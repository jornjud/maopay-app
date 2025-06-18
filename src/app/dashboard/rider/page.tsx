import React, { useState, useEffect } from 'react';
// FIX: Changed import path to use '@/lib/firebase' as specified in tsconfig.json paths.
// This is the standard way to import from src/ in Next.js projects with TypeScript.
// The previous relative path '../../../lib/firebase.ts' was causing resolution issues in the build environment.
import { db, collection, query, where, onSnapshot, doc, updateDoc, auth, appId } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Define interface for order item structure (simplified for now)
interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerAddress: string;
  storeName: string;
  status: 'pending_pickup' | 'picking_up' | 'on_the_way' | 'delivered' | 'cancelled';
  totalPrice: number;
  // Add more fields as needed, e.g., items, deliveryFee, timestamps
}

// Main Rider Dashboard component
export default function App() {
  // State to simulate user role. In a real app, this would come from Firebase Auth/Firestore.
  const [userRole, setUserRole] = useState<'loading' | 'admin' | 'user' | 'store_owner' | 'rider' | 'guest'>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Effect to handle user authentication state and fetch user role
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Fetch user role from Firestore
        const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}`);
        try {
          const userDocSnap = await new Promise<any>((resolve) => {
            const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
              unsubscribe(); // Unsubscribe after first fetch if it's just for role checking
              resolve(docSnap);
            }, (error) => {
              console.error("Error fetching user role document:", error);
              resolve(null); // Resolve with null on error
            });
          });

          if (userDocSnap && userDocSnap.exists()) {
            setUserRole(userDocSnap.data()?.role || 'user');
          } else {
            setUserRole('user'); // Default to 'user' if no role found
          }
        } catch (error) {
          console.error("Error setting up user role listener:", error);
          setUserRole('guest'); // Fallback in case of error
        }
      } else {
        setUserRole('guest'); // No user logged in
        setUserId(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth(); // Cleanup auth listener on unmount
  }, []);

  // Effect to fetch assigned orders for the specific rider
  useEffect(() => {
    // Only fetch if authenticated as a rider and userId is available
    if (userRole === 'rider' && userId) {
      // In a real application, orders would have a 'riderId' field to assign to a specific rider.
      // For now, let's simulate by just showing some placeholder orders or orders with 'pending_pickup' status
      // or that are specifically assigned to this rider's ID.
      // For demonstration, let's assume 'riderId' field exists in 'orders' collection
      const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
      const q = query(ordersRef, where('riderId', '==', userId), where('status', 'in', ['pending_pickup', 'picking_up', 'on_the_way']));

      const unsubscribeOrders = onSnapshot(q, (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Order, 'id'>
        }));
        setAssignedOrders(ordersList);
      }, (error) => {
        console.error("Error fetching assigned orders:", error);
        setMessage({ type: 'error', text: 'ดึงข้อมูลออเดอร์ที่ได้รับมอบหมายไม่สำเร็จนะเพื่อน! 😩' });
      });

      return () => unsubscribeOrders(); // Cleanup listener
    }
  }, [userRole, userId]); // Re-run when userRole or userId changes

  // Function to simulate accepting an order
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const orderDocRef = doc(db, `artifacts/${appId}/public/data/orders`, orderId);
      // Update order status and assign rider if not already assigned
      await updateDoc(orderDocRef, {
        status: 'picking_up', // Change status to picking up
        riderId: userId, // Assign this rider to the order
        updatedAt: new Date().toISOString(),
      });
      setMessage({ type: 'success', text: `รับออเดอร์ ${orderId} เรียบร้อยแล้ว! เตรียมตัวไปรับของเลย! ✅` });
    } catch (error) {
      console.error("Error accepting order:", error);
      setMessage({ type: 'error', text: `รับออเดอร์ ${orderId} ไม่สำเร็จนะเพื่อน! ❌` });
    }
  };

  // Function to simulate updating order status (e.g., picked up, delivered)
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'picking_up' | 'on_the_way' | 'delivered') => {
    try {
      const orderDocRef = doc(db, `artifacts/${appId}/public/data/orders`, orderId);
      await updateDoc(orderDocRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      setMessage({ type: 'success', text: `อัปเดตสถานะออเดอร์ ${orderId} เป็น "${newStatus}" เรียบร้อยแล้ว! 🎉` });
    } catch (error) {
      console.error("Error updating order status:", error);
      setMessage({ type: 'error', text: `อัปเดตสถานะออเดอร์ ${orderId} ไม่สำเร็จนะเพื่อน! ❌` });
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">กำลังโหลดข้อมูล... 🔄</div>
      </div>
    );
  }

  // Check if the user has 'rider' role
  if (userRole !== 'rider') {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            🚫 เข้าไม่ได้นะเพื่อน! 🚫
          </h2>
          <p className="text-gray-600 mb-6">
            หน้า Rider Dashboard มีไว้สำหรับไรเดอร์เท่านั้นจ้าาา
          </p>
          <button
            onClick={() => {
              // In a real Next.js app, you'd use useRouter().push('/')
              console.log('กลับหน้าหลัก');
            }}
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-300 ease-in-out"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // Render the Rider Dashboard if user is a rider
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Rider Dashboard 🏍️
          </h1>
          <p className="text-gray-600">
            ยินดีต้อนรับไรเดอร์! นี่คือออเดอร์ที่ได้รับมอบหมายและสถานะล่าสุด
          </p>
        </header>

        {/* Message Display */}
        {message && (
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

        <main className="grid grid-cols-1 gap-6">
          {/* Assigned Orders Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">
              ออเดอร์ที่ได้รับมอบหมาย ({assignedOrders.length} ออเดอร์)
            </h2>
            {assignedOrders.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {assignedOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                    <p className="font-semibold text-lg text-gray-800">ออเดอร์ #{order.orderId}</p>
                    <p className="text-sm text-gray-600">จากร้าน: {order.storeName}</p>
                    <p className="text-sm text-gray-600">ถึง: {order.customerName} ({order.customerAddress})</p>
                    <p className="text-sm font-bold text-gray-700">ยอดรวม: ฿{order.totalPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      สถานะ: {' '}
                      <span className={`font-semibold ${order.status === 'delivered' ? 'text-green-600' : 'text-orange-500'}`}>
                        {order.status === 'pending_pickup' && 'รอคุณรับ 👍'}
                        {order.status === 'picking_up' && 'กำลังรับสินค้า 📦'}
                        {order.status === 'on_the_way' && 'กำลังจัดส่ง 💨'}
                        {order.status === 'delivered' && 'ส่งแล้ว! 🎉'}
                        {order.status === 'cancelled' && 'ยกเลิก 🚫'}
                      </span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.status === 'pending_pickup' && (
                        <button
                          onClick={() => handleAcceptOrder(order.id)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition duration-300"
                        >
                          รับงาน 🎯
                        </button>
                      )}
                      {order.status === 'picking_up' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'on_the_way')}
                          className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition duration-300"
                        >
                          กำลังไปส่ง 💨
                        </button>
                      )}
                      {order.status === 'on_the_way' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition duration-300"
                        >
                          ส่งแล้ว! 🎉
                        </button>
                      )}
                      {/* Add a button for directions/map link later */}
                      <button
                        onClick={() => alert(`จำลองเส้นทางสำหรับออเดอร์ ${order.orderId}`)}
                        className="px-4 py-2 bg-gray-400 text-white text-sm font-medium rounded-md hover:bg-gray-500 transition duration-300"
                      >
                        ดูแผนที่ 🗺️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                ยังไม่มีออเดอร์ที่ได้รับมอบหมายเลยนะเพื่อน! พักก่อนได้เลย! 😴
              </p>
            )}
          </div>
        </main>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MaoPay App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
