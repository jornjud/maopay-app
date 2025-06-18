"use client";

import { useState } from 'react';
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, storeId, increaseQuantity, decreaseQuantity, removeItem, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCreateOrder = async () => {
    if (!storeId) {
        alert("เกิดข้อผิดพลาด: ไม่พบรหัสร้านค้า");
        return;
    }

    setIsSubmitting(true);
    try {
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items,
                totalPrice,
                storeId,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'เกิดข้อผิดพลาดบางอย่าง');
        }

        alert(`สร้างออเดอร์สำเร็จ! ID ออเดอร์ของคุณคือ: ${result.orderId}`);
        clearCart();
        router.push('/');

    } catch (error: any) {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">ตะกร้าสินค้าของคุณ</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500 mb-4">ตะกร้าของคุณว่างเปล่า</p>
          <Link href="/stores"><Button className="bg-red-600 hover:bg-red-700">ไปเลือกซื้อสินค้า</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-lg">{item.name}</p>
                    <p className="text-gray-600">{item.price} บาท</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="sm" onClick={() => decreaseQuantity(item.id)}>-</Button>
                    <span className="px-4">{item.quantity}</span>
                    <Button variant="ghost" size="sm" onClick={() => increaseQuantity(item.id)}>+</Button>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>ลบ</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">สรุปรายการ</h2>
              <div className="flex justify-between font-bold text-lg">
                <span>ยอดสุทธิ:</span>
                <span>{totalPrice} บาท</span>
              </div>
              <Button 
                className="w-full mt-6 bg-green-600 hover:bg-green-700"
                onClick={handleCreateOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'กำลังส่งออเดอร์...' : 'ดำเนินการสั่งซื้อ'}
              </Button>
               <Button variant="outline" className="w-full mt-2" onClick={clearCart}>ล้างตะกร้า</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
