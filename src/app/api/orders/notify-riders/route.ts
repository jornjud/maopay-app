import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// --- 👇👇 เพิ่มตรงนี้เลยเพื่อน! 👇👇 ---

// Interface for the data expected by the Telegram API
interface TelegramSendMessagePayload {
  chat_id: string;
  text: string;
  parse_mode: 'Markdown' | 'HTML';
  reply_markup?: {
    inline_keyboard: { text: string; url: string; }[][];
  };
}

// Function to send the notification to Telegram
async function sendTelegramNotification(chat_id: string, text: string, orderId: string) {
  const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  // Construct a URL for the rider to view the order details
  const orderUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/rider?orderId=${orderId}`;

  const payload: TelegramSendMessagePayload = {
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
    // Do not re-throw the error to prevent the entire endpoint from failing
    // Just log it and move on
  }
}
// --- 👆👆 จบส่วนที่เพิ่ม 👆👆 ---


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