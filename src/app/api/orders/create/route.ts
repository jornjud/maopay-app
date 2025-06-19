import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  storeId: string;
}

export async function POST(request: Request) {
  try {
    const { userId, items, total, storeId } = await request.json();

    // --- การตรวจสอบข้อมูลเบื้องต้น ---
    if (!userId || !Array.isArray(items) || items.length === 0 || typeof total !== 'number' || !storeId) {
      return new NextResponse(JSON.stringify({ message: 'ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง' }), { status: 400 });
    }

    // --- กรองและจัดระเบียบข้อมูลสินค้าก่อนบันทึก ---
    // เพื่อป้องกันข้อมูลที่ไม่คาดคิดเล็ดลอดเข้าไปในฐานข้อมูล
    const orderItems = items.map((item: CartItem) => ({
      id: item.id || '',
      name: item.name || 'สินค้าไม่มีชื่อ',
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1,
      image: item.image || '', // บันทึก URL รูปภาพ (ถ้ามี)
    }));

    // --- ข้อมูลออเดอร์ที่จะบันทึก ---
    const orderData = {
      userId,
      storeId,
      items: orderItems,
      total,
      status: 'pending', // สถานะเริ่มต้นของออเดอร์
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // --- บันทึกข้อมูลลง Firestore ---
    const orderRef = await addDoc(collection(db, 'orders'), orderData);

    // --- ส่งคำตอบกลับพร้อม Order ID ---
    return NextResponse.json({
      message: 'สร้างออเดอร์สำเร็จ',
      orderId: orderRef.id,
    });

  } catch (error) {
    console.error('Error creating order:', error);
    // ส่งข้อความแสดงข้อผิดพลาดที่เป็นประโยชน์มากขึ้นสำหรับดีบัก
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ message: 'Internal Server Error', error: errorMessage }), { status: 500 });
  }
}
