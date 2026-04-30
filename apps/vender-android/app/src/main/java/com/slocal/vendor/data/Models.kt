package com.slocal.vendor.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.KSerializer
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull

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
data class PushTokenRequest(
    val token: String,
    val platform: String,
)

@Serializable
data class LoginData(
    val user: VendorUser,
    val tokens: AuthTokens? = null,
    @SerialName("access_token") val accessToken: String? = null,
    @SerialName("refresh_token") val refreshToken: String? = null,
    @SerialName("expires_in") val expiresIn: Int? = null,
) {
    val resolvedAccessToken: String?
        get() = tokens?.accessToken ?: accessToken
    val resolvedRefreshToken: String?
        get() = tokens?.refreshToken ?: refreshToken
    val resolvedExpiresIn: Int?
        get() = tokens?.expiresIn ?: expiresIn
}

@Serializable
data class AuthTokens(
    @SerialName("access_token") val accessToken: String? = null,
    @SerialName("refresh_token") val refreshToken: String? = null,
    @SerialName("expires_in") val expiresIn: Int? = null,
)

@Serializable
data class RefreshTokenRequest(@SerialName("refresh_token") val refreshToken: String)

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
    val metadata: JsonObject? = null,
)

@Serializable
data class UpdateVendorIposStoreRequest(@SerialName("ipos_store_id") val iposStoreId: String)

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
    @Serializable(with = NullableLongSerializer::class)
    val revenue: Long? = null,
)

@Serializable
data class DashboardTotal(
    @Serializable(with = NullableLongSerializer::class)
    val revenue: Long? = null,
)

@Serializable
data class DashboardSettlement(
    @Serializable(with = NullableLongSerializer::class)
    val pending: Long? = null,
    @Serializable(with = NullableLongSerializer::class)
    val settled: Long? = null,
    @SerialName("pendingSettlement")
    @Serializable(with = NullableLongSerializer::class)
    val pendingSettlement: Long? = null,
    @SerialName("totalSettled")
    @Serializable(with = NullableLongSerializer::class)
    val totalSettled: Long? = null,
) {
    val pendingAmount: Long?
        get() = pending ?: pendingSettlement
    val settledAmount: Long?
        get() = settled ?: totalSettled
}

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
    @Serializable(with = NullableLongSerializer::class)
    @SerialName("total_amount") val totalAmount: Long? = null,
    @Serializable(with = NullableLongSerializer::class)
    @SerialName("totalAmount") val totalAmountCamel: Long? = null,
    @Serializable(with = NullableLongSerializer::class)
    @SerialName("commission_amount") val commissionAmount: Long? = null,
    @Serializable(with = NullableLongSerializer::class)
    @SerialName("commissionAmount") val commissionAmountCamel: Long? = null,
    @Serializable(with = NullableLongSerializer::class)
    @SerialName("net_amount") val netAmount: Long? = null,
    @Serializable(with = NullableLongSerializer::class)
    @SerialName("netAmount") val netAmountCamel: Long? = null,
    @SerialName("voucher_count") val voucherCount: Int? = null,
    @SerialName("voucherCount") val voucherCountCamel: Int? = null,
    @SerialName("period_start") val periodStart: String? = null,
    @SerialName("periodStart") val periodStartCamel: String? = null,
    @SerialName("period_end") val periodEnd: String? = null,
    @SerialName("periodEnd") val periodEndCamel: String? = null,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("createdAt") val createdAtCamel: String? = null,
    @SerialName("disbursed_at") val disbursedAt: String? = null,
) {
    val netAmountValue: Long?
        get() = netAmount ?: netAmountCamel
    val voucherCountValue: Int?
        get() = voucherCount ?: voucherCountCamel
}

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

@Serializable
data class ReservationListResult(
    val items: List<ReservationWire> = emptyList(),
    val total: Int? = null,
)

@Serializable
data class ReservationWire(
    val reservation: Reservation,
    val service: ReservationService? = null,
    val customer: ReservationCustomer? = null,
    val voucher: ReservationDiscountVoucher? = null,
) {
    val id: String
        get() = reservation.id
    val serviceDisplayName: String
        get() = service?.name?.takeIf { it.isNotBlank() } ?: "Đặt chỗ"
    val customerDisplayName: String
        get() = reservation.customerName?.takeIf { it.isNotBlank() }
            ?: customer?.fullName?.takeIf { it.isNotBlank() }
            ?: "Khách hàng"
    val customerPhoneNumber: String?
        get() = reservation.customerPhone?.takeIf { it.isNotBlank() }
            ?: customer?.phone?.takeIf { it.isNotBlank() }
    val canConfirm: Boolean
        get() = reservation.status == "requested"
    val needsVendorAttention: Boolean
        get() = canConfirm || voucher?.status == "issue_failed"
    val statusTone: ReservationStatusTone
        get() = when {
            voucher?.status == "issue_failed" -> ReservationStatusTone.Danger
            reservation.status == "requested" -> ReservationStatusTone.Attention
            reservation.status == "confirmed" -> ReservationStatusTone.InProgress
            reservation.status == "voucher_issued" || reservation.status == "used" || reservation.status == "settled" -> ReservationStatusTone.Success
            reservation.status == "rejected" || reservation.status == "cancelled" -> ReservationStatusTone.Muted
            else -> ReservationStatusTone.Neutral
        }
}

enum class ReservationStatusTone {
    Attention,
    Danger,
    InProgress,
    Success,
    Muted,
    Neutral,
}

@Serializable
data class ReservationEnvelope(val reservation: Reservation)

@Serializable
data class ReservationActionEnvelope(
    val reservation: Reservation,
    val voucher: ReservationDiscountVoucher? = null,
)

@Serializable
data class Reservation(
    val id: String,
    val status: String,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("customer_phone") val customerPhone: String? = null,
    @SerialName("party_size") val partySize: Int = 1,
    @SerialName("requested_time") val requestedTime: String,
    @SerialName("customer_note") val customerNote: String? = null,
)

@Serializable
data class ReservationService(val name: String? = null)

@Serializable
data class ReservationCustomer(
    @SerialName("full_name") val fullName: String? = null,
    val phone: String? = null,
)

@Serializable
data class ReservationDiscountVoucher(
    val id: String,
    val status: String,
    @SerialName("discount_percent") val discountPercent: String? = null,
    @SerialName("ipos_voucher_code") val iposVoucherCode: String? = null,
    @SerialName("issue_error") val issueError: String? = null,
)

@Serializable
data class ReservationRejectRequest(val reason: String? = null)

object NullableLongSerializer : KSerializer<Long?> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("NullableLong", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): Long? {
        return when (decoder) {
            is JsonDecoder -> when (val element = decoder.decodeJsonElement()) {
                is JsonPrimitive -> {
                    if (!element.isString) {
                        element.longOrNull ?: element.doubleOrNull?.toLong()
                    } else {
                        element.contentOrNull?.toDoubleOrNull()?.toLong()
                    }
                }
                else -> null
            }
            else -> decoder.decodeString().toDoubleOrNull()?.toLong()
        }
    }

    @OptIn(ExperimentalSerializationApi::class)
    override fun serialize(encoder: Encoder, value: Long?) {
        if (value == null) {
            encoder.encodeNull()
        } else {
            encoder.encodeLong(value)
        }
    }
}
