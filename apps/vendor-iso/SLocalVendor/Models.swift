import Foundation

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

    enum CodingKeys: String, CodingKey {
        case user
        case tokens
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
    }

    var resolvedAccessToken: String? { tokens?.accessToken ?? accessToken }
    var resolvedRefreshToken: String? { tokens?.refreshToken ?? refreshToken }
}

struct AuthTokens: Decodable {
    let accessToken: String
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
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
    let phone: String?
    let email: String?
}

struct Dashboard: Decodable {
    var today = DashboardToday()
    var total = DashboardTotal()
    var settlement = DashboardSettlement()
    var recentOrders: [Voucher] = []
}

struct DashboardToday: Decodable {
    var orders: Int?
    var revenue: Int?
}

struct DashboardTotal: Decodable {
    var revenue: Int?
}

struct DashboardSettlement: Decodable {
    var pending: Int?
    var settled: Int?
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

    enum CodingKeys: String, CodingKey {
        case voucherId = "voucher_id"
        case code
        case status
        case canRedeem = "can_redeem"
        case expiresAt = "expires_at"
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

    enum CodingKeys: String, CodingKey {
        case id
        case status
        case finalAmount = "final_amount"
        case serviceName = "service_name"
        case customerName = "customer_name"
        case createdAt = "created_at"
        case redeemedAt = "redeemed_at"
        case completedAt = "completed_at"
    }
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

    enum CodingKeys: String, CodingKey {
        case id
        case status
        case totalAmount = "total_amount"
        case commissionAmount = "commission_amount"
        case netAmount = "net_amount"
        case voucherCount = "voucher_count"
        case periodStart = "period_start"
        case periodEnd = "period_end"
        case createdAt = "created_at"
        case disbursedAt = "disbursed_at"
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
