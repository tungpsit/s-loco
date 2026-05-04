import SwiftUI

struct EarningsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    StatTile(title: "Tổng doanh thu", value: formatVnd(state.dashboard?.total.revenue), color: VendorTheme.primary)
                    HStack(spacing: 12) {
                        StatTile(title: "Đã thanh toán", value: formatVnd(state.dashboard?.settlement.settled), color: VendorTheme.success)
                        StatTile(title: "Chờ giải ngân", value: formatVnd(state.dashboard?.settlement.pending), color: VendorTheme.warning)
                    }
                }
                Section("Lịch sử đối soát") {
                    ForEach(state.settlements) { settlement in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Đối soát \(settlement.status)").font(.headline)
                            Text("\(formatVnd(settlement.netAmount)) · \(settlement.directionLabel) · \(settlement.voucherCount ?? 0) voucher/vé")
                                .font(.subheadline)
                                .foregroundStyle(VendorTheme.secondaryText)
                        }
                    }
                }
            }
            .navigationTitle("Thu nhập")
            .refreshable { await state.refreshHome() }
            .scrollContentBackground(.hidden)
            .background(VendorTheme.surface)
        }
    }
}
