// src/app/api/notify-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, messaging, auth as adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { userId, title, body, link } = await req.json();
        const authToken = req.headers.get('authorization')?.split('Bearer ')[1];

        if (!authToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // ตรวจสอบ Token ว่าคนที่ส่งคำขอนี้มา มีสิทธิ์จริงๆ
        await adminAuth.verifyIdToken(authToken);

        if (!userId || !title || !body) {
            return NextResponse.json({ error: 'Missing userId, title, or body' }, { status: 400 });
        }

        // ไปดึง FCM Token ของ User คนนั้นจาก Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
            console.log(`User ${userId} does not have an FCM token.`);
            return NextResponse.json({ message: 'User does not have a token, notification not sent.' });
        }

        const message = {
            notification: { title, body },
            webpush: {
                fcm_options: { link: link || process.env.NEXT_PUBLIC_BASE_URL },
                notification: { icon: "https://www.maopay-app.vercel.app/favicon.ico" }
            },
            token: fcmToken,
        };

        const response = await messaging.send(message);
        console.log('Successfully sent message:', response);

        return NextResponse.json({ success: true, response });

    } catch (error) {
        console.error('Error sending notification:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}