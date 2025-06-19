// @filename: src/app/dashboard/store/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
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
import Link from 'next/link';

interface Store {
  name: string;
  description: string;
  imageUrl: string;
  ownerId: string;
  telegramGroupId?: string;
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
  timestamp: Timestamp;
}

export default function StoreDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState<Store | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');

  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editedStoreName, setEditedStoreName] = useState('');
  const [editedStoreDescription, setEditedStoreDescription] = useState('');
  const [editedTelegramGroupId, setEditedTelegramGroupId] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);

            if (userData.role === 'store_owner') {
              const storeQuery = query(collection(db, 'stores'), where('ownerId', '==', currentUser.uid));
              const storeSnapshot = await getDocs(storeQuery);

              if (!storeSnapshot.empty) {
                const storeDoc = storeSnapshot.docs[0];
                const storeData = storeDoc.data() as Store;
                const storeDocId = storeDoc.id;
                setStoreInfo(storeData);
                setStoreId(storeDocId);
                setEditedStoreName(storeData.name);
                setEditedStoreDescription(storeData.description);
                setEditedTelegramGroupId(storeData.telegramGroupId || '');

                const productsUnsub = onSnapshot(collection(db, `stores/${storeDocId}/products`), (snap) => {
                    const productsList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
                    setProducts(productsList);
                });
                
                const ordersUnsub = onSnapshot(query(collection(db, 'orders'), where('storeId', '==', storeDocId)), (snap) => {
                    const ordersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
                    setOrders(ordersList.sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
                });

                return () => {
                    productsUnsub();
                    ordersUnsub();
                }
              }
            }
          }
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !newProductName || !newProductPrice) return;
    const imageUrl = "https://placehold.co/600x400/EEE/31343C?text=Product";
    try {
      const newProduct: Omit<Product, 'id'> = {
        name: newProductName,
        description: newProductDescription,
        price: parseFloat(newProductPrice),
        imageUrl,
      };
      await addDoc(collection(db, `stores/${storeId}/products`), newProduct);
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      alert("Product added successfully!");
    } catch (err) {
        console.error(err)
        alert("Failed to add product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
        console.error(err)
        alert("Failed to update order status.");
    }
  };

  const handleUpdateStoreInfo = async () => {
    if (!storeId) return;
    try {
      await updateDoc(doc(db, 'stores', storeId), {
        name: editedStoreName,
        description: editedStoreDescription,
        telegramGroupId: editedTelegramGroupId,
      });
      setIsEditingStore(false);
      alert('Store information updated!');
    } catch (err) {
        console.error(err)
        alert('Failed to update store information.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (userRole !== 'store_owner' || !storeInfo) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-4">🚫 เข้าไม่ได้! 🚫</h2>
          <p className="text-gray-600 mb-6">คุณไม่มีสิทธิ์เข้าหน้านี้ หรือยังไม่ได้ลงทะเบียนร้านค้า</p>
          <Link href="/stores/register" className="text-blue-500 hover:underline">ลงทะเบียนร้านค้าที่นี่</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{storeInfo.name}</h1>
            <Dialog>
                <DialogTrigger asChild><Button>Add Product</Button></DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                        <div><Label htmlFor="p-name">Product Name</Label><Input id="p-name" value={newProductName} onChange={e => setNewProductName(e.target.value)} /></div>
                        <div><Label htmlFor="p-desc">Description</Label><Input id="p-desc" value={newProductDescription} onChange={e => setNewProductDescription(e.target.value)} /></div>
                        <div><Label htmlFor="p-price">Price</Label><Input id="p-price" type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} /></div>
                        <DialogFooter><DialogClose asChild><Button type="submit">Add Product</Button></DialogClose></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </header>
        
        {/* Orders Section */}
        <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Orders ({orders.length})</h2>
            {/* Render orders here */}
        </section>

        {/* Products Section */}
        <section>
            <h2 className="text-2xl font-semibold mb-4">Products ({products.length})</h2>
            {/* Render products here */}
        </section>
    </div>
  );
}