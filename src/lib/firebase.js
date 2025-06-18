// src/lib/firebase.js

// Import ฟังก์ชันที่จำเป็นจาก Firebase SDK
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- FIX: อ่านค่าคอนฟิกจาก Environment Variables ---
// นี่คือวิธีที่ถูกต้องและปลอดภัยที่สุด!
// Next.js จะดึงค่าจากไฟล์ .env.local ตอนเทสบนเครื่อง
// และจะดึงค่าจาก Environment Variables ที่เราตั้งไว้บน Vercel ตอน deploy
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// เริ่มการเชื่อมต่อกับ Firebase
// มีการเช็ค getApps() เพื่อป้องกันการ initialize ซ้ำซ้อนเวลา dev mode
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// สร้างตัวแปรสำหรับเรียกใช้บริการต่างๆ ของ Firebase
const db = getFirestore(app);
const auth = getAuth(app);

// ส่งออก (export) ตัวแปรเหล่านี้เพื่อให้ไฟล์อื่นในโปรเจกต์สามารถนำไปใช้ได้
export { app, db, auth };
