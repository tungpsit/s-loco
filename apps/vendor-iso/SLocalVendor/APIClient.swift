import Foundation

final class APIClient {
    private let baseURL: URL
    private let tokenStore: TokenStore
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(
        baseURL: URL = URL(string: Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? "http://localhost:3000/api/v1")!,
        tokenStore: TokenStore,
        session: URLSession = .shared
    ) {
        self.baseURL = baseURL
        self.tokenStore = tokenStore
        self.session = session
    }

    func login(email: String, password: String) async throws -> LoginData {
        let data: LoginData = try await request(
            "/auth/login",
            method: "POST",
            body: LoginRequest(email: email, password: password),
            authenticated: false
        )
        guard let accessToken = data.resolvedAccessToken else {
            throw ClientError.message("API không trả về access token.")
        }
        tokenStore.accessToken = accessToken
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
            canRefresh: false
        )
        guard let accessToken = tokens.accessToken, let newRefreshToken = tokens.refreshToken else {
            throw ClientError.sessionExpired
        }
        tokenStore.accessToken = accessToken
        tokenStore.refreshToken = newRefreshToken
        tokenStore.accessTokenExpiresAt = Date().addingTimeInterval(TimeInterval(tokens.expiresIn ?? 900))
        return true
    }

    func vendorProfile() async throws -> VendorProfile {
        let envelope: VendorProfileEnvelope = try await request("/vendors/me")
        return envelope.vendor
    }

    func updateIposStoreId(vendorId: String, value: String) async throws -> VendorProfile {
        let envelope: VendorProfileEnvelope = try await request(
            "/vendors/\(vendorId)",
            method: "PATCH",
            body: UpdateVendorIposStoreRequest(iposStoreId: value)
        )
        return envelope.vendor
    }

    func dashboard() async throws -> Dashboard {
        try await request("/dashboard/vendor")
    }

    func vouchers(status: String? = nil) async throws -> [Voucher] {
        var path = "/vouchers/vendor?page=1&limit=50"
        if let status, !status.isEmpty {
            path += "&status=\(status)"
        }
        let result: PaginatedResult<Voucher> = try await request(path)
        return result.values
    }

    func verifyQr(_ token: String) async throws -> VoucherPreview {
        let envelope: VoucherPreviewEnvelope = try await request(
            "/vouchers/verify",
            method: "POST",
            body: QrTokenRequest(qrToken: token)
        )
        return envelope.voucher
    }

    func redeemQr(_ token: String) async throws -> Voucher {
        let envelope: VoucherEnvelope = try await request(
            "/vouchers/redeem",
            method: "POST",
            body: QrTokenRequest(qrToken: token)
        )
        return envelope.voucher
    }

    func completeVoucher(_ id: String) async throws -> Voucher {
        let envelope: VoucherEnvelope = try await request("/vouchers/\(id)/complete", method: "POST")
        return envelope.voucher
    }

    func settlements() async throws -> [Settlement] {
        let result: PaginatedResult<Settlement> = try await request("/settlements?page=1&limit=50")
        return result.values
    }

    func reservations(status: String? = nil) async throws -> [ReservationWire] {
        var path = "/reservations/vendor?page=1&limit=50"
        if let status, !status.isEmpty { path += "&status=\(status)" }
        let result: ReservationListResult = try await request(path)
        return result.items
    }

    func confirmReservation(_ id: String) async throws -> ReservationActionEnvelope {
        try await request("/reservations/\(id)/confirm", method: "POST")
    }

    func rejectReservation(_ id: String, reason: String? = nil) async throws -> ReservationEnvelope {
        try await request(
            "/reservations/\(id)/reject",
            method: "POST",
            body: ReservationRejectRequest(reason: reason)
        )
    }

    func retryReservationVoucher(_ id: String) async throws -> ReservationActionEnvelope {
        try await request("/reservations/discount-vouchers/\(id)/retry-issue", method: "POST")
    }

    func registerPushToken(_ token: String) async throws {
        let _: EmptyBody = try await request(
            "/notifications/register-token",
            method: "POST",
            body: PushTokenRequest(token: token, platform: "ios")
        )
    }

    private func request<T: Decodable, Body: Encodable>(
        _ path: String,
        method: String = "GET",
        body: Body? = nil,
        authenticated: Bool = true,
        canRefresh: Bool = true
    ) async throws -> T {
        if authenticated, canRefresh {
            try await refreshAccessTokenIfNeeded()
        }
        return try await performRequest(
            path,
            method: method,
            body: body,
            authenticated: authenticated,
            canRefresh: canRefresh
        )
    }

    private func performRequest<T: Decodable, Body: Encodable>(
        _ path: String,
        method: String,
        body: Body?,
        authenticated: Bool,
        canRefresh: Bool
    ) async throws -> T {
        let url = URL(string: baseURL.absoluteString + path)!
        var request = URLRequest(url: url)
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
                return try await performRequest(
                    path,
                    method: method,
                    body: body,
                    authenticated: authenticated,
                    canRefresh: false
                )
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
        if (200..<300).contains(statusCode), envelope.success, T.self == EmptyBody.self {
            return EmptyBody() as! T
        }
        throw ClientError.message(envelope.error?.message ?? "Không thể kết nối API.")
    }

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        authenticated: Bool = true
    ) async throws -> T {
        try await request(path, method: method, body: Optional<EmptyBody>.none, authenticated: authenticated)
    }
}

private struct EmptyBody: Codable {}

private struct PushTokenRequest: Encodable {
    let token: String
    let platform: String
}

enum ClientError: LocalizedError {
    case sessionExpired
    case message(String)

    var errorDescription: String? {
        switch self {
        case .sessionExpired:
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        case .message(let value): value
        }
    }
}
