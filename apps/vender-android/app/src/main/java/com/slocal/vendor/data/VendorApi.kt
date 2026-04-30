package com.slocal.vendor.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

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
        val accessToken = data.tokens?.accessToken ?: data.accessToken
        val refreshToken = data.tokens?.refreshToken ?: data.refreshToken
        require(!accessToken.isNullOrBlank()) { "API did not return an access token." }
        tokenStore.accessToken = accessToken
        tokenStore.refreshToken = refreshToken
        return data
    }

    suspend fun vendorProfile(): VendorProfile {
        return request("/vendors/me", VendorProfileEnvelope.serializer()).vendor
    }

    suspend fun dashboard(): Dashboard {
        return request("/dashboard/vendor", Dashboard.serializer())
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

    private suspend fun <T> request(
        path: String,
        serializer: KSerializer<T>,
        method: String = "GET",
        requestBody: String? = null,
        authenticated: Boolean = true,
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
            val envelope = json.decodeFromString(ApiEnvelope.serializer(serializer), raw)
            if (!response.isSuccessful || !envelope.success || envelope.data == null) {
                throw ApiException(response.code, envelope.error?.message ?: "Không thể kết nối API.")
            }
            envelope.data
        }
    }

    companion object {
        const val DEFAULT_BASE_URL = "http://10.0.2.2:3000/api/v1"
        private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    }
}

class ApiException(val statusCode: Int, message: String) : Exception(message)
