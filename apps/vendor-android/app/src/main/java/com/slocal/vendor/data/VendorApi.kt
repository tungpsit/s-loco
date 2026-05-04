package vn.sloco.vendor.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import vn.sloco.vendor.BuildConfig

class VendorApi(
    private val tokenStore: TokenStore,
    private val baseUrl: String = DEFAULT_BASE_URL,
    private val client: OkHttpClient = OkHttpClient(),
) {
    private val json = Json {
        ignoreUnknownKeys = true
    }

    suspend fun login(email: String, password: String): LoginData {
        val data = request(
            path = "/auth/login",
            method = "POST",
            requestBody = json.encodeToString(LoginRequest.serializer(), LoginRequest(email, password)),
            serializer = LoginData.serializer(),
            authenticated = false,
        )
        val accessToken = data.resolvedAccessToken
        val refreshToken = data.resolvedRefreshToken
        require(!accessToken.isNullOrBlank()) { "API did not return an access token." }
        tokenStore.accessToken = accessToken
        tokenStore.refreshToken = refreshToken
        tokenStore.accessTokenExpiresAtMillis = System.currentTimeMillis() + (data.resolvedExpiresIn ?: 900) * 1000L
        return data
    }

    suspend fun refreshAccessTokenIfNeeded(force: Boolean = false): Boolean {
        val refreshToken = tokenStore.refreshToken.orEmpty()
        if (refreshToken.isBlank()) {
            if (force) throw SessionExpiredException()
            return false
        }

        val expiresAt = tokenStore.accessTokenExpiresAtMillis
        if (!force && expiresAt > System.currentTimeMillis() + REFRESH_SKEW_MS) {
            return true
        }

        val tokens: AuthTokens = request(
            path = "/auth/refresh",
            method = "POST",
            requestBody = json.encodeToString(RefreshTokenRequest.serializer(), RefreshTokenRequest(refreshToken)),
            serializer = AuthTokens.serializer(),
            authenticated = false,
            canRefresh = false,
        )
        val accessToken = tokens.accessToken
        val newRefreshToken = tokens.refreshToken
        if (accessToken.isNullOrBlank() || newRefreshToken.isNullOrBlank()) {
            throw SessionExpiredException()
        }
        tokenStore.accessToken = accessToken
        tokenStore.refreshToken = newRefreshToken
        tokenStore.accessTokenExpiresAtMillis = System.currentTimeMillis() + (tokens.expiresIn ?: 900) * 1000L
        return true
    }

    suspend fun changePassword(currentPassword: String, newPassword: String) {
        requestWithoutData(
            path = "/auth/change-password",
            method = "POST",
            requestBody = json.encodeToString(
                ChangePasswordRequest.serializer(),
                ChangePasswordRequest(currentPassword, newPassword),
            ),
        )
    }

    suspend fun resetPassword(): ResetPasswordData {
        return request(
            path = "/auth/reset-password",
            method = "POST",
            serializer = ResetPasswordData.serializer(),
        )
    }

    suspend fun vendorProfile(): VendorProfile {
        return request("/vendors/me", VendorProfileEnvelope.serializer()).vendor
    }

    suspend fun registerPushToken(token: String) {
        requestWithoutData(
            path = "/notifications/register-token",
            method = "POST",
            requestBody = json.encodeToString(
                PushTokenRequest.serializer(),
                PushTokenRequest(token, "android"),
            )
        )
    }

    suspend fun updateIposStoreId(vendorId: String, iposStoreId: String): VendorProfile {
        return request(
            path = "/vendors/$vendorId",
            method = "PATCH",
            requestBody = json.encodeToString(
                UpdateVendorIposStoreRequest.serializer(),
                UpdateVendorIposStoreRequest(iposStoreId),
            ),
            serializer = VendorProfileEnvelope.serializer(),
        ).vendor
    }

    suspend fun updateVendorSettings(
        vendorId: String,
        address: String,
        latitude: String?,
        longitude: String?,
    ): VendorProfile {
        return request(
            path = "/vendors/$vendorId",
            method = "PATCH",
            requestBody = json.encodeToString(
                UpdateVendorSettingsRequest.serializer(),
                UpdateVendorSettingsRequest(address, latitude, longitude),
            ),
            serializer = VendorProfileEnvelope.serializer(),
        ).vendor
    }

    suspend fun dashboard(): Dashboard {
        return request("/dashboard/vendor", Dashboard.serializer())
    }

    suspend fun serviceCategories(): List<ServiceCategory> {
        return request(
            "/services/categories",
            ServiceCategoryListEnvelope.serializer(),
        ).categories
    }

    suspend fun services(vendorId: String): List<VendorService> {
        return request(
            "/services/vendor/$vendorId",
            ServiceListEnvelope.serializer(),
        ).services
    }

    suspend fun createService(vendorId: String, input: CreateServiceRequest): VendorService {
        return request(
            path = "/services/vendor/$vendorId",
            method = "POST",
            requestBody = json.encodeToString(CreateServiceRequest.serializer(), input),
            serializer = ServiceEnvelope.serializer(),
        ).service
    }

    suspend fun updateService(serviceId: String, input: UpdateServiceRequest): VendorService {
        return request(
            path = "/services/$serviceId",
            method = "PATCH",
            requestBody = json.encodeToString(UpdateServiceRequest.serializer(), input),
            serializer = ServiceEnvelope.serializer(),
        ).service
    }

    suspend fun deleteService(serviceId: String) {
        requestWithoutData(
            path = "/services/$serviceId",
            method = "DELETE",
        )
    }

    suspend fun vouchers(status: String? = null): List<Voucher> {
        val query = if (status.isNullOrBlank()) "" else "&status=$status"
        return request(
            "/vouchers/vendor?page=1&limit=50$query",
            PaginatedResult.serializer(Voucher.serializer()),
        ).values()
    }

    suspend fun verifyQr(qrToken: String): VoucherPreview {
        return request(
            path = "/vouchers/verify",
            method = "POST",
            requestBody = json.encodeToString(QrTokenRequest.serializer(), QrTokenRequest(qrToken)),
            serializer = VoucherPreviewEnvelope.serializer(),
        ).voucher
    }

    suspend fun redeemQr(qrToken: String): Voucher {
        return request(
            path = "/vouchers/redeem",
            method = "POST",
            requestBody = json.encodeToString(QrTokenRequest.serializer(), QrTokenRequest(qrToken)),
            serializer = VoucherEnvelope.serializer(),
        ).voucher
    }

    suspend fun completeVoucher(voucherId: String): Voucher {
        return request(
            path = "/vouchers/$voucherId/complete",
            method = "POST",
            serializer = VoucherEnvelope.serializer(),
        ).voucher
    }

    suspend fun settlements(): List<Settlement> {
        return request(
            "/settlements?page=1&limit=50",
            PaginatedResult.serializer(Settlement.serializer()),
        ).values()
    }

    suspend fun reservations(status: String? = null): List<ReservationWire> {
        val query = if (status.isNullOrBlank()) "" else "&status=$status"
        return request(
            "/reservations/vendor?page=1&limit=50$query",
            ReservationListResult.serializer(),
        ).items
    }

    suspend fun confirmReservation(reservationId: String): ReservationActionEnvelope {
        return request(
            path = "/reservations/$reservationId/confirm",
            method = "POST",
            serializer = ReservationActionEnvelope.serializer(),
        )
    }

    suspend fun rejectReservation(reservationId: String, reason: String? = null): ReservationEnvelope {
        return request(
            path = "/reservations/$reservationId/reject",
            method = "POST",
            requestBody = json.encodeToString(
                ReservationRejectRequest.serializer(),
                ReservationRejectRequest(reason),
            ),
            serializer = ReservationEnvelope.serializer(),
        )
    }

    suspend fun retryReservationVoucher(voucherId: String): ReservationActionEnvelope {
        return request(
            path = "/reservations/discount-vouchers/$voucherId/retry-issue",
            method = "POST",
            serializer = ReservationActionEnvelope.serializer(),
        )
    }

    private suspend fun <T> request(
        path: String,
        serializer: KSerializer<T>,
        method: String = "GET",
        requestBody: String? = null,
        authenticated: Boolean = true,
        canRefresh: Boolean = true,
    ): T {
        if (authenticated && canRefresh) {
            refreshAccessTokenIfNeeded()
        }
        return performRequest(path, serializer, method, requestBody, authenticated, canRefresh)
    }

    private suspend fun <T> performRequest(
        path: String,
        serializer: KSerializer<T>,
        method: String,
        requestBody: String?,
        authenticated: Boolean,
        canRefresh: Boolean,
    ): T = withContext(Dispatchers.IO) {
        val body = requestBody?.toRequestBody(JSON_MEDIA_TYPE)
        val builder = Request.Builder()
            .url("$baseUrl$path")
            .method(method, body)
            .header("Content-Type", "application/json")

        if (authenticated) {
            tokenStore.accessToken?.let { builder.header("Authorization", "Bearer $it") }
        }

        client.newCall(builder.build()).execute().use { response ->
            val raw = response.body?.string().orEmpty()
            if (response.code == 401 && authenticated && canRefresh) {
                try {
                    refreshAccessTokenIfNeeded(force = true)
                    return@withContext performRequest(path, serializer, method, requestBody, authenticated, false)
                } catch (_: Exception) {
                    tokenStore.clear()
                    throw SessionExpiredException()
                }
            }
            val envelope = json.decodeFromString(ApiEnvelope.serializer(serializer), raw)
            if (!response.isSuccessful || !envelope.success || envelope.data == null) {
                throw ApiException(response.code, envelope.error?.message ?: "Không thể kết nối API.")
            }
            envelope.data
        }
    }

    private suspend fun requestWithoutData(
        path: String,
        method: String = "GET",
        requestBody: String? = null,
        authenticated: Boolean = true,
        canRefresh: Boolean = true,
    ): Unit {
        if (authenticated && canRefresh) {
            refreshAccessTokenIfNeeded()
        }
        performRequestWithoutData(path, method, requestBody, authenticated, canRefresh)
    }

    private suspend fun performRequestWithoutData(
        path: String,
        method: String,
        requestBody: String?,
        authenticated: Boolean,
        canRefresh: Boolean,
    ): Unit = withContext(Dispatchers.IO) {
        val body = requestBody?.toRequestBody(JSON_MEDIA_TYPE)
        val builder = Request.Builder()
            .url("$baseUrl$path")
            .method(method, body)
            .header("Content-Type", "application/json")

        if (authenticated) {
            tokenStore.accessToken?.let { builder.header("Authorization", "Bearer $it") }
        }

        client.newCall(builder.build()).execute().use { response ->
            val raw = response.body?.string().orEmpty()
            if (response.code == 401 && authenticated && canRefresh) {
                try {
                    refreshAccessTokenIfNeeded(force = true)
                    return@withContext performRequestWithoutData(path, method, requestBody, authenticated, false)
                } catch (_: Exception) {
                    tokenStore.clear()
                    throw SessionExpiredException()
                }
            }
            val envelope = json.decodeFromString(ApiEnvelope.serializer(JsonObject.serializer()), raw)
            if (!response.isSuccessful || !envelope.success) {
                throw ApiException(response.code, envelope.error?.message ?: "Không thể kết nối API.")
            }
        }
    }

    companion object {
        val DEFAULT_BASE_URL = BuildConfig.API_BASE_URL
        private const val REFRESH_SKEW_MS = 120_000L
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}

class ApiException(val statusCode: Int, message: String) : Exception(message)
class SessionExpiredException : Exception("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
