// src/app/api/orders/revert-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, auth as adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const { orderId } = await req.json();
        const authToken = req.headers.get('authorization')?.split('Bearer ')[1];

        if (!authToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const decodedToken = await adminAuth.verifyIdToken(authToken);
        const userId = decodedToken.uid;

        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        
        const orderData = orderSnap.data()!;
        const storeRef = db.collection('stores').doc(orderData.storeId);
        const storeSnap = await storeRef.get();
        
        if (storeSnap.data()?.ownerId !== userId) {
             return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        if (orderData.status !== 'waiting_for_payment') {
            return NextResponse.json({ error: `Cannot revert order with status "${orderData.status}"` }, { status: 400 });
        }

        await orderRef.update({ status: 'waiting_for_confirmation', updatedAt: new Date().toISOString() });
        
        return NextResponse.json({ success: true, message: 'Order confirmation reverted.' });
    } catch (error) {
        console.error('Error reverting order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}