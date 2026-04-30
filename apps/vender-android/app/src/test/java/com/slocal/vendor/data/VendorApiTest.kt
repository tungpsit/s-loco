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
              "tokens": {"access_token":"access","refresh_token":"refresh"}
            }
        """.trimIndent()

        val decoded = json.decodeFromString(LoginData.serializer(), raw)

        assertEquals("access", decoded.tokens?.accessToken)
        assertEquals("refresh", decoded.tokens?.refreshToken)
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
}
