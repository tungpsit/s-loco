import SwiftUI

struct OrdersView: View {
    @EnvironmentObject private var state: AppState
    private let filters: [(String?, String)] = [
        (nil, "Tất cả"),
        ("paid", "Chờ đổi"),
        ("redeemed", "Đã đổi"),
        ("completed", "Hoàn thành"),
    ]

    var body: some View {
        NavigationStack {
            List {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(filters, id: \.1) { status, label in
                            Button(label) {
                                Task { await state.refreshOrders(status: status) }
                            }
                            .buttonStyle(.bordered)
                            .disabled(state.isLoading)
                        }
                    }
                }
                .listRowBackground(Color.clear)

                ForEach(state.vouchers) { voucher in
                    VoucherRow(voucher: voucher)
                }
            }
            .navigationTitle("Đơn hàng")
            .refreshable { await state.refreshOrders() }
            .scrollContentBackground(.hidden)
            .background(VendorTheme.surface)
        }
    }
}
