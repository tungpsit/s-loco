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
        return data
    }

    func vendorProfile() async throws -> VendorProfile {
        let envelope: VendorProfileEnvelope = try await request("/vendors/me")
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

    private func request<T: Decodable, Body: Encodable>(
        _ path: String,
        method: String = "GET",
        body: Body? = nil,
        authenticated: Bool = true
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
        let envelope = try decoder.decode(ApiEnvelope<T>.self, from: data)
        guard (200..<300).contains(statusCode), envelope.success, let payload = envelope.data else {
            throw ClientError.message(envelope.error?.message ?? "Không thể kết nối API.")
        }
        return payload
    }

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        authenticated: Bool = true
    ) async throws -> T {
        try await request(path, method: method, body: Optional<EmptyBody>.none, authenticated: authenticated)
    }
}

private struct EmptyBody: Encodable {}

enum ClientError: LocalizedError {
    case message(String)

    var errorDescription: String? {
        switch self {
        case .message(let value): value
        }
    }
}
