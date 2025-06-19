// src/app/riders/register/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider'; // << Import เข้ามาเช็ค User
import { useRouter } from 'next/navigation'; // << Import เข้ามาสำหรับ redirect
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function App() {
  const { user, loading: authLoading } = useAuth(); // ดึงข้อมูล user มาใช้
  const router = useRouter(); // เตรียม router ไว้

  // State to hold form data for rider registration
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    vehicleType: '',
    licensePlate: '',
    // เราไม่ต้องการ email/password ที่นี่แล้ว เพราะ user ต้อง login มาก่อน
  });

  // State for displaying messages to the user and loading status
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // --- เพิ่มมาใหม่! ---
  // เช็คว่า login หรือยัง ถ้ายังไม่ login หรือกำลังโหลดอยู่ ให้แสดงผลต่างกันไป
  useEffect(() => {
    if (!authLoading && !user) {
      alert("เฮ้ยเพื่อน! ต้องล็อกอินก่อนนะถึงจะสมัครไรเดอร์ได้ 😜");
      router.push('/login?redirect=/riders/register');
    }
  }, [user, authLoading, router]);
  // --- จบส่วนเพิ่มใหม่ ---

  // Function to handle input changes and update form data state
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // --- แก้ไข handleSubmit ใหม่ทั้งหมด! ---
 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault(); 
  if (!user) {
      setMessage({ type: 'error', text: 'User is not authenticated.' });
      return;
  }

  setIsLoading(true);
  setMessage({ type: '', text: '' });

  try {
      // --- นี่ไง! ยิงตรงไปที่ Firestore เลย ไม่ต้อง fetch แล้ว ---
      // เราจะใช้ user.uid เป็น ID ของเอกสารใน collection 'riders' เลย
      const riderRef = doc(db, "riders", user.uid);

      await setDoc(riderRef, {
          userId: user.uid,
          name: formData.fullName,
          phone: formData.phone,
          vehicleDetails: {
              type: formData.vehicleType,
              licensePlate: formData.licensePlate,
          },
          status: 'pending', // สถานะเริ่มต้น รอแอดมินอนุมัติ
          createdAt: new Date(),
      });

      setMessage({ type: 'success', text: 'ลงทะเบียนสำเร็จแล้ว! 🎉 เดี๋ยวแอดมินจะรีบตรวจสอบให้นะ!' });
      // พาไปแดชบอร์ดเลย เท่ๆ
      router.push('/dashboard'); 

  } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
      console.error("Firestore Error:", err);
      setMessage({ type: 'error', text: `โอ๊ย! บันทึกไม่ผ่านว่ะเพื่อน: ${errorMessage}` });
  } finally {
      setIsLoading(false);
  }
};
  
  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">กำลังเช็คข้อมูลแป๊ป...</div>
  }

  // --- ส่วน JSX ปรับแก้เล็กน้อย ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          สมัครเป็นไรเดอร์ MaoPay 🏍️💨
        </h1>
        <p className="text-gray-600 text-center mb-8">
          มาซิ่งส่งความอร่อยไปกับเราสิ!
        </p>

        {message.text && (
          <div
            className={`p-3 rounded-lg text-center mb-4 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="ชื่อเต็มของคุณ"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์: <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="08X-XXX-XXXX"
            />
          </div>

          <div>
            <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทพาหนะ: <span className="text-red-500">*</span>
            </label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="">เลือกประเภทพาหนะ</option>
              <option value="motorcycle">มอเตอร์ไซค์ 🏍️</option>
              <option value="car">รถยนต์ 🚗</option>
            </select>
          </div>

          <div>
            <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
              เลขทะเบียนรถ: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="กข 1234 หรือ 1กข 1234"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out disabled:bg-gray-400"
          >
            {isLoading ? 'กำลังส่งข้อมูล...' : 'ลงทะเบียนไรเดอร์ 💨'}
          </button>
        </form>
      </div>
    </div>
  );
}