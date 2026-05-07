import Foundation

let productTypeCoupon = "coupon"
let productTypeVoucher = "voucher"
let productTypeTicket = "ticket"

func productTypeLabel(_ productType: String) -> String {
    productType == productTypeTicket ? "Vé" : (productType == productTypeCoupon ? "Coupon" : "Voucher")
}

struct ApplicabilityPolicy: Codable, Hashable {
    let weekdays: [Int]?
    let excludePublicHolidays: Bool?
    let blackoutDates: [String]?
    let conditions: String?

    enum CodingKeys: String, CodingKey {
        case weekdays
        case excludePublicHolidays = "exclude_public_holidays"
        case blackoutDates = "blackout_dates"
        case conditions
    }

    var displayLines: [String] {
        var lines: [String] = []
        if let weekdays, !weekdays.isEmpty {
            lines.append("Áp dụng: \(weekdays.map(weekdayLabel).joined(separator: ", "))")
        }
        if excludePublicHolidays == true {
            lines.append("Không áp dụng ngày lễ.")
        }
        if let blackoutDates, !blackoutDates.isEmpty {
            lines.append("Không áp dụng: \(blackoutDates.joined(separator: ", "))")
        }
        if let conditions, !conditions.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            lines.append(conditions)
        }
        return lines
    }

    private func weekdayLabel(_ day: Int) -> String {
        switch day {
        case 1: return "Thứ 2"
        case 2: return "Thứ 3"
        case 3: return "Thứ 4"
        case 4: return "Thứ 5"
        case 5: return "Thứ 6"
        case 6: return "Thứ 7"
        case 7: return "Chủ nhật"
        default: return "Ngày \(day)"
        }
    }
}

struct TouristCategoryOption: Hashable {
    let value: String
    let label: String

    static let home: [TouristCategoryOption] = [
        TouristCategoryOption(value: "", label: "Tất cả"),
        TouristCategoryOption(value: "am-thuc", label: "Ẩm thực"),
        TouristCategoryOption(value: "luu-tru", label: "Lưu trú"),
        TouristCategoryOption(value: "spa-massage", label: "Spa"),
        TouristCategoryOption(value: "xe-dien", label: "Xe điện"),
        TouristCategoryOption(value: "giai-tri", label: "Giải trí"),
        TouristCategoryOption(value: "mua-sam", label: "Mua sắm"),
    ]

    static func apiValue(for value: String) -> String {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty || trimmed == "Tất cả" { return "" }
        if home.contains(where: { $0.value == trimmed }) { return trimmed }
        if trimmed == "Spa & Massage" { return "spa-massage" }
        return home.first { $0.label == trimmed }?.value ?? trimmed
    }
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
    let distanceFromOriginKm: Double?
    enum CodingKeys: String, CodingKey {
        case service, vendor, category
        case distanceFromOriginKm
    }
}

struct ServiceDetailData: Decodable {
    let service: ServiceCore
    let vendor: VendorLite?
    let category: CategoryLite?
}

struct ServicePricingWire: Decodable {
    let finalPrice: String?
    let vendorDiscountPercent: String?
    let appDiscountPercent: String?
    enum CodingKeys: String, CodingKey {
        case finalPrice = "final_price"
        case vendorDiscountPercent = "vendor_discount_percent"
        case appDiscountPercent = "app_discount_percent"
    }
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
    let productType: String?
    let fulfillmentType: String?
    let reservationDiscountPercent: String?
    let applicabilityPolicy: ApplicabilityPolicy?
    let pricing: ServicePricingWire?
    enum CodingKeys: String, CodingKey {
        case id, name, description, images
        case originalPrice, discountPrice, discountPercent, durationMinutes, averageRating
        case productType, fulfillmentType, reservationDiscountPercent, applicabilityPolicy, pricing
    }
}

struct VendorLite: Decodable {
    let id: String?
    let name: String
    let slug: String?
    let address: String?
    let latitude: String?
    let longitude: String?
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
    let vendorAddress: String?
    let vendorLatitude: Double?
    let vendorLongitude: Double?
    let distanceFromOriginKm: Double?
    let originalPrice: Int
    let price: Int
    let discountPercent: Int
    let appDiscountPercent: Int
    let productType: String
    let fulfillmentType: String
    let reservationDiscountPercent: Int
    let applicabilityPolicy: ApplicabilityPolicy?
    let rating: Double
    let durationMinutes: Int
    let imageURL: String?

    var isCoupon: Bool { productType == productTypeCoupon || fulfillmentType == "reservation" }
    var isTicket: Bool { productType == productTypeTicket }
    var isReservation: Bool { isCoupon }
    var productLabel: String { productTypeLabel(productType) }
    var locationSummary: String? {
        if let distanceFromOriginKm {
            return String(format: "%.1f km", distanceFromOriginKm)
        }
        return vendorAddress
    }
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
    let orderNumber: String?
    let status: String
    let totalAmount: Int?
    let finalAmount: Int?
    let items: [OrderLine]?
    enum CodingKeys: String, CodingKey {
        case id, status, items
        case orderNumber
        case orderNumberSnake = "order_number"
        case totalAmount = "total_amount"
        case totalAmountCamel = "totalAmount"
        case finalAmount
        case finalAmountSnake = "final_amount"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        orderNumber = container.decodeStringIfPresent(.orderNumber) ?? container.decodeStringIfPresent(.orderNumberSnake)
        status = try container.decode(String.self, forKey: .status)
        totalAmount = container.decodeIntIfPresent(.totalAmount) ?? container.decodeIntIfPresent(.totalAmountCamel)
        finalAmount = container.decodeIntIfPresent(.finalAmount) ?? container.decodeIntIfPresent(.finalAmountSnake)
        items = try container.decodeIfPresent([OrderLine].self, forKey: .items)
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
        case serviceNameCamel = "serviceName"
        case quantity, price, unitPrice
        case unitPriceSnake = "unit_price"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        serviceName = container.decodeStringIfPresent(.serviceName) ?? container.decodeStringIfPresent(.serviceNameCamel)
        quantity = container.decodeIntIfPresent(.quantity) ?? 1
        price = container.decodeIntIfPresent(.price)
        unitPrice = container.decodeIntIfPresent(.unitPrice) ?? container.decodeIntIfPresent(.unitPriceSnake)
    }
}

struct InitiatePaymentRequest: Encodable {
    let orderId: String
    let gateway: String

    enum CodingKeys: String, CodingKey {
        case orderId = "order_id"
        case gateway
    }
}

struct PaymentInitiation: Decodable, Hashable {
    let paymentUrl: String
    let transactionId: String

    enum CodingKeys: String, CodingKey {
        case paymentUrl
        case paymentUrlSnake = "payment_url"
        case transactionId
        case transactionIdSnake = "transaction_id"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        paymentUrl = container.decodeStringIfPresent(.paymentUrl) ?? container.decodeStringIfPresent(.paymentUrlSnake) ?? ""
        transactionId = container.decodeStringIfPresent(.transactionId) ?? container.decodeStringIfPresent(.transactionIdSnake) ?? ""
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
    let productType: String
    let artifactType: String
    init(
        id: String,
        status: String,
        serviceName: String? = nil,
        vendorName: String? = nil,
        quantity: Int? = nil,
        totalAmount: Int? = nil,
        qrToken: String? = nil,
        createdAt: String? = nil,
        productType: String = productTypeVoucher,
        artifactType: String = productTypeVoucher
    ) {
        self.id = id
        self.status = status
        self.serviceName = serviceName
        self.vendorName = vendorName
        self.quantity = quantity
        self.totalAmount = totalAmount
        self.qrToken = qrToken
        self.createdAt = createdAt
        self.productType = productType
        self.artifactType = artifactType
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
        case productType = "product_type"
        case productTypeCamel = "productType"
        case artifactType = "artifact_type"
        case artifactTypeCamel = "artifactType"
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
        artifactType = container.decodeStringIfPresent(.artifactType) ?? container.decodeStringIfPresent(.artifactTypeCamel) ?? productTypeVoucher
        productType = container.decodeStringIfPresent(.productType) ?? container.decodeStringIfPresent(.productTypeCamel) ?? (artifactType == productTypeTicket ? productTypeTicket : productTypeVoucher)
    }

    var isTicket: Bool { productType == productTypeTicket || artifactType == productTypeTicket }
    var productLabel: String { isTicket ? "Vé" : "Voucher" }
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

struct CreateReservationRequest: Encodable {
    let serviceId: String
    let partySize: Int
    let requestedTime: String
    let customerNote: String?

    enum CodingKeys: String, CodingKey {
        case serviceId = "service_id"
        case partySize = "party_size"
        case requestedTime = "requested_time"
        case customerNote = "customer_note"
    }
}

struct ReservationEnvelope: Decodable {
    let reservation: Reservation
}

struct ReservationListData: Decodable {
    let items: [ReservationWire]
}

struct ReservationWire: Decodable {
    let reservation: Reservation
    let service: ReservationService?
    let vendor: ReservationVendor?
    let voucher: ReservationDiscountVoucher?
}

struct ReservationService: Decodable {
    let name: String?
}

struct ReservationVendor: Decodable {
    let name: String?
}

struct ReservationDiscountVoucher: Decodable, Hashable {
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

struct Reservation: Decodable, Identifiable, Hashable {
    let id: String
    let status: String
    let customerName: String?
    let customerPhone: String?
    let partySize: Int
    let requestedTime: String
    let customerNote: String?
    var serviceName: String? = nil
    var vendorName: String? = nil
    var voucher: ReservationDiscountVoucher? = nil

    enum CodingKeys: String, CodingKey {
        case id, status
        case customerName = "customer_name"
        case customerPhone = "customer_phone"
        case partySize = "party_size"
        case requestedTime = "requested_time"
        case customerNote = "customer_note"
    }
}

struct WeatherEnvelope: Decodable {
    let weather: TouristWeather

    enum CodingKeys: String, CodingKey {
        case weather
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let weather = try container.decodeIfPresent(TouristWeather.self, forKey: .weather) {
            self.weather = weather
            return
        }
        weather = try TouristWeather(from: decoder)
    }
}

struct TouristWeather: Decodable {
    let location: WeatherLocation?
    let updatedAt: String?
    let temperature: Int
    let apparentTemperature: Int?
    let condition: String
    let humidity: Int
    let windSpeed: Int
    let windGusts: Int?
    let uvIndex: Double?
    let rainProbability: Int?
    let precipitation: Double?
    let cloudCover: Int?
    let beach: BeachWeather?
    let travelTip: String?
    let forecast: [WeatherForecastDay]?

    var lacksTravelMetrics: Bool {
        humidity <= 0 || windSpeed <= 0 || uvIndex == nil || rainProbability == nil
    }

    enum CodingKeys: String, CodingKey {
        case location, temperature, condition, humidity, precipitation, beach, forecast
        case updatedAt = "updated_at"
        case apparentTemperature = "apparent_temperature"
        case windSpeed = "wind_speed"
        case windGusts = "wind_gusts"
        case uvIndex = "uv_index"
        case rainProbability = "rain_probability"
        case cloudCover = "cloud_cover"
        case travelTip = "travel_tip"
    }

    enum LegacyRootKeys: String, CodingKey {
        case timezone, current, daily
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let temperature = container.decodeIntIfPresent(.temperature) {
            location = try container.decodeIfPresent(WeatherLocation.self, forKey: .location)
            updatedAt = container.decodeStringIfPresent(.updatedAt)
            self.temperature = temperature
            apparentTemperature = container.decodeIntIfPresent(.apparentTemperature)
            condition = container.decodeStringIfPresent(.condition) ?? "Đang cập nhật"
            humidity = container.decodeIntIfPresent(.humidity) ?? 0
            windSpeed = container.decodeIntIfPresent(.windSpeed) ?? 0
            windGusts = container.decodeIntIfPresent(.windGusts)
            uvIndex = container.decodeDoubleIfPresent(.uvIndex)
            rainProbability = container.decodeIntIfPresent(.rainProbability)
            precipitation = container.decodeDoubleIfPresent(.precipitation)
            cloudCover = container.decodeIntIfPresent(.cloudCover)
            beach = try container.decodeIfPresent(BeachWeather.self, forKey: .beach)
            travelTip = container.decodeStringIfPresent(.travelTip)
            forecast = try container.decodeIfPresent([WeatherForecastDay].self, forKey: .forecast)
            return
        }

        let legacy = try decoder.container(keyedBy: LegacyRootKeys.self)
        let current = try legacy.decodeIfPresent(LegacyWeatherCurrent.self, forKey: .current)
        let daily = try legacy.decodeIfPresent(LegacyWeatherDaily.self, forKey: .daily)
        let dailyHigh = daily?.temperatureMax.first
        let dailyLow = daily?.temperatureMin.first
        let code = current?.weatherCode ?? daily?.weatherCodes.first ?? -1

        location = WeatherLocation(name: "Bãi biển Sầm Sơn, Thanh Hóa")
        updatedAt = current?.time ?? daily?.dates.first
        temperature = Int((current?.temperature ?? dailyHigh ?? dailyLow ?? 0).rounded())
        apparentTemperature = current?.apparentTemperature.map { Int($0.rounded()) }
        condition = WeatherCode.label(code)
        humidity = current?.humidity ?? 0
        windSpeed = Int((current?.windSpeed ?? 0).rounded())
        windGusts = current?.windGusts.map { Int($0.rounded()) }
        uvIndex = daily?.uvIndex.first
        rainProbability = daily?.rainProbability.first.map { Int($0.rounded()) }
        precipitation = current?.precipitation ?? daily?.precipitation.first
        cloudCover = current?.cloudCover
        beach = nil
        travelTip = "Theo dõi thời tiết trước khi đặt hoạt động ngoài trời."
        forecast = daily?.forecastDays
    }
}

struct WeatherLocation: Decodable {
    let name: String
}

struct BeachWeather: Decodable {
    let waveHeight: Double?
    let wavePeriod: Double?
    let seaSurfaceTemperature: Double?
    let currentVelocity: Double?
    let safetyLabel: String?
    let safetyTip: String?

    enum CodingKeys: String, CodingKey {
        case waveHeight = "wave_height"
        case wavePeriod = "wave_period"
        case seaSurfaceTemperature = "sea_surface_temperature"
        case currentVelocity = "current_velocity"
        case safetyLabel = "safety_label"
        case safetyTip = "safety_tip"
    }
}

struct WeatherForecastDay: Decodable, Identifiable {
    let date: String?
    let day: String
    let high: Int
    let low: Int
    let condition: String
    let rainProbability: Int?
    let uvIndex: Double?
    let windSpeed: Int?
    let waveHeight: Double?

    var id: String { date ?? day }

    enum CodingKeys: String, CodingKey {
        case date, day, high, low, condition
        case rainProbability = "rain_probability"
        case uvIndex = "uv_index"
        case windSpeed = "wind_speed"
        case waveHeight = "wave_height"
    }
}

private struct LegacyWeatherCurrent: Decodable {
    let time: String?
    let temperature: Double?
    let apparentTemperature: Double?
    let humidity: Int?
    let precipitation: Double?
    let weatherCode: Int?
    let cloudCover: Int?
    let windSpeed: Double?
    let windGusts: Double?

    enum CodingKeys: String, CodingKey {
        case time
        case temperature = "temperature_2m"
        case apparentTemperature = "apparent_temperature"
        case humidity = "relative_humidity_2m"
        case precipitation
        case weatherCode = "weather_code"
        case cloudCover = "cloud_cover"
        case windSpeed = "wind_speed_10m"
        case windGusts = "wind_gusts_10m"
    }
}

private struct LegacyWeatherDaily: Decodable {
    let dates: [String]
    let temperatureMax: [Double]
    let temperatureMin: [Double]
    let precipitation: [Double]
    let weatherCodes: [Int]
    let rainProbability: [Double]
    let uvIndex: [Double]

    enum CodingKeys: String, CodingKey {
        case dates = "time"
        case temperatureMax = "temperature_2m_max"
        case temperatureMin = "temperature_2m_min"
        case precipitation = "precipitation_sum"
        case weatherCode = "weather_code"
        case weathercode
        case rainProbability = "precipitation_probability_max"
        case uvIndex = "uv_index_max"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        dates = (try? container.decode([String].self, forKey: .dates)) ?? []
        temperatureMax = container.decodeDoubleArray(.temperatureMax)
        temperatureMin = container.decodeDoubleArray(.temperatureMin)
        precipitation = container.decodeDoubleArray(.precipitation)
        rainProbability = container.decodeDoubleArray(.rainProbability)
        uvIndex = container.decodeDoubleArray(.uvIndex)
        weatherCodes = container.decodeIntArray(.weatherCode).isEmpty
            ? container.decodeIntArray(.weathercode)
            : container.decodeIntArray(.weatherCode)
    }

    var forecastDays: [WeatherForecastDay] {
        dates.enumerated().map { index, date in
            WeatherForecastDay(
                date: date,
                day: LegacyWeatherDaily.formatDay(date),
                high: Int((temperatureMax[safe: index] ?? 0).rounded()),
                low: Int((temperatureMin[safe: index] ?? 0).rounded()),
                condition: WeatherCode.label(weatherCodes[safe: index] ?? -1),
                rainProbability: rainProbability[safe: index].map { Int($0.rounded()) },
                uvIndex: uvIndex[safe: index],
                windSpeed: nil,
                waveHeight: nil
            )
        }
    }

    private static func formatDay(_ date: String) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "vi_VN")
        formatter.timeZone = TimeZone(identifier: "Asia/Ho_Chi_Minh")
        formatter.dateFormat = "yyyy-MM-dd"
        guard let parsed = formatter.date(from: date) else { return date }
        formatter.dateFormat = "E, dd/MM"
        return formatter.string(from: parsed)
    }
}

private enum WeatherCode {
    static func label(_ code: Int) -> String {
        switch code {
        case 0: "Trời quang"
        case 1, 2: "Ít mây"
        case 3: "Nhiều mây"
        case 45, 48: "Sương mù"
        case 51, 53, 55, 56, 57, 61, 80: "Mưa nhẹ"
        case 63, 65, 66, 67, 81, 82: "Mưa vừa đến to"
        case 71, 73, 75, 77, 85, 86: "Mưa tuyết"
        case 95, 96, 99: "Dông"
        default: "Đang cập nhật"
        }
    }
}

struct ItineraryRequest: Encodable {
    let days: Int
    let budget: Int
    let preferences: [String]
    let groupType: String
    let stayLocationLabel: String?
    let stayLatitude: Double?
    let stayLongitude: Double?
    let preferNearStay: Bool?
    enum CodingKeys: String, CodingKey {
        case days, budget, preferences
        case groupType = "group_type"
        case stayLocationLabel = "stay_location_label"
        case stayLatitude = "stay_latitude"
        case stayLongitude = "stay_longitude"
        case preferNearStay = "prefer_near_stay"
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
    let distanceFromStayKm: Double?

    enum CodingKeys: String, CodingKey {
        case time, title, description
        case serviceId = "service_id"
        case estimatedCost = "estimated_cost"
        case distanceFromStayKm = "distance_from_stay_km"
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        time = try c.decodeStringIfPresent(.time) ?? "09:00"
        title = try c.decodeStringIfPresent(.title) ?? ""
        description = try c.decodeStringIfPresent(.description) ?? ""
        serviceId = try c.decodeStringIfPresent(.serviceId)
        estimatedCost = try c.decodeIntIfPresent(.estimatedCost)
        distanceFromStayKm = try c.decodeDoubleIfPresent(.distanceFromStayKm)
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

    func decodeDoubleIfPresent(_ key: Key) -> Double? {
        if let value = try? decodeIfPresent(Double.self, forKey: key) {
            return value
        }
        if let value = try? decodeIfPresent(Int.self, forKey: key) {
            return Double(value)
        }
        if let value = try? decodeIfPresent(String.self, forKey: key) {
            return Double(value)
        }
        return nil
    }

    func decodeDoubleArray(_ key: Key) -> [Double] {
        if let values = try? decodeIfPresent([Double].self, forKey: key) {
            return values
        }
        if let values = try? decodeIfPresent([Int].self, forKey: key) {
            return values.map(Double.init)
        }
        if let values = try? decodeIfPresent([String].self, forKey: key) {
            return values.compactMap(Double.init)
        }
        return []
    }

    func decodeIntArray(_ key: Key) -> [Int] {
        if let values = try? decodeIfPresent([Int].self, forKey: key) {
            return values
        }
        if let values = try? decodeIfPresent([Double].self, forKey: key) {
            return values.map { Int($0.rounded()) }
        }
        if let values = try? decodeIfPresent([String].self, forKey: key) {
            return values.compactMap { Int(Double($0) ?? 0) }
        }
        return []
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
