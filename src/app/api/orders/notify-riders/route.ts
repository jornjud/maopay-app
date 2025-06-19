import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface NotifyRidersRequest {
  orderId: string;
  storeId: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const RIDER_CHAT_ID = process.env.TELEGRAM_RIDER_GROUP_CHAT_ID;
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

//... (ฟังก์ชัน sendTelegramNotification เหมือนเดิม)
async function sendTelegramNotification(chatId: string, text: string, orderId: string) {
    const url = `${BASE_URL}/sendMessage`;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maopay-app.vercel.app';
    const orderUrl = `${appBaseUrl}/dashboard/rider?orderId=${orderId}`;
  
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛵 กดดูรายละเอียดและรับงาน', url: orderUrl }
          ]
        ]
      }
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!data.ok) {
        console.error('Failed to send Telegram message:', data.description);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
    }
}


export async function POST(req: NextRequest) {
  if (!TELEGRAM_BOT_TOKEN || !RIDER_CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_RIDER_GROUP_CHAT_ID is not set!');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { orderId, storeId }: NotifyRidersRequest = await req.json();

    if (!orderId || !storeId) {
      return NextResponse.json({ error: 'Missing orderId or storeId' }, { status: 400 });
    }

    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    const storeData = storeSnap.data();

    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const orderData = orderSnap.data();
    
    // --- 🔥 เจ๊แก้ตรงนี้ให้มันกันเหนียว! 🔥 ---
    const storeLocation = storeData.location?.address || 'ไม่ระบุ';
    const deliveryAddress = orderData.deliveryAddress?.address || 'ลูกค้ายังไม่ได้ระบุที่อยู่';
    const items = orderData.items || []; // ถ้าไม่มี items ให้เป็น array ว่างๆ จะได้ไม่พังตอน .map

    const itemsSummary = items.map((item: { name: string; quantity: number; }) => `  - ${item.name} (x${item.quantity})`).join('\\n');
    const message = `
🚨 *มีออเดอร์ใหม่เข้าจ้า!* 🚨

*จากร้าน:* ${storeData.name}
*พิกัดร้าน:* ${storeLocation}

*รายการอาหาร:*
${itemsSummary}

*ราคารวม:* ${orderData.totalPrice.toFixed(2)} บาท

*ที่อยู่จัดส่ง:*
${deliveryAddress}
    `;

    await sendTelegramNotification(RIDER_CHAT_ID, message, orderId);

    return NextResponse.json({ message: 'Notification sent successfully to riders.' });

  } catch (error) {
    console.error('Error in notify-riders endpoint:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}