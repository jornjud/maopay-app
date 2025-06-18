import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { CartItem } from '@/store/cartStore';

// ฟังก์ชันสำหรับส่งข้อความไปที่ Telegram
async function sendTelegramMessage(chatId: string, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !chatId) {
        console.error("Telegram token or Chat ID is missing.");
        return;
    }
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
            }),
        });
    } catch (error) {
        console.error("Failed to send Telegram message:", error);
    }
}

// Handler สำหรับ POST request
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { items, totalPrice, storeId } = body;

        if (!items || items.length === 0 || !totalPrice || !storeId) {
            return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
        }

        // 1. บันทึกออเดอร์ใหม่ลงใน collection 'orders'
        const newOrderRef = await addDoc(collection(db, "orders"), {
            storeId: storeId,
            items: items,
            totalPrice: totalPrice,
            status: 'pending', // สถานะเริ่มต้น: รอร้านยืนยัน
            createdAt: serverTimestamp(), // ประทับเวลาที่สร้าง
        });

        // 2. ดึงข้อมูลร้านค้าเพื่อหา Telegram Chat ID
        const storeDocRef = doc(db, "stores", storeId);
        const storeDocSnap = await getDoc(storeDocRef);
        
        if (!storeDocSnap.exists() || !storeDocSnap.data()?.telegram_chat_id) {
             console.error(`Store ${storeId} not found or has no telegram_chat_id.`);
             // แม้จะส่งแจ้งเตือนไม่ได้ แต่ก็ถือว่าสร้างออเดอร์สำเร็จ
             return NextResponse.json({ message: 'สร้างออเดอร์สำเร็จ แต่ไม่สามารถส่งแจ้งเตือนได้', orderId: newOrderRef.id });
        }
        
        const storeData = storeDocSnap.data();
        const chatId = storeData.telegram_chat_id;

        // 3. สร้างข้อความที่จะส่งไป Telegram
        let message = `🔔 *ออเดอร์ใหม่เข้าแล้วจ้า!*\n\n`;
        message += `*ร้าน:* ${storeData.name}\n`;
        message += `*ID ออเดอร์:* \`${newOrderRef.id}\`\n\n`;
        message += `*รายการอาหาร:*\n`;
        items.forEach((item: CartItem) => {
            message += `- ${item.name} (x${item.quantity}) = ${item.price * item.quantity} บาท\n`;
        });
        message += `\n*ยอดรวม:* *${totalPrice} บาท*\n\n`;
        message += `👉 เข้าไปยืนยันออเดอร์ได้ที่แดชบอร์ดเลย!`;

        // 4. ส่งข้อความ!
        await sendTelegramMessage(chatId, message);

        return NextResponse.json({ message: 'สร้างออเดอร์และส่งแจ้งเตือนสำเร็จ!', orderId: newOrderRef.id }, { status: 201 });

    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างออเดอร์' }, { status: 500 });
    }
}
