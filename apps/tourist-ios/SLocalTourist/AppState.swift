import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var tab: AppTab = .home
    @Published var route: AppRoute?
    @Published var services: [TouristService] = []
    @Published var searchServices: [TouristService] = []
    @Published var vendors: [Vendor] = []
    @Published var vouchers: [Voucher] = []
    @Published var reservations: [Reservation] = []
    @Published var selectedCategory = ""
    @Published var user: TouristUser?
    @Published var currentOrder: Order?
    @Published var itinerary: GeneratedItinerary?
    @Published var weather: TouristWeather?
    @Published var loadingTask: AppLoadingTask?
    @Published var message: String?

    private let tokenStore = TokenStore()
    private lazy var api = APIClient(tokenStore: tokenStore)
    private var tokenRefreshTask: Task<Void, Never>?

    var isAuthenticated: Bool {
        tokenStore.accessToken?.isEmpty == false || tokenStore.refreshToken?.isEmpty == false
    }
    var isLoading: Bool { loadingTask != nil }
    var loadingMessage: String { loadingTask?.message ?? "" }

    func bootstrap() async {
        startTokenRefreshLoop()
        if isAuthenticated {
            do {
                try await api.refreshAccessTokenIfNeeded()
            } catch {
                expireSession(showMessage: false)
            }
        }
        await refreshHome()
        await loadWeather()
        if isAuthenticated {
            await loadVouchers()
            await loadReservations()
        }
    }

    func refreshHome() async {
        await run(.home) {
            services = try await api.services(category: selectedCategory)
            searchServices = services
            vendors = try await api.vendors()
        }
    }

    func search(query: String, category: String) async {
        await run(.home) {
            searchServices = try await api.services(query: query, category: category)
            vendors = try await api.vendors(query: query, category: category)
        }
    }

    func sendOtp(phone: String, redirect: AppRoute? = nil) async {
        await run(.login) {
            try await api.sendOtp(phone: phone.trimmingCharacters(in: .whitespacesAndNewlines))
            route = .otp(phone: phone, redirect: redirect)
        }
    }

    func verifyOtp(phone: String, code: String, redirect: AppRoute? = nil) async {
        await run(.login) {
            let login = try await api.verifyOtp(phone: phone, code: code)
            user = login.user
            startTokenRefreshLoop()
            await loadVouchers()
            await loadReservations()
            route = redirect
        }
    }

    func verifyOtpFromOtpScreen(phone: String, code: String, redirect: AppRoute? = nil) async -> String? {
        loadingTask = .login
        defer { loadingTask = nil }

        do {
            let login = try await api.verifyOtp(phone: phone, code: code)
            user = login.user
            startTokenRefreshLoop()
            await loadVouchers()
            await loadReservations()
            route = redirect
            return nil
        } catch {
            return "Mã OTP không đúng. Vui lòng kiểm tra và nhập lại."
        }
    }

    func resendOtpFromOtpScreen(phone: String) async -> String? {
        loadingTask = .login
        defer { loadingTask = nil }

        do {
            try await api.sendOtp(phone: phone.trimmingCharacters(in: .whitespacesAndNewlines))
            return nil
        } catch {
            return error.localizedDescription
        }
    }

    func createOrder(service: TouristService, quantity: Int) async {
        guard isAuthenticated else {
            route = .login(redirect: .service(service))
            return
        }
        await run(.checkout) {
            currentOrder = try await api.createOrder(serviceId: service.id, quantity: quantity)
            if let order = currentOrder { route = .checkout(order.id) }
        }
    }

    func createReservation(service: TouristService, partySize: Int, requestedTime: String, note: String) async {
        guard isAuthenticated else {
            route = .login(redirect: .service(service))
            return
        }
        await run(.checkout) {
            var reservation = try await api.createReservation(
                serviceId: service.id,
                partySize: partySize,
                requestedTime: requestedTime,
                note: note
            )
            reservation.serviceName = service.name
            reservation.vendorName = service.vendorName
            reservations.insert(reservation, at: 0)
            route = .reservation(reservation)
        }
    }

    func loadOrder(_ id: String) async {
        await run(.checkout) {
            currentOrder = try await api.order(id: id)
        }
    }

    func loadVouchers(status: String? = nil) async {
        await run(.vouchers) {
            vouchers = try await api.vouchers(status: status)
        }
    }

    func loadReservations(status: String? = nil) async {
        await run(.vouchers) {
            reservations = try await api.reservations(status: status)
        }
    }

    func createItinerary(
        days: Int,
        budget: Int,
        preferences: String,
        groupType: String = "couple",
        stayLocationLabel: String? = nil,
        stayLatitude: Double? = nil,
        stayLongitude: Double? = nil,
        preferNearStay: Bool = false
    ) async {
        await run(.ai) {
            itinerary = try await api.itinerary(
                days: days,
                budget: budget,
                preferences: preferences,
                groupType: groupType,
                stayLocationLabel: stayLocationLabel,
                stayLatitude: stayLatitude,
                stayLongitude: stayLongitude,
                preferNearStay: preferNearStay
            )
        }
    }

    func loadWeather() async {
        await run(.weather) {
            weather = try await api.weather()
        }
    }

    func openServiceFromItinerary(_ serviceId: String) async {
        if let service = services.first(where: { $0.id == serviceId })
            ?? searchServices.first(where: { $0.id == serviceId }) {
            route = .service(service)
            return
        }

        await run(.home) {
            let service = try await api.service(id: serviceId)
            route = .service(service)
        }
    }

    func logout() {
        tokenRefreshTask?.cancel()
        tokenRefreshTask = nil
        tokenStore.clear()
        user = nil
        vouchers = []
        reservations = []
        route = nil
        tab = .home
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
        vouchers = []
        reservations = []
        currentOrder = nil
        route = nil
        tab = .home
        if showMessage {
            message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        }
    }

    func registerPushNotifications() async {
        guard isAuthenticated else { return }
        guard let token = await PushNotificationManager.shared.requestAuthorizationAndToken() else { return }
        do {
            try await api.registerPushToken(token)
        } catch {
            print("Failed to register push token: \(error.localizedDescription)")
        }
    }

    private func run(_ task: AppLoadingTask, _ operation: () async throws -> Void) async {
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

enum AppTab: String, CaseIterable, Identifiable {
    case home = "Trang chủ"
    case browse = "Tìm kiếm"
    case vouchers = "Vé của tôi"
    case ai = "AI"
    case profile = "Tài khoản"

    var id: String { rawValue }
    var icon: String {
        switch self {
        case .home: "house"
        case .browse: "magnifyingglass"
        case .vouchers: "ticket"
        case .ai: "sparkles"
        case .profile: "person"
        }
    }
}

indirect enum AppRoute: Identifiable {
    case service(TouristService)
    case vendor(Vendor)
    case checkout(String)
    case voucher(Voucher)
    case reservation(Reservation)
    case weather
    case login(redirect: AppRoute?)
    case otp(phone: String, redirect: AppRoute?)

    var id: String {
        switch self {
        case .service(let service): "service-\(service.id)"
        case .vendor(let vendor): "vendor-\(vendor.id)"
        case .checkout(let id): "checkout-\(id)"
        case .voucher(let voucher): "voucher-\(voucher.id)"
        case .reservation(let reservation): "reservation-\(reservation.id)"
        case .weather: "weather"
        case .login: "login"
        case .otp(let phone, _): "otp-\(phone)"
        }
    }
}

enum AppLoadingTask {
    case home, login, checkout, vouchers, ai, weather
    var message: String {
        switch self {
        case .home: "Đang tải dữ liệu..."
        case .login: "Đang đăng nhập..."
        case .checkout: "Đang xử lý đơn hàng..."
        case .vouchers: "Đang tải voucher..."
        case .ai: "Đang tạo lịch trình..."
        case .weather: "Đang tải thời tiết..."
        }
    }
}
