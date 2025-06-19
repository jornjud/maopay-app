import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// ... (Interface, Constants, sendTelegramNotification function are the same)

export async function POST(req: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_RIDER_GROUP_CHAT_ID) {
    console.error('SERVER ERROR: Missing Telegram environment variables!');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { orderId, storeId } = await req.json();

    if (!orderId || !storeId) {
      return NextResponse.json({ error: 'Missing orderId or storeId' }, { status: 400 });
    }

    // --- สร้างข้อความอย่างปลอดภัย ---
    let message = '';
    try {
        const storeRef = doc(db, 'stores', storeId);
        const orderRef = doc(db, 'orders', orderId);

        const [storeSnap, orderSnap] = await Promise.all([getDoc(storeRef), getDoc(orderRef)]);

        if (!storeSnap.exists()) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        if (!orderSnap.exists()) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const storeData = storeSnap.data();
        const orderData = orderSnap.data();

        const storeLocation = storeData.location?.address || 'ไม่ระบุพิกัด';
        const deliveryAddress = orderData.deliveryAddress?.address || 'ลูกค้ายังไม่ได้ระบุที่อยู่';
        const items = orderData.items || [];
        const totalPrice = orderData.totalPrice || 0;

        const itemsSummary = items.map((item: { name: string; quantity: number; }) => `  - ${item.name} (x${item.quantity})`).join('\\n');
        
        message = `
🚨 *มีออเดอร์ใหม่เข้าจ้า!* 🚨

*จากร้าน:* ${storeData.name || 'N/A'}
*พิกัดร้าน:* ${storeLocation}

*รายการอาหาร:*
${itemsSummary}

*ราคารวม:* ${totalPrice.toFixed(2)} บาท

*ที่อยู่จัดส่ง:*
${deliveryAddress}
        `;
    } catch (dataError) {
        console.error("ERROR when preparing message data:", dataError);
        // ถ้าดึงข้อมูลมาสร้าง message ไม่ได้ ก็ส่งข้อความแบบง่ายๆไปแทน
        message = `🚨 มีออเดอร์ใหม่เข้า! Order ID: ${orderId} แต่ดึงข้อมูลมาแสดงผลไม่ได้ โปรดตรวจสอบในระบบ`;
    }
    
    // --- ส่งข้อความ ---
    await sendTelegramNotification(process.env.TELEGRAM_RIDER_GROUP_CHAT_ID, message, orderId);

    return NextResponse.json({ message: 'Notification sent successfully to riders.' });

  } catch (error) {
    console.error('FATAL Error in notify-riders endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}