// src/app/dashboard/admin/page.tsx
"use client"; // << ต้องอยู่บนสุดแบบนี้เลยนะ! #ClientComponent #NoMoreErrors

import React, { useState, useEffect } from 'react';
// FIX: Changed absolute import path '@/lib/firebase' to a relative path '../../../lib/firebase'
// This resolves the "Could not resolve" error caused by path alias not being recognized in the environment.
import { db, collection, query, where, onSnapshot, doc, updateDoc, auth, appId } from '../../../lib/firebase'; // Import Firestore and Auth functions
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged specifically

// Define interfaces for data structure for better type safety
interface Store {
  id: string;
  storeName: string;
  address: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Rider {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleType: string;
  licensePlate: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// Main Admin Dashboard component
export default function App() {
  const [userRole, setUserRole] = useState<'loading' | 'admin' | 'user' | 'store_owner' | 'rider' | 'guest'>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingStores, setPendingStores] = useState<Store[]>([]);
  const [pendingRiders, setPendingRiders] = useState<Rider[]>([]);
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
            // If user document doesn't exist, default to 'user' role
            setUserRole('user');
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

  // Effect to fetch pending stores
  useEffect(() => {
    if (userRole === 'admin' && userId) { // Only fetch if authenticated as admin
      const storesRef = collection(db, `artifacts/${appId}/public/data/stores`);
      const q = query(storesRef, where('status', '==', 'pending'));

      const unsubscribeStores = onSnapshot(q, (snapshot) => {
        const storesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Store, 'id'>
        }));
        setPendingStores(storesList);
      }, (error) => {
        console.error("Error fetching pending stores:", error);
        setMessage({ type: 'error', text: 'ดึงข้อมูลร้านค้าที่รออนุมัติไม่สำเร็จนะเพื่อน! 😩' });
      });

      return () => unsubscribeStores(); // Cleanup listener
    }
  }, [userRole, userId]); // Re-run when userRole or userId changes

  // Effect to fetch pending riders
  useEffect(() => {
    if (userRole === 'admin' && userId) { // Only fetch if authenticated as admin
      const ridersRef = collection(db, `artifacts/${appId}/public/data/riders`);
      const q = query(ridersRef, where('status', '==', 'pending'));

      const unsubscribeRiders = onSnapshot(q, (snapshot) => {
        const ridersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Rider, 'id'>
        }));
        setPendingRiders(ridersList);
      }, (error) => {
        console.error("Error fetching pending riders:", error);
        setMessage({ type: 'error', text: 'ดึงข้อมูลไรเดอร์ที่รออนุมัติไม่สำเร็จนะเพื่อน! 😩' });
      });

      return () => unsubscribeRiders(); // Cleanup listener
    }
  }, [userRole, userId]); // Re-run when userRole or userId changes

  // Function to handle approval of a store
  const handleApproveStore = async (storeId: string) => {
    try {
      const storeDocRef = doc(db, `artifacts/${appId}/public/data/stores`, storeId);
      await updateDoc(storeDocRef, { status: 'approved' });
      setMessage({ type: 'success', text: `อนุมัติร้านค้า ${storeId} เรียบร้อยแล้ว! ✅` });
    } catch (error) {
      console.error("Error approving store:", error);
      setMessage({ type: 'error', text: `อนุมัติร้านค้า ${storeId} ไม่สำเร็จนะเพื่อน! ❌` });
    }
  };

  // Function to handle rejection of a store
  const handleRejectStore = async (storeId: string) => {
    try {
      const storeDocRef = doc(db, `artifacts/${appId}/public/data/stores`, storeId);
      await updateDoc(storeDocRef, { status: 'rejected' });
      setMessage({ type: 'success', text: `ปฏิเสธร้านค้า ${storeId} เรียบร้อยแล้ว! 🗑️` });
    } catch (error) {
      console.error("Error rejecting store:", error);
      setMessage({ type: 'error', text: `ปฏิเสธร้านค้า ${storeId} ไม่สำเร็จนะเพื่อน! ❌` });
    }
  };

  // Function to handle approval of a rider
  const handleApproveRider = async (riderId: string) => {
    try {
      const riderDocRef = doc(db, `artifacts/${appId}/public/data/riders`, riderId);
      await updateDoc(riderDocRef, { status: 'approved' });
      setMessage({ type: 'success', text: `อนุมัติไรเดอร์ ${riderId} เรียบร้อยแล้ว! ✅` });
    } catch (error) {
      console.error("Error approving rider:", error);
      setMessage({ type: 'error', text: `อนุมัติไรเดอร์ ${riderId} ไม่สำเร็จนะเพื่อน! ❌` });
    }
  };

  // Function to handle rejection of a rider
  const handleRejectRider = async (riderId: string) => {
    try {
      const riderDocRef = doc(db, `artifacts/${appId}/public/data/riders`, riderId);
      await updateDoc(riderDocRef, { status: 'rejected' });
      setMessage({ type: 'success', text: `ปฏิเสธไรเดอร์ ${riderId} เรียบร้อยแล้ว! 🗑️` });
    } catch (error) {
      console.error("Error rejecting rider:", error);
      setMessage({ type: 'error', text: `ปฏิเสธไรเดอร์ ${riderId} ไม่สำเร็จนะเพื่อน! ❌` });
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

  // Check if the user has 'admin' role, if not, show access denied
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            🚫 เข้าไม่ได้นะเพื่อน! 🚫
          </h2>
          <p className="text-gray-600 mb-6">
            หน้า Admin Dashboard มีไว้สำหรับแอดมินเท่านั้นจ้าาา
          </p>
          <button
            onClick={() => {
              // In a real Next.js app, you'd use useRouter().push('/')
              // For this example, we'll just log
              console.log('กลับหน้าหลัก');
              // Optionally, you might want to redirect to a login page or home
            }}
            className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-300 ease-in-out"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // Render the Admin Dashboard if user is admin
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Admin Dashboard 👑
          </h1>
          <p className="text-gray-600">
            ยินดีต้อนรับแอดมินเหมา! นี่คือศูนย์กลางการจัดการ MaoPay App ของคุณ
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

        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Store Approvals */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-indigo-700 mb-4">
              ร้านค้ารออนุมัติ 🏪 ({pendingStores.length} ร้าน)
            </h2>
            {pendingStores.length > 0 ? (
              <ul className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {pendingStores.map((store) => (
                  <li key={store.id} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                    <p className="font-semibold text-gray-800">{store.storeName}</p>
                    <p className="text-sm text-gray-600">อีเมล: {store.email}</p>
                    <p className="text-sm text-gray-600">โทร: {store.phone}</p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleApproveStore(store.id)}
                        className="flex-1 py-1 px-3 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition duration-300"
                      >
                        อนุมัติ ✅
                      </button>
                      <button
                        onClick={() => handleRejectStore(store.id)}
                        className="flex-1 py-1 px-3 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition duration-300"
                      >
                        ปฏิเสธ ❌
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">ไม่มีร้านค้าที่รออนุมัติแล้วจ้า! 🎉</p>
            )}
            {/* Removed the static 'ตรวจสอบร้านค้า' button as list is dynamic */}
          </div>

          {/* Card 2: Rider Approvals */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              ไรเดอร์รออนุมัติ 🏍️ ({pendingRiders.length} คน)
            </h2>
            {pendingRiders.length > 0 ? (
              <ul className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {pendingRiders.map((rider) => (
                  <li key={rider.id} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                    <p className="font-semibold text-gray-800">{rider.fullName}</p>
                    <p className="text-sm text-gray-600">ประเภท: {rider.vehicleType}</p>
                    <p className="text-sm text-gray-600">ทะเบียน: {rider.licensePlate}</p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleApproveRider(rider.id)}
                        className="flex-1 py-1 px-3 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition duration-300"
                      >
                        อนุมัติ ✅
                      </button>
                      <button
                        onClick={() => handleRejectRider(rider.id)}
                        className="flex-1 py-1 px-3 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition duration-300"
                      >
                        ปฏิเสธ ❌
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">ไม่มีไรเดอร์ที่รออนุมัติแล้วจ้า! 🎉</p>
            )}
            {/* Removed the static 'ตรวจสอบไรเดอร์' button as list is dynamic */}
          </div>

          {/* Card 3: System Overview (remains largely the same, but can be updated with real data later) */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">
              ภาพรวมระบบ 📈
            </h2>
            <ul className="text-gray-600 space-y-2">
              <li>จำนวนผู้ใช้ทั้งหมด: <span className="font-bold">รอเชื่อมต่อ</span></li>
              <li>จำนวนออเดอร์วันนี้: <span className="font-bold">รอเชื่อมต่อ</span></li>
              <li>รายได้รวมวันนี้: <span className="font-bold">รอเชื่อมต่อ</span></li>
            </ul>
            <button className="mt-4 px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
              ดูรายงานทั้งหมด
            </button>
          </div>
        </main>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MaoPay App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}