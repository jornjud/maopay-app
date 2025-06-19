"use client";

import React, { useState } from 'react';
import { auth, db } from '../../../lib/firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

// Main App component for the store registration page
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
  });


  const handleNextStep = () => setStep(step + 1);
  const handlePrevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
        setError("You must be logged in to register a store.");
        return;
    }

    setLoading(true);

    try {
        // Check if user already has a store
        const storeDocRef = doc(db, 'stores', `store_${currentUser.uid}`);
        const storeDoc = await getDoc(storeDocRef);

        if (storeDoc.exists()) {
            setError("You have already registered a store.");
            setLoading(false);
            return;
        }

        // Add a new document in collection "stores"
        await setDoc(storeDocRef, {
            ownerId: currentUser.uid,
            name: storeName,
            description: storeDescription,
            type: storeType,
            telegramGroupId: telegramGroupId,
            location: {
                address: address,
                city: city,
                province: province,
                zipCode: zipCode,
            },
            imageUrl: "https://placehold.co/600x400/3498db/ffffff?text=ร้านค้าของฉัน",
            createdAt: new Date(),
        });
        
        // Also update the user's role to 'store_owner'
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { role: 'store_owner' }, { merge: true });

        setLoading(false);
        alert('Store registered successfully!');
        router.push('/dashboard/store');

    } catch (err) {
        setLoading(false);
        if (err instanceof Error) {
            setError(err.message);
            console.error(err);
        } else {
            setError("An unknown error occurred.");
        }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">ข้อมูลเบื้องต้นของร้าน</h2>
            <div className="mb-4">
              <label htmlFor="storeName" className="block text-gray-700 mb-2">ชื่อร้านค้า</label>
              <input type="text" id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="mb-4">
              <label htmlFor="storeDescription" className="block text-gray-700 mb-2">คำอธิบายร้านค้า</label>
              <textarea id="storeDescription" value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="w-full p-2 border rounded" rows={3}></textarea>
            </div>
             <div className="mb-4">
              <label htmlFor="telegramGroupId" className="block text-gray-700 mb-2">Telegram Group ID (สำหรับแจ้งเตือน Rider)</label>
              <input type="text" id="telegramGroupId" value={telegramGroupId} onChange={(e) => setTelegramGroupId(e.target.value)} className="w-full p-2 border rounded" placeholder="เช่น -100123456789" />
               <p className="text-xs text-gray-500 mt-1">*ไม่จำเป็นต้องใส่ก็ได้</p>
            </div>
            <button onClick={handleNextStep} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">ถัดไป</button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">ที่อยู่ร้านค้า</h2>
            <div className="mb-4">
              <label htmlFor="address" className="block text-gray-700 mb-2">ที่อยู่</label>
              <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="อำเภอ" className="w-full p-2 border rounded" required />
              <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="จังหวัด" className="w-full p-2 border rounded" required />
            </div>
            <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="รหัสไปรษณีย์" className="w-full p-2 border rounded mb-4" required />
            <div className="flex justify-between">
              <button onClick={handlePrevStep} className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">ย้อนกลับ</button>
              <button onClick={handleSubmit} disabled={loading} className="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400">
                {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนร้านค้า'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">ลงทะเบียนร้านค้า</h1>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          {renderStep()}
        </form>
      </div>
    </div>
  );
}
