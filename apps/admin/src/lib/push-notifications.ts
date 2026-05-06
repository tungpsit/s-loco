import { notificationApi } from './api'

type PushRegistrationResult = {
  success: boolean
  message: string
}

const REQUIRED_FIREBASE_ENV = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
]

export function isWebPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
}

export function hasFirebaseWebConfig() {
  return REQUIRED_FIREBASE_ENV.every((key) => Boolean(process.env[key]))
}

export async function enableAdminWebPush(): Promise<PushRegistrationResult> {
  if (!isWebPushSupported()) {
    return { success: false, message: 'Trình duyệt này chưa hỗ trợ thông báo đẩy.' }
  }

  if (!hasFirebaseWebConfig()) {
    return {
      success: false,
      message: 'Chưa cấu hình Firebase Web Push. In-app notification vẫn hoạt động bình thường.',
    }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { success: false, message: 'Bạn chưa cấp quyền nhận thông báo trình duyệt.' }
  }

  try {
    const { initializeApp, getApps } = await import('firebase/app')
    const { getMessaging, getToken } = await import('firebase/messaging')

    const app = getApps().length
      ? getApps()[0]
      : initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        })

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (!token) {
      return { success: false, message: 'Không lấy được push token từ Firebase.' }
    }

    await notificationApi.registerToken(token, 'web')
    return { success: true, message: 'Đã bật thông báo trình duyệt cho admin.' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Không thể bật thông báo trình duyệt.'
    return { success: false, message }
  }
}
