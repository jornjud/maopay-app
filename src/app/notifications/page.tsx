// src/app/notifications/page.tsx
"use client";

import React, { useState } from 'react';
import { getMessaging, getToken } from "firebase/messaging";
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

export default function App() {
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const requestPermissionAndGetToken = async () => {
    setMessage({ type: 'info', text: 'กำลังขออนุญาต...' });
    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        setMessage({ type: 'success', text: 'ได้รับอนุญาตแล้ว! กำลังดึง Token...' });

        const currentToken = await getToken(messaging, {
          vapidKey: 'BKcjhwBLOSgnGyu8U1Ei0z3pQhmT7OkkU9ikKrlSHxQrA2sKLto8iaqK0Pa0LjjPSqxPUTbhiGXCOCVdxN1_w_U',
        });

        if (currentToken) {
          setNotificationToken(currentToken);
          console.log('FCM Token:', currentToken);
          setMessage({ type: 'success', text: 'ลงทะเบียนรับแจ้งเตือนสำเร็จแล้ว! 🎉' });
          // เราลบ onMessage ออกจากตรงนี้แล้ว เพราะย้ายไปอยู่ใน FirebaseMessagingProvider
        } else {
          setMessage({ type: 'error', text: 'ชิบหาย! ดึง Token ไม่ได้ว่ะเพื่อน ลองเช็คคอนโซลดู' });
        }
      } else {
        setMessage({ type: 'error', text: 'อดเลย! นายไม่ให้สิทธิ์ส่งแจ้งเตือน 🚫' });
      }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดตอนขอ Token ว่ะเพื่อน' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white p-6 rounded-xl shadow-lg mb-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">
          หน้าลงทะเบียนรับแจ้งเตือน 🔔
        </h1>
        <p className="text-gray-600 text-center mb-8">
          กดปุ่มข้างล่างเพื่ออนุญาตให้ MaoPay ส่งแจ้งเตือนหานายได้
        </p>

        {message && (
          <div
            className={`p-3 rounded-lg text-center mb-4 text-sm font-medium ${
              message.type === 'success' ? 'bg-green-100 text-green-700'
              : message.type === 'error' ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <Button
          onClick={requestPermissionAndGetToken}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg"
        >
          ขออนุญาตและลงทะเบียนรับแจ้งเตือน
        </Button>

        {notificationToken && (
           <div className="bg-gray-50 p-4 rounded-lg mt-6 border border-gray-200">
             <p className="text-gray-700 font-semibold mb-2">FCM Registration Token ของเครื่องนาย:</p>
             <code className="block bg-gray-100 p-2 rounded-md text-sm text-gray-800 break-all">
               {notificationToken}
             </code>
           </div>
        )}
      </div>
    </div>
  );
}