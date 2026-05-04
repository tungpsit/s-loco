package vn.sloco.vendor.data

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

    @Test
    fun vendorServiceDecodesDrizzleCamelCaseShape() {
        val raw = """
            {
              "id": "s1",
              "name": "Buffet hải sản",
              "categoryId": "c1",
              "originalPrice": "350000.00",
              "discountPrice": "299000.00",
              "fulfillmentType": "reservation",
              "reservationDiscountPercent": "10.00",
              "durationMinutes": 90,
              "maxQuantityPerOrder": 6,
              "isActive": true,
              "images": ["https://example.com/a.jpg"]
            }
        """.trimIndent()

        val decoded = json.decodeFromString(VendorService.serializer(), raw)

        assertEquals("c1", decoded.categoryIdValue)
        assertEquals(350_000L, decoded.originalPriceValue)
        assertEquals(299_000L, decoded.discountPriceValue)
        assertEquals("reservation", decoded.fulfillmentTypeValue)
        assertEquals(PRODUCT_TYPE_COUPON, decoded.productTypeValue)
        assertEquals("10.00", decoded.reservationDiscountPercentValue)
        assertEquals(90, decoded.durationMinutesValue)
        assertEquals(6, decoded.maxQuantityPerOrderValue)
        assertEquals(true, decoded.activeValue)
    }

    @Test
    fun createServiceRequestEncodesApiShape() {
        val encoded = json.encodeToString(
            CreateServiceRequest.serializer(),
            CreateServiceRequest(
                name = "Buffet hải sản",
                slug = "buffet-hai-san",
                categoryId = "c1",
                originalPrice = "350000",
                discountPrice = "299000",
                productType = PRODUCT_TYPE_TICKET,
                fulfillmentType = SERVICE_TYPE_FIXED_PRICE,
                durationMinutes = 90,
                maxQuantityPerOrder = 6,
                images = listOf("https://example.com/a.jpg"),
            ),
        )

        assertEquals(
            """{"name":"Buffet hải sản","slug":"buffet-hai-san","category_id":"c1","original_price":"350000","discount_price":"299000","product_type":"ticket","duration_minutes":90,"max_quantity_per_order":6,"images":["https://example.com/a.jpg"]}""",
            encoded,
        )
    }

    @Test
    fun createReservationServiceRequestEncodesApiShape() {
        val encoded = json.encodeToString(
            CreateServiceRequest.serializer(),
            CreateServiceRequest(
                name = "Đặt bàn hải sản",
                slug = "dat-ban-hai-san",
                categoryId = "c1",
                originalPrice = "0",
                productType = PRODUCT_TYPE_COUPON,
                fulfillmentType = SERVICE_TYPE_RESERVATION,
                reservationDiscountPercent = "10",
            ),
        )

        assertEquals(
            """{"name":"Đặt bàn hải sản","slug":"dat-ban-hai-san","category_id":"c1","original_price":"0","product_type":"coupon","fulfillment_type":"reservation","reservation_discount_percent":"10"}""",
            encoded,
        )
    }

    @Test
    fun settlementDecodesPaymentDirection() {
        val raw = """
            {
              "id": "st1",
              "status": "pending",
              "net_amount": "240000.00",
              "direction": "vendor_pays_sloco",
              "voucher_count": 2
            }
        """.trimIndent()

        val decoded = json.decodeFromString(Settlement.serializer(), raw)

        assertEquals("vendor_pays_sloco", decoded.directionValue)
    }

    @Test
    fun updateVendorSettingsRequestEncodesLocationFields() {
        val encoded = json.encodeToString(
            UpdateVendorSettingsRequest.serializer(),
            UpdateVendorSettingsRequest(
                address = "123 Hồ Xuân Hương",
                latitude = "19.7450000",
                longitude = "105.9010000",
            ),
        )

        assertEquals(
            """{"address":"123 Hồ Xuân Hương","latitude":"19.7450000","longitude":"105.9010000"}""",
            encoded,
        )
    }
}
