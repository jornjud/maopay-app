// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();
const messaging = admin.messaging(); // <-- 🔥 เพิ่มบรรทัดนี้เข้าไป!

export { db, auth, messaging }; // <-- 🔥 แล้วก็เพิ่ม `messaging` ตรงที่ export ด้วย!