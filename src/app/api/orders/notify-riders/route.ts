import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'ไม่พบ ID ออเดอร์' }, { status: 400 });
        }

        // 1. ดึงข้อมูลออเดอร์
        const orderDocRef = doc(db, "orders", orderId);
        const orderDocSnap = await getDoc(orderDocRef);

        if (!orderDocSnap.exists()) {
            return NextResponse.json({ error: 'ไม่พบออเดอร์นี้ในระบบ' }, { status: 404 });
        }
        const orderData = orderDocSnap.data();
        const storeId = orderData.storeId;

        // 2. ดึงข้อมูลร้านค้าเพื่อเอาชื่อร้าน
        const storeDocRef = doc(db, "stores", storeId);
        const storeDocSnap = await getDoc(storeDocRef);
        const storeName = storeDocSnap.exists() ? storeDocSnap.data().name : 'ไม่พบชื่อร้าน';
        
        // 3. ดึง Chat ID ของกลุ่มไรเดอร์จาก .env
        const riderChatId = process.env.TELEGRAM_RIDER_GROUP_CHAT_ID;
        if (!riderChatId) {
            throw new Error("ไม่ได้ตั้งค่า TELEGRAM_RIDER_GROUP_CHAT_ID");
        }

        // 4. สร้างข้อความแจ้งงาน
        let message = `🛵💨 *มีงานใหม่เข้า!* 🛵💨\n\n`;
        message += `*ร้าน:* ${storeName}\n`;
        message += `*ยอดรวม:* ${orderData.totalPrice} บาท\n`;
        message += `*สถานะ:* รอลั่น!\n\n`;
        message += `ใครใกล้ กดรับงานได้เลย!`;
        
        // 5. ส่งแจ้งเตือนไปที่กลุ่มไรเดอร์
        await sendTelegramMessage(riderChatId, message);
        
        // 6. อัปเดตสถานะออเดอร์ใน Firestore
        await updateDoc(orderDocRef, {
            status: 'notifying_riders' // เปลี่ยนสถานะเป็น "กำลังแจ้งไรเดอร์"
        });

        return NextResponse.json({ message: 'ส่งแจ้งเตือนให้ไรเดอร์เรียบร้อย!' }, { status: 200 });

    } catch (error: any) {
        console.error("Error notifying riders:", error);
        return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
    }
}
