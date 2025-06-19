import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface NotifyRidersRequest {
  orderId: string;
  storeId: string;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Sends a notification message to a Telegram chat with an inline button.
 * @param chatId The target Telegram chat ID.
 * @param text The message content.
 * @param orderId The ID of the order to create a direct link.
 */
async function sendTelegramNotification(chatId: string, text: string, orderId: string) {
  const url = `${BASE_URL}/sendMessage`;
  // Use an environment variable for the app's base URL for flexibility.
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maopay-app.vercel.app';
  const orderUrl = `${appBaseUrl}/dashboard/rider?orderId=${orderId}`;

  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown', // Using Markdown for text formatting
    reply_markup: {
      inline_keyboard: [
        [
          // This button will link directly to the rider dashboard with the order details pre-loaded.
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
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set in environment variables.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const { orderId, storeId }: NotifyRidersRequest = await req.json();

    if (!orderId || !storeId) {
      return NextResponse.json({ error: 'Missing orderId or storeId' }, { status: 400 });
    }

    // 1. Fetch store details to get the Telegram Group ID and location
    const storeRef = doc(db, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    const storeData = storeSnap.data();
    const chatId = storeData.telegramGroupId;

    if (!chatId) {
      console.log(`Store ${storeId} does not have a Telegram Group ID configured.`);
      return NextResponse.json({ message: 'No Telegram Group ID for this store.' });
    }

    // 2. Fetch order details to create a meaningful message
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const orderData = orderSnap.data();
    const storeLocation = storeData.location?.address || 'ไม่ระบุ';

    // 3. Create a more detailed and readable notification message
    const itemsSummary = orderData.items.map((item: { productName: string; quantity: number; }) => `  - ${item.productName} (x${item.quantity})`).join('\n');
    const message = `
🚨 *มีออเดอร์ใหม่เข้าจ้า!* 🚨

*จากร้าน:* ${storeData.name}
*พิกัดร้าน:* ${storeLocation}

*รายการอาหาร:*
${itemsSummary}

*ราคารวม:* ${orderData.totalPrice.toFixed(2)} บาท

*ที่อยู่จัดส่ง:*
${orderData.deliveryAddress.address}
    `;

    // 4. Send the notification with the direct link button
    await sendTelegramNotification(chatId, message, orderId);

    return NextResponse.json({ message: 'Notification sent successfully to riders.' });

  } catch (error) {
    console.error('Error in notify-riders endpoint:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
