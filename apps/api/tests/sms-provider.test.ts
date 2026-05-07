import { describe, expect, test } from 'bun:test'
import {
  createSMSProvider,
  EsmsSMSProvider,
  FallbackSMSProvider,
  InfobipSMSProvider,
  type SMSProvider,
  SpeedSmsProvider,
  TingTingSMSProvider,
} from '../src/lib/sms-provider'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('SMS providers', () => {
  test('eSMS provider sends OTP customer-care payload and accepts CodeResult 100', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return jsonResponse({ CodeResult: '100', SMSID: 'sms-1' })
    }

    const provider = new EsmsSMSProvider(
      {
        apiKey: 'api-key',
        secretKey: 'secret-key',
        brandName: 'S-Loco',
        callbackUrl: 'https://api.example.com/api/v1/webhooks/esms/sms-status',
        requestIdFactory: () => 'req-1',
      },
      fetcher,
    )

    await expect(provider.sendDetailed('0912345678', 'Mã OTP S-Loco của bạn: 1234')).resolves.toMatchObject({
      ok: true,
      provider: 'esms',
      requestId: 'req-1',
      smsId: 'sms-1',
      codeResult: '100',
      status: 'accepted',
    })
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe(
      'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json',
    )

    const body = JSON.parse(String(calls[0]?.init.body))
    expect(body).toMatchObject({
      ApiKey: 'api-key',
      SecretKey: 'secret-key',
      Brandname: 'S-Loco',
      Phone: '0912345678',
      Content: 'Mã OTP S-Loco của bạn: 1234',
      SmsType: 2,
      IsUnicode: 1,
      RequestId: 'req-1',
      CallbackUrl: 'https://api.example.com/api/v1/webhooks/esms/sms-status',
    })
  })

  test('eSMS provider omits Brandname when sending from fixed number', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return jsonResponse({ CodeResult: '100', SMSID: 'sms-1' })
    }

    const provider = new EsmsSMSProvider(
      { apiKey: 'api-key', secretKey: 'secret-key', smsType: 8 },
      fetcher,
    )

    await expect(provider.send('0912345678', 'Mã OTP S-Loco của bạn: 1234')).resolves.toBe(true)

    const body = JSON.parse(String(calls[0]?.init.body))
    expect(body).toMatchObject({
      ApiKey: 'api-key',
      SecretKey: 'secret-key',
      Phone: '0912345678',
      Content: 'Mã OTP S-Loco của bạn: 1234',
      SmsType: 8,
      IsUnicode: 1,
    })
    expect(body).not.toHaveProperty('Brandname')
  })

  test('Ting Ting provider sends SMS payload and accepts success response', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return jsonResponse({ status: 'success', sms: 1, cost: 850, tranId: 'tran-1' })
    }

    const provider = new TingTingSMSProvider({ apiKey: 'ting-key', sender: 'S-Loco' }, fetcher)

    await expect(provider.send('0912345678', '[TING TING] Mã OTP của bạn là 1234. #tingting.dev')).resolves.toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe('https://v1.tingting.im/api/sms')
    expect(calls[0]?.init.headers).toMatchObject({
      'Content-Type': 'application/json',
      apikey: 'ting-key',
    })

    const body = JSON.parse(String(calls[0]?.init.body))
    expect(body).toEqual({
      to: '84912345678',
      content: '[TING TING] Mã OTP của bạn là 1234. #tingting.dev',
      sender: 'S-Loco',
    })
  })

  test('factory prefers Ting Ting when credentials are configured', async () => {
    const calls: string[] = []
    const fetcher = async (url: string | URL | Request) => {
      calls.push(String(url))
      return jsonResponse({ status: 'success', tranId: 'tran-1' })
    }

    const provider = createSMSProvider(
      {
        TINGTING_API_KEY: 'ting-key',
        TINGTING_SENDER: 'S-Loco',
        ESMS_API_KEY: 'api-key',
        ESMS_SECRET_KEY: 'secret-key',
      },
      fetcher,
    )

    await expect(provider.send('0912345678', 'otp')).resolves.toBe(true)
    expect(calls).toEqual(['https://v1.tingting.im/api/sms'])
  })

  test('SpeedSMS provider sends brandname payload and accepts success code 00', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return jsonResponse({ status: 'success', code: '00' })
    }

    const provider = new SpeedSmsProvider({ accessToken: 'speed-token', sender: 'S-Loco' }, fetcher)

    await expect(provider.send('0912345678', 'Mã OTP S-Loco của bạn: 1234')).resolves.toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe(
      'https://api.speedsms.vn/index.php/sms/send?access-token=speed-token',
    )

    const body = JSON.parse(String(calls[0]?.init.body))
    expect(body).toMatchObject({
      to: ['0912345678'],
      content: 'Mã OTP S-Loco của bạn: 1234',
      sms_type: 2,
      sender: 'S-Loco',
    })
  })

  test('SpeedSMS provider omits sender when testing without brandname', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return jsonResponse({ status: 'success', code: '00' })
    }

    const provider = new SpeedSmsProvider({ accessToken: 'speed-token', smsType: 2 }, fetcher)

    await expect(provider.send('0912345678', 'Mã OTP S-Loco của bạn: 1234')).resolves.toBe(true)

    const body = JSON.parse(String(calls[0]?.init.body))
    expect(body).toMatchObject({
      to: ['0912345678'],
      content: 'Mã OTP S-Loco của bạn: 1234',
      sms_type: 2,
    })
    expect(body).not.toHaveProperty('sender')
  })

  test('Infobip provider sends SMS API payload and accepts pending status', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return jsonResponse({
        messages: [
          {
            to: '84912345678',
            messageId: 'infobip-message-1',
            status: { groupId: 1, groupName: 'PENDING', name: 'PENDING_ACCEPTED' },
          },
        ],
      })
    }

    const provider = new InfobipSMSProvider(
      { apiKey: 'infobip-key', baseUrl: 'https://api.infobip.com', sender: 'S-Loco' },
      fetcher,
    )

    await expect(provider.send('0912345678', 'Mã OTP S-Loco của bạn: 1234')).resolves.toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe('https://api.infobip.com/sms/3/messages')
    expect(calls[0]?.init.headers).toMatchObject({
      Authorization: 'App infobip-key',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    })

    const body = JSON.parse(String(calls[0]?.init.body))
    expect(body).toEqual({
      messages: [
        {
          from: 'S-Loco',
          destinations: [{ to: '84912345678' }],
          text: 'Mã OTP S-Loco của bạn: 1234',
        },
      ],
    })
  })

  test('Infobip provider omits sender when testing without registered sender', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} })
      return jsonResponse({
        messages: [{ status: { groupId: 1, name: 'PENDING_ACCEPTED' } }],
      })
    }

    const provider = new InfobipSMSProvider({ apiKey: 'infobip-key' }, fetcher)

    await expect(provider.send('+84912345678', 'otp')).resolves.toBe(true)

    const body = JSON.parse(String(calls[0]?.init.body))
    expect(body).toEqual({
      messages: [
        {
          destinations: [{ to: '84912345678' }],
          text: 'otp',
        },
      ],
    })
  })

  test('fallback provider tries SpeedSMS when eSMS fails', async () => {
    const calls: string[] = []
    const primary: SMSProvider = {
      async send() {
        calls.push('esms')
        return false
      },
    }
    const fallback: SMSProvider = {
      async send() {
        calls.push('speedsms')
        return true
      },
    }

    const provider = new FallbackSMSProvider([primary, fallback])

    await expect(provider.send('0912345678', 'otp')).resolves.toBe(true)
    expect(calls).toEqual(['esms', 'speedsms'])
  })

  test('factory builds eSMS with SpeedSMS fallback from environment', async () => {
    const calls: string[] = []
    const originalWarn = console.warn
    console.warn = () => {}
    const fetcher = async (url: string | URL | Request) => {
      const textUrl = String(url)
      calls.push(textUrl.includes('esms.vn') ? 'esms' : 'speedsms')
      if (textUrl.includes('esms.vn')) {
        return jsonResponse({ CodeResult: '99', ErrorMessage: 'temporary failure' })
      }
      return jsonResponse({ status: 'success', code: '00' })
    }

    const provider = createSMSProvider(
      {
        SMS_PROVIDER: 'esms',
        SMS_FALLBACK_PROVIDER: 'speedsms',
        ESMS_API_KEY: 'api-key',
        ESMS_SECRET_KEY: 'secret-key',
        ESMS_BRAND_NAME: 'S-Loco',
        SPEEDSMS_ACCESS_TOKEN: 'speed-token',
        SPEEDSMS_SENDER: 'S-Loco',
      },
      fetcher,
    )

    try {
      await expect(provider.send('0912345678', 'otp')).resolves.toBe(true)
      expect(calls).toEqual(['esms', 'speedsms'])
    } finally {
      console.warn = originalWarn
    }
  })

  test('factory supports eSMS and SpeedSMS without brandname while testing', async () => {
    const bodies: unknown[] = []
    const fetcher = async (_url: string | URL | Request, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)))
      return jsonResponse({ CodeResult: '100', SMSID: 'sms-1' })
    }

    const provider = createSMSProvider(
      {
        SMS_PROVIDER: 'esms',
        SMS_FALLBACK_PROVIDER: 'speedsms',
        ESMS_API_KEY: 'api-key',
        ESMS_SECRET_KEY: 'secret-key',
        ESMS_BRAND_NAME: '',
        SPEEDSMS_ACCESS_TOKEN: 'speed-token',
        SPEEDSMS_SENDER: '',
      },
      fetcher,
    )

    await expect(provider.send('0912345678', 'otp')).resolves.toBe(true)

    expect(bodies[0]).toMatchObject({
      ApiKey: 'api-key',
      SecretKey: 'secret-key',
      Phone: '0912345678',
      Content: 'otp',
      SmsType: 8,
    })
    expect(bodies[0]).not.toHaveProperty('Brandname')
  })

  test('factory supports Infobip in a multi-provider fallback chain', async () => {
    const calls: string[] = []
    const originalWarn = console.warn
    console.warn = () => {}
    const fetcher = async (url: string | URL | Request) => {
      const textUrl = String(url)
      if (textUrl.includes('esms.vn')) {
        calls.push('esms')
        return jsonResponse({ CodeResult: '99', ErrorMessage: 'temporary failure' })
      }
      if (textUrl.includes('speedsms.vn')) {
        calls.push('speedsms')
        return jsonResponse({ status: 'error', message: 'temporary failure' })
      }
      calls.push('infobip')
      return jsonResponse({
        messages: [{ status: { groupId: 1, name: 'PENDING_ACCEPTED' } }],
      })
    }

    const provider = createSMSProvider(
      {
        SMS_PROVIDER: 'esms',
        SMS_FALLBACK_PROVIDER: 'speedsms,infobip',
        ESMS_API_KEY: 'api-key',
        ESMS_SECRET_KEY: 'secret-key',
        SPEEDSMS_ACCESS_TOKEN: 'speed-token',
        INFOBIP_API_KEY: 'infobip-key',
      },
      fetcher,
    )

    try {
      await expect(provider.send('0912345678', 'otp')).resolves.toBe(true)
      expect(calls).toEqual(['esms', 'speedsms', 'infobip'])
    } finally {
      console.warn = originalWarn
    }
  })

  test('eSMS provider logs provider response when API rejects the message', async () => {
    const warnings: unknown[][] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => warnings.push(args)
    try {
      const fetcher = async () =>
        jsonResponse({ CodeResult: '99', ErrorMessage: 'Brandname is invalid' })
      const provider = new EsmsSMSProvider(
        { apiKey: 'api-key', secretKey: 'secret-key', brandName: 'S-Loco' },
        fetcher,
      )

      await expect(provider.send('0912345678', 'otp')).resolves.toBe(false)
    } finally {
      console.warn = originalWarn
    }

    expect(String(warnings[0]?.[0])).toContain('[SMS:eSMS] Send failed')
    expect(warnings[0]?.[1]).toMatchObject({
      codeResult: '99',
      errorMessage: 'Brandname is invalid',
    })
  })

  test('SpeedSMS provider logs provider response when API rejects the message', async () => {
    const warnings: unknown[][] = []
    const originalWarn = console.warn
    console.warn = (...args: unknown[]) => warnings.push(args)
    try {
      const fetcher = async () => jsonResponse({ status: 'error', code: '105', message: 'invalid' })
      const provider = new SpeedSmsProvider(
        { accessToken: 'speed-token', sender: 'S-Loco' },
        fetcher,
      )

      await expect(provider.send('0912345678', 'otp')).resolves.toBe(false)
    } finally {
      console.warn = originalWarn
    }

    expect(String(warnings[0]?.[0])).toContain('[SMS:SpeedSMS] Send failed')
    expect(warnings[0]?.[1]).toMatchObject({
      status: 'error',
      code: '105',
      message: 'invalid',
    })
  })
})
