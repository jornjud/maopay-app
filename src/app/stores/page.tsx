"use client"; // This directive is for Next.js App Router client components

import React, { useState, useEffect } from 'react';
// FIX: Corrected the relative import path for firebase.ts
// The file src/app/stores/page.tsx needs to go up two directories (../../) to reach src/,
// then down into lib/firebase.ts.
import { db, collection, query, where, onSnapshot, doc, getDoc, auth, appId } from '../../lib/firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';

// Define interfaces for store and menu item structure
interface Store {
  id: string;
  storeName: string;
  address: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  // You might add lat/lng here later for map integration
}

// Main Stores page component with search and filter functionality
export default function App() {
  const [stores, setStores] = useState<Store[]>([]); // All approved stores
  const [filteredStores, setFilteredStores] = useState<Store[]>([]); // Stores after applying search/filter
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'approved', 'pending', 'rejected'
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Effect to fetch stores from Firestore when component mounts or filters change
  useEffect(() => {
    setIsLoading(true);
    // Query only approved stores for the customer view
    const storesRef = collection(db, `artifacts/${appId}/public/data/stores`);
    let q = query(storesRef, where('status', '==', 'approved'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Store, 'id'>
      }));
      setStores(storesList); // Set all approved stores
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching stores:", error);
      setMessage({ type: 'error', text: 'ดึงข้อมูลร้านค้าไม่สำเร็จนะเพื่อน! 😩' });
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, []);

  // Effect to apply search and filter whenever stores, searchTerm, or filterStatus changes
  useEffect(() => {
    let currentFiltered = stores;

    // Apply search term filter
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(store =>
        store.storeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter (though in this page, we only fetch 'approved' stores)
    // This filter is more relevant for an Admin view, but included for completeness.
    if (filterStatus !== 'all') {
      currentFiltered = currentFiltered.filter(store => store.status === filterStatus);
    }

    setFilteredStores(currentFiltered);
  }, [stores, searchTerm, filterStatus]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter status change
  const handleFilterStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterStatus(e.target.value as 'all' | 'approved' | 'pending' | 'rejected');
  };

  // Function to navigate to a specific store's detail page (placeholder)
  const goToStoreDetails = (storeId: string) => {
    // In a real Next.js app, you'd use useRouter().push(`/stores/${storeId}`)
    alert(`ไปหน้ารายละเอียดร้านค้า ID: ${storeId}`); // Using alert for demo
    console.log(`Navigating to /stores/${storeId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">กำลังโหลดข้อมูลร้านค้า... 🔄</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            ร้านค้าทั้งหมดใน MaoPay 🛒
          </h1>
          <p className="text-gray-600">
            ค้นหาร้านค้าและเมนูอร่อยได้ที่นี่เลยเพื่อน!
          </p>
        </header>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-lg text-center mb-4 text-sm font-medium ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <main>
          {/* Search and Filter Section */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="ค้นหาชื่อร้านค้า..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {/* For a customer-facing page, typically only approved stores are shown.
                The status filter might be more useful for an Admin view or internal tools. */}
            <select
              value={filterStatus}
              onChange={handleFilterStatusChange}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm sm:w-auto"
            >
              <option value="all">สถานะทั้งหมด (ลูกค้า)</option>
              <option value="approved">เปิดอยู่</option>
              <option value="pending">รออนุมัติ</option>
              <option value="rejected">ถูกปฏิเสธ</option>
            </select>
          </div>

          {/* Store List Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.length > 0 ? (
              filteredStores.map(store => (
                <div key={store.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition duration-300 ease-in-out cursor-pointer"
                     onClick={() => goToStoreDetails(store.id)}>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{store.storeName}</h3>
                  <p className="text-sm text-gray-600 mb-3">{store.address}</p>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${store.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {store.status === 'approved' ? 'เปิดอยู่ 👍' : 'รอการอนุมัติ ⏳'}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); goToStoreDetails(store.id); }} // Prevent parent click
                      className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition duration-300"
                    >
                      ดูร้านค้า ➡️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-lg">
                <p className="text-xl text-gray-600">
                  {searchTerm || filterStatus !== 'all'
                    ? 'ไม่พบร้านค้าที่ตรงกับเงื่อนไขนะเพื่อน! 😩'
                    : 'ยังไม่มีร้านค้าในระบบเลย! 🙁'}
                </p>
              </div>
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
