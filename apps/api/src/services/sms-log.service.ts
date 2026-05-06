import { smsLogs, type smsLogStatusEnum } from '@S-Loco/db/schema'
import { and, eq, or } from 'drizzle-orm'
import { getDb } from '../db'

type SmsLogStatus = typeof smsLogStatusEnum.enumValues[number]
type JsonRecord = Record<string, unknown>

export interface SmsSendLogInput {
  provider: string
  purpose?: string
  phone: string
  content: string
  requestId?: string
  smsId?: string
  status: SmsLogStatus
  codeResult?: string
  errorMessage?: string
  sendStatus?: string
  requestPayload?: JsonRecord
  responsePayload?: JsonRecord
}

export interface EsmsCallbackUpdate {
  smsId?: string
  requestId?: string
  status: SmsLogStatus
  codeResult?: string
  errorMessage?: string
  sendStatus?: string
  callbackPayload: JsonRecord
  callbackReceivedAt: Date
}

export async function createSmsLog(input: SmsSendLogInput) {
  const db = getDb()
  const [log] = await db.insert(smsLogs).values({
    provider: input.provider,
    purpose: input.purpose ?? 'otp',
    phone: input.phone,
    content: input.content,
    requestId: input.requestId,
    smsId: input.smsId,
    status: input.status,
    codeResult: input.codeResult,
    errorMessage: input.errorMessage,
    sendStatus: input.sendStatus,
    requestPayload: input.requestPayload,
    responsePayload: input.responsePayload,
    sentAt: new Date(),
    updatedAt: new Date(),
  }).returning()
  return log
}

export function buildEsmsCallbackUpdate(payload: JsonRecord): EsmsCallbackUpdate {
  return {
    smsId: pickString(payload, ['SMSID', 'SmsId', 'smsid', 'sms_id']),
    requestId: pickString(payload, ['RequestId', 'requestId', 'request_id']),
    sendStatus: pickString(payload, ['SendStatus', 'sendStatus', 'send_status', 'Status', 'status']),
    codeResult: pickString(payload, ['CodeResult', 'codeResult', 'code_result']),
    errorMessage: pickString(payload, ['ErrorMessage', 'errorMessage', 'error_message', 'Message', 'message']),
    status: normalizeSmsLogStatus(payload),
    callbackPayload: payload,
    callbackReceivedAt: new Date(),
  }
}

export async function processEsmsCallback(payload: JsonRecord) {
  const update = buildEsmsCallbackUpdate(payload)
  const db = getDb()
  const filters = []
  if (update.smsId) filters.push(eq(smsLogs.smsId, update.smsId))
  if (update.requestId) filters.push(eq(smsLogs.requestId, update.requestId))

  if (filters.length === 0) {
    const [log] = await db.insert(smsLogs).values({
      provider: 'esms',
      purpose: 'unknown',
      phone: pickString(payload, ['Phone', 'phone']) ?? 'unknown',
      content: '',
      smsId: update.smsId,
      requestId: update.requestId,
      status: update.status,
      codeResult: update.codeResult,
      errorMessage: update.errorMessage,
      sendStatus: update.sendStatus,
      callbackPayload: update.callbackPayload,
      callbackReceivedAt: update.callbackReceivedAt,
      updatedAt: new Date(),
    }).returning()
    return { matched: false, log }
  }

  const where = filters.length === 1 ? filters[0]! : or(...filters)
  const [log] = await db.update(smsLogs).set({
    status: update.status,
    smsId: update.smsId,
    requestId: update.requestId,
    codeResult: update.codeResult,
    errorMessage: update.errorMessage,
    sendStatus: update.sendStatus,
    callbackPayload: update.callbackPayload,
    callbackReceivedAt: update.callbackReceivedAt,
    updatedAt: new Date(),
  }).where(and(where)).returning()

  if (log) return { matched: true, log }

  const [created] = await db.insert(smsLogs).values({
    provider: 'esms',
    purpose: 'unknown',
    phone: pickString(payload, ['Phone', 'phone']) ?? 'unknown',
    content: '',
    smsId: update.smsId,
    requestId: update.requestId,
    status: update.status,
    codeResult: update.codeResult,
    errorMessage: update.errorMessage,
    sendStatus: update.sendStatus,
    callbackPayload: update.callbackPayload,
    callbackReceivedAt: update.callbackReceivedAt,
    updatedAt: new Date(),
  }).returning()
  return { matched: false, log: created }
}

export function normalizeSmsLogStatus(payload: JsonRecord): SmsLogStatus {
  const raw = pickString(payload, ['SendStatus', 'sendStatus', 'send_status', 'Status', 'status'])
  const normalized = raw?.trim().toLowerCase()
  if (!normalized) return 'unknown'
  if (['5', 'delivered', 'success', 'sent', 'done'].includes(normalized)) return 'delivered'
  if (['6', 'undelivered', 'not_delivered', 'expired'].includes(normalized)) return 'undelivered'
  if (['0', '1', '2', '3', '4', 'failed', 'fail', 'error', 'rejected'].includes(normalized)) return 'failed'
  return 'unknown'
}

function pickString(payload: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (value !== undefined && value !== null) return String(value)
  }
  return undefined
}
