import { NextRequest, NextResponse } from 'next/server';
//       👇 แก้ตรงนี้! เอา messaging เข้ามาแทน adminAuth
import { db, messaging } from '@/lib/firebase-admin'; 
import { doc, getDoc } from 'firebase/firestore';

// ... (ฟังก์ชัน sendTelegramNotification เหมือนเดิม ไม่ต้องแก้) ...

async function sendTelegramNotification(chat_id: string, text: string, orderId: string) {
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/rider?orderId=${orderId}`;

  const payload: { chat_id: string; text: string; parse_mode: 'Markdown' | 'HTML'; reply_markup?: { inline_keyboard: { text: string; url: string; }[][]; }; } = {
    chat_id: chat_id,
    text: text,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: 'รับงานนี้! 🛵', url: orderUrl }]
      ]
    }
  };

  try {
    const response = await fetch(TELEGRAM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram API Error:', result.description);
      throw new Error(`Telegram API responded with an error: ${result.description}`);
    }
    console.log('Successfully sent message to Telegram');
    return result;
  } catch (error) {
    console.error('Failed to send notification to Telegram:', error);
  }
}


async function sendPushNotification(title: string, body: string, orderId: string) {
    const topic = 'new-jobs';

    const message = {
        notification: {
            title: title,
            body: body,
        },
        webpush: {
            fcm_options: {
                link: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/rider?orderId=${orderId}`
            },
            notification: {
                icon: "https://www.maopay-app.vercel.app/favicon.ico",
            }
        },
        topic: topic,
    };

    try {
        // --- 👇 แก้ตรงนี้! ให้เรียกจาก messaging ตรงๆ เลย ---
        const response = await messaging.send(message);
        console.log('Successfully sent push notification:', response);
        return { success: true, response };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error };
    }
}

export async function POST(req: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_RIDER_GROUP_CHAT_ID) {
    return NextResponse.json({ error: 'Server configuration error for Telegram.' }, { status: 500 });
  }

  try {
    const { orderId, storeId } = await req.json();
    if (!orderId || !storeId) {
      return NextResponse.json({ error: 'Missing orderId or storeId' }, { status: 400 });
    }

    const storeRef = doc(db, 'stores', storeId);
    const orderRef = doc(db, 'orders', orderId);
    const [storeSnap, orderSnap] = await Promise.all([getDoc(storeRef), getDoc(orderRef)]);

    if (!storeSnap.exists()) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    if (!orderSnap.exists()) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    const storeData = storeSnap.data();
    const orderData = orderSnap.data();
    
    const notiTitle = `🚨 งานใหม่เข้า! จากร้าน ${storeData.name || 'N/A'}`;
    const notiBody = `มีออเดอร์ให้ไปส่งที่: ${orderData.deliveryAddress?.address || 'ไม่มีที่อยู่'}`;
    const telegramMessage = `
🚨 *มีออเดอร์ใหม่เข้าจ้า!* 🚨
*จากร้าน:* ${storeData.name || 'N/A'}
*ที่อยู่จัดส่ง:* ${orderData.deliveryAddress?.address || 'ไม่มีที่อยู่'}
*ยอดรวม:* ${orderData.total.toFixed(2)} บาท
    `;

    await sendTelegramNotification(process.env.TELEGRAM_RIDER_GROUP_CHAT_ID, telegramMessage, orderId);
    await sendPushNotification(notiTitle, notiBody, orderId);

    return NextResponse.json({ message: 'Notification sent successfully to riders via all channels.' });

  } catch (error) {
    console.error('FATAL Error in notify-riders endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}