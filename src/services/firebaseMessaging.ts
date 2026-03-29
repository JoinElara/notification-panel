import { initializeApp, getApps, type FirebaseOptions } from 'firebase/app';
import { getMessaging, getToken, deleteToken, isSupported, onMessage } from 'firebase/messaging';

function readFirebaseWebConfig(): FirebaseOptions {
  const e = import.meta.env;
  const apiKey = e.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = e.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = e.VITE_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = e.VITE_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = e.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = e.VITE_FIREBASE_APP_ID?.trim();
  const measurementId = e.VITE_FIREBASE_MEASUREMENT_ID?.trim();

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    throw new Error(
      'Missing Firebase Web config. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, ' +
        'VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, ' +
        'VITE_FIREBASE_APP_ID in .env (see .env.example).',
    );
  }

  const config: FirebaseOptions = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
  if (measurementId) config.measurementId = measurementId;
  return config;
}

let firebaseConfig: FirebaseOptions | null = null;

function getOrCreateApp() {
  if (getApps().length > 0) return getApps()[0];
  if (!firebaseConfig) firebaseConfig = readFirebaseWebConfig();
  return initializeApp(firebaseConfig);
}

/**
 * Clear any stale push subscription on this SW registration.
 * When the VAPID key changes, the old subscription becomes invalid
 * and getToken() fails with "push service error".
 */
async function clearStalePushSubscription(reg: ServiceWorkerRegistration) {
  try {
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }
  } catch {
    // Ignore — no subscription to clear
  }
}

export async function getWebFcmToken(): Promise<string> {
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!window.isSecureContext && !isLocalhost) {
    throw new Error('Web push requires HTTPS (or localhost for development)');
  }

  if (!('Notification' in window)) {
    throw new Error('This browser does not support Notification API');
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support Service Workers');
  }

  const supported = await isSupported();
  if (!supported) {
    throw new Error(
      'Firebase Messaging is not supported in this browser. Use latest Chrome/Edge/Firefox.',
    );
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    throw new Error('Missing VITE_FIREBASE_VAPID_KEY in frontend env');
  }

  if (Notification.permission === 'denied') {
    throw new Error(
      'Notifications are blocked. Go to browser Settings → Site Settings → Notifications and allow this site.',
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  // Unregister any old service workers for this scope, then register fresh
  const existingRegs = await navigator.serviceWorker.getRegistrations();
  for (const reg of existingRegs) {
    // Clear stale push subscriptions that may use an old VAPID key
    await clearStalePushSubscription(reg);
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/',
    updateViaCache: 'none',
  });

  // Wait for the SW to become active
  await navigator.serviceWorker.ready;

  // Also clear any stale subscription on the new registration
  await clearStalePushSubscription(registration);

  const app = getOrCreateApp();
  const messaging = getMessaging(app);

  // Delete any existing FCM token to force a fresh subscription
  try {
    await deleteToken(messaging);
  } catch {
    // No existing token — that's fine
  }

  const activeReg = registration.active ? registration : await navigator.serviceWorker.ready;

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: activeReg,
    });

    if (!token) {
      throw new Error('No FCM token returned by Firebase');
    }

    return token;
  } catch (error: any) {
    const message = String(error?.message || '');
    const code = error?.code || '';

    if (code === 'messaging/permission-blocked') {
      throw new Error('Notifications are blocked for this site in browser settings');
    }
    if (message.toLowerCase().includes('push service error')) {
      throw new Error(
        'Registration failed - push service error.\n\n' +
        'This usually means the VAPID key doesn\'t match your Firebase project.\n' +
        'Fix: Go to Firebase Console → Project Settings → Cloud Messaging → ' +
        'Web Push certificates → copy the Key pair (public key) and set it as ' +
        'VITE_FIREBASE_VAPID_KEY in notification-panel/.env, then restart the dev server.',
      );
    }

    throw new Error(error?.message || 'Failed to generate FCM token');
  }
}

/**
 * Listen for foreground push messages.
 * When the page is in focus, Firebase does NOT show a system notification automatically.
 * This handler shows it manually + calls an optional callback.
 */
export function listenForForegroundMessages(
  onNotification?: (payload: { title: string; body: string }) => void,
) {
  const app = getOrCreateApp();
  const messaging = getMessaging(app);

  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Elara';
    const body = payload.notification?.body || payload.data?.body || '';

    // Show browser notification even when tab is active
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/elara-logo.png' });
    }

    if (onNotification) {
      onNotification({ title, body });
    }
  });
}
