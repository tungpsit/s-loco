export interface SMSProvider {
  send(phone: string, message: string): Promise<boolean>
}

type Fetcher = (url: string | URL | Request, init?: RequestInit) => Promise<Response>

export class ConsoleSMSProvider implements SMSProvider {
  async send(phone: string, message: string) {
    console.log(`\n╔════════════════════════════════════╗`)
    console.log(`║  [SMS] To: ${phone.padEnd(16)}   ║`)
    console.log(`║  ${message.padEnd(32)} ║`)
    console.log(`╚════════════════════════════════════╝\n`)
    return true
  }
}

export interface EsmsConfig {
  apiKey: string
  secretKey: string
  brandName?: string
  smsType?: number
  isUnicode?: number
  endpoint?: string
}

export class EsmsSMSProvider implements SMSProvider {
  private readonly endpoint: string
  private readonly smsType: number
  private readonly isUnicode: number

  constructor(
    private readonly config: EsmsConfig,
    private readonly fetcher: Fetcher = fetch,
  ) {
    this.endpoint =
      config.endpoint ??
      'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json'
    this.smsType = config.smsType ?? 2
    this.isUnicode = config.isUnicode ?? 1
  }

  async send(phone: string, message: string) {
    const res = await this.fetcher(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ApiKey: this.config.apiKey,
        SecretKey: this.config.secretKey,
        Content: message,
        Phone: phone,
        Brandname: this.config.brandName,
        SmsType: this.smsType,
        IsUnicode: this.isUnicode,
      }),
    })

    if (!res.ok) {
      console.warn('[SMS:eSMS] Send failed', { httpStatus: res.status, body: await readJson(res) })
      return false
    }

    const data = (await res.json().catch(() => null)) as { CodeResult?: string | number } | null
    const sent = String(data?.CodeResult) === '100'
    if (!sent) {
      console.warn('[SMS:eSMS] Send failed', {
        codeResult: data?.CodeResult,
        errorMessage: (data as { ErrorMessage?: string } | null)?.ErrorMessage,
      })
    }
    return sent
  }
}

export interface SpeedSmsConfig {
  accessToken: string
  sender?: string
  smsType?: number
  endpoint?: string
}

export class SpeedSmsProvider implements SMSProvider {
  private readonly endpoint: string
  private readonly smsType: number

  constructor(
    private readonly config: SpeedSmsConfig,
    private readonly fetcher: Fetcher = fetch,
  ) {
    this.endpoint = config.endpoint ?? 'https://api.speedsms.vn/index.php/sms/send'
    this.smsType = config.smsType ?? 2
  }

  async send(phone: string, message: string) {
    const url = `${this.endpoint}?access-token=${encodeURIComponent(this.config.accessToken)}`
    const res = await this.fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: [phone],
        content: message,
        sms_type: this.smsType,
        sender: this.config.sender,
      }),
    })

    if (!res.ok) {
      console.warn('[SMS:SpeedSMS] Send failed', {
        httpStatus: res.status,
        body: await readJson(res),
      })
      return false
    }

    const data = (await res.json().catch(() => null)) as {
      status?: string
      code?: string | number
      message?: string
    } | null
    const sent = data?.status === 'success' && String(data?.code) === '00'
    if (!sent) {
      console.warn('[SMS:SpeedSMS] Send failed', {
        status: data?.status,
        code: data?.code,
        message: data?.message,
      })
    }
    return sent
  }
}

export interface InfobipConfig {
  apiKey: string
  baseUrl?: string
  sender?: string
}

export class InfobipSMSProvider implements SMSProvider {
  private readonly endpoint: string

  constructor(
    private readonly config: InfobipConfig,
    private readonly fetcher: Fetcher = fetch,
  ) {
    const baseUrl = (config.baseUrl ?? 'https://api.infobip.com').replace(/\/+$/, '')
    this.endpoint = `${baseUrl}/sms/3/messages`
  }

  async send(phone: string, message: string) {
    const res = await this.fetcher(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `App ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            from: this.config.sender,
            destinations: [{ to: toInfobipPhone(phone) }],
            text: message,
          },
        ],
      }),
    })

    if (!res.ok) {
      console.warn('[SMS:Infobip] Send failed', {
        httpStatus: res.status,
        body: await readJson(res),
      })
      return false
    }

    const data = (await res.json().catch(() => null)) as {
      messages?: Array<{ status?: { groupId?: number; name?: string; description?: string } }>
    } | null
    const firstStatus = data?.messages?.[0]?.status
    const sent = firstStatus?.groupId === 1 || firstStatus?.groupId === 3
    if (!sent) {
      console.warn('[SMS:Infobip] Send failed', {
        groupId: firstStatus?.groupId,
        name: firstStatus?.name,
        description: firstStatus?.description,
      })
    }
    return sent
  }
}

export class FallbackSMSProvider implements SMSProvider {
  constructor(private readonly providers: SMSProvider[]) {
    if (providers.length === 0) {
      throw new Error('At least one SMS provider is required')
    }
  }

  async send(phone: string, message: string) {
    for (const provider of this.providers) {
      try {
        if (await provider.send(phone, message)) return true
      } catch (err) {
        console.warn('[SMS] Provider failed, trying fallback if configured:', err)
      }
    }

    return false
  }
}

export function createSMSProvider(
  env: Record<string, string | undefined> = process.env,
  fetcher: Fetcher = fetch,
): SMSProvider {
  const primary = normalizeProviderName(env.SMS_PROVIDER ?? 'mock')
  if (primary === 'mock' || primary === 'console') return new ConsoleSMSProvider()

  const providers = [createNamedProvider(primary, env, fetcher)]
  const fallbacks = parseProviderList(env.SMS_FALLBACK_PROVIDER ?? '')
  for (const fallback of fallbacks) {
    if (fallback === 'mock' || fallback === 'console') continue
    providers.push(createNamedProvider(fallback, env, fetcher))
  }

  return providers.length === 1 ? providers[0]! : new FallbackSMSProvider(providers)
}

function createNamedProvider(
  name: string,
  env: Record<string, string | undefined>,
  fetcher: Fetcher,
): SMSProvider {
  switch (name) {
    case 'esms':
      return new EsmsSMSProvider(
        {
          apiKey: requireEnv(env, 'ESMS_API_KEY'),
          secretKey: requireEnv(env, 'ESMS_SECRET_KEY'),
          brandName: optionalEnv(env, 'ESMS_BRAND_NAME'),
          smsType: numberFromEnv(env.ESMS_SMS_TYPE, optionalEnv(env, 'ESMS_BRAND_NAME') ? 2 : 8),
          isUnicode: numberFromEnv(env.ESMS_IS_UNICODE, 1),
        },
        fetcher,
      )
    case 'speedsms':
      return new SpeedSmsProvider(
        {
          accessToken: requireEnv(env, 'SPEEDSMS_ACCESS_TOKEN'),
          sender: optionalEnv(env, 'SPEEDSMS_SENDER'),
          smsType: numberFromEnv(env.SPEEDSMS_SMS_TYPE, 2),
        },
        fetcher,
      )
    case 'infobip':
      return new InfobipSMSProvider(
        {
          apiKey: requireEnv(env, 'INFOBIP_API_KEY'),
          baseUrl: optionalEnv(env, 'INFOBIP_BASE_URL'),
          sender: optionalEnv(env, 'INFOBIP_SENDER'),
        },
        fetcher,
      )
    default:
      throw new Error(`Unsupported SMS_PROVIDER: ${name}`)
  }
}

function normalizeProviderName(value: string) {
  return value.split('#')[0]?.trim().toLowerCase() ?? ''
}

function parseProviderList(value: string) {
  return value
    .split(',')
    .map((provider) => normalizeProviderName(provider))
    .filter(Boolean)
}

function requireEnv(env: Record<string, string | undefined>, key: string) {
  const value = env[key]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function optionalEnv(env: Record<string, string | undefined>, key: string) {
  return env[key]?.trim() || undefined
}

function numberFromEnv(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

async function readJson(res: Response) {
  return res.json().catch(() => null)
}

function toInfobipPhone(phone: string) {
  const normalized = phone.trim().replace(/\s+/g, '')
  if (normalized.startsWith('+')) return normalized.slice(1)
  if (normalized.startsWith('0')) return `84${normalized.slice(1)}`
  return normalized
}
