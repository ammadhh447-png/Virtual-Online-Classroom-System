// Replace with your Firebase configuration in the client app and the service worker
// This file is required for FCM background messages on the web.

importScripts(
  "https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js",
);

// TODO: replace with your app's Firebase config (only for the service worker scope)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const notificationTitle = payload.notification?.title || "Background Message";
  const notificationOptions = {
    body: payload.notification?.body || "",
    data: payload.data || {},
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
