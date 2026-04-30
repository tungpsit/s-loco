import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published private(set) var user: VendorUser?
    @Published private(set) var vendor: VendorProfile?
    @Published private(set) var dashboard: Dashboard?
    @Published private(set) var vouchers: [Voucher] = []
    @Published private(set) var settlements: [Settlement] = []
    @Published private(set) var qrPreview: VoucherPreview?
    @Published private(set) var redeemedVoucher: Voucher?
    @Published var selectedTab: AppTab = .dashboard
    @Published private(set) var loadingTask: AppLoadingTask?
    @Published var message: String?

    private let tokenStore = TokenStore()
    private lazy var api = APIClient(tokenStore: tokenStore)

    var isAuthenticated: Bool {
        tokenStore.accessToken?.isEmpty == false
    }

    var isLoading: Bool {
        loadingTask != nil
    }

    var loadingMessage: String {
        loadingTask?.message ?? ""
    }

    func bootstrap() async {
        guard isAuthenticated else { return }
        await refreshHome()
    }

    func login(email: String, password: String) async {
        await runLoading(.login) {
            let login = try await api.login(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
            user = login.user
            vendor = try await api.vendorProfile()
            try await reloadHome()
        }
    }

    func refreshHome() async {
        await runLoading(.home) {
            try await reloadHome()
        }
    }

    func refreshOrders(status: String? = nil) async {
        await runLoading(.orders) {
            vouchers = try await api.vouchers(status: status)
        }
    }

    func redeemQr(_ token: String) async {
        await runLoading(.redeemQr) {
            let value = token.trimmingCharacters(in: .whitespacesAndNewlines)
            let preview = try await api.verifyQr(value)
            guard preview.canRedeem else {
                throw ClientError.message("Voucher trạng thái \(preview.status), không thể đổi.")
            }
            qrPreview = preview
            redeemedVoucher = try await api.redeemQr(value)
            vouchers = try await api.vouchers()
        }
    }

    func completeRedeemedVoucher() async {
        guard let voucher = redeemedVoucher else { return }
        await runLoading(.completeVoucher) {
            redeemedVoucher = try await api.completeVoucher(voucher.id)
            vouchers = try await api.vouchers()
        }
    }

    func logout() {
        tokenStore.clear()
        user = nil
        vendor = nil
        dashboard = nil
        vouchers = []
        settlements = []
        qrPreview = nil
        redeemedVoucher = nil
        selectedTab = .dashboard
    }

    private func reloadHome() async throws {
        dashboard = try await api.dashboard()
        vouchers = try await api.vouchers()
        settlements = try await api.settlements()
    }

    private func runLoading(_ task: AppLoadingTask, _ operation: () async throws -> Void) async {
        loadingTask = task
        defer { loadingTask = nil }
        do {
            try await operation()
        } catch {
            message = error.localizedDescription
        }
    }
}

enum AppLoadingTask {
    case login
    case home
    case orders
    case redeemQr
    case completeVoucher

    var message: String {
        switch self {
        case .login:
            "Đang đăng nhập..."
        case .home:
            "Đang tải dữ liệu cửa hàng..."
        case .orders:
            "Đang tải đơn hàng..."
        case .redeemQr:
            "Đang xác thực voucher..."
        case .completeVoucher:
            "Đang hoàn thành voucher..."
        }
    }
}

enum AppTab: String, CaseIterable, Identifiable {
    case dashboard = "Trang chủ"
    case scan = "Quét QR"
    case orders = "Đơn hàng"
    case earnings = "Thu nhập"
    case settings = "Cài đặt"

    var id: String { rawValue }
}
