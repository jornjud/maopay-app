"use client"; // This directive is for Next.js App Router client components

import React, { useState, useEffect } from 'react';
// FIX: Corrected the relative import path for firebase.ts
// The file src/app/history/page.tsx needs to go up two directories (../../) to reach src/,
// then down into lib/firebase.ts.
import { db, collection, query, where, getDocs, auth, appId } from '../../lib/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for order createdAt

// Define interface for order item structure (simplified for now)
interface OrderItem {
  name: string;
  quantity: number;
}

// Define interface for order structure
interface Order {
  id: string;
  storeId: string;
  storeName: string; // Assuming storeName is stored directly in the order document
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'cooking' | 'ready_for_pickup' | 'picking_up' | 'on_the_way' | 'delivered' | 'cancelled' | 'rejected';
  createdAt: Timestamp; // Use Timestamp type
  // Add deliveryAddress, riderId, etc. as needed
}

// Main Customer Order History Page component
export default function App() {
  const [user, setUser] = useState<any>(null); // Firebase User object
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Effect to handle user authentication state and fetch orders
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
        // Fetch orders for this user
        await fetchUserOrders(currentUser.uid);
      } else {
        setUser(null);
        setUserId(null);
        setUserOrders([]); // Clear orders if logged out
        setMessage({ type: 'info', text: 'กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อนะเพื่อน! 🔒' });
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth(); // Cleanup auth listener
  }, []);

  // Function to fetch orders for a specific user
  const fetchUserOrders = async (currentUserId: string) => {
    setIsLoading(true);
    try {
      const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
      // Query orders where customerId matches the current user's ID
      const q = query(ordersRef, where('customerId', '==', currentUserId));

      const querySnapshot = await getDocs(q); // Use getDocs for a one-time fetch

      const ordersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Order, 'id'>
      }));
      // Sort orders by createdAt in descending order (latest first)
      ordersList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setUserOrders(ordersList);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      setMessage({ type: 'error', text: 'ดึงประวัติการสั่งซื้อไม่สำเร็จนะเพื่อน! 😩' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">กำลังโหลดข้อมูล... 🔄</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            ประวัติการสั่งซื้อ 📚
          </h1>
          <p className="text-gray-600">
            ดูรายการออเดอร์ทั้งหมดที่คุณเคยสั่งซื้อ
          </p>
        </header>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-lg text-center mb-4 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {message.message}
          </div>
        )}

        {!userId && (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center mb-6">
            <h2 className="text-2xl font-bold text-red-700 mb-4">
              คุณยังไม่ได้เข้าสู่ระบบนะเพื่อน! 🔐
            </h2>
            <p className="text-gray-600 mb-6">
              เข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อทั้งหมดของคุณ
            </p>
            <button
              onClick={() => {
                // In a real Next.js app, you'd use useRouter().push('/login')
                alert('ไปหน้าล็อกอินนะเพื่อน!');
              }}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 ease-in-out"
            >
              เข้าสู่ระบบเลย!
            </button>
          </div>
        )}

        {userId && userOrders.length === 0 && !isLoading && !message && (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <p className="text-xl text-gray-600">
              ยังไม่พบประวัติการสั่งซื้อเลยนะเพื่อน! ลองสั่งอาหารอร่อยๆ ได้เลย! 😋
            </p>
          </div>
        )}

        {userId && userOrders.length > 0 && (
          <main className="space-y-6">
            {userOrders.map((order) => (
              <div key={order.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-bold text-gray-800">ออเดอร์ #{order.id.substring(0, 8)}...</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : ''}
                    ${order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                    ${['pending', 'cooking', 'ready_for_pickup', 'picking_up', 'on_the_way'].includes(order.status) ? 'bg-yellow-100 text-yellow-800' : ''}
                  `}>
                    {order.status === 'pending' && 'รอร้านรับ ⏳'}
                    {order.status === 'cooking' && 'กำลังทำ 🍳'}
                    {order.status === 'ready_for_pickup' && 'พร้อมส่ง 🛵'}
                    {order.status === 'picking_up' && 'ไรเดอร์รับแล้ว ✅'}
                    {order.status === 'on_the_way' && 'กำลังจัดส่ง 💨'}
                    {order.status === 'delivered' && 'ส่งสำเร็จ! 🎉'}
                    {order.status === 'cancelled' && 'ยกเลิกแล้ว 🚫'}
                    {order.status === 'rejected' && 'ถูกปฏิเสธ 🗑️'}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">ร้าน:</span> {order.storeName}
                </p>
                <p className="text-gray-700 mb-2">
                  <span className="font-semibold">วันที่:</span> {new Date(order.createdAt.toMillis()).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-800 mb-1">รายการสินค้า:</h3>
                  <ul className="list-disc pl-5 text-gray-600">
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.name} x {item.quantity}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-lg font-bold text-gray-800">ยอดรวม:</span>
                  <span className="text-lg font-bold text-green-700">฿{order.totalPrice.toFixed(2)}</span>
                </div>
                {/* Optional: Add a button to view order details or re-order */}
                {order.status === 'delivered' && (
                  <button
                    onClick={() => alert(`รีวิวออเดอร์ ${order.id} ได้เลย!`)}
                    className="mt-4 w-full py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 transition duration-300"
                  >
                    รีวิวออเดอร์นี้ 📝
                  </button>
                )}
              </div>
            ))}
          </main>
        )}
      </div>

      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} MaoPay App. All rights reserved.</p>
      </footer>
    </div>
  );
}
