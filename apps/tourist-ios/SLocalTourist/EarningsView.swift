import SwiftUI

struct EarningsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            Group {
                if state.isAuthenticated {
                    voucherList
                } else {
                    loggedOutState
                }
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("Vé của tôi")
            .toolbar {
                if state.isAuthenticated {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            Task { await state.loadVouchers() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
            }
        }
    }

    private var voucherList: some View {
        List {
            ForEach(state.vouchers) { voucher in
                Button {
                    state.route = .voucher(voucher)
                } label: {
                    VoucherRow(voucher: voucher)
                }
                .buttonStyle(.plain)
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .refreshable { await state.loadVouchers() }
        .overlay {
            if state.vouchers.isEmpty {
                EmptyState(icon: "ticket", title: "Chưa có vé", message: "Vé đã mua sẽ xuất hiện ở đây để quét QR khi sử dụng.")
            }
        }
    }

    private var loggedOutState: some View {
        EmptyState(icon: "person.crop.circle.badge.exclamationmark", title: "Đăng nhập để xem vé", message: "Xác thực bằng OTP để quản lý voucher và lịch sử đặt dịch vụ.")
            .safeAreaInset(edge: .bottom) {
                Button {
                    state.route = .login(redirect: nil)
                } label: {
                    Text("Đăng nhập")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .padding(16)
            }
    }
}

struct VoucherRow: View {
    let voucher: Voucher

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 14)
                .fill(TouristTheme.primarySoft)
                .frame(width: 58, height: 58)
                .overlay(Image(systemName: "qrcode").font(.title2).foregroundStyle(TouristTheme.primary))
            VStack(alignment: .leading, spacing: 5) {
                Text(voucher.serviceName ?? "Voucher S-Loco")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TouristTheme.text)
                    .lineLimit(2)
                Text(voucher.vendorName ?? voucher.status.capitalized)
                    .font(.caption)
                    .foregroundStyle(TouristTheme.muted)
                if let amount = voucher.totalAmount {
                    Text(amount.vnd)
                        .font(.caption.bold())
                        .foregroundStyle(TouristTheme.primary)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(TouristTheme.muted)
        }
        .padding(12)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
    }
}

struct EmptyState: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.system(size: 42))
                .foregroundStyle(TouristTheme.primary)
            Text(title)
                .font(.headline)
                .foregroundStyle(TouristTheme.text)
            Text(message)
                .font(.subheadline)
                .multilineTextAlignment(.center)
                .foregroundStyle(TouristTheme.muted)
                .padding(.horizontal, 28)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
