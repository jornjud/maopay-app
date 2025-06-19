// ที่ไฟล์: src/app/cart/page.tsx หรือ page.tsx ที่นายส่งมา

"use client";

import { useState } from 'react';
// 1. ลบ CartItem ออกจากการ import เพราะไม่ได้ใช้แล้ว
import { useCartStore } from '@/store/cartStore'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';

const CartPage = () => {
  const { items, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }

    if (items.length === 0) {
      setError("ตะกร้าของคุณว่างเปล่า");
      return;
    }
    
    const storeId = useCartStore.getState().storeId;

    if (!storeId) {
      setError("ไม่สามารถดำเนินการต่อได้: ไม่พบข้อมูลร้านค้าในตะกร้า");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          items: items,
          total: total,
          storeId: storeId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Network response was not ok');
      }

      clearCart();
      router.push(`/history`);
    } catch (error: unknown) {
      console.error('Failed to create order:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดบางอย่าง โปรดลองอีกครั้ง';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">ตะกร้าสินค้าของคุณ</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p>ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
                    {/* 2. เอา (item as any) ออกได้เลย! */}
                    <Image
                      src={item.image || `https://placehold.co/80x80/e2e8f0/64748b?text=${item.name ? item.name.charAt(0) : '?'}`}
                      alt={item.name || 'สินค้า'}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-muted-foreground">{item.price.toFixed(2)} บาท</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => decreaseQuantity(item.id)}>
                        <MinusCircle className="h-5 w-5" />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => increaseQuantity(item.id)}>
                        <PlusCircle className="h-5 w-5" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {items.length > 0 && (
          <CardFooter className="flex flex-col items-stretch gap-4 mt-4">
             {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
            <div className="flex justify-between text-xl font-bold">
              <span>ยอดสุทธิ:</span>
              <span>{total.toFixed(2)} บาท</span>
            </div>
            <Button onClick={handleCheckout} disabled={isLoading} size="lg">
              {isLoading ? 'กำลังดำเนินการ...' : 'ดำเนินการต่อ'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CartPage;