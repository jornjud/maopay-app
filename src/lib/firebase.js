// src/lib/firebase.js

// Import ฟังก์ชันที่จำเป็นจาก Firebase SDK
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ดึงค่าคอนฟิกจากไฟล์ .env.local ที่เราสร้างไว้
// process.env.KEY_NAME คือวิธีที่ Next.js ใช้ในการอ่านไฟล์ .env
const firebaseConfig = {
  apiKey: "AIzaSyBBT4jPexRxFsk00Ly4Dwah3Q01NTtiOS8",
  authDomain: "maopay-app.firebaseapp.com",
  projectId: "maopay-app",
  storageBucket: "maopay-app.firebasestorage.app",
  messagingSenderId: "1017073316088",
  appId: "1:1017073316088:web:17f10fa54e3e2702a34b0d"
};

// เริ่มการเชื่อมต่อกับ Firebase
// มีการเช็ค getApps() เพื่อป้องกันการ initialize ซ้ำซ้อนเวลา dev mode
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// สร้างตัวแปรสำหรับเรียกใช้บริการต่างๆ ของ Firebase
const db = getFirestore(app);
const auth = getAuth(app);

// ส่งออก (export) ตัวแปรเหล่านี้เพื่อให้ไฟล์อื่นในโปรเจกต์สามารถนำไปใช้ได้
export { app, db, auth };
