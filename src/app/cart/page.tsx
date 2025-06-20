"use client";

import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState } from 'react';
import { useCartStore } from '@/store/cartStore'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CartPage = () => {
  const { items, storeId, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCartStore();
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // --- คำนวณค่าบริการตาม Flow ใหม่ ---
  const deliveryFee = Math.ceil(items.reduce((acc, item) => acc + item.quantity, 0) / 5) * 10;
  const appFee = 1; // ค่าบริการแอป 1 บาท
  const total = subtotal + deliveryFee + appFee;

  const handleCheckout = async () => {
    if (!user) {
        router.push('/login?redirect=/cart');
        return;
    }
    if (items.length === 0) {
        setError("ตะกร้าของมึงว่างเปล่าเว้ยเพื่อน!");
        return;
    }
	if (!deliveryAddress.trim()) {
        setError("เฮ้ยเพื่อน! ลืมใส่ที่อยู่จัดส่งรึเปล่า?");
        return;
    }
    if (!storeId) {
        setError("ชิบหายละ! ไม่เจอ ID ร้านค้าในตะกร้า, ทำต่อไม่ได้ว่ะ");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
        const storeDocRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeDocRef);
        if(!storeSnap.exists()){
            throw new Error("ไม่พบข้อมูลร้านค้า!");
        }
        const storeData = storeSnap.data();

        // --- สร้างข้อมูลออเดอร์ตาม Flow V2.0 ---
        const orderData = {
            userId: user.uid,
            customerName: user.displayName || user.email,
            storeId: storeId,
            storeName: storeData.name,
            items: items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image || ''
            })),
            fees: {
                subtotal: subtotal,
                deliveryFee: deliveryFee,
                appFee: appFee,
            },
            total: total,
            status: 'waiting_for_confirmation', // <-- สถานะเริ่มต้นใหม่!
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            deliveryAddress: {
                address: deliveryAddress
            },
            payment: {
                qrImage: `https://promptpay.io/0812345678/${total.toFixed(2)}.png`, // <-- QR Code ของแอปเรา
                paidAt: null,
            }
        };

        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        console.log("สร้างออเดอร์สำเร็จ! ID:", orderRef.id);

        clearCart();
        alert("ส่งคำสั่งซื้อไปให้ร้านค้าแล้ว! รอร้านยืนยันแป๊ปนะเพื่อน!");
        router.push(`/history`); 

    } catch (error: unknown) {
        console.error('Failed to create order:', error);
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดบางอย่าง โปรดลองอีกครั้ง';
        setError(`สร้างออเดอร์ไม่สำเร็จว่ะเพื่อน: ${errorMessage}`);
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
            <p className="text-center text-gray-500 py-8">ยังไม่มีสินค้าในตะกร้า</p>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-4">
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
                      <span className='font-bold text-lg w-8 text-center'>{item.quantity}</span>
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
            <div className="grid w-full gap-1.5">
                <Label htmlFor="address">ที่อยู่สำหรับจัดส่ง</Label>
                <Textarea 
                    placeholder="บอกที่อยู่มาให้ละเอียดเลยเพื่อน... เช่น บ้านเลขที่, ซอย, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์" 
                    id="address"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                />
			</div>
            <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between"><span>ราคาสินค้า</span><span>{subtotal.toFixed(2)} บาท</span></div>
                <div className="flex justify-between"><span>ค่าจัดส่ง</span><span>{deliveryFee.toFixed(2)} บาท</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>ค่าบริการ</span><span>{appFee.toFixed(2)} บาท</span></div>
                <div className="flex justify-between text-xl font-bold"><span>ยอดสุทธิ</span><span>{total.toFixed(2)} บาท</span></div>
            </div>
            {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md">{error}</p>}
            <Button onClick={handleCheckout} disabled={isLoading} size="lg">
              {isLoading ? 'กำลังส่งคำสั่งซื้อ...' : 'ยืนยันและส่งให้ร้านค้าตรวจสอบ'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CartPage;
