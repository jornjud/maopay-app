"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../lib/firebase';
import { collection, doc, onSnapshot, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Define interfaces for data structures
interface StoreApplication {
    id: string;
    name: string;
    ownerId: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface RiderApplication {
    id: string;
    name: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboardPage() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [storeApps, setStoreApps] = useState<StoreApplication[]>([]);
    const [riderApps, setRiderApps] = useState<RiderApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    setUserRole('admin');
                } else {
                    setUserRole('user'); // Or whatever the default role is
                }
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (userRole !== 'admin') return;

        // Listener for pending store applications
        const storesQuery = query(collection(db, 'stores'), where('status', '==', 'pending'));
        const unsubscribeStores = onSnapshot(storesQuery, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreApplication));
            setStoreApps(apps);
        });

        // Listener for pending rider applications
        const ridersQuery = query(collection(db, 'riders'), where('status', '==', 'pending'));
        const unsubscribeRiders = onSnapshot(ridersQuery, (snapshot) => {
            const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RiderApplication));
            setRiderApps(apps);
        });

        return () => {
            unsubscribeStores();
            unsubscribeRiders();
        };
    }, [userRole]);

    const handleApprove = async (type: 'store' | 'rider', id: string, userId: string) => {
        const collectionName = type === 'store' ? 'stores' : 'riders';
        const roleName = type === 'store' ? 'store_owner' : 'rider';
        try {
            const appRef = doc(db, collectionName, id);
            await updateDoc(appRef, { status: 'approved' });

            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { role: roleName });

            alert(`${type} application approved!`);
        } catch (error) {
            console.error(`Error approving ${type}:`, error);
            alert(`Failed to approve ${type}.`);
        }
    };

    const handleReject = async (type: 'store' | 'rider', id: string) => {
        const collectionName = type === 'store' ? 'stores' : 'riders';
        try {
            const appRef = doc(db, collectionName, id);
            await updateDoc(appRef, { status: 'rejected' });
            alert(`${type} application rejected!`);
        } catch (error) {
            console.error(`Error rejecting ${type}:`, error);
            alert(`Failed to reject ${type}.`);
        }
    };

    if (loading) return <div className="text-center p-10">Loading...</div>;
    if (userRole !== 'admin') return <div className="text-center p-10 text-red-500">Access Denied. You are not an admin.</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending Store Applications ({storeApps.length})</h2>
                <div className="space-y-3">
                    {storeApps.length > 0 ? storeApps.map(app => (
                        <div key={app.id} className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
                            <span className="font-medium text-gray-800">{app.name || 'N/A'}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleApprove('store', app.id, app.ownerId)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm">Approve</button>
                                <button onClick={() => handleReject('store', app.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Reject</button>
                            </div>
                        </div>
                    )) : <p className="text-gray-500">No pending store applications.</p>}
                </div>
            </section>

            <section className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Pending Rider Applications ({riderApps.length})</h2>
                 <div className="space-y-3">
                    {riderApps.length > 0 ? riderApps.map(app => (
                        <div key={app.id} className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
                            <span className="font-medium text-gray-800">{app.name || 'N/A'}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleApprove('rider', app.id, app.userId)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm">Approve</button>
                                <button onClick={() => handleReject('rider', app.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Reject</button>
                            </div>
                        </div>
                    )) : <p className="text-gray-500">No pending rider applications.</p>}
                </div>
            </section>
        </div>
    );
}
