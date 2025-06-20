// public/firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

// --- ใส่ค่า Firebase Config ของนายตรงนี้! ---
// (เอามาจากในไฟล์ .env.local ของนายได้เลย)
const firebaseConfig = {
  apiKey: "AIzaSyBBT4jPexRxFsk00Ly4Dwah3Q01NTtiOS8", // NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "maopay-app.firebaseapp.com", // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "maopay-app", // NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "maopay-app.appspot.com", // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "1017073316088", // NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:1017073316088:web:17f10fa54e3e2702a34b0d", // NEXT_PUBLIC_FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.ico", // นายจะเปลี่ยนเป็น icon ของนายก็ได้นะ
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});