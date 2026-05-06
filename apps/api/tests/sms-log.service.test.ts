import { describe, expect, test } from 'bun:test'
import { buildEsmsCallbackUpdate, normalizeSmsLogStatus } from '../src/services/sms-log.service'

describe('SMS log service', () => {
  test('maps eSMS callback payload to final delivered status', () => {
    const payload = {
      SMSID: 'sms-1',
      RequestId: 'req-1',
      SendStatus: '5',
      CodeResult: '100',
      ErrorMessage: '',
    }

    const update = buildEsmsCallbackUpdate(payload)

    expect(update).toMatchObject({
      smsId: 'sms-1',
      requestId: 'req-1',
      sendStatus: '5',
      codeResult: '100',
      errorMessage: '',
      status: 'delivered',
      callbackPayload: payload,
    })
    expect(update.callbackReceivedAt).toBeInstanceOf(Date)
  })

  test('normalizes failed eSMS callback status codes defensively', () => {
    expect(normalizeSmsLogStatus({ SendStatus: '1' })).toBe('failed')
    expect(normalizeSmsLogStatus({ Status: 'DELIVERED' })).toBe('delivered')
    expect(normalizeSmsLogStatus({ Status: 'UNDELIVERED' })).toBe('undelivered')
    expect(normalizeSmsLogStatus({ SendStatus: 'unexpected' })).toBe('unknown')
  })
})
