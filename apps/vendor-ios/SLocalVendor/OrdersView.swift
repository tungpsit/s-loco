import SwiftUI

struct OrdersView: View {
    @EnvironmentObject private var state: AppState
    private let filters: [(String?, String)] = [
        (nil, "Tất cả"),
        ("paid", "Chờ đổi"),
        ("redeemed", "Đã đổi"),
        ("completed", "Hoàn thành"),
    ]
    private let reservationFilters: [(String?, String)] = [
        (nil, "Tất cả"),
        ("requested", "Chờ gọi"),
        ("voucher_issued", "Đã có mã"),
        ("used", "Đã dùng"),
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

                Section("Đặt chỗ nhà hàng") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack {
                            ForEach(reservationFilters, id: \.1) { status, label in
                                Button(label) {
                                    Task { await state.refreshReservations(status: status) }
                                }
                                .buttonStyle(.bordered)
                                .disabled(state.isLoading)
                            }
                        }
                    }
                    .listRowBackground(Color.clear)

                    ForEach(state.reservations) { reservation in
                        NavigationLink {
                            ReservationDetailView(item: reservation)
                        } label: {
                            ReservationRow(item: reservation)
                        }
                    }
                }
            }
            .navigationTitle("Đơn hàng")
            .refreshable {
                await state.refreshOrders()
                await state.refreshReservations()
            }
            .task {
                await state.refreshReservations()
            }
            .scrollContentBackground(.hidden)
            .vendorReadableContent()
            .background(VendorTheme.surface)
        }
    }
}
