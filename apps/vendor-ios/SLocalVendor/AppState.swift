import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published private(set) var user: VendorUser?
    @Published private(set) var vendor: VendorProfile?
    @Published private(set) var dashboard: Dashboard?
    @Published private(set) var vouchers: [Voucher] = []
    @Published private(set) var settlements: [Settlement] = []
    @Published private(set) var reservations: [ReservationWire] = []
    @Published private(set) var services: [VendorService] = []
    @Published private(set) var serviceCategories: [ServiceCategory] = []
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
            vendor = try await api.vendorProfile()
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

    func refreshServices() async {
        await runLoading(.services) {
            serviceCategories = try await api.serviceCategories()
            let currentVendor = try await currentVendor()
            services = try await api.services(vendorId: currentVendor.id)
        }
    }

    func saveService(
        service: VendorService?,
        name: String,
        categoryId: String,
        description: String,
        productType: String,
        originalPrice: String,
        discountPrice: String,
        reservationDiscountPercent: String,
        durationMinutes: String,
        maxQuantityPerOrder: String,
        imageUrls: String,
        isActive: Bool
    ) async {
        await runLoading(.services) {
            let currentVendor = try await currentVendor()
            let cleanedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
            let cleanedCategoryId = categoryId.trimmingCharacters(in: .whitespacesAndNewlines)
            let isCoupon = productType == productTypeCoupon
            let fulfillmentType = fulfillmentTypeForProductType(productType)
            let cleanedPrice = originalPrice.onlyDigits.isEmpty && isCoupon ? "0" : originalPrice.onlyDigits
            let cleanedDiscount = discountPrice.onlyDigits
            let cleanedReservationDiscount = reservationDiscountPercent.onlyPercent
            guard cleanedName.count >= 2 else { throw ClientError.message("Vui lòng nhập tên dịch vụ.") }
            guard !cleanedCategoryId.isEmpty else { throw ClientError.message("Vui lòng chọn danh mục.") }
            guard !cleanedPrice.isEmpty else { throw ClientError.message(isCoupon ? "Vui lòng nhập giá tham chiếu." : "Vui lòng nhập giá gốc.") }
            if isCoupon && cleanedReservationDiscount.isEmpty {
                throw ClientError.message("Vui lòng nhập % ưu đãi coupon.")
            }
            if !isCoupon, !cleanedDiscount.isEmpty, let discount = Int(cleanedDiscount), let price = Int(cleanedPrice), discount > price {
                throw ClientError.message("Giá khuyến mãi không được lớn hơn giá gốc.")
            }
            let duration = Int(durationMinutes.onlyDigits)
            let maxQuantity = Int(maxQuantityPerOrder.onlyDigits)
            let images = imageUrls
                .split(whereSeparator: \.isNewline)
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }

            if let service {
                _ = try await api.updateService(
                    id: service.id,
                    input: UpdateServiceRequest(
                        name: cleanedName,
                        categoryId: cleanedCategoryId,
                        description: description.trimmedNil,
                        originalPrice: cleanedPrice,
                        discountPrice: !isCoupon && !cleanedDiscount.isEmpty ? cleanedDiscount : nil,
                        productType: productType,
                        fulfillmentType: fulfillmentType,
                        reservationDiscountPercent: isCoupon ? cleanedReservationDiscount : nil,
                        durationMinutes: duration,
                        maxQuantityPerOrder: maxQuantity,
                        isActive: isActive,
                        images: images.isEmpty ? nil : images
                    )
                )
                message = "Đã cập nhật dịch vụ."
            } else {
                _ = try await api.createService(
                    vendorId: currentVendor.id,
                    input: CreateServiceRequest(
                        name: cleanedName,
                        slug: slugify(cleanedName),
                        categoryId: cleanedCategoryId,
                        description: description.trimmedNil,
                        originalPrice: cleanedPrice,
                        discountPrice: !isCoupon && !cleanedDiscount.isEmpty ? cleanedDiscount : nil,
                        productType: productType,
                        fulfillmentType: fulfillmentType,
                        reservationDiscountPercent: isCoupon ? cleanedReservationDiscount : nil,
                        durationMinutes: duration,
                        maxQuantityPerOrder: maxQuantity,
                        images: images.isEmpty ? nil : images
                    )
                )
                message = "Đã thêm dịch vụ."
            }
            services = try await api.services(vendorId: currentVendor.id)
        }
    }

    func deleteService(_ service: VendorService) async {
        await runLoading(.services) {
            try await api.deleteService(id: service.id)
            let currentVendor = try await currentVendor()
            services = try await api.services(vendorId: currentVendor.id)
            message = "Đã xóa dịch vụ."
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

    func updateVendorSettings(address: String, latitude: String, longitude: String) async {
        await runLoading(.settings) {
            guard let currentVendor = vendor else {
                throw ClientError.message("Chưa tải thông tin cửa hàng.")
            }
            let cleanedLatitude = latitude.trimmingCharacters(in: .whitespacesAndNewlines)
            let cleanedLongitude = longitude.trimmingCharacters(in: .whitespacesAndNewlines)
            try validateCoordinate(cleanedLatitude, min: -90, max: 90, label: "Vĩ độ")
            try validateCoordinate(cleanedLongitude, min: -180, max: 180, label: "Kinh độ")
            vendor = try await api.updateVendorSettings(
                vendorId: currentVendor.id,
                address: address.trimmingCharacters(in: .whitespacesAndNewlines),
                latitude: cleanedLatitude.isEmpty ? nil : cleanedLatitude,
                longitude: cleanedLongitude.isEmpty ? nil : cleanedLongitude
            )
            message = "Đã lưu vị trí cửa hàng."
        }
    }

    func changePassword(currentPassword: String, newPassword: String, confirmPassword: String) async {
        await runLoading(.settings) {
            guard newPassword == confirmPassword else {
                throw ClientError.message("Mật khẩu xác nhận không khớp.")
            }
            try await api.changePassword(currentPassword: currentPassword, newPassword: newPassword)
            logout()
            message = "Đã đổi mật khẩu. Vui lòng đăng nhập lại."
        }
    }

    func resetPassword() async {
        await runLoading(.settings) {
            let result = try await api.resetPassword()
            logout()
            message = "Mật khẩu tạm thời: \(result.temporaryPassword). Vui lòng đăng nhập lại và đổi mật khẩu."
        }
    }

    func redeemQr(_ token: String) async {
        await runLoading(.redeemQr) {
            let value = token.trimmingCharacters(in: .whitespacesAndNewlines)
            let preview = try await api.verifyQr(value)
            guard preview.canRedeem else {
                throw ClientError.message("Voucher/vé trạng thái \(preview.status), không thể đổi.")
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
        services = []
        serviceCategories = []
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
        services = []
        serviceCategories = []
        qrPreview = nil
        redeemedVoucher = nil
        selectedTab = .dashboard
        if showMessage {
            message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        }
    }

    private func reloadHome() async throws {
        serviceCategories = try await api.serviceCategories()
        let currentVendor = try await currentVendor()
        dashboard = try await api.dashboard()
        vouchers = try await api.vouchers()
        settlements = try await api.settlements()
        reservations = try await api.reservations()
        services = try await api.services(vendorId: currentVendor.id)
    }

    private func currentVendor() async throws -> VendorProfile {
        if let vendor { return vendor }
        let loaded = try await api.vendorProfile()
        vendor = loaded
        return loaded
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

private func validateCoordinate(_ value: String, min: Double, max: Double, label: String) throws {
    guard !value.isEmpty else { return }
    guard let number = Double(value), number >= min, number <= max else {
        throw ClientError.message("\(label) không hợp lệ.")
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
    case services
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
        case .services:
            "Đang tải dịch vụ..."
        case .settings:
            "Đang lưu cài đặt..."
        }
    }
}

enum AppTab: String, CaseIterable, Identifiable {
    case dashboard = "Trang chủ"
    case scan = "Quét QR"
    case orders = "Đơn hàng"
    case services = "Dịch vụ"
    case earnings = "Thu nhập"
    case settings = "Thêm"

    var id: String { rawValue }
}

private extension String {
    var onlyDigits: String {
        filter(\.isNumber)
    }

    var onlyPercent: String {
        filter { $0.isNumber || $0 == "." }.trimmingCharacters(in: CharacterSet(charactersIn: "."))
    }

    var trimmedNil: String? {
        let value = trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }
}

private func slugify(_ value: String) -> String {
    let folded = value
        .lowercased()
        .folding(options: .diacriticInsensitive, locale: Locale(identifier: "vi_VN"))
        .replacingOccurrences(of: "đ", with: "d")
    let allowed = folded.map { character -> Character in
        if character.isLetter || character.isNumber || character == " " || character == "-" {
            return character
        }
        return " "
    }
    let slug = String(allowed)
        .split(whereSeparator: { $0 == " " || $0 == "-" })
        .joined(separator: "-")
    return slug.isEmpty ? "dich-vu-\(Int(Date().timeIntervalSince1970))" : slug
}
