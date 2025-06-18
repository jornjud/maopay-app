import React, { useState, useEffect } from 'react';
// FIX: Changed the import path to use the alias with explicit .ts extension.
// Based on your tsconfig.json, '@/lib/firebase.ts' should correctly resolve to 'src/lib/firebase.ts'.
// This is the standard and most reliable way for Next.js and TypeScript projects.
import { db, collection, query, where, onSnapshot, doc, updateDoc, auth, appId } from '@/lib/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp for order createdAt

// Define interface for menu item structure
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean; // Field to manage item availability
}

// Define interface for order structure
interface Order {
  id: string;
  storeId: string;
  customerName: string; // Simplified
  customerAddress: string; // Simplified
  items: { name: string; quantity: number }[];
  totalPrice: number;
  status: 'pending' | 'cooking' | 'ready_for_pickup' | 'picking_up' | 'on_the_way' | 'delivered' | 'cancelled' | 'rejected';
  createdAt: Timestamp; // Use Timestamp type
  // Add riderId if assigned, deliveryAddress, etc.
}


// Main Store Owner Dashboard component
export default function App() {
  // State to simulate user role. In a real app, this would come from Firebase Auth/Firestore.
  const [userRole, setUserRole] = useState<'loading' | 'admin' | 'user' | 'store_owner' | 'rider' | 'guest'>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState<any>(null); // To store the specific store's data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]); // To store menu items for this store
  const [storeOrders, setStoreOrders] = useState<Order[]>([]); // To store orders for this store
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // States for Add/Edit Menu Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null); // For editing, null for adding new
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
  });

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
            const userData = userDocSnap.data();
            setUserRole(userData?.role || 'user');
            // If user is a store owner, fetch their store details
            if (userData?.role === 'store_owner' && userData?.storeId) {
                // Fetch store details based on storeId linked to the user
                const storeDocRef = doc(db, `artifacts/${appId}/public/data/stores`, userData.storeId);
                const unsubscribeStore = onSnapshot(storeDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setStoreInfo({ id: docSnap.id, ...docSnap.data() });
                    } else {
                        console.warn("Store document not found for this store owner.");
                        setStoreInfo(null);
                    }
                }, (error) => {
                    console.error("Error fetching store info:", error);
                    setStoreInfo(null);
                });
                return () => unsubscribeStore(); // Cleanup store listener
            }
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
        setStoreInfo(null); // Clear store info if logged out
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth(); // Cleanup auth listener on unmount
  }, []);

  // Effect to fetch menu items for the specific store
  useEffect(() => {
    if (userRole === 'store_owner' && storeInfo?.id) {
      const menuItemsRef = collection(db, `artifacts/${appId}/public/data/stores/${storeInfo.id}/menu`);
      const unsubscribeMenuItems = onSnapshot(menuItemsRef, (snapshot) => {
        const itemsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<MenuItem, 'id'>
        }));
        setMenuItems(itemsList);
      }, (error) => {
        console.error("Error fetching menu items:", error);
        setMessage({ type: 'error', text: 'ดึงข้อมูลเมนูอาหารไม่สำเร็จนะเพื่อน! 😩' });
      });

      return () => unsubscribeMenuItems(); // Cleanup listener
    }
  }, [userRole, storeInfo?.id]); // Re-run when userRole or storeInfo changes

  // Effect to fetch orders for the specific store
  useEffect(() => {
    if (userRole === 'store_owner' && storeInfo?.id) {
      const ordersRef = collection(db, `artifacts/${appId}/public/data/orders`);
      // Query orders for this store, excluding 'delivered' and 'cancelled'
      const q = query(ordersRef, where('storeId', '==', storeInfo.id), where('status', 'not-in', ['delivered', 'cancelled', 'rejected']));

      const unsubscribeOrders = onSnapshot(q, (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Order, 'id'>
        }));
        // Sort orders by createdAt in descending order (latest first)
        ordersList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
        setStoreOrders(ordersList);
      }, (error) => {
        console.error("Error fetching store orders:", error);
        setMessage({ type: 'error', text: 'ดึงข้อมูลออเดอร์ไม่สำเร็จนะเพื่อน! 😩' });
      });

      return () => unsubscribeOrders(); // Cleanup listener
    }
  }, [userRole, storeInfo?.id]); // Re-run when userRole or storeInfo changes

  // Handle opening modal for adding or editing
  const openModal = (item: MenuItem | null = null) => {
    setCurrentMenuItem(item);
    if (item) {
      setMenuForm({
        name: item.name,
        description: item.description,
        price: item.price.toString(), // Convert number to string for input
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      });
    } else {
      // Reset form for new item
      setMenuForm({ name: '', description: '', price: '', imageUrl: '', isAvailable: true });
    }
    setIsModalOpen(true);
  };

  // Handle closing modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMenuItem(null);
    setMenuForm({ name: '', description: '', price: '', imageUrl: '', isAvailable: true }); // Clear form
    setMessage(null); // Clear any messages
  };

  // Handle menu form input changes
  const handleMenuFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setMenuForm((prevForm) => ({
      ...prevForm,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Handle Add/Edit Menu Item submission
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        name: menuForm.name,
        description: menuForm.description,
        price: parseFloat(menuForm.price), // Convert price to number
        imageUrl: menuForm.imageUrl || 'https://placehold.co/150x150/cccccc/333333?text=No+Image', // Default image
        isAvailable: menuForm.isAvailable,
        updatedAt: new Date().toISOString(),
      };

      if (currentMenuItem) {
        // Update existing item
        const itemDocRef = doc(db, `artifacts/${appId}/public/data/stores/${storeInfo.id}/menu`, currentMenuItem.id);
        await updateDoc(itemDocRef, itemData);
        setMessage({ type: 'success', text: 'อัปเดตเมนูเรียบร้อยแล้ว! ✅' });
      } else {
        // Add new item
        const menuCollectionRef = collection(db, `artifacts/${appId}/public/data/stores/${storeInfo.id}/menu`);
        await addDoc(menuCollectionRef, { ...itemData, createdAt: new Date().toISOString() });
        setMessage({ type: 'success', text: 'เพิ่มเมนูใหม่เรียบร้อยแล้ว! 🎉' });
      }
      closeModal(); // Close modal after successful submission
    } catch (error) {
      console.error("Error saving menu item:", error);
      setMessage({ type: 'error', text: 'บันทึกเมนูไม่สำเร็จนะเพื่อน! ❌' });
    }
  };

  // Handle Soft Delete Menu Item
  const handleDeleteMenuItem = async (itemId: string) => {
    // Using window.confirm for simplicity. Replace with a custom modal in a real app.
    if (window.confirm('แน่ใจนะว่าจะลบเมนูนี้? ลบแล้วกู้คืนไม่ได้นะเพื่อน!')) {
      try {
        const itemDocRef = doc(db, `artifacts/${appId}/public/data/stores/${storeInfo.id}/menu`, itemId);
        await updateDoc(itemDocRef, { isDeleted: true, updatedAt: new Date().toISOString() }); // Soft delete
        setMessage({ type: 'success', text: 'ลบเมนูเรียบร้อยแล้ว! 🗑️' });
      } catch (error) {
        console.error("Error deleting menu item:", error);
        setMessage({ type: 'error', text: 'ลบเมนูไม่สำเร็จนะเพื่อน! ❌' });
      }
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderDocRef = doc(db, `artifacts/${appId}/public/data/orders`, orderId);
      await updateDoc(orderDocRef, { status: newStatus, updatedAt: new Date().toISOString() });
      setMessage({ type: 'success', text: `อัปเดตสถานะออเดอร์ ${orderId.substring(0, 6)}... เป็น "${newStatus}" เรียบร้อยแล้ว! ✅` });
    } catch (error) {
      console.error("Error updating order status:", error);
      setMessage({ type: 'error', text: `อัปเดตสถานะออเดอร์ ${orderId.substring(0, 6)}... ไม่สำเร็จนะเพื่อน! ❌` });
    }
  };

  // Function to simulate notifying riders (will be a proper API call later)
  const handleNotifyRiders = async (orderId: string) => {
      // In a real app, this would trigger an API call to notify available riders
      // and potentially change order status to 'awaiting_rider_acceptance' or similar.
      if (window.confirm("แน่ใจนะว่าจะแจ้งให้ไรเดอร์ไปรับออเดอร์นี้?")) {
        try {
            // Simulate an API call to notify riders
            const response = await fetch('/api/orders/notify-riders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setMessage({ type: 'success', text: 'แจ้งไรเดอร์เรียบร้อยแล้ว! 🛵' });
                // Optionally update order status to indicate rider notification initiated
                await handleUpdateOrderStatus(orderId, 'ready_for_pickup'); // Set to ready for pickup if not already
            } else {
                setMessage({ type: 'error', text: `แจ้งไรเดอร์ไม่สำเร็จ: ${data.message || 'เกิดข้อผิดพลาด!'}` });
            }
        } catch (error) {
            console.error("Error notifying riders:", error);
            setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการแจ้งไรเดอร์นะเพื่อน! 😩' });
        }
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

  // Check if the user has 'store_owner' role and storeInfo is available
  if (userRole !== 'store_owner' || !storeInfo) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            🚫 เข้าไม่ได้นะเพื่อน! 🚫
          </h2>
          <p className="text-gray-600 mb-6">
            หน้า Store Owner Dashboard มีไว้สำหรับเจ้าของร้านเท่านั้นจ้าาา
            {userRole === 'store_owner' && !storeInfo && " (ร้านของคุณอาจจะยังไม่ได้รับการอนุมัติ หรือข้อมูลร้านค้าไม่ถูกต้องนะ)"}
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

  // Render the Store Owner Dashboard if user is store_owner and storeInfo is present
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Store Dashboard: {storeInfo.storeName} 🏪
          </h1>
          <p className="text-gray-600">
            ยินดีต้อนรับเจ้าของร้าน {storeInfo.storeName}
            ! สถานะร้านค้า: <span className={`font-semibold ${storeInfo.status === 'approved' ? 'text-green-600' : 'text-orange-500'}`}>
              {storeInfo.status === 'pending' ? 'รออนุมัติ ⏳' : storeInfo.status === 'approved' ? 'อนุมัติแล้ว! ✅' : 'ถูกปฏิเสธ ❌'}
            </span>
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

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Management Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-orange-700 mb-4">
              จัดการออเดอร์ 📦
            </h2>
            {storeOrders.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {storeOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                    <p className="font-semibold text-lg text-gray-800">ออเดอร์ #{order.id.substring(0, 6)}...</p>
                    <p className="text-sm text-gray-600">ลูกค้า: {order.customerName}</p>
                    <p className="text-sm text-gray-600">ที่อยู่: {order.customerAddress}</p>
                    <ul className="list-disc pl-5 my-2 text-sm text-gray-700">
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item.name} x {item.quantity}</li>
                      ))}
                    </ul>
                    <p className="text-md font-bold text-gray-800">ยอดรวม: ฿{order.totalPrice.toFixed(2)}</p>
                    <p className="text-md font-semibold text-gray-700 mt-1">
                      สถานะ: {' '}
                      <span className={`font-bold
                        ${order.status === 'pending' ? 'text-gray-500' : ''}
                        ${order.status === 'cooking' ? 'text-yellow-600' : ''}
                        ${order.status === 'ready_for_pickup' ? 'text-green-600' : ''}
                        ${order.status === 'picking_up' ? 'text-blue-600' : ''}
                        ${order.status === 'on_the_way' ? 'text-indigo-600' : ''}
                        ${order.status === 'delivered' ? 'text-green-800' : ''}
                        ${order.status === 'cancelled' || order.status === 'rejected' ? 'text-red-600' : ''}
                      `}>
                        {order.status === 'pending' && 'รอร้านรับออเดอร์ ⏳'}
                        {order.status === 'cooking' && 'กำลังทำอาหาร 🍳'}
                        {order.status === 'ready_for_pickup' && 'อาหารพร้อมส่ง! 🛵'}
                        {order.status === 'picking_up' && 'ไรเดอร์กำลังไปรับ ✅'}
                        {order.status === 'on_the_way' && 'ไรเดอร์กำลังจัดส่ง 💨'}
                        {order.status === 'delivered' && 'ส่งเรียบร้อยแล้ว! 🎉'}
                        {order.status === 'cancelled' && 'ยกเลิกแล้ว 🚫'}
                        {order.status === 'rejected' && 'ปฏิเสธแล้ว 🗑️'}
                      </span>
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'cooking')}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition duration-300"
                        >
                          รับออเดอร์ 👍
                        </button>
                      )}
                      {order.status === 'cooking' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready_for_pickup')}
                          className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition duration-300"
                        >
                          อาหารพร้อมส่ง 📦
                        </button>
                      )}
                      {order.status === 'ready_for_pickup' && (
                        <button
                          onClick={() => handleNotifyRiders(order.id)} // This will also update status to ready_for_pickup if not already
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition duration-300"
                        >
                          แจ้งไรเดอร์ 🛵
                        </button>
                      )}
                      {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition duration-300"
                        >
                          ยกเลิก ❌
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                ยังไม่มีออเดอร์ที่ต้องจัดการเลยนะเพื่อน! พักผ่อนได้เลย! 😴
              </p>
            )}
          </div>

          {/* Menu Management Section (remains the same) */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-700">
                จัดการเมนูอาหาร 🍔
              </h2>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 transition duration-300 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                เพิ่มเมนูใหม่
              </button>
            </div>

            {menuItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.filter(item => !item.isDeleted).map((item) => ( // Filter out soft-deleted items
                  <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-40 object-cover"
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/150x150/cccccc/333333?text=No+Image'; }}
                    />
                    <div className="p-4 flex-grow">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">{item.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                      <p className="text-md font-bold text-green-700 mb-2">฿{item.price.toFixed(2)}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.isAvailable ? 'พร้อมขาย 👍' : 'หมดชั่วคราว 🚫'}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end space-x-2 border-t border-gray-200">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300"
                        title="แก้ไขเมนู"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(item.id)}
                        className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
                        title="ลบเมนู"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                ยังไม่มีเมนูอาหารในร้านคุณเลยนะเพื่อน! ลองเพิ่มเมนูใหม่สิ! 🍽️
              </p>
            )}
          </div>
        </main>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MaoPay App. All rights reserved.</p>
        </footer>

        {/* Add/Edit Menu Item Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentMenuItem ? 'แก้ไขเมนูอาหาร' : 'เพิ่มเมนูอาหารใหม่'}
              </h2>
              <form onSubmit={handleMenuSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อเมนู: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={menuForm.name}
                    onChange={handleMenuFormChange}
                    required
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="ชื่อเมนูสุดอร่อย"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    รายละเอียด:
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={menuForm.description}
                    onChange={handleMenuFormChange}
                    rows={3}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="ใส่รายละเอียดเมนู"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    ราคา: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={menuForm.price}
                    onChange={handleMenuFormChange}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="ราคา (บาท)"
                  />
                </div>
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    URL รูปภาพ:
                  </label>
                  <input
                    type="text"
                    id="imageUrl"
                    name="imageUrl"
                    value={menuForm.imageUrl}
                    onChange={handleMenuFormChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    placeholder="ใส่ URL รูปภาพเมนู (ถ้ามี)"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={menuForm.isAvailable}
                    onChange={handleMenuFormChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAvailable" className="ml-2 block text-sm font-medium text-gray-700">
                    พร้อมขาย
                  </label>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md shadow-md hover:bg-purple-700 transition duration-300"
                  >
                    {currentMenuItem ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
