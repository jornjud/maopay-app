"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  AuthError,
  User, // << เพิ่มการ import User
} from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // << เพิ่มการ import db
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"; // << เพิ่มการ import ที่จำเป็นสำหรับ Firestore
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Redirect user if they are already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      } else {
        setPageLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // --- ฟังก์ชันใหม่! สำหรับสร้างข้อมูล User ใน Firestore ---
  const createUserProfileDocument = async (userAuth: User) => {
    if (!userAuth) return;

    // ไปหา document ของ user คนนี้ใน collection 'users'
    const userDocRef = doc(db, "users", userAuth.uid);
    const userSnapshot = await getDoc(userDocRef);

    // ถ้ายังไม่มีข้อมูลของ user คนนี้ใน Firestore (แสดงว่าเป็น user ใหม่จริงๆ)
    if (!userSnapshot.exists()) {
      const { email, displayName } = userAuth;
      const createdAt = serverTimestamp(); // เอาเวลาปัจจุบันจาก Server
      try {
        // สร้าง document ใหม่ พร้อมกำหนด role เริ่มต้นเป็น 'customer'
        await setDoc(userDocRef, {
          displayName: displayName || email, // ถ้ามีชื่อจาก Google ก็ใช้, ไม่มีก็ใช้อีเมล
          email,
          role: "customer", // << ตำแหน่งเริ่มต้นของทุกลูค้าใหม่!
          createdAt,
        });
      } catch (error) {
        console.error("Error creating user profile", error);
        // อาจจะแสดงข้อความบอก user ว่าเกิดข้อผิดพลาดก็ได้
      }
    }
    // ถ้ามีข้อมูลอยู่แล้ว ก็ไม่ต้องทำอะไร ปล่อยให้เค้า login ไปตามปกติ
  };
  // --- จบฟังก์ชันใหม่ ---

  const handleSignUp = async () => {
    setError(null);
    setIsSubmitting(true);
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      setIsSubmitting(false);
      return;
    }
    try {
      // 1. สร้าง User ใน Authentication
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // 2. (ของใหม่!) สร้างข้อมูล User ใน Firestore
      await createUserProfileDocument(user);
      // onAuthStateChanged จะจัดการ redirect ให้เอง
    } catch (err) {
      const authError = err as AuthError;
      const errorMessage = authError.message || "เกิดข้อผิดพลาด";
      setError("การสมัครสมาชิกล้มเหลว: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login เฉยๆ ไม่ต้องสร้าง Profile ใหม่, onAuthStateChanged จะจัดการ redirect ให้เอง
    } catch (err) {
      const authError = err as AuthError;
      const errorMessage = authError.message || "เกิดข้อผิดพลาด";
      setError("การเข้าสู่ระบบล้มเหลว: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      // 1. Sign in ด้วย Popup ของ Google
      const { user } = await signInWithPopup(auth, provider);
      // 2. (ของใหม่!) สร้างข้อมูล User ใน Firestore (ถ้ายังไม่มี)
      await createUserProfileDocument(user);
      // onAuthStateChanged จะทำงานและ redirect ไปหน้าแรกเอง
    } catch (err) {
      const authError = err as AuthError;
      if (authError.code !== 'auth/popup-closed-by-user') {
          const errorMessage = authError.message || "เกิดข้อผิดพลาด";
          setError("การล็อกอินด้วย Google ล้มเหลว: " + errorMessage);
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return <div className="container text-center py-12">กำลังโหลด...</div>
  }

  // --- ส่วนของ JSX เหมือนเดิม ไม่ได้แก้ ---
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">เข้าสู่ระบบ MAOPAY</CardTitle>
          <CardDescription>
            สมัครสมาชิก หรือเข้าสู่ระบบเพื่อเริ่มสั่งอาหาร
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting}/>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full grid grid-cols-2 gap-2">
             <Button onClick={handleSignIn} className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting}>{isSubmitting ? 'กำลังโหลด...' : 'เข้าสู่ระบบ'}</Button>
             <Button onClick={handleSignUp} variant="outline" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'กำลังโหลด...' : 'สมัครสมาชิก'}</Button>
          </div>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">หรือ</span></div>
          </div>
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={isSubmitting}>
             <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,36.21,44,30.551,44,24c0,22.659,43.862,21.35,43.611,20.083z"/></svg>
            {isSubmitting ? 'กำลังโหลด...' : 'เข้าสู่ระบบด้วย Google'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
