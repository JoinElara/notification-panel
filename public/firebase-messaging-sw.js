/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBXdSU9bMdGNC7qZneh3KJB1jgQaRM8W4g',
  authDomain: 'elara-261bc.firebaseapp.com',
  projectId: 'elara-261bc',
  storageBucket: 'elara-261bc.firebasestorage.app',
  messagingSenderId: '61069444020',
  appId: '1:61069444020:web:572ceed3cbe786de9968e1',
  measurementId: 'G-Z2RD28G3SN',
});

const messaging = firebase.messaging();

// Handle background push messages (when tab is not focused)
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

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
