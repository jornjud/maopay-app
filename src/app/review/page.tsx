// @filename: src/app/review/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

function ReviewPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const storeId = searchParams.get('storeId');

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId || !storeId || !currentUser) {
            setError('Missing required information to submit a review.');
            return;
        }
        if (rating === 0) {
            setError('Please select a rating.');
            return;
        }
        setLoading(true);
        try {
            const reviewRef = doc(db, 'stores', storeId, 'reviews', orderId);
            await setDoc(reviewRef, {
                userId: currentUser.uid,
                rating,
                comment,
                createdAt: new Date(),
            });

            // Mark order as reviewed
            const orderRef = doc(db, 'orders', orderId);
            await setDoc(orderRef, { hasBeenReviewed: true }, { merge: true });

            alert('Review submitted! Thank you!');
            router.push('/history');
        } catch (err) {
            console.error(err);
            setError('Failed to submit review.');
        } finally {
            setLoading(false);
        }
    };
    
    // ... JSX for the review form
    return <div>Review Form Here</div>;
}

export default function ReviewPageWrapper() {
    return (
        <Suspense fallback={<div>Loading review page...</div>}>
            <ReviewPage />
        </Suspense>
    );
}