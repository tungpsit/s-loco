import { describe, expect, test } from 'bun:test'
import { isExpoPushToken } from '../src/services/push.service'

describe('push service', () => {
  test('detects Expo push tokens before native APNs/FCM routing', () => {
    expect(isExpoPushToken('ExpoPushToken[abc123]')).toBe(true)
    expect(isExpoPushToken('ExponentPushToken[abc123]')).toBe(true)
    expect(isExpoPushToken('native-fcm-or-apns-token')).toBe(false)
  })
})
