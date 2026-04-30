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

struct EmptyBody: Encodable {}

struct Paginated<T: Decodable>: Decodable {
    let items: [T]?
    let data: [T]?
    var values: [T] { items ?? data ?? [] }
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

struct TouristUser: Decodable {
    let id: String
    let phone: String?
    let email: String?
    let fullName: String?
    let role: String?
    enum CodingKeys: String, CodingKey {
        case id, phone, email, role
        case fullName = "full_name"
    }
}

struct LoginData: Decodable {
    let user: TouristUser
    let tokens: AuthTokens?
    let accessToken: String?
    let refreshToken: String?
    let expiresIn: Int?
    enum CodingKeys: String, CodingKey {
        case user, tokens
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
    }
    var resolvedAccessToken: String? { tokens?.accessToken ?? accessToken }
    var resolvedRefreshToken: String? { tokens?.refreshToken ?? refreshToken }
    var resolvedExpiresIn: Int? { tokens?.expiresIn ?? expiresIn }
}

struct OtpSendRequest: Encodable { let phone: String }
struct OtpVerifyRequest: Encodable {
    let phone: String
    let code: String
}
struct RefreshTokenRequest: Encodable {
    let refreshToken: String
    enum CodingKeys: String, CodingKey {
        case refreshToken = "refresh_token"
    }
}

struct ServiceListData: Decodable {
    let items: [ServiceWire]
}

struct ServiceWire: Decodable {
    let service: ServiceCore?
    let vendor: VendorLite?
    let category: CategoryLite?
}

struct ServiceDetailData: Decodable {
    let service: ServiceCore
    let vendor: VendorLite?
    let category: CategoryLite?
}

struct ServiceCore: Decodable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let originalPrice: String?
    let discountPrice: String?
    let discountPercent: String?
    let images: [String]?
    let durationMinutes: Int?
    let averageRating: String?
    enum CodingKeys: String, CodingKey {
        case id, name, description, images
        case originalPrice, discountPrice, discountPercent, durationMinutes, averageRating
    }
}

struct VendorLite: Decodable {
    let id: String?
    let name: String
    let slug: String?
    let address: String?
    let ratingAvg: String?
    let reviewCount: Int?
}

struct CategoryLite: Decodable {
    let name: String?
    let slug: String?
}

struct TouristService: Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
    let category: String
    let vendorName: String
    let originalPrice: Int
    let price: Int
    let discountPercent: Int
    let rating: Double
    let durationMinutes: Int
    let imageURL: String?
}

struct Vendor: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let slug: String?
    let address: String?
    let ratingAvg: String?
    let reviewCount: Int?
    let description: String?
}

struct CreateOrderRequest: Encodable {
    let items: [CreateOrderItem]
}

struct CreateOrderItem: Encodable {
    let serviceId: String
    let quantity: Int
    enum CodingKeys: String, CodingKey {
        case serviceId = "service_id"
        case quantity
    }
}

struct OrderEnvelope: Decodable { let order: Order }
struct Order: Decodable, Identifiable, Hashable {
    let id: String
    let status: String
    let totalAmount: Int?
    let finalAmount: Int?
    let items: [OrderLine]?
    enum CodingKeys: String, CodingKey {
        case id, status, items
        case totalAmount = "total_amount"
        case finalAmount
    }
    var amount: Int { finalAmount ?? totalAmount ?? 0 }
}

struct OrderLine: Decodable, Hashable {
    let serviceName: String?
    let quantity: Int
    let price: Int?
    let unitPrice: Int?
    enum CodingKeys: String, CodingKey {
        case serviceName = "service_name"
        case quantity, price, unitPrice
    }
}

struct Voucher: Decodable, Identifiable, Hashable {
    let id: String
    let status: String
    let serviceName: String?
    let vendorName: String?
    let quantity: Int?
    let totalAmount: Int?
    let qrToken: String?
    let createdAt: String?
    init(
        id: String,
        status: String,
        serviceName: String? = nil,
        vendorName: String? = nil,
        quantity: Int? = nil,
        totalAmount: Int? = nil,
        qrToken: String? = nil,
        createdAt: String? = nil
    ) {
        self.id = id
        self.status = status
        self.serviceName = serviceName
        self.vendorName = vendorName
        self.quantity = quantity
        self.totalAmount = totalAmount
        self.qrToken = qrToken
        self.createdAt = createdAt
    }

    enum CodingKeys: String, CodingKey {
        case id, status, quantity
        case serviceName = "service_name"
        case serviceNameCamel = "serviceName"
        case vendorName = "vendor_name"
        case vendorNameCamel = "vendorName"
        case totalAmount = "total_amount"
        case totalAmountCamel = "totalAmount"
        case qrToken = "qr_token"
        case qrTokenCamel = "qrToken"
        case createdAt = "created_at"
        case createdAtCamel = "createdAt"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        status = try container.decode(String.self, forKey: .status)
        serviceName = container.decodeStringIfPresent(.serviceName) ?? container.decodeStringIfPresent(.serviceNameCamel)
        vendorName = container.decodeStringIfPresent(.vendorName) ?? container.decodeStringIfPresent(.vendorNameCamel)
        quantity = container.decodeIntIfPresent(.quantity)
        totalAmount = container.decodeIntIfPresent(.totalAmount) ?? container.decodeIntIfPresent(.totalAmountCamel)
        qrToken = container.decodeStringIfPresent(.qrToken) ?? container.decodeStringIfPresent(.qrTokenCamel)
        createdAt = container.decodeStringIfPresent(.createdAt) ?? container.decodeStringIfPresent(.createdAtCamel)
    }
}

struct VoucherWire: Decodable {
    let voucher: Voucher?
    let service: ServiceCore?
    let vendor: VendorLite?
    let orderItem: OrderItemLite?
}

struct OrderItemLite: Decodable {
    let quantity: Int?
    let totalPrice: Int?

    enum CodingKeys: String, CodingKey {
        case quantity
        case totalPrice
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        quantity = container.decodeIntIfPresent(.quantity)
        totalPrice = container.decodeIntIfPresent(.totalPrice)
    }
}

struct ItineraryRequest: Encodable {
    let days: Int
    let budget: Int
    let preferences: [String]
    let groupType: String
    enum CodingKeys: String, CodingKey {
        case days, budget, preferences
        case groupType = "group_type"
    }
}

struct GeneratedItinerary: Decodable, CustomStringConvertible {
    let title: String
    let summary: String?
    let days: [GeneratedItineraryDay]
    let totalEstimatedCost: Int?
    let tips: [String]?

    enum CodingKeys: String, CodingKey {
        case title, summary, days, tips
        case totalEstimatedCost = "total_estimated_cost"
    }

    var description: String {
        var lines: [String] = [title]
        if let summary, !summary.isEmpty {
            lines.append(summary)
        }
        if let totalEstimatedCost {
            lines.append("Ước tính: \(totalEstimatedCost.vnd)")
        }

        for day in days {
            lines.append("")
            lines.append("Ngày \(day.day): \(day.title)")
            for activity in day.activities {
                let cost = activity.estimatedCost.map { " - \($0.vnd)" } ?? ""
                lines.append("\(activity.time) - \(activity.title)\(cost)")
                if !activity.description.isEmpty {
                    lines.append(activity.description)
                }
            }
        }

        if let tips, !tips.isEmpty {
            lines.append("")
            lines.append("Mẹo:")
            lines.append(contentsOf: tips.map { "- \($0)" })
        }

        return lines.joined(separator: "\n")
    }
}

struct GeneratedItineraryDay: Decodable {
    let day: Int
    let title: String
    let activities: [GeneratedItineraryActivity]
}

struct GeneratedItineraryActivity: Decodable {
    let time: String
    let title: String
    let description: String
    let serviceId: String?
    let estimatedCost: Int?

    enum CodingKeys: String, CodingKey {
        case time, title, description
        case serviceId = "service_id"
        case estimatedCost = "estimated_cost"
    }
}

private extension KeyedDecodingContainer {
    func decodeStringIfPresent(_ key: Key) -> String? {
        if let value = try? decodeIfPresent(String.self, forKey: key) {
            return value
        }
        if let value = try? decodeIfPresent(Int.self, forKey: key) {
            return String(value)
        }
        if let value = try? decodeIfPresent(Double.self, forKey: key) {
            return String(value)
        }
        return nil
    }

    func decodeIntIfPresent(_ key: Key) -> Int? {
        if let value = try? decodeIfPresent(Int.self, forKey: key) {
            return value
        }
        if let value = try? decodeIfPresent(Double.self, forKey: key) {
            return Int(value)
        }
        if let value = try? decodeIfPresent(String.self, forKey: key) {
            return Int(Double(value) ?? 0)
        }
        return nil
    }
}
