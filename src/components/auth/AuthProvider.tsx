"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { set } from 'zod';

// สร้าง Context สำหรับเก็บข้อมูล User
type AuthContextType = {
  user: User | null;
  loading: boolean;
};
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// สร้าง Provider ที่จะครอบแอปของเรา
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged คือผู้ฟังเหตุการณ์จาก Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // ถ้ามี user ล็อกอิน, ก็จะเก็บข้อมูลไว้
      setLoading(false); // ไม่ว่าจะล็อกอินหรือไม่ ก็บอกว่าโหลดเสร็จแล้ว
    });

    // คืนค่า unsubscribe ตอน component ถูกทำลาย เพื่อป้องกัน memory leak
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// สร้าง Hook สั้นๆ เพื่อให้เรียกใช้ง่าย
export const useAuth = () => {
  return useContext(AuthContext);
};
