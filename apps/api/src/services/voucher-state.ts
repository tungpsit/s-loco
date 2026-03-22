// ─── Voucher State Machine ─────────────────────────────
// Valid transitions map: from → [allowed targets]


const TRANSITIONS: Record<string, string[]> = {
  created:   ['paid', 'cancelled'],
  paid:      ['redeemed', 'refunded', 'expired'],
  redeemed:  ['completed'],
  completed: ['settled'],
  settled:   [],
  refunded:  [],
  expired:   [],
  cancelled: [],
}

export function canTransition(from: string, to: string): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new StateError(
      'INVALID_TRANSITION',
      `Không thể chuyển trạng thái voucher từ "${from}" sang "${to}".`,
    )
  }
}

export class StateError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'StateError'
  }
}
