package com.slocal.vendor.data

import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

class VendorApiTest {
    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun loginDataDecodesCurrentTokenShape() {
        val raw = """
            {
              "user": {"id":"u1","email":"vendor@example.com","role":"vendor_owner"},
              "tokens": {"access_token":"access","refresh_token":"refresh","expires_in":900}
            }
        """.trimIndent()

        val decoded = json.decodeFromString(LoginData.serializer(), raw)

        assertEquals("access", decoded.resolvedAccessToken)
        assertEquals("refresh", decoded.resolvedRefreshToken)
        assertEquals(900, decoded.resolvedExpiresIn)
    }

    @Test
    fun dashboardDecodesNumericStringsFromApi() {
        val raw = """
            {
              "today": {"orders": 2, "revenue": "1250000.00", "vouchers": 1},
              "total": {"revenue": "5000000.00", "orders": 8, "activeVouchers": 3},
              "settlement": {"totalSettled": "3000000.00", "pendingSettlement": "750000.00"}
            }
        """.trimIndent()

        val decoded = json.decodeFromString(Dashboard.serializer(), raw)

        assertEquals(2, decoded.today.orders)
        assertEquals(1_250_000L, decoded.today.revenue)
        assertEquals(5_000_000L, decoded.total.revenue)
        assertEquals(3_000_000L, decoded.settlement.settledAmount)
        assertEquals(750_000L, decoded.settlement.pendingAmount)
    }

    @Test
    fun reservationDisplayInfoFallsBackToJoinedCustomer() {
        val raw = """
            {
              "reservation": {
                "id": "r1",
                "status": "requested",
                "customer_name": null,
                "customer_phone": null,
                "party_size": 4,
                "requested_time": "2026-05-01T12:00:00.000Z",
                "customer_note": "Bàn gần cửa sổ"
              },
              "service": {"name": "Đặt bàn hải sản"},
              "customer": {"full_name": "Trần Minh Anh", "phone": "0900000003"},
              "voucher": null
            }
        """.trimIndent()

        val decoded = json.decodeFromString(ReservationWire.serializer(), raw)

        assertEquals("Trần Minh Anh", decoded.customerDisplayName)
        assertEquals("0900000003", decoded.customerPhoneNumber)
        assertEquals(true, decoded.canConfirm)
        assertEquals(true, decoded.needsVendorAttention)
        assertEquals(ReservationStatusTone.Attention, decoded.statusTone)
    }

    @Test
    fun paginatedResultUsesItemsBeforeLegacyData() {
        val raw = """
            {
              "items": [{"id":"v1","status":"paid"}],
              "data": [{"id":"v2","status":"redeemed"}]
            }
        """.trimIndent()

        val decoded = json.decodeFromString(PaginatedResult.serializer(Voucher.serializer()), raw)

        assertEquals("v1", decoded.values().first().id)
    }

    @Test
    fun pushTokenRequestEncodesAndroidPlatform() {
        val encoded = json.encodeToString(
            PushTokenRequest.serializer(),
            PushTokenRequest(token = "fcm-token", platform = "android"),
        )

        assertEquals("""{"token":"fcm-token","platform":"android"}""", encoded)
    }
}
