export default function OrdersPage() {
  const orders = [
    { id: 'ORD-001', customer: 'Nguyễn Văn A', amount: '350,000₫', status: 'paid', items: 2, date: '22/03 10:30' },
    { id: 'ORD-002', customer: 'Trần Thị B', amount: '1,200,000₫', status: 'created', items: 5, date: '22/03 09:15' },
    { id: 'ORD-003', customer: 'Lê Văn C', amount: '580,000₫', status: 'paid', items: 3, date: '21/03 16:45' },
    { id: 'ORD-004', customer: 'Phạm Thị D', amount: '200,000₫', status: 'cancelled', items: 1, date: '21/03 14:20' },
    { id: 'ORD-005', customer: 'Hoàng Văn E', amount: '750,000₫', status: 'refunded', items: 4, date: '20/03 11:00' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Quản lý đơn hàng</h1>
          <p className="text-sm text-on-surface-variant mt-1">Tất cả đơn hàng trên nền tảng</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none">
            <option>Tất cả trạng thái</option>
            <option>Đã thanh toán</option>
            <option>Chờ thanh toán</option>
            <option>Đã hủy</option>
            <option>Hoàn tiền</option>
          </select>
          <input
            type="date"
            className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Tổng đơn" value={String(orders.length)} color="text-on-surface" />
        <SummaryCard label="Đã thanh toán" value={String(orders.filter(o => o.status === 'paid').length)} color="text-primary" />
        <SummaryCard label="Chờ TT" value={String(orders.filter(o => o.status === 'created').length)} color="text-tertiary" />
        <SummaryCard label="Đã hủy" value={String(orders.filter(o => o.status === 'cancelled').length)} color="text-error" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/15">
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mã đơn</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Khách hàng</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Số lượng</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tổng tiền</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Ngày</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono font-medium text-primary">{o.id}</td>
                <td className="px-6 py-4 text-sm text-on-surface">{o.customer}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{o.items} dịch vụ</td>
                <td className="px-6 py-4 text-sm font-medium text-on-surface">{o.amount}</td>
                <td className="px-6 py-4"><OrderStatus status={o.status} /></td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{o.date}</td>
                <td className="px-6 py-4 text-right">
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface-variant hover:bg-surface-highest transition-colors">
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 text-center">
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-xs text-on-surface-variant mt-1">{label}</p>
    </div>
  )
}

function OrderStatus({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Đã TT', cls: 'bg-primary-fixed/30 text-primary' },
    created: { label: 'Chờ TT', cls: 'bg-tertiary-fixed/50 text-tertiary' },
    cancelled: { label: 'Đã hủy', cls: 'bg-error/10 text-error' },
    refunded: { label: 'Hoàn tiền', cls: 'bg-outline-variant/20 text-outline' },
  }
  const s = map[status] || { label: status, cls: '' }
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}
