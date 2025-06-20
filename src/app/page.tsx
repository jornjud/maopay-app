// src/app/page.tsx

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, CookingPot, Leaf } from "lucide-react";

export default function HomePage() {
  return (
    <>
      {/* --- Hero Section --- */}
      <div className="relative bg-red-50">
          <div className="container mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Text Content */}
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 mb-4 leading-tight">
                หิวเหรอ? ให้ <span className="text-red-600">MAOPAY</span> จัดการ
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                สั่งอาหารร้านโปรดของคุณ ส่งตรงถึงหน้าบ้าน รวดเร็วทันใจ ไรเดอร์คุณภาพพร้อมบริการในพื้นที่ของคุณ
              </p>
              <Link href="/stores">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                  <CookingPot className="mr-2 h-5 w-5" />
                  สั่งเลยตอนนี้!
                </Button>
              </Link>
            </div>

            {/* Image Content */}
            <div className="md:w-1/2">
                <Image 
                    src="https://placehold.co/600x450/FFE4E6/DC2626?text=Delicious+Food"
                    alt="Maopay Delivery Service"
                    width={600}
                    height={450}
                    className="rounded-lg shadow-2xl"
                    priority
                />
            </div>
          </div>
      </div>

      {/* --- Features Section --- */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">ทำไมต้อง MaoPay?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="text-center">
                    <CardHeader>
                        <Bike className="mx-auto h-12 w-12 text-red-500 mb-4"/>
                        <CardTitle>ส่งไวเหมือนปืนยิง</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">ไรเดอร์ของเราพร้อมซิ่งไปส่งอาหารให้คุณทันทีที่ร้านทำเสร็จ ไม่ต้องรอนาน!</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <Leaf className="mx-auto h-12 w-12 text-green-500 mb-4"/>
                        <CardTitle>ร้านเด็ดทั่วเมือง</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">เรารวบรวมร้านอาหารเด็ดๆ ร้านในตำนาน มาให้คุณเลือกสั่งได้ในที่เดียว</p>
                    </CardContent>
                </Card>
                 <Card className="text-center">
                    <CardHeader>
                        <CookingPot className="mx-auto h-12 w-12 text-orange-500 mb-4"/>
                        <CardTitle>สั่งง่าย จ่ายสะดวก</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">แอปเราออกแบบมาให้ใช้ง่ายสุดๆ ไม่กี่คลิกก็ได้กินของอร่อย แถมจ่ายเงินง่ายด้วย QR</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
      
      {/* --- Call to Action for Stores/Riders --- */}
      <div className="bg-gray-800 text-white py-16">
         <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">มาเป็นส่วนหนึ่งกับเรา</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">ไม่ว่าคุณจะเป็นเจ้าของร้านอาหาร หรืออยากเป็นไรเดอร์ส่งความสุข เราเปิดรับคุณเสมอ</p>
            <div className="flex justify-center gap-4">
                <Link href="/stores/register">
                     <Button size="lg" variant="secondary">สมัครร้านค้า</Button>
                </Link>
                 <Link href="/riders/register">
                     <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-200">สมัครไรเดอร์</Button>
                </Link>
            </div>
         </div>
      </div>
    </>
  );
}