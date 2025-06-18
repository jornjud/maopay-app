// src/app/review/page.tsx
"use client"; // << ต้องอยู่บนสุดแบบนี้เลยนะ! #ClientComponent #NoMoreErrors

import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, auth, appId } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Define interface for review data structure
export interface ReviewData {
  reviewerId: string;
  targetType: 'store' | 'rider'; // What is being reviewed (store or rider)
  targetId: string; // The ID of the store or rider being reviewed
  orderId: string; // The order associated with this review
  rating: number; // Star rating (1-5)
  comment: string;
  createdAt: string;
}

// Main Review Submission Page component
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // States for review form
  const [rating, setRating] = useState(0); // 0-5 stars
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- Mock Data for Demonstration ---
  // In a real app, these would come from URL params or a state passed from order confirmation.
  const mockOrderId = "ORDER-12345"; // Example order ID
  const mockStoreId = "STORE-ABCDEF"; // Example store ID that completed the order
  const mockStoreName = "ร้านปิ้งย่างหม่าล่า"; // Example store name
  const mockRiderId = "RIDER-XYZ123"; // Example rider ID that delivered the order
  const mockRiderName = "ไรเดอร์ใจดี"; // Example rider name

  // Effect to handle user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
      } else {
        setUser(null);
        setUserId(null);
        // Optionally, redirect to login if review requires login
        setMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบก่อนทำการรีวิวนะเพื่อน! 🔒' });
      }
      setIsLoading(false);
    });
    return () => unsubscribe(); // Cleanup auth listener
  }, []);

  // Handle star rating click
  const handleRatingClick = (star: number) => {
    setRating(star);
  };

  // Handle comment change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  // Handle review submission (for Store)
  const handleSubmitReview = async (targetType: 'store' | 'rider', targetId: string) => {
    if (!userId) {
      setMessage({ type: 'error', text: 'ต้องเข้าสู่ระบบก่อนนะเพื่อน! 😩' });
      return;
    }
    if (rating === 0) {
      setMessage({ type: 'error', text: 'กรุณาให้คะแนนดาวด้วยนะเพื่อน! 🌟' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const reviewData: ReviewData = {
        reviewerId: userId,
        targetType: targetType,
        targetId: targetId,
        orderId: mockOrderId, // Link review to the order
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };

      // Save review to Firestore
      // Collection path: /artifacts/{appId}/public/data/reviews
      const reviewsCollectionRef = collection(db, `artifacts/${appId}/public/data/reviews`);
      await addDoc(reviewsCollectionRef, reviewData);

      setMessage({ type: 'success', text: `ส่งรีวิวให้ ${targetType === 'store' ? mockStoreName : mockRiderName} เรียบร้อยแล้ว! 🎉 ขอบคุณมาก!` });
      setRating(0); // Reset rating
      setComment(''); // Reset comment
    } catch (error) {
      console.error("Error submitting review:", error);
      setMessage({ type: 'error', text: 'ส่งรีวิวไม่สำเร็จนะเพื่อน! ลองใหม่อีกครั้ง 😩' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">กำลังโหลดข้อมูล... 🔄</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-6">
          รีวิวประสบการณ์ของคุณ 📝
        </h1>
        <p className="text-gray-600 text-center mb-8">
          ช่วยให้คะแนนและรีวิวเพื่อปรับปรุงบริการของเรานะเพื่อน!
        </p>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-lg text-center mb-4 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.message}
          </div>
        )}

        {!userId && (
            <div className="text-center text-red-500 mb-4">
                คุณต้องเข้าสู่ระบบก่อนจึงจะรีวิวได้นะ! 🔒
            </div>
        )}

        {/* Review for Store */}
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-md mb-6">
          <h2 className="text-xl font-bold text-blue-700 mb-4">
            รีวิวร้านค้า: {mockStoreName} 🏪
          </h2>
          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-8 h-8 cursor-pointer ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() => handleRatingClick(star)}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={handleCommentChange}
            rows={4}
            placeholder="เขียนคอมเมนต์ของคุณที่นี่..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm mb-4"
          ></textarea>
          <button
            onClick={() => handleSubmitReview('store', mockStoreId)}
            disabled={submitting || !userId}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-150 ease-in-out ${
              submitting || !userId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิวร้านค้า 👍'}
          </button>
        </div>

        {/* Review for Rider (Similar structure, can be separated if needed) */}
        <div className="bg-white p-6 rounded-xl border border-green-200 shadow-md">
          <h2 className="text-xl font-bold text-green-700 mb-4">
            รีวิวไรเดอร์: {mockRiderName} 🏍️
          </h2>
          {/* Re-using same rating/comment states for simplicity, but in real app
              you might want separate states or a more complex form for both reviews at once */}
          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-8 h-8 cursor-pointer ${
                  star <= rating ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onClick={() => handleRatingClick(star)}
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={handleCommentChange}
            rows={4}
            placeholder="เขียนคอมเมนต์ของคุณที่นี่..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm mb-4"
          ></textarea>
          <button
            onClick={() => handleSubmitReview('rider', mockRiderId)}
            disabled={submitting || !userId}
            className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-150 ease-in-out ${
              submitting || !userId ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {submitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิวไรเดอร์ 💨'}
          </button>
        </div>

        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MaoPay App. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}