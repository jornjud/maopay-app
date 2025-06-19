"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';

export default function RegisterStorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("กรุณาเข้าสู่ระบบก่อนทำการสมัครร้านค้า");
      router.push('/login');
      return;
    }

    if (!storeName || !description || !address || !phoneNumber) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/stores/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: user.uid,
          name: storeName,
          description,
          address,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'เกิดข้อผิดพลาดในการสมัคร');
      }
      
      setSuccess('สมัครร้านค้าสำเร็จ! เราจะนำคุณไปยังแดชบอร์ดร้านค้า');
      setTimeout(() => {
        router.push('/dashboard/store');
      }, 2000);


    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบ';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">สมัครเป็นร้านค้ากับ MaoPay</CardTitle>
          <CardDescription>
            กรอกข้อมูลด้านล่างเพื่อเริ่มขายสินค้าของคุณบนแพลตฟอร์มของเรา
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">
              <p>{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="store-name">ชื่อร้านค้า</Label>
                <Input
                  id="store-name"
                  type="text"
                  placeholder="เช่น ร้านข้าวแกงปืนใหญ่"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">คำอธิบายร้านค้า</Label>
                <Textarea
                  id="description"
                  placeholder="บอกเราเล็กน้อยเกี่ยวกับร้านของคุณ"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone-number">เบอร์โทรศัพท์ติดต่อ</Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="08xxxxxxxx"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'กำลังดำเนินการ...' : 'สมัครร้านค้า'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}