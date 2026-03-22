export default function SettlementsPage() {
  const settlements = [
    { id: 'STL-001', vendor: 'Nhà hàng Biển Xanh', total: '2,500,000₫', commission: '200,000₫', net: '2,300,000₫', vouchers: 12, status: 'pending', period: '19/03 – 22/03' },
    { id: 'STL-002', vendor: 'Spa Sầm Sơn', total: '1,800,000₫', commission: '144,000₫', net: '1,656,000₫', vouchers: 8, status: 'approved', period: '16/03 – 19/03' },
    { id: 'STL-003', vendor: 'Xe điện Thanh Hóa', total: '960,000₫', commission: '76,800₫', net: '883,200₫', vouchers: 24, status: 'disbursed', period: '13/03 – 16/03' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Quản lý thanh toán</h1>
          <p className="text-sm text-on-surface-variant mt-1">Duyệt và giải ngân cho vendor — hoa hồng 8%</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 text-sm font-medium rounded-full bg-gradient-to-br from-primary to-primary-container text-white hover:opacity-90 transition-opacity">
            Chạy batch thanh toán
          </button>
          <button className="px-5 py-2.5 text-sm font-medium rounded-full bg-surface-high text-primary hover:bg-surface-highest transition-colors">
            Báo cáo đối soát
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-on-surface">5,260,000₫</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng giá trị</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">420,800₫</p>
          <p className="text-xs text-on-surface-variant mt-1">Hoa hồng (8%)</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-tertiary">1</p>
          <p className="text-xs text-on-surface-variant mt-1">Chờ duyệt</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">883,200₫</p>
          <p className="text-xs text-on-surface-variant mt-1">Đã giải ngân</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/15">
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mã</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vendor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Kỳ</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tổng</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Hoa hồng</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thực nhận</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Voucher</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map(s => (
              <tr key={s.id} className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono font-medium text-primary">{s.id}</td>
                <td className="px-6 py-4 text-sm text-on-surface">{s.vendor}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{s.period}</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-on-surface">{s.total}</td>
                <td className="px-6 py-4 text-sm text-right text-error">{s.commission}</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-primary">{s.net}</td>
                <td className="px-6 py-4 text-sm text-center text-on-surface-variant">{s.vouchers}</td>
                <td className="px-6 py-4"><SettlementStatus status={s.status} /></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {s.status === 'pending' && (
                      <>
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90">Duyệt</button>
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-error/10 text-error hover:bg-error/20">Từ chối</button>
                      </>
                    )}
                    {s.status === 'approved' && (
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90">Giải ngân</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function SettlementStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Chờ duyệt', cls: 'bg-tertiary-fixed/50 text-tertiary' },
    approved: { label: 'Đã duyệt', cls: 'bg-primary-fixed/30 text-primary' },
    disbursed: { label: 'Đã giải ngân', cls: 'bg-secondary-container/50 text-secondary' },
    rejected: { label: 'Từ chối', cls: 'bg-error/10 text-error' },
  }
  const s = map[status] || { label: status, cls: '' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}
