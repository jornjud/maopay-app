import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        // It's better to explicitly list the fields you expect
        const { 
            ownerId, 
            name, 
            description, 
            type, 
            telegramGroupId, 
            location,
            imageUrl 
        } = data;

        // Basic validation
        if (!ownerId || !name || !type || !location) {
            return NextResponse.json({ error: 'Missing required fields for store registration.' }, { status: 400 });
        }

        // Add a new document with a generated id.
        const newStoreRef = await addDoc(collection(db, "stores"), {
            ownerId,
            name,
            description: description || '',
            type,
            telegramGroupId: telegramGroupId || '',
            location,
            imageUrl: imageUrl || `https://placehold.co/600x400/orange/white?text=${encodeURIComponent(name)}`,
            status: 'pending', // Initial status for admin approval
            createdAt: serverTimestamp(), // Use server timestamp for consistency
        });

        return NextResponse.json({ 
            message: 'Store registration submitted successfully and is pending approval.', 
            storeId: newStoreRef.id 
        }, { status: 201 });

    } catch (error) {
        console.error('Error in Store Registration API:', error);
        
        if (error instanceof Error) {
            return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
        }
        
        return NextResponse.json({ error: 'An unknown internal server error occurred.' }, { status: 500 });
    }
}
