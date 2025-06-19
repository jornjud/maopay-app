import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { userId, name, phone, vehicleDetails } = data;

        // Basic validation
        if (!userId || !name || !phone || !vehicleDetails) {
            return NextResponse.json({ error: 'Missing required fields for rider registration.' }, { status: 400 });
        }

        // Use the user's UID as the document ID for the rider profile
        const riderRef = doc(db, "riders", userId);

        // Set the data for the new rider
        await setDoc(riderRef, {
            userId: userId,
            name: name,
            phone: phone,
            vehicleDetails: vehicleDetails,
            status: 'pending', // Set initial status to 'pending' for admin approval
            createdAt: new Date(),
        });

        return NextResponse.json({ 
            message: 'Rider registration submitted successfully and is pending approval.', 
            riderId: userId 
        }, { status: 201 });

    } catch (error) {
        console.error('Error in Rider Registration API:', error);
        
        if (error instanceof Error) {
            return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
        }
        
        return NextResponse.json({ error: 'An unknown internal server error occurred.' }, { status: 500 });
    }
}
