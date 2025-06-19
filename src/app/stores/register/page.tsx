"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../lib/firebase'; 
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleNextStep = () => {
      if (storeName && storeType) {
          setError(null);
          setStep(step + 1);
      } else {
          setError('กรุณากรอกชื่อและประเภทร้านค้า');
      }
  };
  const handlePrevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!address || !city || !province || !zipCode) {
        setError('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน');
        return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
        // Use the API route to handle registration
        const response = await fetch('/api/stores/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ownerId: currentUser.uid,
                name: storeName,
                description: storeDescription,
                type: storeType,
                telegramGroupId,
                location: { address, city, province, zipCode },
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit registration.');
        }

        alert('Store registration submitted for review!');
        router.push('/dashboard');

    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center p-10">Loading...</div>

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div><Label htmlFor="storeName">ชื่อร้านค้า</Label><Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required /></div>
            <div><Label htmlFor="storeDesc">คำอธิบายร้านค้า</Label><Textarea id="storeDesc" placeholder="บอกเล่าเกี่ยวกับร้านของคุณ..." value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} /></div>
            <div>
                <Label htmlFor="storeType">ประเภทร้านค้า</Label>
                <Select onValueChange={setStoreType} value={storeType}>
                    <SelectTrigger id="storeType"><SelectValue placeholder="-- เลือกประเภท --" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="restaurant">ร้านอาหาร</SelectItem>
                        <SelectItem value="cafe">คาเฟ่</SelectItem>
                        <SelectItem value="street_food">สตรีทฟู้ด</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div><Label htmlFor="telegram">Telegram Group ID (ไม่จำเป็น)</Label><Input id="telegram" placeholder="-100123456789" value={telegramGroupId} onChange={(e) => setTelegramGroupId(e.target.value)} /></div>
            <Button onClick={handleNextStep} className="w-full">ถัดไป</Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div><Label htmlFor="address">ที่อยู่</Label><Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="city">อำเภอ/เขต</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required /></div>
                <div><Label htmlFor="province">จังหวัด</Label><Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} required /></div>
            </div>
            <div><Label htmlFor="zip">รหัสไปรษณีย์</Label><Input id="zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required /></div>
            <div className="flex justify-between pt-4">
              <Button onClick={handlePrevStep} variant="outline">ย้อนกลับ</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งเพื่อตรวจสอบ'}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">ลงทะเบียนร้านค้า</h1>
        <p className="text-center text-gray-500 mb-6">ขั้นตอนที่ {step} จาก 2</p>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit}>{renderStep()}</form>
      </div>
    </div>
  );
}

