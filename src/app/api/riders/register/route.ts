import { NextRequest, NextResponse } from 'next/server';
import { db, collection, addDoc, appId } from '@/lib/firebase'; // Import db, collection, addDoc, and appId from our firebase config

// This is the API endpoint for rider registration.
// It will handle POST requests coming from the rider registration form and save to Firestore.

export async function POST(req: NextRequest) {
  try {
    // Parse the request body as JSON
    const data = await req.json();

    // Log the incoming data for debugging purposes
    console.log('ได้รับข้อมูลลงทะเบียนไรเดอร์:', data);

    // Basic validation: Check if essential fields are provided
    const { fullName, phone, email, password, confirmPassword, vehicleType, licensePlate, bankAccountNumber } = data;

    if (!fullName || !phone || !email || !password || !confirmPassword || !vehicleType || !licensePlate || !bankAccountNumber) {
      // If any required field is missing, return an error
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบนะเพื่อน! กรอกให้ครบทุกช่องก่อน!' },
        { status: 400 } // Bad Request status code
      );
    }

    // Further validation: Check if passwords match (should ideally be done on client-side too)
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านไม่ตรงกันนะเพื่อน! ลองอีกที!' },
        { status: 400 } // Bad Request status code
      );
    }

    // Prepare data to save to Firestore
    // IMPORTANT: In a real app, you MUST hash the password before saving!
    // For this example, we are saving it as plain text for simplicity, but DO NOT do this in production!
    const riderDataToSave = {
      fullName,
      phone,
      email,
      password, // REMINDER: Hash this in production!
      vehicleType,
      licensePlate,
      bankAccountNumber,
      status: 'pending', // Initial status is 'pending' for admin approval
      createdAt: new Date().toISOString(), // Record creation time
      updatedAt: new Date().toISOString(), // Record update time
    };

    // Save the rider data to Firestore
    // Collection path: /artifacts/{appId}/public/data/riders
    const ridersCollectionRef = collection(db, `artifacts/${appId}/public/data/riders`);
    await addDoc(ridersCollectionRef, riderDataToSave);

    console.log('บันทึกข้อมูลไรเดอร์ลง Firestore เรียบร้อย! ✅');

    return NextResponse.json(
      { success: true, message: 'ลงทะเบียนไรเดอร์เรียบร้อยแล้วจ้า! 🎉 รอการอนุมัติจากแอดมินนะเพื่อน!', status: 'pending' },
      { status: 200 } // OK status code
    );

  } catch (error) {
    // Catch any unexpected errors during the process
    console.error('เกิดข้อผิดพลาดในการลงทะเบียนไรเดอร์:', error);
    return NextResponse.json(
      { success: false, message: 'มีบางอย่างผิดพลาด! โปรดลองใหม่อีกครั้งนะเพื่อน!' },
      { status: 500 } // Internal Server Error
    );
  }
}
