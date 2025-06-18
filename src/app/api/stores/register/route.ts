import { NextRequest, NextResponse } from 'next/server';
import { db, collection, addDoc, appId } from '@/lib/firebase'; // Import db, collection, addDoc, and appId from our firebase config

// This is the API endpoint for store registration.
// It will handle POST requests coming from the registration form and save to Firestore.

export async function POST(req: NextRequest) {
  try {
    // Parse the request body as JSON
    const data = await req.json();

    // Log the incoming data for debugging purposes
    console.log('ได้รับข้อมูลลงทะเบียนร้านค้า:', data);

    // Basic validation: Check if essential fields are provided
    const { storeName, address, phone, email, password, confirmPassword } = data;

    if (!storeName || !address || !phone || !email || !password || !confirmPassword) {
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
    const storeDataToSave = {
      storeName,
      address,
      phone,
      email,
      password, // REMINDER: Hash this in production!
      status: 'pending', // Initial status is 'pending' for admin approval
      createdAt: new Date().toISOString(), // Record creation time
      updatedAt: new Date().toISOString(), // Record update time
    };

    // Save the store data to Firestore
    // Collection path: /artifacts/{appId}/public/data/stores
    const storesCollectionRef = collection(db, `artifacts/${appId}/public/data/stores`);
    await addDoc(storesCollectionRef, storeDataToSave);

    console.log('บันทึกข้อมูลร้านค้าลง Firestore เรียบร้อย! ✅');

    return NextResponse.json(
      { success: true, message: 'ลงทะเบียนร้านค้าเรียบร้อยแล้วจ้า! 🎉 รอการอนุมัติจากแอดมินนะเพื่อน!', status: 'pending' },
      { status: 200 } // OK status code
    );

  } catch (error) {
    // Catch any unexpected errors during the process
    console.error('เกิดข้อผิดพลาดในการลงทะเบียนร้านค้า:', error);
    return NextResponse.json(
      { success: false, message: 'มีบางอย่างผิดพลาด! โปรดลองใหม่อีกครั้งนะเพื่อน!' },
      { status: 500 } // Internal Server Error
    );
  }
}
