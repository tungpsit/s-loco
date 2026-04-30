import { describe, expect, test } from 'bun:test'
import type { SMSProvider } from '../src/lib/sms-provider'
import { OtpError, sendOtpMessage } from '../src/services/otp.service'

describe('OTP service SMS delivery', () => {
  test('sendOtpMessage sends localized OTP message through provider', async () => {
    const sent: Array<{ phone: string; message: string }> = []
    const provider: SMSProvider = {
      async send(phone, message) {
        sent.push({ phone, message })
        return true
      },
    }

    await expect(sendOtpMessage(provider, '0912345678', '1234')).resolves.toBeUndefined()
    expect(sent).toEqual([
      {
        phone: '0912345678',
        message: 'Mã OTP S-Loco của bạn: 1234. Hết hạn sau 5 phút.',
      },
    ])
  })

  test('sendOtpMessage rejects when provider cannot deliver SMS', async () => {
    const provider: SMSProvider = {
      async send() {
        return false
      },
    }

    await expect(sendOtpMessage(provider, '0912345678', '1234')).rejects.toBeInstanceOf(OtpError)
  })
})
