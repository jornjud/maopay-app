// @filename: src/app/dashboard/rider/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, doc, getDoc, updateDoc, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

// --- Interfaces ---
interface Order {
  id: string;
  storeId: string;
  storeName?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  deliveryAddress: { address: string; lat?: number; lng?: number };
  createdAt: Timestamp;
  riderId?: string;
  customerName?: string;
}

interface RiderProfile {
  userId: string;
  name:string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
}

function RiderDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Order[]>([]);
  const [myJobs, setMyJobs] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Modal States ---
  const [selectedJob, setSelectedJob] = useState<Order | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // --- Auth & Profile ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'rider') {
          const riderDoc = await getDoc(doc(db, 'riders', currentUser.uid));
          if (riderDoc.exists()) {
            setRiderProfile({ userId: riderDoc.id, ...riderDoc.data() } as RiderProfile);
          }
        } else {
             router.push('/login'); // Not a rider, kick them out
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user) return;

    // My current jobs ( งานที่รับแล้ว แต่ยังไม่เสร็จ )
    const myJobsQuery = query(
        collection(db, 'orders'), 
        where('riderId', '==', user.uid), 
        where('status', '==', 'out_for_delivery')
    );
    const unsubscribeMyJobs = onSnapshot(myJobsQuery, (snapshot) => {
        const jobsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setMyJobs(jobsList.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()));
    });

    // Available new jobs ( งานใหม่ที่พร้อมให้รับ )
    const availableJobsQuery = query(collection(db, 'orders'), where('status', '==', 'ready_for_pickup'));
    const unsubscribeAvailableJobs = onSnapshot(availableJobsQuery, (snapshot) => {
        const jobsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setAvailableJobs(jobsList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });

    return () => {
      unsubscribeMyJobs();
      unsubscribeAvailableJobs();
    };
  }, [user]);

  // --- Handle deep link from Telegram ---
  useEffect(() => {
    const orderIdFromUrl = searchParams.get('orderId');
    if (orderIdFromUrl && availableJobs.length > 0) {
      const jobFromList = availableJobs.find(o => o.id === orderIdFromUrl);
      if(jobFromList) {
          handleViewJobDetails(jobFromList);
      }
    }
  }, [searchParams, availableJobs]);

  const handleAcceptJob = async (orderId: string) => {
    if (!user) return;
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { 
            riderId: user.uid,
            riderName: riderProfile?.name || 'N/A',
            status: 'out_for_delivery',
            updatedAt: serverTimestamp()
        });
        alert('รับงานเรียบร้อยแล้ว! ไปรับของที่ร้านได้เลย!');
        setIsJobModalOpen(false);
    } catch (err) {
        console.error("Error accepting job: ", err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรับงาน');
    }
  };
  
  const handleCompleteJob = async (orderId: string) => {
     try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'completed', updatedAt: serverTimestamp() });
        alert(`ส่งงานสำเร็จ! ขอบคุณมากเพื่อน!`);
    } catch (err) {
        console.error("Error completing job: ", err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการจบงาน');
    }
  };
  
  const handleViewJobDetails = (order: Order) => {
    setSelectedJob(order);
    setIsJobModalOpen(true);
  };

  if (loading) return <div className="flex justify-center items-center h-screen">กำลังโหลดข้อมูลไรเดอร์...</div>;
  if (!riderProfile) return <div className="flex justify-center items-center h-screen bg-red-100 text-red-700 p-8">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หรือยังไม่ได้รับการอนุมัติ</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">แดชบอร์ดไรเดอร์</h1>
            {riderProfile && <p className="text-gray-600">สวัสดี, {riderProfile.name}! สถานะ: <span className='font-bold text-green-600'>พร้อมรับงาน</span></p>}
            {error && <p className="text-red-500 bg-red-100 p-2 rounded mt-2">{error}</p>}
        </header>

        {/* My Current Job Section */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">🛵 งานที่กำลังทำอยู่ ({myJobs.length})</h2>
          <div className="space-y-4">
            {myJobs.length > 0 ? myJobs.map(job => (
                <Card key={job.id} className="border-l-4 border-blue-500">
                    <CardHeader>
                        <CardTitle>ออเดอร์ #{job.id.substring(0, 6)}</CardTitle>
                        <CardDescription>จากร้าน: {job.storeName || 'N/A'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <p><strong>ลูกค้า:</strong> {job.customerName || 'N/A'}</p>
                       <p><strong>ที่อยู่จัดส่ง:</strong> {job.deliveryAddress.address}</p>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={() => handleCompleteJob(job.id)} className="w-full bg-green-600 hover:bg-green-700">✅ ส่งของสำเร็จแล้ว</Button>
                    </CardFooter>
                </Card>
            )) : <p className="text-gray-500 col-span-full">ยังไม่มีงานที่กำลังทำอยู่</p>}
           </div>
        </section>

        {/* Available Jobs Section */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">✨ งานใหม่ที่พร้อมให้รับ ({availableJobs.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableJobs.length > 0 ? availableJobs.map(job => (
                   <Card key={job.id}>
                      <CardHeader>
                          <CardTitle>ออเดอร์ #{job.id.substring(0, 6)}</CardTitle>
                          <CardDescription>จากร้าน: {job.storeName || 'N/A'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <p><strong>ยอดรวม:</strong> {job.total.toFixed(2)} บาท</p>
                           <p><strong>ที่อยู่จัดส่ง:</strong> {job.deliveryAddress.address}</p>
                      </CardContent>
                      <CardFooter>
                          <Button onClick={() => handleViewJobDetails(job)} className="w-full">ดูรายละเอียดและรับงาน</Button>
                      </CardFooter>
                  </Card>
              )) : <p className="text-gray-500 col-span-full">ยังไม่มีงานใหม่เข้ามาตอนนี้</p>}
          </div>
        </section>
      </div>
      
      {/* Job Details Modal */}
      <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedJob ? (
            <>
              <DialogHeader>
                <DialogTitle>รายละเอียดงาน #{selectedJob.id.substring(0, 6)}</DialogTitle>
                <DialogDescription>จากร้าน: <strong>{selectedJob.storeName || "ไม่ระบุ"}</strong></DialogDescription>
              </DialogHeader>
              <div className="py-2 space-y-3 text-sm">
                <h4 className="font-semibold mb-1">รายการอาหาร</h4>
                <ul className="list-disc list-inside bg-gray-100 p-3 rounded-md text-gray-800">
                  {selectedJob.items.map((item, index) => <li key={index}>{item.name} x {item.quantity}</li>)}
                </ul>
                <h4 className="font-semibold">ที่อยู่จัดส่ง</h4>
                <p className="text-gray-700">{selectedJob.deliveryAddress.address}</p>
                <h4 className="font-semibold">ยอดรวม</h4>
                <p className="font-bold text-lg text-green-600">{selectedJob.total.toFixed(2)} บาท</p>
              </div>
              <DialogFooter className="sm:justify-between gap-2">
                <DialogClose asChild><Button type="button" variant="secondary">ปิด</Button></DialogClose>
                <Button className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white" onClick={() => handleAcceptJob(selectedJob.id)}>✅ ยืนยันรับงานนี้</Button>
              </DialogFooter>
            </>
          ) : <p>กำลังโหลดข้อมูล...</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RiderDashboardPage() {
  return (
      <Suspense fallback={<div className="flex justify-center items-center h-screen">กำลังโหลด...</div>}>
          <RiderDashboard />
      </Suspense>
  )
}
