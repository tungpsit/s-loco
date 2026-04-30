package com.slocal.tourist

import org.junit.Assert.assertEquals
import org.junit.Test
import kotlinx.serialization.json.JsonPrimitive

class TouristCategoryTest {
    @Test
    fun categoryLabelsResolveToApiSlugs() {
        assertEquals("am-thuc", touristCategoryApiValue("Ẩm thực"))
        assertEquals("spa-massage", touristCategoryApiValue("Spa"))
        assertEquals("spa-massage", touristCategoryApiValue("Spa & Massage"))
        assertEquals("", touristCategoryApiValue("Tất cả"))
        assertEquals("", touristCategoryApiValue(""))
        assertEquals(
            listOf("", "am-thuc", "luu-tru", "spa-massage", "xe-dien", "giai-tri", "mua-sam"),
            touristCategories.map { it.value }
        )
    }

    @Test
    fun pushTokenPayloadUsesAndroidPlatform() {
        val payload = pushTokenPayload("fcm-token")

        assertEquals(JsonPrimitive("fcm-token"), payload["token"])
        assertEquals(JsonPrimitive("android"), payload["platform"])
    }
}
