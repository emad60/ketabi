/**
 * Firebase Configuration
 * تهيئة Firebase للإشعارات Push
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration من Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

// تهيئة Firebase فقط إذا كانت المفاتيح موجودة
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    app = initializeApp(firebaseConfig);
    
    // تهيئة Messaging فقط في المتصفح
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error);
  }
} else {
  console.warn('⚠️ Firebase config missing. Push notifications will not work.');
}

/**
 * طلب إذن الإشعارات والحصول على FCM Token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return null;
  }

  try {
    // طلب الإذن من المستخدم
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // الحصول على Token
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      
      console.log('✅ FCM Token:', token);
      return token;
    } else {
      console.warn('⚠️ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
}

/**
 * الاستماع للإشعارات الواردة
 */
export function onMessageListener(
  callback: (payload: any) => void
): (() => void) | null {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return null;
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Message received:', payload);
    callback(payload);
    
    // عرض الإشعار في المتصفح
    if (payload.notification) {
      new Notification(payload.notification.title || 'إشعار جديد', {
        body: payload.notification.body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: payload.messageId,
        data: payload.data,
      });
    }
  });
}

export { app, messaging };
