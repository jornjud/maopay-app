// @filename: src/app/stores/register/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../lib/firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function StoreRegistrationPage() {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeType, setStoreType] = useState('');
  const [telegramGroupId, setTelegramGroupId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [zipCode, setZipCode] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
          } else {
            router.push('/login');
          }
          setLoading(false);
      });
      return () => unsubscribe();
  }, [router]);

  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    try {
        const storeDocRef = doc(db, 'stores', `store_${currentUser.uid}`);
        await setDoc(storeDocRef, {
            ownerId: currentUser.uid,
            name: storeName,
            description: storeDescription,
            type: storeType,
            status: 'pending', // Add status for admin approval
            telegramGroupId: telegramGroupId,
            location: { address, city, province, zipCode },
            imageUrl: "https://placehold.co/600x400?text=Store",
            createdAt: new Date(),
        });
        
        // DO NOT set role here. Admin should approve first.
        alert('Store registration submitted for review!');
        router.push('/dashboard');

    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">ข้อมูลร้านค้า</h2>
            <div className="mb-4">
              <label htmlFor="storeName">ชื่อร้าน</label>
              <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
                <label htmlFor="storeType">ประเภทร้านค้า</label>
                <select id="storeType" value={storeType} onChange={e => setStoreType(e.target.value)} className="w-full p-2 border rounded" required>
                    <option value="">-- เลือกประเภท --</option>
                    <option value="restaurant">ร้านอาหาร</option>
                    <option value="cafe">คาเฟ่</option>
                    <option value="street_food">สตรีทฟู้ด</option>
                </select>
            </div>
            <button onClick={handleNextStep} className="w-full bg-blue-500 text-white p-2 rounded">ถัดไป</button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">ที่อยู่</h2>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="ที่อยู่" className="w-full p-2 border rounded mb-2" required />
            <div className="flex justify-between">
              <button onClick={handlePrevStep} className="bg-gray-500 text-white p-2 rounded">ย้อนกลับ</button>
              <button onClick={handleSubmit} disabled={loading} className="bg-green-500 text-white p-2 rounded">
                {loading ? 'กำลังส่ง...' : 'ส่งเพื่อตรวจสอบ'}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">ลงทะเบียนร้านค้า</h1>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit}>{renderStep()}</form>
      </div>
    </div>
  );
}