declare module 'firebase/app' {
  type FirebaseApp = unknown
  export function initializeApp(options: Record<string, string | undefined>): FirebaseApp
  export function getApps(): FirebaseApp[]
}

declare module 'firebase/messaging' {
  export function getMessaging(app: unknown): unknown
  export function getToken(
    messaging: unknown,
    options: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration },
  ): Promise<string>
}
