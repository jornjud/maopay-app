// src/app/profile/page.tsx

"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { User, Store, Bike, ShieldCheck } from "lucide-react";

// --- Interfaces for our data ---
interface UserProfile {
  role: 'customer' | 'owner' | 'rider' | 'admin';
  displayName: string;
  email: string;
}

interface StoreProfile {
    name: string;
    description: string;
    status: string;
}

interface RiderProfile {
    name: string;
    phone: string;
    status: string;
    vehicleDetails: {
        type: string;
        licensePlate: string;
    }
}


export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profileData, setProfileData] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/profile');
            return;
        }

        const fetchProfileData = async () => {
            if (user) {
                try {
                    // 1. Fetch the base user profile to get the role
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (!userDocSnap.exists()) {
                        throw new Error("User profile not found!");
                    }
                    const baseProfile = userDocSnap.data() as UserProfile;
                    let roleSpecificData = {};

                    // 2. Based on role, fetch more specific data
                    if (baseProfile.role === 'owner') {
                        const storeDocRef = doc(db, "stores", user.uid); // Assuming store ID is user UID
                        const storeDocSnap = await getDoc(storeDocRef);
                        if (storeDocSnap.exists()) {
                            roleSpecificData = { store: storeDocSnap.data() };
                        }
                    } else if (baseProfile.role === 'rider') {
                        const riderDocRef = doc(db, "riders", user.uid);
                        const riderDocSnap = await getDoc(riderDocRef);
                        if (riderDocSnap.exists()) {
                             roleSpecificData = { rider: riderDocSnap.data() };
                        }
                    }

                    setProfileData({ ...baseProfile, ...roleSpecificData });

                } catch (error) {
                    console.error("Error fetching profile data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchProfileData();
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return <div className="container text-center py-12">Digging up your profile info... 🕵️‍♀️</div>;
    }

    if (!profileData) {
        return <div className="container text-center py-12">Damn, couldn't find your profile. Try logging in again.</div>;
    }

    const { displayName, email, role, store, rider } = profileData;

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800">Your Profile</h1>
                <p className="text-lg text-gray-500">What's up, {displayName || 'buddy'}!</p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* --- Base Account Info Card (Everyone sees this) --- */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User /> Account Info</CardTitle>
                        <CardDescription>Your basic account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>Display Name:</strong> {displayName}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>User ID:</strong> <span className="text-xs text-gray-500">{user?.uid}</span></p>
                        <p><strong>Role:</strong> <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{role}</span></p>
                    </CardContent>
                </Card>

                {/* --- Store Owner Card --- */}
                {role === 'owner' && store && (
                    <Card className="border-blue-500 border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-600"><Store /> Store Profile</CardTitle>
                            <CardDescription>Details about your awesome store.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong>Store Name:</strong> {store.name}</p>
                            <p><strong>Description:</strong> {store.description}</p>
                            <p><strong>Status:</strong> <span className="font-bold">{store.status}</span></p>
                        </CardContent>
                    </Card>
                )}

                 {/* --- Rider Card --- */}
                {role === 'rider' && rider && (
                    <Card className="border-green-500 border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600"><Bike /> Rider Profile</CardTitle>
                            <CardDescription>Your info for delivering the goods.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p><strong>Rider Name:</strong> {rider.name}</p>
                            <p><strong>Phone:</strong> {rider.phone}</p>
                             <p><strong>Status:</strong> <span className="font-bold">{rider.status}</span></p>
                            <p><strong>Vehicle:</strong> {rider.vehicleDetails?.type} ({rider.vehicleDetails?.licensePlate})</p>
                        </CardContent>
                    </Card>
                )}

                 {/* --- Admin Card --- */}
                {role === 'admin' && (
                    <Card className="border-red-500 border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600"><ShieldCheck /> Admin Powers</CardTitle>
                            <CardDescription>You're the boss!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>You have access to the admin dashboard to manage the platform.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}