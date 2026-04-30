/**
 * Push Notification Service — Expo Push, FCM (Android/Web), APNs (iOS)
 *
 * Usage:
 *   import { sendPush } from './push.service'
 *   await sendPush({ token, platform, title, body, data })
 *
 * Required env vars for native tokens:
 *   FCM_SERVICE_ACCOUNT_PATH  — path to Firebase service account JSON (or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY)
 *   APNS_KEY_ID               — Apple developer key ID
 *   APNS_TEAM_ID              — Apple developer team ID
 *   APNS_KEY_PATH             — path to .p8 private key file (or APNS_PRIVATE_KEY inline)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushPayload {
  token: string
  platform: 'android' | 'ios' | 'web'
  title: string
  body: string
  data?: Record<string, string>
  badge?: number
}

export interface PushResult {
  success: boolean
  messageId?: string
  error?: string
}

// ─── Expo Push Service — Expo managed apps ───────────────────────────────────

export function isExpoPushToken(token: string): boolean {
  return /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(token)
}

async function sendExpoPush(payload: PushPayload): Promise<PushResult> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: payload.token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: 'default',
      badge: payload.badge,
    }),
  })

  const data = (await res.json()) as {
    data?: { status?: string; id?: string; message?: string }
    errors?: Array<{ message?: string }>
  }

  if (!res.ok || data.data?.status === 'error') {
    return {
      success: false,
      error: data.data?.message ?? data.errors?.[0]?.message ?? `Expo ${res.status}`,
    }
  }

  return { success: true, messageId: data.data?.id }
}

// ─── FCM (Firebase Cloud Messaging) — Android / Web ───────────────────────────

async function getFcmAccessToken(): Promise<string> {
  // Firebase service account from env or file
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.',
    )
  }

  // JWT-based OAuth2 for FCM v1 API
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const { SignJWT } = await import('jose')
  const privateKeyParsed = await import('jose').then((j) =>
    j.importPKCS8(
      privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, ''),
      'RS256',
    ),
  )
  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKeyParsed)

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const tokenData = (await tokenRes.json()) as { access_token?: string }
  const accessToken = tokenData.access_token
  if (!accessToken) throw new Error('Failed to get FCM access token')
  return accessToken
}

async function sendFcm(payload: PushPayload): Promise<PushResult> {
  const accessToken = await getFcmAccessToken()
  const projectId = process.env.FIREBASE_PROJECT_ID!

  const fcmPayload: Record<string, unknown> = {
    message: {
      token: payload.token,
      notification: { title: payload.title, body: payload.body },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#005E97',
          channel_id: 's_loco_notifications',
        },
      },
      webpush: {
        fcm_options: { link: process.env.PUSH_DEEP_LINK || 'sloco://app' },
      },
      ...(payload.data && {
        data: Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)])),
      }),
    },
  }

  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fcmPayload),
  })

  const data = (await res.json()) as { name?: string; error?: { message?: string } }
  if (!res.ok || data.error) {
    return { success: false, error: data.error?.message ?? `HTTP ${res.status}` }
  }
  return { success: true, messageId: data.name }
}

// ─── APNs (Apple Push Notification Service) — iOS ─────────────────────────────

async function getApnsAuthToken(): Promise<string> {
  const keyId = process.env.APNS_KEY_ID!
  const teamId = process.env.APNS_TEAM_ID!
  const privateKey = (process.env.APNS_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)

  const { importPKCS8 } = await import('jose')
  const pkcs8Key = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, '')
  const secretKey = await importPKCS8(pkcs8Key, 'ES256')

  const { SignJWT } = await import('jose')
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .setIssuer(teamId)
    .sign(secretKey)
}

async function sendApns(payload: PushPayload): Promise<PushResult> {
  const authToken = await getApnsAuthToken()
  const topic = process.env.APNS_TOPIC || 'com.sloco.app'

  const apnsPayload: Record<string, unknown> = {
    aps: {
      alert: { title: payload.title, body: payload.body },
      sound: 'default',
      badge: payload.badge ?? 1,
    },
    ...(payload.data && { ...payload.data }),
  }

  const res = await fetch(`https://api.push.apple.com/3/device/${payload.token}`, {
    method: 'POST',
    headers: {
      'apns-topic': topic,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      Authorization: `bearer ${authToken}`,
    },
    body: JSON.stringify(apnsPayload),
  })

  // 200 = success, 410 = token no longer valid (remove from DB)
  if (res.ok) return { success: true }
  if (res.status === 410) {
    return { success: false, error: 'TOKEN_EXPIRED' }
  }
  const body = await res.text()
  return { success: false, error: `APNs ${res.status}: ${body}` }
}

// ─── Unified sendPush ─────────────────────────────────────────────────────────

export async function sendPush(payload: PushPayload): Promise<PushResult> {
  try {
    if (isExpoPushToken(payload.token)) {
      return await sendExpoPush(payload)
    }

    if (payload.platform === 'ios') {
      return await sendApns(payload)
    }
    return await sendFcm(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[Push] Failed to send: ${message}`)
    return { success: false, error: message }
  }
}

export async function sendPushBatch(payloads: PushPayload[]): Promise<Map<string, PushResult>> {
  const results = new Map<string, PushResult>()
  await Promise.all(
    payloads.map(async (p) => {
      results.set(p.token, await sendPush(p))
    }),
  )
  return results
}
