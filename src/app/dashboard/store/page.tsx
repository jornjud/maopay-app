"use client";

import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, doc, getDoc, updateDoc, addDoc, onSnapshot, Timestamp } from 'firebase/firestore';
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
  id: string;
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
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role);

            if (userData.role === 'store_owner') {
              const storeQuery = query(collection(db, 'stores'), where('ownerId', '==', currentUser.uid));
              
              const unsub = onSnapshot(storeQuery, (storeSnapshot) => {
                if (!storeSnapshot.empty) {
                  const storeDoc = storeSnapshot.docs[0];
                  const storeData = storeDoc.data() as Store;
                  const storeDocId = storeDoc.id;
                  
                  setStoreInfo(storeData);
                  setStoreId(storeDocId);
                  setEditedStoreName(storeData.name);
                  setEditedStoreDescription(storeData.description);
                  setEditedTelegramGroupId(storeData.telegramGroupId || '');

                  onSnapshot(collection(db, `stores/${storeDocId}/products`), (snap) => {
                      const productsList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
                      setProducts(productsList);
                  });
                  
                  onSnapshot(query(collection(db, 'orders'), where('storeId', '==', storeDocId)), (snap) => {
                      const ordersList = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
                      setOrders(ordersList.sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis()));
                  });
                }
                 setLoading(false);
              });
              return () => unsub();
            } else {
                 setLoading(false);
            }
          } else {
             setLoading(false);
          }
        } catch (error: unknown) {
            console.error(error)
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setError(errorMessage);
            setLoading(false);
        }
      } else {
        setLoading(false);
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !newProductName || !newProductPrice) return;
    const imageUrl = `https://placehold.co/600x400/purple/white?text=${encodeURIComponent(newProductName)}`;
    try {
      const newProductData: Omit<Product, 'id'> = {
        name: newProductName,
        description: newProductDescription,
        price: parseFloat(newProductPrice),
        imageUrl,
      };
      await addDoc(collection(db, `stores/${storeId}/products`), newProductData);
      setNewProductName('');
      setNewProductDescription('');
      setNewProductPrice('');
      alert("Product added successfully!");
    } catch (error: unknown) {
        console.error(error)
        alert("Failed to add product.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      alert(`Order status updated to ${newStatus}`);
    } catch (error: unknown) {
        console.error(error)
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
    } catch (error: unknown) {
        console.error(error)
        alert('Failed to update store information.');
    }
  };

  if (loading) return <div className="text-center p-10">Loading Dashboard...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (userRole !== 'store_owner' || !storeInfo) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">🚫 Access Denied! 🚫</h2>
          <p className="text-gray-600 mb-6">You must be a store owner to view this page. Please register your store first.</p>
          <Button asChild><Link href="/stores/register">Register Your Store</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="bg-white p-6 rounded-xl shadow-md mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{storeInfo.name}</h1>
                  <p className="text-gray-500 mt-1">{storeInfo.description}</p>
                </div>
                 <Dialog open={isEditingStore} onOpenChange={setIsEditingStore}>
                    <DialogTrigger asChild><Button variant="outline">Edit Store Info</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Store Information</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div><Label htmlFor="s-name">Store Name</Label><Input id="s-name" value={editedStoreName} onChange={e => setEditedStoreName(e.target.value)} /></div>
                            <div><Label htmlFor="s-desc">Description</Label><Input id="s-desc" value={editedStoreDescription} onChange={e => setEditedStoreDescription(e.target.value)} /></div>
                            <div><Label htmlFor="s-telegram">Telegram Group ID</Label><Input id="s-telegram" value={editedTelegramGroupId} onChange={e => setEditedTelegramGroupId(e.target.value)} /></div>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={handleUpdateStoreInfo}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-semibold mb-4">Incoming Orders ({orders.length})</h2>
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white p-4 rounded-lg shadow">
                            <p>Order #{order.id.substring(0,6)} - Status: {order.status}</p>
                            <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>Mark as Preparing</Button>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                 <h2 className="text-2xl font-semibold mb-4">Manage Products</h2>
                 <Dialog>
                    <DialogTrigger asChild><Button className="w-full mb-4">Add New Product</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div><Label htmlFor="p-name">Product Name</Label><Input id="p-name" value={newProductName} onChange={e => setNewProductName(e.target.value)} required /></div>
                            <div><Label htmlFor="p-desc">Description</Label><Input id="p-desc" value={newProductDescription} onChange={e => setNewProductDescription(e.target.value)} /></div>
                            <div><Label htmlFor="p-price">Price</Label><Input id="p-price" type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} required/></div>
                            <DialogFooter><DialogClose asChild><Button type="submit">Save Product</Button></DialogClose></DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
                <div className="space-y-2">
                     {products.map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-lg shadow-sm">
                            <p>{product.name} - {product.price} THB</p>
                        </div>
                     ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}