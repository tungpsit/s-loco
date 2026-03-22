export default function VendorsPage() {
  const vendors = [
    { id: '1', name: 'Nhà hàng Biển Xanh', status: 'pending', category: 'Ẩm thực', created: '22/03/2026' },
    { id: '2', name: 'Spa Sầm Sơn Wellness', status: 'active', category: 'Spa & Massage', created: '21/03/2026' },
    { id: '3', name: 'Xe điện Thanh Hóa', status: 'active', category: 'Vận chuyển', created: '20/03/2026' },
    { id: '4', name: 'Khách sạn Ocean View', status: 'suspended', category: 'Lưu trú', created: '19/03/2026' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Quản lý Vendor</h1>
          <p className="text-sm text-on-surface-variant mt-1">Duyệt, quản lý và giám sát vendor</p>
        </div>
        <div className="flex gap-3">
          <select className="bg-surface-high rounded-xl px-4 py-2.5 text-sm text-on-surface border-none outline-none">
            <option>Tất cả trạng thái</option>
            <option>Chờ duyệt</option>
            <option>Đang hoạt động</option>
            <option>Tạm dừng</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-on-surface">{vendors.length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Tổng Vendor</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">{vendors.filter(v => v.status === 'active').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Đang hoạt động</p>
        </div>
        <div className="bg-white rounded-xl p-4 text-center">
          <p className="text-2xl font-display font-bold text-tertiary">{vendors.filter(v => v.status === 'pending').length}</p>
          <p className="text-xs text-on-surface-variant mt-1">Chờ duyệt</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/15">
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Vendor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Danh mục</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Ngày tạo</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id} className="border-b border-outline-variant/10 hover:bg-surface-low/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium text-on-surface text-sm">{v.name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-on-surface-variant">{v.category}</span>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={v.status} />
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{v.created}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {v.status === 'pending' && (
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">
                        Duyệt
                      </button>
                    )}
                    {v.status === 'active' && (
                      <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-error text-white hover:opacity-90 transition-opacity">
                        Tạm dừng
                      </button>
                    )}
                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-high text-on-surface-variant hover:bg-surface-highest transition-colors">
                      Chi tiết
                    </button>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-primary-fixed/30 text-primary',
    pending: 'bg-tertiary-fixed/50 text-tertiary',
    suspended: 'bg-error/10 text-error',
  }
  const labels: Record<string, string> = {
    active: 'Hoạt động', pending: 'Chờ duyệt', suspended: 'Tạm dừng',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  )
}
