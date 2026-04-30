import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published private(set) var user: VendorUser?
    @Published private(set) var vendor: VendorProfile?
    @Published private(set) var dashboard: Dashboard?
    @Published private(set) var vouchers: [Voucher] = []
    @Published private(set) var settlements: [Settlement] = []
    @Published private(set) var reservations: [ReservationWire] = []
    @Published private(set) var qrPreview: VoucherPreview?
    @Published private(set) var redeemedVoucher: Voucher?
    @Published var selectedTab: AppTab = .dashboard
    @Published private(set) var loadingTask: AppLoadingTask?
    @Published var message: String?

    private let tokenStore = TokenStore()
    private lazy var api = APIClient(tokenStore: tokenStore)
    private var tokenRefreshTask: Task<Void, Never>?

    var isAuthenticated: Bool {
        tokenStore.accessToken?.isEmpty == false || tokenStore.refreshToken?.isEmpty == false
    }

    var isLoading: Bool {
        loadingTask != nil
    }

    var loadingMessage: String {
        loadingTask?.message ?? ""
    }

    func bootstrap() async {
        guard isAuthenticated else { return }
        startTokenRefreshLoop()
        do {
            try await api.refreshAccessTokenIfNeeded()
        } catch {
            expireSession(showMessage: false)
            return
        }
        await registerPushNotifications()
        await refreshHome()
    }

    func login(email: String, password: String) async {
        await runLoading(.login) {
            let login = try await api.login(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
            user = login.user
            startTokenRefreshLoop()
            vendor = try await api.vendorProfile()
            await registerPushNotifications()
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

    func refreshReservations(status: String? = nil) async {
        await runLoading(.reservations) {
            reservations = try await api.reservations(status: status)
        }
    }

    func confirmReservation(_ id: String) async {
        await runLoading(.reservationAction) {
            _ = try await api.confirmReservation(id)
            reservations = try await api.reservations()
            message = "Đã xác nhận và phát hành voucher iPos."
        }
    }

    func rejectReservation(_ id: String) async {
        await runLoading(.reservationAction) {
            _ = try await api.rejectReservation(id)
            reservations = try await api.reservations()
            message = "Đã từ chối đặt chỗ."
        }
    }

    func retryReservationVoucher(_ id: String) async {
        await runLoading(.reservationAction) {
            _ = try await api.retryReservationVoucher(id)
            reservations = try await api.reservations()
            message = "Đã thử phát hành lại voucher iPos."
        }
    }

    func updateIposStoreId(_ value: String) async {
        await runLoading(.settings) {
            guard let currentVendor = vendor else {
                throw ClientError.message("Chưa tải thông tin cửa hàng.")
            }
            vendor = try await api.updateIposStoreId(
                vendorId: currentVendor.id,
                value: value.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            message = "Đã lưu iPos store ID."
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
        tokenRefreshTask?.cancel()
        tokenRefreshTask = nil
        tokenStore.clear()
        user = nil
        vendor = nil
        dashboard = nil
        vouchers = []
        settlements = []
        reservations = []
        qrPreview = nil
        redeemedVoucher = nil
        selectedTab = .dashboard
    }

    private func startTokenRefreshLoop() {
        guard tokenRefreshTask == nil else { return }
        tokenRefreshTask = Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 60 * 1_000_000_000)
                await self?.refreshSessionIfNeeded()
            }
        }
    }

    private func refreshSessionIfNeeded() async {
        guard isAuthenticated else { return }
        do {
            try await api.refreshAccessTokenIfNeeded()
        } catch {
            expireSession(showMessage: true)
        }
    }

    private func expireSession(showMessage: Bool) {
        tokenRefreshTask?.cancel()
        tokenRefreshTask = nil
        tokenStore.clear()
        user = nil
        vendor = nil
        dashboard = nil
        vouchers = []
        settlements = []
        reservations = []
        qrPreview = nil
        redeemedVoucher = nil
        selectedTab = .dashboard
        if showMessage {
            message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        }
    }

    private func reloadHome() async throws {
        dashboard = try await api.dashboard()
        vouchers = try await api.vouchers()
        settlements = try await api.settlements()
        reservations = try await api.reservations()
    }

    private func registerPushNotifications() async {
        guard isAuthenticated else { return }
        guard let token = await PushNotificationManager.shared.requestAuthorizationAndToken() else { return }
        do {
            try await api.registerPushToken(token)
        } catch {
            print("Failed to register push token: \(error.localizedDescription)")
        }
    }

    private func runLoading(_ task: AppLoadingTask, _ operation: () async throws -> Void) async {
        loadingTask = task
        defer { loadingTask = nil }
        do {
            try await operation()
        } catch {
            if case ClientError.sessionExpired = error {
                expireSession(showMessage: true)
            } else {
                message = error.localizedDescription
            }
        }
    }
}

enum AppLoadingTask {
    case login
    case home
    case orders
    case redeemQr
    case completeVoucher
    case reservations
    case reservationAction
    case settings

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
        case .reservations:
            "Đang tải đặt chỗ..."
        case .reservationAction:
            "Đang xử lý đặt chỗ..."
        case .settings:
            "Đang lưu cài đặt..."
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
