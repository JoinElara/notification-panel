/* eslint-disable no-undef */
/**
 * Template — values filled by scripts/generate-firebase-messaging-sw.mjs from env.
 * Keep compat SDK version roughly aligned with the `firebase` npm package major.
 */
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '%%VITE_FIREBASE_API_KEY%%',
  authDomain: '%%VITE_FIREBASE_AUTH_DOMAIN%%',
  projectId: '%%VITE_FIREBASE_PROJECT_ID%%',
  storageBucket: '%%VITE_FIREBASE_STORAGE_BUCKET%%',
  messagingSenderId: '%%VITE_FIREBASE_MESSAGING_SENDER_ID%%',
  appId: '%%VITE_FIREBASE_APP_ID%%',
  measurementId: '%%VITE_FIREBASE_MEASUREMENT_ID%%',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'Elara';
  const options = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/elara-logo.png',
    badge: '/elara-logo.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    }),
  );
});
