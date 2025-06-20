"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../lib/firebase';
import { collection, doc, onSnapshot, query, where, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Interfaces ---
interface StoreApplication {
    id: string;
    name: string;
    ownerId: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface RiderApplication {
    id:string;
    name: string;
    userId: string;
    status: 'pending' | 'approved' | 'rejected';
}

interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    role: 'customer' | 'store_owner' | 'rider' | 'admin';
}

export default function AdminDashboardPage() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [storeApps, setStoreApps] = useState<StoreApplication[]>([]);
    const [riderApps, setRiderApps] = useState<RiderApplication[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().role === 'admin') {
                    setUserRole('admin');
                    fetchAllUsers();
                } else {
                    setUserRole('user');
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

    const fetchAllUsers = async () => {
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(userList);
    };

    const handleApplication = async (type: 'store' | 'rider', appId: string, userId: string, newStatus: 'approved' | 'rejected') => {
        const collectionName = type === 'store' ? 'stores' : 'riders';
        const roleName = type === 'store' ? 'store_owner' : 'rider';
        try {
            const appRef = doc(db, collectionName, appId);
            await updateDoc(appRef, { status: newStatus });

            if (newStatus === 'approved') {
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, { role: roleName });
            }
            alert(`Application ${newStatus} successfully!`);
            fetchAllUsers(); // Refresh user list
        } catch (error) {
            console.error(`Error updating application:`, error);
            alert(`Failed to update application.`);
        }
    };
    
    const handleRoleChange = async () => {
        if (!selectedUser || !selectedRole) {
            alert("กรุณาเลือกผู้ใช้และตำแหน่งใหม่");
            return;
        }
        try {
            const userRef = doc(db, 'users', selectedUser.uid);
            await updateDoc(userRef, { role: selectedRole });
            alert(`เปลี่ยนตำแหน่งของ ${selectedUser.displayName} เป็น ${selectedRole} เรียบร้อย!`);
            fetchAllUsers(); // Refresh user list to show updated role
        } catch (error) {
            console.error("Error updating role: ", error);
            alert("อัปเดตตำแหน่งล้มเหลว");
        }
    };


    if (loading) return <div className="text-center p-10">Loading...</div>;
    if (userRole !== 'admin') return <div className="text-center p-10 text-red-500">Access Denied. You are not an admin.</div>;

    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard (V2)</h1>

            {/* Application Approval Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>คำขอเปิดร้านค้า ({storeApps.length})</CardTitle>
                        <CardDescription>จัดการคำขอเปิดร้านค้าใหม่</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {storeApps.length > 0 ? storeApps.map(app => (
                            <div key={app.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                                <span className="font-medium text-gray-800">{app.name || 'N/A'}</span>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleApplication('store', app.id, app.ownerId, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm">Approve</Button>
                                    <Button onClick={() => handleApplication('store', app.id, app.ownerId, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Reject</Button>
                                </div>
                            </div>
                        )) : <p className="text-gray-500">No pending store applications.</p>}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>คำขอสมัครไรเดอร์ ({riderApps.length})</CardTitle>
                         <CardDescription>จัดการคำขอสมัครเป็นไรเดอร์</CardDescription>
                    </CardHeader>
                     <CardContent className="space-y-3">
                        {riderApps.length > 0 ? riderApps.map(app => (
                            <div key={app.id} className="p-3 bg-gray-50 rounded-md flex justify-between items-center">
                                <span className="font-medium text-gray-800">{app.name || 'N/A'}</span>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleApplication('rider', app.id, app.userId, 'approved')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm">Approve</Button>
                                    <Button onClick={() => handleApplication('rider', app.id, app.userId, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Reject</Button>
                                </div>
                            </div>
                        )) : <p className="text-gray-500">No pending rider applications.</p>}
                    </CardContent>
                </Card>
            </div>

            {/* User Role Management */}
            <Card>
                 <CardHeader>
                    <CardTitle>จัดการตำแหน่งผู้ใช้</CardTitle>
                    <CardDescription>เปลี่ยนตำแหน่งของผู้ใช้ในระบบ</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label>เลือกผู้ใช้</label>
                        <Select onValueChange={(uid) => setSelectedUser(users.find(u => u.uid === uid) || null)}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- เลือกผู้ใช้ --" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(user => (
                                    <SelectItem key={user.uid} value={user.uid}>
                                        {user.displayName} ({user.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-1.5">
                        <label>ตำแหน่งใหม่</label>
                        <Select onValueChange={setSelectedRole} disabled={!selectedUser}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- เลือกตำแหน่ง --" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="store_owner">Store Owner</SelectItem>
                                <SelectItem value="rider">Rider</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleRoleChange} disabled={!selectedUser || !selectedRole}>
                        ยืนยันการเปลี่ยนตำแหน่ง
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
