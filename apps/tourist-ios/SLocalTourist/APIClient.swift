import Foundation

final class APIClient {
    private static let itineraryTimeout: TimeInterval = 120

    private let baseURL: URL
    private let tokenStore: TokenStore
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(
        baseURL: URL = URL(string: Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? "https://api.sloco.vn/api/v1")!,
        tokenStore: TokenStore,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.tokenStore = tokenStore
        self.session = session
    }

    func services(query: String = "", category: String = "") async throws -> [TouristService] {
        var path = "/services?page=1&limit=30"
        let category = TouristCategoryOption.apiValue(for: category)
        if !query.isEmpty { path += "&q=\(query.urlEncoded)" }
        if !category.isEmpty { path += "&category=\(category.urlEncoded)" }
        let data: ServiceListData = try await request(path, authenticated: false)
        return data.items.compactMap(mapService)
    }

    func vendors(query: String = "", category: String = "") async throws -> [Vendor] {
        var path = "/vendors?page=1"
        let category = TouristCategoryOption.apiValue(for: category)
        if !query.isEmpty { path += "&q=\(query.urlEncoded)" }
        if !category.isEmpty { path += "&category=\(category.urlEncoded)" }
        let data: Paginated<Vendor> = try await request(path, authenticated: false)
        return data.values
    }

    func service(id: String) async throws -> TouristService {
        let data: ServiceDetailData = try await request("/services/\(id)", authenticated: false)
        return mapService(ServiceWire(service: data.service, vendor: data.vendor, category: data.category, distanceFromOriginKm: nil))!
    }

    func sendOtp(phone: String) async throws {
        let _: EmptyPayload = try await request("/auth/otp/send", method: "POST", body: OtpSendRequest(phone: phone), authenticated: false)
    }

    func verifyOtp(phone: String, code: String) async throws -> LoginData {
        let data: LoginData = try await request("/auth/otp/verify", method: "POST", body: OtpVerifyRequest(phone: phone, code: code), authenticated: false)
        guard let token = data.resolvedAccessToken else { throw ClientError.message("API không trả về access token.") }
        tokenStore.accessToken = token
        tokenStore.refreshToken = data.resolvedRefreshToken
        tokenStore.accessTokenExpiresAt = Date().addingTimeInterval(TimeInterval(data.resolvedExpiresIn ?? 900))
        return data
    }

    @discardableResult
    func refreshAccessTokenIfNeeded(force: Bool = false) async throws -> Bool {
        guard let refreshToken = tokenStore.refreshToken, !refreshToken.isEmpty else {
            if force { throw ClientError.sessionExpired }
            return false
        }

        if !force, let expiresAt = tokenStore.accessTokenExpiresAt, expiresAt.timeIntervalSinceNow > 120 {
            return true
        }

        let tokens: AuthTokens = try await request(
            "/auth/refresh",
            method: "POST",
            body: RefreshTokenRequest(refreshToken: refreshToken),
            authenticated: false,
            canRefresh: false,
        )
        guard let accessToken = tokens.accessToken, let newRefreshToken = tokens.refreshToken else {
            throw ClientError.sessionExpired
        }
        tokenStore.accessToken = accessToken
        tokenStore.refreshToken = newRefreshToken
        tokenStore.accessTokenExpiresAt = Date().addingTimeInterval(TimeInterval(tokens.expiresIn ?? 900))
        return true
    }

    func createOrder(serviceId: String, quantity: Int) async throws -> Order {
        let body = CreateOrderRequest(items: [CreateOrderItem(serviceId: serviceId, quantity: quantity)])
        let data: OrderEnvelope = try await request("/orders", method: "POST", body: body)
        return data.order
    }

    func createReservation(serviceId: String, partySize: Int, requestedTime: String, note: String?) async throws -> Reservation {
        let body = CreateReservationRequest(
            serviceId: serviceId,
            partySize: partySize,
            requestedTime: requestedTime,
            customerNote: note?.isEmpty == true ? nil : note
        )
        let data: ReservationEnvelope = try await request("/reservations", method: "POST", body: body)
        return data.reservation
    }

    func reservations(status: String? = nil) async throws -> [Reservation] {
        var path = "/reservations?page=1&limit=50"
        if let status, !status.isEmpty { path += "&status=\(status)" }
        let data: ReservationListData = try await request(path)
        return data.items.map { wire in
            var reservation = wire.reservation
            reservation.serviceName = wire.service?.name
            reservation.vendorName = wire.vendor?.name
            reservation.voucher = wire.voucher
            return reservation
        }
    }

    func order(id: String) async throws -> Order {
        let data: OrderEnvelope = try await request("/orders/\(id)")
        return data.order
    }

    func initiatePayment(orderId: String, gateway: String = "sepay") async throws -> PaymentInitiation {
        try await request(
            "/payments/initiate",
            method: "POST",
            body: InitiatePaymentRequest(orderId: orderId, gateway: gateway)
        )
    }

    func vouchers(status: String? = nil) async throws -> [Voucher] {
        var path = "/vouchers?page=1&limit=50"
        if let status, !status.isEmpty { path += "&status=\(status)" }
        let data: Paginated<VoucherWire> = try await request(path)
        return data.values.map { wire in
            if let voucher = wire.voucher {
                return Voucher(
                    id: voucher.id,
                    status: voucher.status,
                    serviceName: voucher.serviceName ?? wire.service?.name,
                    vendorName: voucher.vendorName ?? wire.vendor?.name,
                    quantity: voucher.quantity ?? wire.orderItem?.quantity ?? 1,
                    totalAmount: voucher.totalAmount ?? wire.orderItem?.totalPrice,
                    qrToken: voucher.qrToken,
                    createdAt: voucher.createdAt,
                    productType: voucher.productType,
                    artifactType: voucher.artifactType
                )
            }
            return Voucher(
                id: UUID().uuidString,
                status: "paid",
                serviceName: wire.service?.name,
                vendorName: wire.vendor?.name,
                quantity: wire.orderItem?.quantity ?? 1,
                totalAmount: wire.orderItem?.totalPrice,
                qrToken: nil,
                createdAt: nil,
                productType: productTypeVoucher,
                artifactType: productTypeVoucher
            )
        }
    }

    func itinerary(
        days: Int,
        budget: Int,
        preferences: String,
        groupType: String = "couple",
        stayLocationLabel: String? = nil,
        stayLatitude: Double? = nil,
        stayLongitude: Double? = nil,
        preferNearStay: Bool = false
    ) async throws -> GeneratedItinerary {
        let label = stayLocationLabel?.trimmingCharacters(in: .whitespacesAndNewlines)
        let body = ItineraryRequest(
            days: days,
            budget: budget,
            preferences: preferences.preferenceList,
            groupType: groupType,
            stayLocationLabel: label?.isEmpty == false ? label : nil,
            stayLatitude: stayLatitude,
            stayLongitude: stayLongitude,
            preferNearStay: preferNearStay ? true : nil
        )
        return try await request("/itinerary/generate", method: "POST", body: body, timeout: Self.itineraryTimeout)
    }

    func weather() async throws -> TouristWeather {
        let data: WeatherEnvelope = try await request("/content/weather", authenticated: false)
        if data.weather.lacksTravelMetrics {
            return try await fetchOpenMeteoWeather()
        }
        return data.weather
    }

    func registerPushToken(_ token: String) async throws {
        let _: EmptyPayload = try await request(
            "/notifications/register-token",
            method: "POST",
            body: PushTokenRequest(token: token, platform: "ios")
        )
    }

    private func fetchOpenMeteoWeather() async throws -> TouristWeather {
        var components = URLComponents(string: "https://api.open-meteo.com/v1/forecast")!
        components.queryItems = [
            URLQueryItem(name: "latitude", value: "19.75"),
            URLQueryItem(name: "longitude", value: "105.90"),
            URLQueryItem(name: "timezone", value: "Asia/Ho_Chi_Minh"),
            URLQueryItem(name: "forecast_days", value: "7"),
            URLQueryItem(
                name: "current",
                value: [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "weather_code",
                    "cloud_cover",
                    "wind_speed_10m",
                    "wind_gusts_10m",
                    "precipitation",
                ].joined(separator: ",")
            ),
            URLQueryItem(
                name: "daily",
                value: [
                    "weather_code",
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_sum",
                    "precipitation_probability_max",
                    "uv_index_max",
                ].joined(separator: ",")
            ),
        ]

        guard let url = components.url else {
            throw ClientError.message("Không thể tạo URL thời tiết.")
        }
        let (data, response) = try await session.data(from: url)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(statusCode) else {
            throw ClientError.message("Không thể tải thời tiết từ Open-Meteo.")
        }
        return try decoder.decode(WeatherEnvelope.self, from: data).weather
    }

    private func mapService(_ item: ServiceWire) -> TouristService? {
        guard let service = item.service else { return nil }
        let original = service.originalPrice.intValue
        let vendorPrice = service.discountPrice.intValue == 0 ? original : service.discountPrice.intValue
        let price = service.pricing?.finalPrice.intValue ?? vendorPrice
        let discount = service.pricing?.vendorDiscountPercent.intValue ?? (service.discountPercent.intValue == 0 && original > vendorPrice && original > 0
            ? Int((1 - Double(vendorPrice) / Double(original)) * 100)
            : service.discountPercent.intValue
        )
        let appDiscount = service.pricing?.appDiscountPercent.intValue ?? service.reservationDiscountPercent.intValue
        return TouristService(
            id: service.id,
            name: service.name,
            description: service.description ?? "",
            category: item.category?.name ?? "",
            vendorName: item.vendor?.name ?? "",
            vendorAddress: item.vendor?.address,
            vendorLatitude: item.vendor?.latitude?.doubleValue.validLatitude,
            vendorLongitude: item.vendor?.longitude?.doubleValue.validLongitude,
            distanceFromOriginKm: item.distanceFromOriginKm,
            originalPrice: original,
            price: price,
            discountPercent: discount,
            appDiscountPercent: appDiscount,
            productType: service.productType ?? (service.fulfillmentType == "reservation" ? productTypeCoupon : productTypeVoucher),
            fulfillmentType: service.fulfillmentType ?? "fixed_price",
            reservationDiscountPercent: appDiscount,
            applicabilityPolicy: service.applicabilityPolicy,
            rating: service.averageRating.doubleValue,
            durationMinutes: service.durationMinutes ?? 0,
            imageURL: service.images?.first
        )
    }

    private func request<T: Decodable, Body: Encodable>(
        _ path: String,
        method: String = "GET",
        body: Body? = nil,
        authenticated: Bool = true,
        canRefresh: Bool = true,
        timeout: TimeInterval? = nil
    ) async throws -> T {
        if authenticated, canRefresh {
            try await refreshAccessTokenIfNeeded()
        }
        return try await performRequest(path, method: method, body: body, authenticated: authenticated, canRefresh: canRefresh, timeout: timeout)
    }

    private func performRequest<T: Decodable, Body: Encodable>(
        _ path: String,
        method: String,
        body: Body?,
        authenticated: Bool,
        canRefresh: Bool,
        timeout: TimeInterval?
    ) async throws -> T {
        let url = URL(string: baseURL.absoluteString + path)!
        var request = URLRequest(url: url)
        if let timeout {
            request.timeoutInterval = timeout
        }
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if authenticated, let token = tokenStore.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        if statusCode == 401, authenticated, canRefresh {
            do {
                try await refreshAccessTokenIfNeeded(force: true)
                return try await performRequest(path, method: method, body: body, authenticated: authenticated, canRefresh: false, timeout: timeout)
            } catch {
                tokenStore.clear()
                throw ClientError.sessionExpired
            }
        }
        let envelope: ApiEnvelope<T>
        do {
            envelope = try decoder.decode(ApiEnvelope<T>.self, from: data)
        } catch {
            throw ClientError.message("API trả về dữ liệu không đúng định dạng.")
        }
        if (200..<300).contains(statusCode), envelope.success, let payload = envelope.data {
            return payload
        }
        if (200..<300).contains(statusCode), envelope.success, T.self == EmptyPayload.self {
            return EmptyPayload() as! T
        }
        guard let message = envelope.error?.message else {
            throw ClientError.message("Không thể kết nối API.")
        }
        throw ClientError.message(message)
    }

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        authenticated: Bool = true
    ) async throws -> T {
        try await request(path, method: method, body: Optional<EmptyBody>.none, authenticated: authenticated)
    }
}

struct EmptyPayload: Decodable {}

private struct PushTokenRequest: Encodable {
    let token: String
    let platform: String
}

struct RawPayload: Decodable, CustomStringConvertible {
    let description: String
    init(from decoder: Decoder) throws {
        description = "Lịch trình đã được tạo. Xem phản hồi chi tiết từ API trong bản tích hợp tiếp theo."
    }
}

private extension String {
    var preferenceList: [String] {
        split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }
}

enum ClientError: LocalizedError {
    case sessionExpired
    case message(String)
    var errorDescription: String? {
        switch self {
        case .sessionExpired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        case .message(let value): value
        }
    }
}

private extension String {
    var intValue: Int { Int(Double(self) ?? 0) }
    var doubleValue: Double { Double(self) ?? 0 }
    var urlEncoded: String { addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? self }
}

private extension Optional where Wrapped == String {
    var intValue: Int { self?.intValue ?? 0 }
    var doubleValue: Double { self?.doubleValue ?? 0 }
}

private extension Double {
    var validLatitude: Double? { (-90...90).contains(self) ? self : nil }
    var validLongitude: Double? { (-180...180).contains(self) ? self : nil }
}
