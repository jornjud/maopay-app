"use client"; // This directive is for Next.js App Router client components

import React, { useState, useEffect } from 'react';

// This component simulates a client-side application receiving push notifications.
// In a real application, this would involve Firebase Cloud Messaging (FCM) SDK
// to subscribe to notifications and handle incoming messages via a Service Worker.
export default function App() {
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    // --- Simulation of FCM Token Registration ---
    // In a real app, you would ask for notification permission and get the FCM token here.
    // Example (simplified):
    // async function requestNotificationPermissionAndGetToken() {
    //   if ('Notification' in window && 'serviceWorker' in navigator) {
    //     const permission = await Notification.requestPermission();
    //     if (permission === 'granted') {
    //       // Get Firebase Messaging Service Worker registration token
    //       // const messaging = firebase.messaging();
    //       // const currentToken = await messaging.getToken({ vapidKey: 'YOUR_VAPID_KEY_FROM_FCM_CONSOLE' });
    //       // if (currentToken) {
    //       //   setNotificationToken(currentToken);
    //       //   console.log('FCM Registration Token:', currentToken);
    //       //   setMessage({ type: 'success', text: 'ลงทะเบียนรับแจ้งเตือนแล้ว! 🎉' });
    //       //   // Send this token to your backend to associate with the user
    //       // } else {
    //       //   console.warn('No FCM registration token available.');
    //       //   setMessage({ type: 'info', text: 'ไม่สามารถรับ Token ได้ (ปิดแจ้งเตือนในเบราว์เซอร์?)' });
    //       // }
    //     } else {
    //       setMessage({ type: 'error', text: 'ผู้ใช้ไม่อนุญาตให้ส่งแจ้งเตือนนะเพื่อน! 🚫' });
    //     }
    //   } else {
    //     setMessage({ type: 'warning', text: 'เบราว์เซอร์ไม่รองรับการแจ้งเตือนนะเพื่อน! 😞' });
    //   }
    // }
    // requestNotificationPermissionAndGetToken();

    // --- Simulate receiving a notification ---
    // This part simulates a notification coming from our mock API.
    // In a real app, FCM would trigger a Service Worker to handle incoming messages.
    const handleSimulatedNotification = (event: Event) => {
      // Assuming a custom event 'simulateNotification' is dispatched
      const customEvent = event as CustomEvent<{ title: string; body: string }>;
      const { title, body } = customEvent.detail;
      const receivedMsg = `Received: [${new Date().toLocaleTimeString()}] ${title} - ${body}`;
      setReceivedMessages((prev) => [...prev, receivedMsg]);
      setMessage({ type: 'info', text: 'มีแจ้งเตือนใหม่เข้ามาแล้ว! 🔔' });
    };

    window.addEventListener('simulateNotification', handleSimulatedNotification as EventListener);

    // Mock a token for display purposes, as we can't get a real one here.
    setNotificationToken('mock_fcm_token_12345_for_this_device');
    setMessage({ type: 'success', text: 'จำลองการลงทะเบียนแจ้งเตือนเรียบร้อยแล้ว! 🎉' });

    return () => {
      window.removeEventListener('simulateNotification', handleSimulatedNotification as EventListener);
    };
  }, []); // Run only once on mount

  // Function to simulate sending a test notification from the client (for testing the backend mock)
  const sendTestNotification = async () => {
    if (!notificationToken) {
      setMessage({ type: 'error', text: 'ไม่มี Token สำหรับส่งแจ้งเตือนนะเพื่อน! 😭' });
      return;
    }

    setMessage(null);
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: notificationToken,
          title: 'ทดสอบแจ้งเตือนจาก Client',
          body: 'ข้อความทดสอบแจ้งเตือนของคุณ!',
          // In real FCM, you'd send data payload too
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'ส่งแจ้งเตือนทดสอบไป Backend แล้ว! (Backend จะจำลองการส่งนะ) ✅' });
      } else {
        setMessage({ type: 'error', text: `ส่งแจ้งเตือนทดสอบไม่สำเร็จ: ${data.message || 'เกิดข้อผิดพลาด!'}` });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งแจ้งเตือนทดสอบนะเพื่อน! 😩' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-white p-6 rounded-xl shadow-lg mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-4">
          หน้าทดสอบแจ้งเตือน 🔔
        </h1>
        <p className="text-gray-600 text-center mb-8">
          จำลองการรับและส่ง Push Notifications
        </p>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-lg text-center mb-4 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Token Display (Mock) */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <p className="text-gray-700 font-semibold mb-2">Registration Token (จำลอง):</p>
          <code className="block bg-gray-100 p-2 rounded-md text-sm text-gray-800 break-all">
            {notificationToken || 'กำลังรอ Token...'}
          </code>
          <p className="text-xs text-gray-500 mt-2">
            *ในระบบจริง Token นี้จะถูกส่งไปเก็บที่ Server ของคุณ เพื่อใช้เวลาส่งแจ้งเตือนกลับมา
          </p>
        </div>

        {/* Test Notification Button */}
        <button
          onClick={sendTestNotification}
          disabled={!notificationToken}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-150 ease-in-out ${
            !notificationToken ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          ส่งแจ้งเตือนทดสอบ (จาก Client ไป Backend) 🚀
        </button>

        {/* Received Notifications Log */}
        <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            ข้อความแจ้งเตือนที่ได้รับ (จำลอง) 📥
          </h2>
          {receivedMessages.length > 0 ? (
            <ul className="space-y-2 text-sm text-gray-700 max-h-48 overflow-y-auto pr-2">
              {receivedMessages.map((msg, index) => (
                <li key={index} className="bg-white p-2 rounded-md shadow-sm border border-gray-100">
                  {msg}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              ยังไม่มีข้อความแจ้งเตือนที่ได้รับนะเพื่อน!
            </p>
          )}
           <button
            onClick={() => {
                // This simulates an external system (like our API) sending a notification
                // In a real app, this would be handled by the Service Worker / FCM SDK
                const event = new CustomEvent('simulateNotification', {
                    detail: { title: 'ออเดอร์ใหม่!', body: 'มีออเดอร์เข้าจากร้านปิ้งย่างหม่าล่านะเพื่อน!' }
                });
                window.dispatchEvent(event);
            }}
            className="mt-4 px-4 py-2 bg-purple-500 text-white font-medium rounded-md hover:bg-purple-600 transition duration-300"
          >
            จำลองแจ้งเตือน (จากระบบ)
          </button>
        </div>
      </div>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} MaoPay App. All rights reserved.</p>
      </footer>
    </div>
  );
}
