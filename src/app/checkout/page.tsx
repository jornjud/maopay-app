"use client"; // This directive is for Next.js App Router client components

import React, { useState } from 'react';

// Main CheckoutPage component for simulating payment processing
export default function App() {
  const [paymentMethod, setPaymentMethod] = useState(''); // State for selected payment method
  const [paymentStatus, setPaymentStatus] = useState<{ type: string; message: string } | null>(null); // State for payment feedback
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  // Hardcoded total amount for demonstration purposes
  const totalAmount = 120.50; // Example total price

  // Function to handle payment method selection
  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value);
    setPaymentStatus(null); // Clear previous status
  };

  // Function to simulate payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission

    if (!paymentMethod) {
      setPaymentStatus({ type: 'error', message: 'กรุณาเลือกวิธีการชำระเงินก่อนนะเพื่อน! 💳' });
      return;
    }

    setIsLoading(true);
    setPaymentStatus(null); // Clear previous status

    try {
      // Simulate API call to your backend (which would then interact with a real Payment Gateway)
      const response = await fetch('/api/payment/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'THB', // Thai Baht
          paymentMethodType: paymentMethod,
          // In a real app, you might send customer ID, order details, etc.
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentStatus({ type: 'success', message: `จ่ายเงิน ${totalAmount} บาท ด้วย ${paymentMethod} สำเร็จ! 🎉 ขอบคุณที่ใช้บริการจ้า!` });
        // In a real app, redirect to order confirmation page or update order status
        console.log('Payment successful:', data);
      } else {
        setPaymentStatus({ type: 'error', message: `จ่ายเงินไม่สำเร็จนะเพื่อน! 😭 ${data.message || 'เกิดข้อผิดพลาดบางอย่าง'}` });
        console.error('Payment failed:', data);
      }
    } catch (error) {
      console.error('Error during payment processing:', error);
      setPaymentStatus({ type: 'error', message: 'เกิดข้อผิดพลาดทางเทคนิค! ลองใหม่อีกครั้งนะเพื่อน! 🛠️' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          หน้าชำระเงิน 🛒
        </h1>
        <p className="text-gray-600 text-center mb-8">
          เลือกวิธีการชำระเงินและยืนยันออเดอร์
        </p>

        {/* Order Summary */}
        <div className="bg-purple-50 p-4 rounded-lg mb-6 shadow-sm">
          <h2 className="text-xl font-bold text-purple-700 mb-2">สรุปรายการ</h2>
          <div className="flex justify-between text-lg font-semibold text-gray-800">
            <span>ยอดรวมทั้งหมด:</span>
            <span>฿{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              วิธีการชำระเงิน: <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={handlePaymentMethodChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm appearance-none bg-white bg-no-repeat bg-[right_0.75rem_center] bg-[length:1em_1em] pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3 3 3-3m0 6l-3-3-3 3' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
              }}
            >
              <option value="">-- เลือกช่องทาง --</option>
              <option value="credit_card">บัตรเครดิต/เดบิต 💳</option>
              <option value="qr_payment">QR พร้อมเพย์ 📱</option>
              <option value="cash_on_delivery">เก็บเงินปลายทาง 💰</option>
              {/* Add more options if needed, e.g., bank transfer, e-wallets */}
            </select>
          </div>

          {/* Payment Status Message */}
          {paymentStatus && (
            <div
              className={`p-3 rounded-lg text-center text-sm font-medium ${
                paymentStatus.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {paymentStatus.message}
            </div>
          )}

          {/* Pay Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white transition duration-150 ease-in-out ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังประมวลผล...
              </span>
            ) : (
              'จ่ายเงินเลย! 💸'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
