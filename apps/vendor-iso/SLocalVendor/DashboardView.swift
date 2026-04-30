import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 12) {
                        StatTile(title: "Đơn hôm nay", value: "\(state.dashboard?.today.orders ?? 0)", color: VendorTheme.primary)
                        StatTile(title: "Doanh thu", value: formatVnd(state.dashboard?.today.revenue), color: VendorTheme.primaryContainer)
                    }
                    StatTile(title: "Chờ giải ngân", value: formatVnd(state.dashboard?.settlement.pending), color: VendorTheme.warning)
                }
                Section("Voucher gần đây") {
                    ForEach(state.dashboard?.recentOrders ?? Array(state.vouchers.prefix(5))) { voucher in
                        VoucherRow(voucher: voucher)
                    }
                }
            }
            .navigationTitle(state.vendor?.name ?? "Trang chủ")
            .refreshable { await state.refreshHome() }
            .scrollContentBackground(.hidden)
            .background(VendorTheme.surface)
        }
    }
}

struct StatTile: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(.white.opacity(0.75))
            Text(value).font(.title3.weight(.bold)).foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(color)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .listRowBackground(Color.clear)
    }
}

struct VoucherRow: View {
    let voucher: Voucher

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(voucher.serviceName ?? voucher.id).font(.headline)
            Text("\(voucher.customerName ?? "Khách hàng") · \(voucher.status) · \(formatVnd(voucher.finalAmount))")
                .font(.subheadline)
                .foregroundStyle(VendorTheme.secondaryText)
        }
        .padding(.vertical, 4)
    }
}
