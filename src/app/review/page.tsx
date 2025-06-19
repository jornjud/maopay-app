"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

function StarRating({ rating, setRating }: { rating: number, setRating: (r: number) => void }) {
    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}


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
        setError('');
        try {
            const reviewRef = doc(db, 'stores', storeId, 'reviews', orderId);
            await setDoc(reviewRef, {
                userId: currentUser.uid,
                userName: currentUser.displayName || 'Anonymous',
                rating,
                comment,
                createdAt: new Date(),
            });

            const orderRef = doc(db, 'orders', orderId);
            await setDoc(orderRef, { hasBeenReviewed: true }, { merge: true });

            alert('Review submitted! Thank you for your feedback!');
            router.push('/history');
        } catch (err) {
            console.error(err);
            setError('Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    if (!orderId || !storeId) {
        return <div className="text-center p-10 text-red-500">Missing order or store information.</div>
    }

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">Leave a Review</h1>
                <p className="text-sm text-gray-600 mb-6">Your feedback helps us improve!</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label>Rating</Label>
                        <StarRating rating={rating} setRating={setRating} />
                    </div>
                     <div>
                        <Label htmlFor="comment">Comment</Label>
                        <Textarea 
                            id="comment"
                            placeholder="Tell us more about your experience..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function ReviewPageWrapper() {
    return (
        <Suspense fallback={<div className="text-center p-10">Loading review page...</div>}>
            <ReviewPage />
        </Suspense>
    );
}
