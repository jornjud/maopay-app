"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // << เพิ่ม import Select
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";

export default function RegisterStorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [storeType, setStoreType] = useState(""); // << เพิ่ม State สำหรับประเภทของร้าน
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) {
    setError("เฮ้ยเพื่อน! ต้องล็อกอินก่อนนะถึงจะสมัครได้ 😜");
    router.push("/login?redirect=/stores/register");
    return;
  }

  if (!storeName || !description || !address || !phoneNumber || !storeType) {
    setError("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่องนะเพื่อน");
    return;
  }

  setIsLoading(true);
  setError("");
  setSuccess("");

  try {
    // --- นี่ไง! ยิงตรงไป Firestore เลย ไม่ต้อง fetch แล้ว ---
    await addDoc(collection(db, "stores"), {
      ownerId: user.uid,
      name: storeName,
      description,
      type: storeType,
      location: {
        address: address,
        phone: phoneNumber,
      },
      // สร้าง URL รูปภาพชั่วคราวไปก่อน
      imageUrl: `https://placehold.co/600x400/orange/white?text=${encodeURIComponent(storeName)}`,
      status: 'pending', // สถานะเริ่มต้น รอแอดมินอนุมัติ
      createdAt: serverTimestamp(), // ใช้เวลาของเซิร์ฟเวอร์
    });

    setSuccess("สมัครร้านค้าสำเร็จแล้วโว้ย! เดี๋ยวแอดมินจัดการต่อให้ รอแป๊ป! 🥳");
    // เคลียร์ฟอร์มซะหน่อย
    setStoreName("");
    setDescription("");
    setAddress("");
    setPhoneNumber("");
    setStoreType("");

    // พาไปหน้าแดชบอร์ดเลยก็ได้ เท่ๆ
    // setTimeout(() => {
    //   router.push('/dashboard');
    // }, 2000);

  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดแบบไม่รู้อ่ะเพื่อน";
    console.error("Firestore Error:", error);
    setError(`โอ๊ย! บันทึกไม่ผ่านว่ะเพื่อน: ${errorMessage}`);
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

              {/* --- 👇👇 เพิ่มช่องให้เลือกประเภทของร้าน! 👇👇 --- */}
              <div className="grid gap-2">
                <Label htmlFor="store-type">ประเภทร้านค้า</Label>
                <Select
                  required
                  onValueChange={(value) => setStoreType(value)}
                  value={storeType}
                >
                  <SelectTrigger id="store-type">
                    <SelectValue placeholder="-- เลือกประเภทร้านค้า --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">ร้านอาหาร</SelectItem>
                    <SelectItem value="cafe">คาเฟ่</SelectItem>
                    <SelectItem value="street_food">สตรีทฟู้ด</SelectItem>
                  </SelectContent>
                </Select>
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
                <Textarea
                  id="address"
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
                {isLoading ? "กำลังดำเนินการ..." : "สมัครร้านค้า"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}