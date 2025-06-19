"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// Define interfaces for better type safety
interface Store {
  name: string;
  description: string;
  imageUrl: string;
  ownerId: string;
  telegramGroupId?: string; // Optional field for Telegram Group ID
}

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

interface Order {
  id: string;
  customerName: string;
  items: { productName: string; quantity: number }[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'ready_for_pickup' | 'completed' | 'cancelled';
  timestamp: Date;
}

// Main component for the store dashboard
export default function StoreDashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for the "Add Product" dialog
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductImage, setNewProductImage] = useState<File | null>(null); // For file upload

  // State for editing store info
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editedStoreName, setEditedStoreName] = useState('');
  const [editedStoreDescription, setEditedStoreDescription] = useState('');
  const [editedTelegramGroupId, setEditedTelegramGroupId] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch user role
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);

            // If user is a store owner, fetch their store, products, and orders
            if (userData.role === 'store_owner') {
              const storeQuery = query(collection(db, 'stores'), where('ownerId', '==', user.uid));
              const storeSnapshot = await getDocs(storeQuery);

              if (!storeSnapshot.empty) {
                const storeData = storeSnapshot.docs[0].data() as Store;
                const storeDocId = storeSnapshot.docs[0].id;
                setStoreInfo(storeData);
                setStoreId(storeDocId);
                setEditedStoreName(storeData.name);
                setEditedStoreDescription(storeData.description);
                setEditedTelegramGroupId(storeData.telegramGroupId || '');

                // Fetch products for this store
                const productsQuery = query(collection(db, `stores/${storeDocId}/products`));
                const productsSnapshot = await getDocs(productsQuery);
                const productsList = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                setProducts(productsList);

                // Fetch orders for this store
                const ordersQuery = query(collection(db, 'orders'), where('storeId', '==', storeDocId));
                const ordersSnapshot = await getDocs(ordersQuery);
                const ordersList = ordersSnapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp.toDate(), // Convert Firestore Timestamp to JS Date
                  } as Order;
                });
                setOrders(ordersList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())); // Sort by newest first
              }
            }
          } else {
            setError("User data not found.");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          if (err instanceof Error) {
            setError(`Failed to load dashboard data: ${err.message}`);
          } else {
            setError("An unknown error occurred.");
          }
        } finally {
          setLoading(false);
        }
      } else {
        // No user is signed in.
        setUserRole(null);
        setStoreInfo(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    // Basic validation
    if (!newProductName || !newProductPrice) {
      alert("Please fill in product name and price.");
      return;
    }
    // TODO: Implement image upload to Firebase Storage and get the URL
    const imageUrl = "https://placehold.co/600x400/EEE/31343C?text=Product+Image";

    try {
      const newProduct: Omit<Product, 'id'> = {
        name: newProductName,
        description: newProductDescription,
        price: parseFloat(newProductPrice),
        imageUrl,
      };
      const productRef = await addDoc(collection(db, `stores/${storeId}/products`), newProduct);

      setProducts(prevProducts => [...prevProducts, { ...newProduct, id: productRef.id }]);
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      setNewProductImage(null);
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status.");
    }
  };

  const handleUpdateStoreInfo = async () => {
    if (!storeId) return;
    try {
      const storeRef = doc(db, 'stores', storeId);
      await updateDoc(storeRef, {
        name: editedStoreName,
        description: editedStoreDescription,
        telegramGroupId: editedTelegramGroupId,
      });
      setStoreInfo(prev => prev ? {
        ...prev,
        name: editedStoreName,
        description: editedStoreDescription,
        telegramGroupId: editedTelegramGroupId,
      } : null);
      setIsEditingStore(false);
      alert('Store information updated successfully!');
    } catch (error) {
      console.error('Error updating store info:', error);
      alert('Failed to update store information.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">กำลังโหลดข้อมูลร้านค้า...</div>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-red-100">
        <div className="text-red-600 text-xl p-8 bg-white rounded-lg shadow-md text-center">
          <p className="font-bold mb-4">เกิดข้อผิดพลาด</p>
          <p>{error}</p>
          <Link href="/" className="mt-4 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  if (userRole !== 'store_owner' || !storeInfo) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">
            🚫 เข้าไม่ได้นะเพื่อน! 🚫
          </h2>
          <p className="text-gray-600 mb-2">
            ดูเหมือนว่าคุณจะไม่มีสิทธิ์เข้าถึงหน้านี้ หรือยังไม่มีข้อมูลร้านค้าในระบบ
          </p>
          <p className="text-gray-500 mb-6 text-sm">
            หากคุณเป็นเจ้าของร้านค้า กรุณาตรวจสอบให้แน่ใจว่าคุณได้ทำการ
            <Link href="/stores/register" className="text-blue-500 hover:underline">ลงทะเบียนร้านค้า</Link>
            เรียบร้อยแล้ว
          </p>
          <Link href="/dashboard" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
            กลับไปหน้าแดชบอร์ด
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-md">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{storeInfo.name}</h1>
              <p className="text-gray-500 mt-1">{storeInfo.description}</p>
              {storeInfo.telegramGroupId && (
                <p className="text-sm text-gray-500 mt-1">Telegram Group ID: <span className="font-mono bg-gray-100 p-1 rounded">{storeInfo.telegramGroupId}</span></p>
              )}
            </div>
            <Button onClick={() => setIsEditingStore(true)}>แก้ไขข้อมูลร้าน</Button>
          </div>
        </header>

        {/* The rest of your component UI */}

      </div>
    </div>
  );
}
