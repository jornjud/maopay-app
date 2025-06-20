// src/components/auth/FirebaseMessagingProvider.tsx
"use client";

import { useEffect } from 'react';
import { getMessaging, onMessage } from 'firebase/messaging';
import { app } from '@/lib/firebase';
import { useNotificationStore } from '@/store/notificationStore';

// Component นี้จะทำหน้าที่รับข้อความแจ้งเตือนตอนเปิดแอปอยู่ (Foreground)
export const FirebaseMessagingProvider = ({ children }: { children: React.ReactNode }) => {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // ให้มันทำงานแค่ฝั่ง Client เท่านั้น
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const messaging = getMessaging(app);

        // ตั้งค่าตัวดักฟังข้อความ
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('✅ Foreground message received!', payload);

          const notiTitle = payload.notification?.title || 'แจ้งเตือนใหม่';
          const notiBody = payload.notification?.body || 'ไม่มีเนื้อหา';

          // เพิ่มการแจ้งเตือนเข้าไปใน Store ของเรา (แล้วกระดิ่งมันจะอัปเดตเอง!)
          addNotification({
            message: `${notiTitle}: ${notiBody}`,
            role: 'all',
          });
        });

        return () => {
          unsubscribe(); // Cleanup ตอน component ถูกทำลาย
        };
      } catch (error) {
          console.error("Failed to initialize foreground messaging", error);
      }
    }
  }, [addNotification]);

  return <>{children}</>;
};