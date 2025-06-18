import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'ไม่พบ ID ออเดอร์' }, { status: 400 });
        }

        const orderDocRef = doc(db, "orders", orderId);
        const orderDocSnap = await getDoc(orderDocRef);

        if (!orderDocSnap.exists()) {
            return NextResponse.json({ error: 'ไม่พบออเดอร์นี้ในระบบ' }, { status: 404 });
        }
        const orderData = orderDocSnap.data();
        const storeId = orderData.storeId;

        const storeDocRef = doc(db, "stores", storeId);
        const storeDocSnap = await getDoc(storeDocRef);
        const storeName = storeDocSnap.exists() ? storeDocSnap.data().name : 'ไม่พบชื่อร้าน';
        
        const riderChatId = process.env.TELEGRAM_RIDER_GROUP_CHAT_ID;
        if (!riderChatId) {
            throw new Error("ไม่ได้ตั้งค่า TELEGRAM_RIDER_GROUP_CHAT_ID");
        }

        let message = `🛵💨 *มีงานใหม่เข้า!* 🛵💨\n\n`;
        message += `*ร้าน:* ${storeName}\n`;
        message += `*ยอดรวม:* ${orderData.totalPrice} บาท\n`;
        message += `*สถานะ:* รอลั่น!\n\n`;
        message += `ใครใกล้ กดรับงานได้เลย!`;
        
        await sendTelegramMessage(riderChatId, message);
        
        await updateDoc(orderDocRef, {
            status: 'notifying_riders'
        });

        return NextResponse.json({ message: 'ส่งแจ้งเตือนให้ไรเดอร์เรียบร้อย!' }, { status: 200 });

    } catch (error: unknown) { // << แก้ไข: เปลี่ยนจาก any เป็น unknown
        const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
        console.error("Error notifying riders:", error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
