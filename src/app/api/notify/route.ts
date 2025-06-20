// src/app/api/notify/route.ts
import { NextRequest, NextResponse } from 'next/server';

// API endpoint นี้จำลองการรับคำขอส่ง notification
// ในระบบจริง ตรงนี้จะเป็นจุดที่ยิงไปหา Firebase Cloud Messaging (FCM)
export async function POST(req: NextRequest) {
  try {
    const { token, title, body } = await req.json();

    // แค่ log ออกมาดูใน terminal ของ Vercel ว่าได้รับข้อมูลครบ
    console.log('✅ Mock Notification Request Received:');
    console.log(`   - Token: ${token}`);
    console.log(`   - Title: ${title}`);
    console.log(`   - Body: ${body}`);

    // ส่ง response กลับไปว่าสำเร็จแล้ว!
    return NextResponse.json(
      { success: true, message: 'เย้! Backend ได้รับคำขอแล้วเพื่อน!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Error in /api/notify endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'โอ๊ย! Server มีปัญหา' },
      { status: 500 }
    );
  }
}