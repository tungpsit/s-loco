import Foundation

final class APIClient {
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

    func changePassword(currentPassword: String, newPassword: String) async throws {
        let _: EmptyBody = try await request(
            "/auth/change-password",
            method: "POST",
            body: ChangePasswordRequest(currentPassword: currentPassword, newPassword: newPassword)
        )
    }

    func resetPassword() async throws -> ResetPasswordData {
        try await request("/auth/reset-password", method: "POST")
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

    func updateVendorSettings(
        vendorId: String,
        address: String,
        latitude: String?,
        longitude: String?
    ) async throws -> VendorProfile {
        let envelope: VendorProfileEnvelope = try await request(
            "/vendors/\(vendorId)",
            method: "PATCH",
            body: UpdateVendorSettingsRequest(address: address, latitude: latitude, longitude: longitude)
        )
        return envelope.vendor
    }

    func dashboard() async throws -> Dashboard {
        try await request("/dashboard/vendor")
    }

    func serviceCategories() async throws -> [ServiceCategory] {
        let envelope: ServiceCategoryListEnvelope = try await request("/services/categories")
        return envelope.categories
    }

    func services(vendorId: String) async throws -> [VendorService] {
        let envelope: ServiceListEnvelope = try await request("/services/vendor/\(vendorId)")
        return envelope.services
    }

    func createService(vendorId: String, input: CreateServiceRequest) async throws -> VendorService {
        let envelope: ServiceEnvelope = try await request(
            "/services/vendor/\(vendorId)",
            method: "POST",
            body: input
        )
        return envelope.service
    }

    func updateService(id: String, input: UpdateServiceRequest) async throws -> VendorService {
        let envelope: ServiceEnvelope = try await request(
            "/services/\(id)",
            method: "PATCH",
            body: input
        )
        return envelope.service
    }

    func deleteService(id: String) async throws {
        let _: EmptyBody = try await request("/services/\(id)", method: "DELETE")
    }

    func uploadServiceImage(data: Data, filename: String, mimeType: String) async throws -> UploadedImage {
        try await uploadImage(path: "/uploads/images", data: data, filename: filename, mimeType: mimeType, purpose: "service_image")
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

    private func uploadImage(
        path: String,
        data: Data,
        filename: String,
        mimeType: String,
        purpose: String,
        canRefresh: Bool = true
    ) async throws -> UploadedImage {
        if canRefresh {
            try await refreshAccessTokenIfNeeded()
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        let url = URL(string: baseURL.absoluteString + path)!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        if let token = tokenStore.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = multipartImageBody(
            boundary: boundary,
            data: data,
            filename: filename,
            mimeType: mimeType,
            purpose: purpose
        )

        let (responseData, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        if statusCode == 401, canRefresh {
            do {
                try await refreshAccessTokenIfNeeded(force: true)
                return try await uploadImage(path: path, data: data, filename: filename, mimeType: mimeType, purpose: purpose, canRefresh: false)
            } catch {
                tokenStore.clear()
                throw ClientError.sessionExpired
            }
        }

        let envelope: ApiEnvelope<UploadedImage>
        do {
            envelope = try decoder.decode(ApiEnvelope<UploadedImage>.self, from: responseData)
        } catch {
            if !(200..<300).contains(statusCode) {
                throw ClientError.message("Upload ảnh thất bại (HTTP \(statusCode)). Vui lòng kiểm tra API server.")
            }
            throw ClientError.message("API trả về dữ liệu không đúng định dạng.")
        }
        if (200..<300).contains(statusCode), envelope.success, let payload = envelope.data {
            return payload
        }
        throw ClientError.message(envelope.error?.message ?? "Không thể upload ảnh.")
    }

    private func multipartImageBody(
        boundary: String,
        data: Data,
        filename: String,
        mimeType: String,
        purpose: String
    ) -> Data {
        var body = Data()
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"purpose\"\r\n\r\n")
        body.appendString("\(purpose)\r\n")
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n")
        body.appendString("Content-Type: \(mimeType)\r\n\r\n")
        body.append(data)
        body.appendString("\r\n--\(boundary)--\r\n")
        return body
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

private extension Data {
    mutating func appendString(_ value: String) {
        append(Data(value.utf8))
    }
}

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
