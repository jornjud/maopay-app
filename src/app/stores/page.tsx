"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '../../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Store {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    type: string;
}

export default function StoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    useEffect(() => {
        const storesQuery = query(collection(db, "stores"), where("status", "==", "approved"));
        
        const unsubscribe = onSnapshot(storesQuery, (snapshot) => {
            const storesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Store));
            setStores(storesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching stores: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredStores = stores.filter(store => {
        const matchesSearchTerm = store.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === 'all' || store.type === selectedType;
        return matchesSearchTerm && matchesType;
    });

    if (loading) {
        return <div className="text-center p-10">กำลังโหลดร้านค้า...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">ร้านค้าทั้งหมด</h1>
            
            {/* Filter and Search Section */}
            <div className="flex flex-wrap gap-4 mb-6">
                <input
                    type="text"
                    placeholder="ค้นหาชื่อร้าน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md"
                />
                <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="p-2 border rounded-md"
                >
                    <option value="all">ทุกประเภท</option>
                    <option value="restaurant">ร้านอาหาร</option>
                    <option value="cafe">คาเฟ่</option>
                    <option value="street_food">สตรีทฟู้ด</option>
                </select>
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.length > 0 ? filteredStores.map(store => (
                    <Link href={`/stores/${store.id}`} key={store.id} className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="relative h-48 w-full">
                           <Image 
                                src={store.imageUrl} 
                                alt={store.name} 
                                layout="fill"
                                objectFit="cover"
                            />
                        </div>
                        <div className="p-4">
                            <h2 className="text-xl font-bold">{store.name}</h2>
                            <p className="text-gray-600 mt-2 truncate">{store.description}</p>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mt-2 px-2.5 py-0.5 rounded-full">{store.type}</span>
                        </div>
                    </Link>
                )) : (
                     <p className="col-span-full text-center text-gray-500">ไม่พบร้านค้าที่ตรงกับเงื่อนไข</p>
                )}
            </div>
        </div>
    );
}