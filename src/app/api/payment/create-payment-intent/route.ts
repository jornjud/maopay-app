import { NextRequest, NextResponse } from 'next/server';

// This API endpoint simulates the creation of a payment intent
// and interaction with a payment gateway (like Omise or Stripe).
// In a real application, this is where your server-side logic
// for payment processing would reside.

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, paymentMethodType /*, ...other payment details */ } = await req.json();

    console.log('Received payment request:', { amount, currency, paymentMethodType });

    // --- IMPORTANT: This is a SIMULATION! ---
    // In a real application, you would integrate with a Payment Gateway SDK here.
    // Examples:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // Stripe expects amount in cents
    //   currency: currency,
    //   payment_method_types: [paymentMethodType],
    //   // Add more parameters like description, metadata, confirm, etc.
    // });
    // Or for Omise:
    // const omise = require('omise')({ publicKey: process.env.OMISE_PUBLIC_KEY, secretKey: process.env.OMISE_SECRET_KEY });
    // const charge = await omise.charges.create({ ... });

    // Simulate different outcomes based on payment method for demonstration
    if (paymentMethodType === 'cash_on_delivery') {
      // For Cash on Delivery, payment is "successful" immediately on order placement.
      // The actual cash collection happens later by the rider.
      return NextResponse.json(
        { success: true, message: 'ยืนยันออเดอร์เก็บเงินปลายทางเรียบร้อยแล้ว! 💰' },
        { status: 200 }
      );
    }

    // Simulate success or failure for other payment methods
    const simulationSuccess = Math.random() > 0.1; // 90% chance of success, 10% chance of failure

    if (simulationSuccess) {
      // Simulate a successful response from the payment gateway
      return NextResponse.json(
        { success: true, message: 'ชำระเงินสำเร็จ! 🎉', transactionId: `txn_${Date.now()}` },
        { status: 200 }
      );
    } else {
      // Simulate a failed response from the payment gateway
      return NextResponse.json(
        { success: false, message: 'ชำระเงินไม่สำเร็จ! 😩 ยอดเงินไม่พอ หรือข้อมูลบัตรไม่ถูกต้องนะเพื่อน!' },
        { status: 400 } // Bad Request, or 500 if internal gateway error
      );
    }
  } catch (error) {
    console.error('Error processing payment request:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดทางเซิร์ฟเวอร์ในการประมวลผลการชำระเงินนะเพื่อน! 🛠️' },
      { status: 500 } // Internal Server Error
    );
  }
}
