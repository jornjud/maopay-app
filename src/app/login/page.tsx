"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          alert("ยินดีต้อนรับเข้าสู่ maopay");
          router.push("/");
        }
      })
      .catch((err) => {
        const errorMessage = err.message || 'เกิดข้อผิดพลาดในการล็อกอินด้วย Google';
        setError(errorMessage);
        console.error("Google Redirect Result Error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  // ฟังก์ชันสมัครสมาชิกที่นายทำมา
  const handleSignUp = async () => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ");
      router.push("/");
    } catch (err) {
      setError("การสมัครสมาชิกล้มเหลว: " + (err as Error).message);
    }
  };

  // ฟังก์ชันเข้าสู่ระบบที่นายทำมา
  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("เข้าสู่ระบบสำเร็จ!");
      router.push("/");
    } catch (err) {
      setError("การเข้าสู่ระบบล้มเหลว: " + (err as Error).message);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err) {
      setError("การเข้าสู่ระบบด้วย Google ล้มเหลว: " + (err as Error).message);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container text-center py-12">กำลังตรวจสอบการล็อกอิน...</div>
  }

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
            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="w-full grid grid-cols-2 gap-2">
             <Button onClick={handleSignIn} className="w-full bg-red-600 hover:bg-red-700">เข้าสู่ระบบ</Button>
             <Button onClick={handleSignUp} variant="outline" className="w-full">สมัครสมาชิก</Button>
          </div>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">หรือ</span></div>
          </div>
          <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
             <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4,12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4,16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,36.21,44,30.551,44,24c0,22.659,43.862,21.35,43.611,20.083z"/></svg>
            เข้าสู่ระบบด้วย Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
