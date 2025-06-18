// src/app/riders/register/page.tsx
"use client"; // << เพิ่มตรงนี้เลยจ้า! #ClientComponent #NextJS

import React, { useState } from 'react'; // 

// Main App component for the rider registration page
export default function App() {
  // State to hold form data for rider registration
  const [formData, setFormData] = useState({ // 
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    licensePlate: '',
    bankAccountNumber: '',
  });

  // State for displaying messages to the user (e.g., success, error)
  const [message, setMessage] = useState({ type: '', text: '' }); // 

  // Function to handle input changes and update form data state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Basic validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'รหัสผ่านไม่ตรงกันนะเพื่อน! ลองอีกที!' }); // Passwords do not match
      return;
    }

    // You would typically send this data to an API endpoint here
    // For now, let's just log it to the console
    console.log('ข้อมูลไรเดอร์ที่ลงทะเบียน:', formData);

    // Simulate API call success
    setMessage({ type: 'success', text: 'ลงทะเบียนไรเดอร์เรียบร้อยแล้วจ้า! 🎉 เตรียมตัวซิ่งได้เลย!' }); // Successful registration message

    // Clear form after successful submission
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      vehicleType: '',
      licensePlate: '',
      bankAccountNumber: '',
    });
  };

  // Function to navigate back to the home page (placeholder)
  const goToHome = () => {
    // In a real Next.js app, you'd use useRouter().push('/') here.
    // For this standalone component, we'll just log.
    console.log('กลับหน้าหลัก');
    alert('กลับหน้าหลักนะเพื่อน! 👋'); // Using alert for demo purposes, replace with proper UI notification
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          สมัครเป็นไรเดอร์ MaoPay 🏍️💨
        </h1>
        <p className="text-gray-600 text-center mb-8">
          มาซิ่งส่งความอร่อยไปกับเราสิ!
        </p>

        {/* Display messages to the user */}
        {message.text && (
          <div
            className={`p-3 rounded-lg text-center mb-4 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Rider Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="ชื่อเต็มของคุณ"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์: <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="08X-XXX-XXXX"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล: <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่าน: <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="ตั้งรหัสผ่านสุดลับ"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              ยืนยันรหัสผ่าน: <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="ยืนยันอีกครั้ง"
            />
          </div>

          <div>
            <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
              ประเภทพาหนะ: <span className="text-red-500">*</span>
            </label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            >
              <option value="">เลือกประเภทพาหนะ</option>
              <option value="motorcycle">มอเตอร์ไซค์ 🏍️</option>
              <option value="bicycle">จักรยาน 🚴</option>
              <option value="car">รถยนต์ 🚗</option>
            </select>
          </div>

          <div>
            <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
              เลขทะเบียนรถ: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="licensePlate"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="กข 1234 หรือ 1กข 1234"
            />
          </div>

          <div>
            <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700 mb-1">
              เลขที่บัญชีธนาคาร: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="bankAccountNumber"
              name="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="เลขที่บัญชีรับเงิน"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
          >
            ลงทะเบียนไรเดอร์ 💨
          </button>
        </form>

        {/* Back to home button */}
        <div className="mt-6 text-center">
          <button
            onClick={goToHome}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            หรือจะกลับหน้าหลักก่อนดี?
          </button>
        </div>
      </div>
    </div>
  );
}