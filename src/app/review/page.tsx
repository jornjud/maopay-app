"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea'; // ตอนนี้จะ import ผ่านแล้ว
import { Star } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ReviewPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);

  // สมมติว่าเรากำลังรีวิว orderId หรือ storeId บางอย่าง
  const targetId = "some_order_or_store_id"; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('กรุณาเข้าสู่ระบบเพื่อส่งรีวิว');
      router.push('/login');
      return;
    }
    if (rating === 0) {
      alert('กรุณาให้คะแนนดาว');
      return;
    }

    try {
      const reviewId = doc(db, 'reviews', `${user.uid}_${targetId}`).id;
      await setDoc(doc(db, 'reviews', reviewId), {
        userId: user.uid,
        targetId: targetId,
        rating: rating,
        comment: comment,
        createdAt: new Date(),
      });
      alert('ขอบคุณสำหรับรีวิวของคุณ!');
      // อาจจะ redirect ไปหน้าอื่น
      router.push('/history'); 
    } catch (error) {
      console.error("Error submitting review: ", error);
      alert('เกิดข้อผิดพลาดในการส่งรีวิว');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>เขียนรีวิว</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">คะแนนของคุณ</label>
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <button
                      type="button"
                      key={starValue}
                      className="focus:outline-none"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHover(starValue)}
                      onMouseLeave={() => setHover(rating)}
                    >
                      <Star
                        className={`cursor-pointer ${
                          starValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill={starValue <= (hover || rating) ? 'currentColor' : 'none'}
                        size={32}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                ความคิดเห็น
              </label>
              <Textarea
                id="comment"
                placeholder="บอกเล่าประสบการณ์ของคุณ..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full">
              ส่งรีวิว
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewPage;
