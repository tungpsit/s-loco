import Foundation

let productTypeCoupon = "coupon"
let productTypeVoucher = "voucher"
let productTypeTicket = "ticket"

func productTypeLabel(_ productType: String) -> String {
    productType == productTypeTicket ? "Vé" : (productType == productTypeCoupon ? "Coupon" : "Voucher")
}

func fulfillmentTypeForProductType(_ productType: String) -> String {
    productType == productTypeCoupon ? ServiceType.reservation : ServiceType.fixedPrice
}

struct ApiEnvelope<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: ApiError?
}

struct ApiError: Decodable, Error {
    let code: String?
    let message: String?
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct LoginData: Decodable {
    let user: VendorUser
    let tokens: AuthTokens?
    let accessToken: String?
    let refreshToken: String?
    let expiresIn: Int?

    enum CodingKeys: String, CodingKey {
        case user
        case tokens
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
    }

    var resolvedAccessToken: String? { tokens?.accessToken ?? accessToken }
    var resolvedRefreshToken: String? { tokens?.refreshToken ?? refreshToken }
    var resolvedExpiresIn: Int? { tokens?.expiresIn ?? expiresIn }
}

struct AuthTokens: Decodable {
    let accessToken: String?
    let refreshToken: String?
    let expiresIn: Int?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
    }
}

struct RefreshTokenRequest: Encodable {
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

struct ChangePasswordRequest: Encodable {
    let currentPassword: String
    let newPassword: String

    enum CodingKeys: String, CodingKey {
        case currentPassword = "current_password"
        case newPassword = "new_password"
    }
}

struct ResetPasswordData: Decodable {
    let temporaryPassword: String

    enum CodingKeys: String, CodingKey {
        case temporaryPassword = "temporary_password"
    }
}

struct VendorUser: Decodable {
    let id: String
    let email: String
    let fullName: String?
    let phone: String?
    let role: String

    enum CodingKeys: String, CodingKey {
        case id
        case email
        case fullName = "full_name"
        case phone
        case role
    }
}

struct VendorProfileEnvelope: Decodable {
    let vendor: VendorProfile
}

struct VendorProfile: Decodable {
    let id: String
    let name: String
    let slug: String
    let address: String?
    let latitude: String?
    let longitude: String?
    let phone: String?
    let email: String?
    let metadata: VendorMetadata?
}

struct VendorMetadata: Decodable {
    let iposStoreId: String?

    enum CodingKeys: String, CodingKey {
        case iposStoreId = "ipos_store_id"
    }
}

struct UpdateVendorIposStoreRequest: Encodable {
    let iposStoreId: String

    enum CodingKeys: String, CodingKey {
        case iposStoreId = "ipos_store_id"
    }
}

struct UpdateVendorSettingsRequest: Encodable {
    let address: String
    let latitude: String?
    let longitude: String?
}

struct ServiceCategoryListEnvelope: Decodable {
    let categories: [ServiceCategory]
}

struct ServiceCategory: Decodable, Identifiable {
    let id: String
    let name: String
    let slug: String
    let icon: String?
}

struct ServiceListEnvelope: Decodable {
    let services: [VendorService]
}

struct ServiceEnvelope: Decodable {
    let service: VendorService
}

struct VendorService: Decodable, Identifiable {
    let id: String
    let name: String
    let slug: String?
    let categoryId: String
    let description: String?
    let originalPrice: Int
    let discountPrice: Int?
    let productType: String
    let fulfillmentType: String
    let reservationDiscountPercent: String?
    let durationMinutes: Int?
    let maxQuantityPerOrder: Int?
    let isActive: Bool
    let images: [String]

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case slug
        case categoryId
        case categoryIdSnake = "category_id"
        case description
        case originalPrice
        case originalPriceSnake = "original_price"
        case discountPrice
        case discountPriceSnake = "discount_price"
        case productType
        case productTypeSnake = "product_type"
        case fulfillmentType
        case fulfillmentTypeSnake = "fulfillment_type"
        case reservationDiscountPercent
        case reservationDiscountPercentSnake = "reservation_discount_percent"
        case durationMinutes
        case durationMinutesSnake = "duration_minutes"
        case maxQuantityPerOrder
        case maxQuantityPerOrderSnake = "max_quantity_per_order"
        case isActive
        case isActiveSnake = "is_active"
        case images
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        slug = try container.decodeStringIfPresent(forKey: .slug)
        let decodedCategoryId = try container.decodeStringIfPresent(forKey: .categoryId)
        let decodedCategoryIdSnake = try container.decodeStringIfPresent(forKey: .categoryIdSnake)
        categoryId = decodedCategoryId ?? decodedCategoryIdSnake ?? ""
        description = try container.decodeStringIfPresent(forKey: .description)
        let decodedOriginalPrice = try container.decodeLossyIntIfPresent(forKey: .originalPrice)
        let decodedOriginalPriceSnake = try container.decodeLossyIntIfPresent(forKey: .originalPriceSnake)
        originalPrice = decodedOriginalPrice ?? decodedOriginalPriceSnake ?? 0
        let decodedDiscountPrice = try container.decodeLossyIntIfPresent(forKey: .discountPrice)
        let decodedDiscountPriceSnake = try container.decodeLossyIntIfPresent(forKey: .discountPriceSnake)
        discountPrice = decodedDiscountPrice ?? decodedDiscountPriceSnake
        let decodedFulfillmentType = try container.decodeStringIfPresent(forKey: .fulfillmentType)
        let decodedFulfillmentTypeSnake = try container.decodeStringIfPresent(forKey: .fulfillmentTypeSnake)
        fulfillmentType = decodedFulfillmentType ?? decodedFulfillmentTypeSnake ?? ServiceType.fixedPrice
        let decodedProductType = try container.decodeStringIfPresent(forKey: .productType)
        let decodedProductTypeSnake = try container.decodeStringIfPresent(forKey: .productTypeSnake)
        productType = decodedProductType ?? decodedProductTypeSnake ?? (fulfillmentType == ServiceType.reservation ? productTypeCoupon : productTypeVoucher)
        let decodedReservationDiscount = try container.decodeStringIfPresent(forKey: .reservationDiscountPercent)
        let decodedReservationDiscountSnake = try container.decodeStringIfPresent(forKey: .reservationDiscountPercentSnake)
        reservationDiscountPercent = decodedReservationDiscount ?? decodedReservationDiscountSnake
        let decodedDurationMinutes = try container.decodeLossyIntIfPresent(forKey: .durationMinutes)
        let decodedDurationMinutesSnake = try container.decodeLossyIntIfPresent(forKey: .durationMinutesSnake)
        durationMinutes = decodedDurationMinutes ?? decodedDurationMinutesSnake
        let decodedMaxQuantity = try container.decodeLossyIntIfPresent(forKey: .maxQuantityPerOrder)
        let decodedMaxQuantitySnake = try container.decodeLossyIntIfPresent(forKey: .maxQuantityPerOrderSnake)
        maxQuantityPerOrder = decodedMaxQuantity ?? decodedMaxQuantitySnake
        let decodedIsActive = try container.decodeIfPresent(Bool.self, forKey: .isActive)
        let decodedIsActiveSnake = try container.decodeIfPresent(Bool.self, forKey: .isActiveSnake)
        isActive = decodedIsActive ?? decodedIsActiveSnake ?? true
        images = (try? container.decodeIfPresent([String].self, forKey: .images)) ?? []
    }

    var productLabel: String { productTypeLabel(productType) }
    var isCoupon: Bool { productType == productTypeCoupon }
}

struct CreateServiceRequest: Encodable {
    let name: String
    let slug: String
    let categoryId: String
    let description: String?
    let originalPrice: String
    let discountPrice: String?
    let productType: String
    let fulfillmentType: String
    let reservationDiscountPercent: String?
    let durationMinutes: Int?
    let maxQuantityPerOrder: Int?
    let images: [String]?

    enum CodingKeys: String, CodingKey {
        case name
        case slug
        case categoryId = "category_id"
        case description
        case originalPrice = "original_price"
        case discountPrice = "discount_price"
        case productType = "product_type"
        case fulfillmentType = "fulfillment_type"
        case reservationDiscountPercent = "reservation_discount_percent"
        case durationMinutes = "duration_minutes"
        case maxQuantityPerOrder = "max_quantity_per_order"
        case images
    }
}

struct UpdateServiceRequest: Encodable {
    let name: String
    let categoryId: String
    let description: String?
    let originalPrice: String
    let discountPrice: String?
    let productType: String
    let fulfillmentType: String
    let reservationDiscountPercent: String?
    let durationMinutes: Int?
    let maxQuantityPerOrder: Int?
    let isActive: Bool
    let images: [String]?

    enum CodingKeys: String, CodingKey {
        case name
        case categoryId = "category_id"
        case description
        case originalPrice = "original_price"
        case discountPrice = "discount_price"
        case productType = "product_type"
        case fulfillmentType = "fulfillment_type"
        case reservationDiscountPercent = "reservation_discount_percent"
        case durationMinutes = "duration_minutes"
        case maxQuantityPerOrder = "max_quantity_per_order"
        case isActive = "is_active"
        case images
    }
}

enum ServiceType {
    static let fixedPrice = "fixed_price"
    static let reservation = "reservation"
}

struct Dashboard: Decodable {
    var today = DashboardToday()
    var total = DashboardTotal()
    var settlement = DashboardSettlement()
    var recentOrders: [Voucher] = []

    enum CodingKeys: String, CodingKey {
        case today
        case total
        case settlement
        case recentOrders
    }

    init() {}

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        today = try container.decodeIfPresent(DashboardToday.self, forKey: .today) ?? DashboardToday()
        total = try container.decodeIfPresent(DashboardTotal.self, forKey: .total) ?? DashboardTotal()
        settlement = try container.decodeIfPresent(DashboardSettlement.self, forKey: .settlement) ?? DashboardSettlement()
        recentOrders = try container.decodeIfPresent([Voucher].self, forKey: .recentOrders) ?? []
    }
}

struct DashboardToday: Decodable {
    var orders: Int?
    var revenue: Int?

    enum CodingKeys: String, CodingKey {
        case orders
        case revenue
    }

    init(orders: Int? = nil, revenue: Int? = nil) {
        self.orders = orders
        self.revenue = revenue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        orders = try container.decodeLossyIntIfPresent(forKey: .orders)
        revenue = try container.decodeLossyIntIfPresent(forKey: .revenue)
    }
}

struct DashboardTotal: Decodable {
    var revenue: Int?

    enum CodingKeys: String, CodingKey {
        case revenue
    }

    init(revenue: Int? = nil) {
        self.revenue = revenue
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        revenue = try container.decodeLossyIntIfPresent(forKey: .revenue)
    }
}

struct DashboardSettlement: Decodable {
    var pending: Int?
    var settled: Int?

    enum CodingKeys: String, CodingKey {
        case pending
        case settled
        case pendingSettlement
        case totalSettled
    }

    init(pending: Int? = nil, settled: Int? = nil) {
        self.pending = pending
        self.settled = settled
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        pending = try container.decodeLossyIntIfPresent(forKey: .pending)
            ?? container.decodeLossyIntIfPresent(forKey: .pendingSettlement)
        settled = try container.decodeLossyIntIfPresent(forKey: .settled)
            ?? container.decodeLossyIntIfPresent(forKey: .totalSettled)
    }
}

struct VoucherEnvelope: Decodable {
    let voucher: Voucher
}

struct VoucherPreviewEnvelope: Decodable {
    let voucher: VoucherPreview
}

struct VoucherPreview: Decodable {
    let voucherId: String
    let code: String
    let status: String
    let canRedeem: Bool
    let expiresAt: String?
    let productType: String?
    let artifactType: String?

    enum CodingKeys: String, CodingKey {
        case voucherId = "voucher_id"
        case code
        case status
        case canRedeem = "can_redeem"
        case expiresAt = "expires_at"
        case productType = "product_type"
        case artifactType = "artifact_type"
    }

    var productLabel: String {
        productTypeLabel(productType ?? (artifactType == productTypeTicket ? productTypeTicket : productTypeVoucher))
    }
}

struct Voucher: Decodable, Identifiable {
    let id: String
    let status: String
    let finalAmount: Int?
    let serviceName: String?
    let customerName: String?
    let createdAt: String?
    let redeemedAt: String?
    let completedAt: String?
    let productType: String?
    let artifactType: String?

    enum CodingKeys: String, CodingKey {
        case id
        case status
        case finalAmount = "final_amount"
        case serviceName = "service_name"
        case customerName = "customer_name"
        case createdAt = "created_at"
        case redeemedAt = "redeemed_at"
        case completedAt = "completed_at"
        case productType = "product_type"
        case artifactType = "artifact_type"
    }

    var isTicket: Bool { productType == productTypeTicket || artifactType == productTypeTicket }
    var productLabel: String { isTicket ? "Vé" : "Voucher" }
}

struct Settlement: Decodable, Identifiable {
    let id: String
    let status: String
    let totalAmount: Int?
    let commissionAmount: Int?
    let netAmount: Int?
    let voucherCount: Int?
    let periodStart: String?
    let periodEnd: String?
    let createdAt: String?
    let disbursedAt: String?
    let direction: String

    enum CodingKeys: String, CodingKey {
        case id
        case status
        case totalAmount
        case totalAmountSnake = "total_amount"
        case commissionAmount
        case commissionAmountSnake = "commission_amount"
        case netAmount
        case netAmountSnake = "net_amount"
        case voucherCount
        case voucherCountSnake = "voucher_count"
        case periodStart
        case periodStartSnake = "period_start"
        case periodEnd
        case periodEndSnake = "period_end"
        case createdAt
        case createdAtSnake = "created_at"
        case disbursedAt
        case disbursedAtSnake = "disbursed_at"
        case direction
        case directionSnake = "settlement_direction"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        status = try container.decode(String.self, forKey: .status)
        totalAmount = try container.decodeLossyIntIfPresent(forKey: .totalAmount)
            ?? container.decodeLossyIntIfPresent(forKey: .totalAmountSnake)
        commissionAmount = try container.decodeLossyIntIfPresent(forKey: .commissionAmount)
            ?? container.decodeLossyIntIfPresent(forKey: .commissionAmountSnake)
        netAmount = try container.decodeLossyIntIfPresent(forKey: .netAmount)
            ?? container.decodeLossyIntIfPresent(forKey: .netAmountSnake)
        voucherCount = try container.decodeLossyIntIfPresent(forKey: .voucherCount)
            ?? container.decodeLossyIntIfPresent(forKey: .voucherCountSnake)
        periodStart = try container.decodeStringIfPresent(forKey: .periodStart)
            ?? container.decodeStringIfPresent(forKey: .periodStartSnake)
        periodEnd = try container.decodeStringIfPresent(forKey: .periodEnd)
            ?? container.decodeStringIfPresent(forKey: .periodEndSnake)
        createdAt = try container.decodeStringIfPresent(forKey: .createdAt)
            ?? container.decodeStringIfPresent(forKey: .createdAtSnake)
        disbursedAt = try container.decodeStringIfPresent(forKey: .disbursedAt)
            ?? container.decodeStringIfPresent(forKey: .disbursedAtSnake)
        direction = try container.decodeStringIfPresent(forKey: .direction)
            ?? container.decodeStringIfPresent(forKey: .directionSnake)
            ?? "sloco_pays_vendor"
    }

    var directionLabel: String {
        direction == "vendor_pays_sloco" ? "Vendor trả S-Loco" : "S-Loco trả vendor"
    }
}

struct PaginatedResult<T: Decodable>: Decodable {
    let items: [T]?
    let data: [T]?

    var values: [T] { items ?? data ?? [] }
}

struct QrTokenRequest: Encodable {
    let qrToken: String

    enum CodingKeys: String, CodingKey {
        case qrToken = "qr_token"
    }
}

struct ReservationListResult: Decodable {
    let items: [ReservationWire]
}

struct ReservationWire: Decodable, Identifiable {
    var id: String { reservation.id }
    let reservation: VendorReservation
    let service: ReservationService?
    let customer: ReservationCustomer?
    let voucher: ReservationDiscountVoucher?

    var serviceDisplayName: String {
        service?.name?.isEmpty == false ? service!.name! : "Đặt chỗ"
    }

    var customerDisplayName: String {
        if let value = reservation.customerName, !value.isEmpty { return value }
        if let value = customer?.fullName, !value.isEmpty { return value }
        return "Khách hàng"
    }

    var customerPhoneNumber: String? {
        if let value = reservation.customerPhone, !value.isEmpty { return value }
        if let value = customer?.phone, !value.isEmpty { return value }
        return nil
    }

    var canConfirm: Bool {
        reservation.status == "requested"
    }

    var needsVendorAttention: Bool {
        canConfirm || voucher?.status == "issue_failed"
    }

    var statusTone: ReservationStatusTone {
        if voucher?.status == "issue_failed" { return .danger }
        switch reservation.status {
        case "requested":
            return .attention
        case "confirmed":
            return .inProgress
        case "voucher_issued", "used", "settled":
            return .success
        case "rejected", "cancelled":
            return .muted
        default:
            return .neutral
        }
    }
}

enum ReservationStatusTone {
    case attention
    case danger
    case inProgress
    case success
    case muted
    case neutral
}

struct ReservationEnvelope: Decodable {
    let reservation: VendorReservation
}

struct ReservationActionEnvelope: Decodable {
    let reservation: VendorReservation
    let voucher: ReservationDiscountVoucher?
}

struct VendorReservation: Decodable, Identifiable {
    let id: String
    let status: String
    let customerName: String?
    let customerPhone: String?
    let partySize: Int
    let requestedTime: String
    let customerNote: String?

    enum CodingKeys: String, CodingKey {
        case id, status
        case customerName = "customer_name"
        case customerPhone = "customer_phone"
        case partySize = "party_size"
        case requestedTime = "requested_time"
        case customerNote = "customer_note"
    }
}

struct ReservationService: Decodable {
    let name: String?
}

struct ReservationCustomer: Decodable {
    let fullName: String?
    let phone: String?

    enum CodingKeys: String, CodingKey {
        case fullName = "full_name"
        case phone
    }
}

struct ReservationDiscountVoucher: Decodable {
    let id: String
    let status: String
    let discountPercent: String?
    let iposVoucherCode: String?
    let issueError: String?

    enum CodingKeys: String, CodingKey {
        case id, status
        case discountPercent = "discount_percent"
        case iposVoucherCode = "ipos_voucher_code"
        case issueError = "issue_error"
    }
}

struct ReservationRejectRequest: Encodable {
    let reason: String?
}

private extension KeyedDecodingContainer {
    func decodeLossyIntIfPresent(forKey key: Key) throws -> Int? {
        if let value = try? decodeIfPresent(Int.self, forKey: key) {
            return value
        }
        if let value = try? decodeIfPresent(Double.self, forKey: key) {
            return Int(value)
        }
        if let value = try? decodeIfPresent(String.self, forKey: key) {
            return Double(value).map(Int.init)
        }
        return nil
    }

    func decodeStringIfPresent(forKey key: Key) throws -> String? {
        if let value = try? decodeIfPresent(String.self, forKey: key) {
            return value
        }
        return nil
    }
}
