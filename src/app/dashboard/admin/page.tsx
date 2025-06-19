"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../lib/firebase';
import { collection, doc, onSnapshot, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// Define interfaces for data structures
interface StoreApplication {
    id: string;
    name: string;
    ownerId: string;
    status: 'pending' | 'approved' | 'rejected';
    // Add other relevant fields from the store registration
}

interface RiderApplication {
    id: string;
    name: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
    // Add other relevant fields from the rider registration
}

export default function AdminDashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [storeApps, setStoreApps] = useState<StoreApplication[]>([]);
    const [riderApps, setRiderApps] = useState<RiderApplication[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    setUserRole('admin');
                } else {
                    setUserRole('user'); // Or whatever the default role is
                }
            } else {
                setUser(null);
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
            // Approve the application
            const appRef = doc(db, collectionName, id);
            await updateDoc(appRef, { status: 'approved' });

            // Update user's role
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

    if (loading) return <div>Loading...</div>;
    if (userRole !== 'admin') return <div>Access Denied. You are not an admin.</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

            <section>
                <h2 className="text-xl font-semibold mb-2">Pending Store Applications ({storeApps.length})</h2>
                <div className="space-y-2">
                    {storeApps.map(app => (
                        <div key={app.id} className="p-3 bg-gray-100 rounded flex justify-between items-center">
                            <span>{app.name}</span>
                            <div>
                                <button onClick={() => handleApprove('store', app.id, app.ownerId)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Approve</button>
                                <button onClick={() => handleReject('store', app.id)} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8">
                <h2 className="text-xl font-semibold mb-2">Pending Rider Applications ({riderApps.length})</h2>
                 <div className="space-y-2">
                    {riderApps.map(app => (
                        <div key={app.id} className="p-3 bg-gray-100 rounded flex justify-between items-center">
                            <span>{app.name}</span>
                            <div>
                                <button onClick={() => handleApprove('rider', app.id, app.userId)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Approve</button>
                                <button onClick={() => handleReject('rider', app.id)} className="bg-red-500 text-white px-2 py-1 rounded">Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
