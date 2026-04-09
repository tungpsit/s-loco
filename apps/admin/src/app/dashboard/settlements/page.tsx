'use client'

import { settlementApi } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/* ── helpers ────────────────────────────────────────── */
const fmt = (n?: number | string) => {
  if (n == null || n === '' || Number.isNaN(Number(n))) return '0₫'
  return Number(n).toLocaleString('vi-VN') + '₫'
}

const shortId = (id?: string) => id ? id.slice(0, 8).toUpperCase() : '—'

/** API returns { settlement, vendor } objects — normalise */
function normalise(raw: any[]): any[] {
  return raw.map((r) => {
    if (r.settlement) {
      return { ...r.settlement, vendorName: r.vendor?.name || 'Không rõ' }
    }
    return r
  })
}

/* ── icons (inline SVG) ─────────────────────────────── */
const Icons = {
  wallet: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6m0 6v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
}

/* ── page ────────────────────────────────────────────── */
export default function SettlementsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settlements'],
    queryFn: () => settlementApi.list(),
  })

  const approveMut = useMutation({
    mutationFn: settlementApi.approve,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })
  const disburseMut = useMutation({
    mutationFn: settlementApi.disburse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })
  const rejectMut = useMutation({
    mutationFn: (id: string) => settlementApi.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })
  const batchMut = useMutation({
    mutationFn: settlementApi.runBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
  })

  const rawItems: any[] = data?.data?.items || data?.data || []
  const settlements = normalise(rawItems)

  const totalValue = settlements.reduce((s, b) => s + Number(b.totalAmount || 0), 0)
  const totalCommission = settlements.reduce((s, b) => s + Number(b.commissionAmount || 0), 0)
  const pending = settlements.filter((s) => s.status === 'pending').length
  const disbursed = settlements.reduce((s, b) => b.status === 'disbursed' ? s + Number(b.netAmount || 0) : s, 0)

  return (
    <>
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-on-surface">Quản lý thanh toán</h1>
          <p className="text-sm text-on-surface-variant mt-1">Duyệt và giải ngân cho vendor · hoa hồng 8%</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => batchMut.mutate()}
            disabled={batchMut.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.97] transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {batchMut.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : Icons.refresh}
            {batchMut.isPending ? 'Đang xử lý…' : 'Chạy batch mới'}
          </button>
          <button
            onClick={async () => {
              const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
              const token = typeof window !== 'undefined' ? localStorage.getItem('sloco_admin_token') : null
              const res = await fetch(API + '/settlements/export', {
                headers: token ? { Authorization: 'Bearer ' + token } : {},
              })
              if (!res.ok) return alert('Xuất báo cáo thất bại')
              const blob = await res.blob()
              const cd = res.headers.get('Content-Disposition') || ''
              const match = cd.match(/filename="?([^"]+)"?/)
              const fname = match ? match[1] : 'bao-cao-thanh-toan.csv'
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = fname
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
            disabled={!settlements.length}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-outline-variant/20 bg-white text-on-surface hover:bg-surface-low transition-colors disabled:opacity-40"
          >
            {Icons.download}
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Icons.wallet} label="Tổng giá trị" value={fmt(totalValue)} accent="bg-primary/10 text-primary" />
        <StatCard icon={Icons.chart} label="Hoa hồng (8%)" value={fmt(totalCommission)} accent="bg-tertiary/10 text-tertiary" />
        <StatCard icon={Icons.clock} label="Chờ duyệt" value={String(pending)} accent="bg-amber-100 text-amber-700" />
        <StatCard icon={Icons.check} label="Đã giải ngân" value={fmt(disbursed)} accent="bg-emerald-100 text-emerald-700" />
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-medium text-on-surface-variant">Đang tải dữ liệu…</p>
          </div>
        ) : settlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
            <div className="w-16 h-16 rounded-2xl bg-surface-high flex items-center justify-center">
              {Icons.wallet}
            </div>
            <p className="text-base font-semibold text-on-surface">Chưa có giao dịch</p>
            <p className="text-sm">Nhấn &quot;Chạy batch mới&quot; để tạo đợt thanh toán đầu tiên.</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-low/40">
                    <th className="text-left px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Mã</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Vendor</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Kỳ</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Tổng</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Hoa hồng</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Thực nhận</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Voucher</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Trạng thái</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {settlements.map((s: any) => (
                    <tr key={s.id} className="hover:bg-primary/[0.03] transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-primary whitespace-nowrap">
                        STL-{shortId(s.id)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {(s.vendorName || 'V').charAt(0)}
                          </div>
                          <span className="font-medium text-on-surface">{s.vendorName || 'Vendor'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant text-xs whitespace-nowrap">
                        {s.periodStart ? new Date(s.periodStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—'}
                        {' – '}
                        {s.periodEnd ? new Date(s.periodEnd).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—'}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-on-surface whitespace-nowrap">{fmt(s.totalAmount)}</td>
                      <td className="px-5 py-4 text-right text-error whitespace-nowrap">{fmt(s.commissionAmount)}</td>
                      <td className="px-5 py-4 text-right font-bold text-primary whitespace-nowrap">{fmt(s.netAmount)}</td>
                      <td className="px-5 py-4 text-center text-on-surface-variant">{s.voucherCount ?? '—'}</td>
                      <td className="px-5 py-4"><div className="flex justify-center"><Badge status={s.status} /></div></td>
                      <td className="px-5 py-4">
                        <Actions s={s} approve={approveMut} reject={rejectMut} disburse={disburseMut} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="lg:hidden divide-y divide-outline-variant/5">
              {settlements.map((s: any) => (
                <div key={s.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {(s.vendorName || 'V').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{s.vendorName || 'Vendor'}</p>
                        <p className="text-[11px] font-mono text-on-surface-variant">STL-{shortId(s.id)}</p>
                      </div>
                    </div>
                    <Badge status={s.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 rounded-xl bg-surface-low/50 p-3">
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Tổng</p>
                      <p className="text-xs font-bold text-on-surface mt-0.5">{fmt(s.totalAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Fee</p>
                      <p className="text-xs font-bold text-error mt-0.5">{fmt(s.commissionAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold text-on-surface-variant uppercase">Nhận</p>
                      <p className="text-xs font-bold text-primary mt-0.5">{fmt(s.netAmount)}</p>
                    </div>
                  </div>
                  <Actions s={s} approve={approveMut} reject={rejectMut} disburse={disburseMut} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

/* ── Components ─────────────────────────────────────── */

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-outline-variant/10 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-on-surface-variant truncate">{label}</p>
        <p className="text-xl font-display font-bold text-on-surface mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const m: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'Chờ duyệt',   cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    approved:  { label: 'Đã duyệt',    cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
    disbursed: { label: 'Đã giải ngân', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    rejected:  { label: 'Từ chối',      cls: 'bg-red-50 text-red-700 ring-red-200' },
  }
  const st = m[status] || { label: status, cls: 'bg-gray-50 text-gray-600 ring-gray-200' }
  return <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold ring-1 whitespace-nowrap ${st.cls}`}>{st.label}</span>
}

function Actions({ s, approve, reject, disburse }: { s: any; approve: any; reject: any; disburse: any }) {
  const busy = approve.isPending || reject.isPending || disburse.isPending
  return (
    <div className="flex items-center justify-end gap-2">
      {s.status === 'pending' && (
        <>
          <button onClick={() => approve.mutate(s.id)} disabled={busy} className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors">Duyệt</button>
          <button onClick={() => reject.mutate(s.id)} disabled={busy} className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-error bg-error/5 hover:bg-error/10 disabled:opacity-40 transition-colors">Từ chối</button>
        </>
      )}
      {s.status === 'approved' && (
        <button onClick={() => disburse.mutate(s.id)} disabled={busy} className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors">Giải ngân</button>
      )}
      {s.status === 'disbursed' && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Hoàn tất
        </span>
      )}
    </div>
  )
}
