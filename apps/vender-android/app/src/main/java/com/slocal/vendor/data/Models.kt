package com.slocal.vendor.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class ApiEnvelope<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null,
)

@Serializable
data class ApiError(
    val code: String? = null,
    val message: String? = null,
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class LoginData(
    val user: VendorUser,
    val tokens: AuthTokens? = null,
    @SerialName("access_token") val accessToken: String? = null,
    @SerialName("refresh_token") val refreshToken: String? = null,
)

@Serializable
data class AuthTokens(
    @SerialName("access_token") val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
)

@Serializable
data class VendorUser(
    val id: String,
    val email: String,
    @SerialName("full_name") val fullName: String? = null,
    val phone: String? = null,
    val role: String,
)

@Serializable
data class VendorProfileEnvelope(val vendor: VendorProfile)

@Serializable
data class VendorProfile(
    val id: String,
    val name: String,
    val slug: String,
    val address: String? = null,
    val phone: String? = null,
    val email: String? = null,
)

@Serializable
data class Dashboard(
    val today: DashboardToday = DashboardToday(),
    val total: DashboardTotal = DashboardTotal(),
    val settlement: DashboardSettlement = DashboardSettlement(),
    val recentOrders: List<Voucher> = emptyList(),
)

@Serializable
data class DashboardToday(
    val orders: Int? = null,
    val revenue: Long? = null,
)

@Serializable
data class DashboardTotal(
    val revenue: Long? = null,
)

@Serializable
data class DashboardSettlement(
    val pending: Long? = null,
    val settled: Long? = null,
)

@Serializable
data class VoucherEnvelope(val voucher: Voucher)

@Serializable
data class VoucherPreviewEnvelope(val voucher: VoucherPreview)

@Serializable
data class VoucherPreview(
    @SerialName("voucher_id") val voucherId: String,
    val code: String,
    val status: String,
    @SerialName("can_redeem") val canRedeem: Boolean,
    @SerialName("expires_at") val expiresAt: String? = null,
)

@Serializable
data class Voucher(
    val id: String,
    val status: String,
    @SerialName("final_amount") val finalAmount: Long? = null,
    @SerialName("service_name") val serviceName: String? = null,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("redeemed_at") val redeemedAt: String? = null,
    @SerialName("completed_at") val completedAt: String? = null,
)

@Serializable
data class Settlement(
    val id: String,
    val status: String,
    @SerialName("total_amount") val totalAmount: Long? = null,
    @SerialName("commission_amount") val commissionAmount: Long? = null,
    @SerialName("net_amount") val netAmount: Long? = null,
    @SerialName("voucher_count") val voucherCount: Int? = null,
    @SerialName("period_start") val periodStart: String? = null,
    @SerialName("period_end") val periodEnd: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("disbursed_at") val disbursedAt: String? = null,
)

@Serializable
data class PaginatedResult<T>(
    val items: List<T>? = null,
    val data: List<T>? = null,
    val meta: JsonElement? = null,
) {
    fun values(): List<T> = items ?: data ?: emptyList()
}

@Serializable
data class QrTokenRequest(@SerialName("qr_token") val qrToken: String)
