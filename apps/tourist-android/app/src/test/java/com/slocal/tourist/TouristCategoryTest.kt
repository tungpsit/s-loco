package vn.sloco.tourist

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
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

    @Test
    fun itineraryPayloadOmitsNearStayOptionsWhenUnset() {
        val payload = itineraryPayload(
            days = 3,
            budget = 3_000_000,
            preferences = "Ẩm thực, biển",
        )

        assertEquals(JsonPrimitive(3), payload["days"])
        assertEquals(JsonPrimitive(3_000_000), payload["budget"])
        assertEquals(JsonPrimitive("couple"), payload["group_type"])
        assertNull(payload["stay_location_label"])
        assertNull(payload["stay_latitude"])
        assertNull(payload["stay_longitude"])
        assertNull(payload["prefer_near_stay"])
    }

    @Test
    fun itineraryPayloadOmitsStayWhenPreferNearStayDisabled() {
        val payload = itineraryPayload(
            days = 2,
            budget = 2_000_000,
            preferences = "Biển",
            stay = ItineraryStayContext("FLC Sầm Sơn", 19.742, 105.901),
            preferNearStay = false,
        )

        assertNull(payload["stay_location_label"])
        assertNull(payload["stay_latitude"])
        assertNull(payload["stay_longitude"])
        assertNull(payload["prefer_near_stay"])
    }

    @Test
    fun itineraryPayloadIncludesNearStayOptionsWhenProvided() {
        val payload = itineraryPayload(
            days = 2,
            budget = 2_000_000,
            preferences = "Biển",
            groupType = "family",
            stay = ItineraryStayContext("FLC Sầm Sơn", 19.742, 105.901),
            preferNearStay = true,
        )

        assertEquals(JsonPrimitive("family"), payload["group_type"])
        assertEquals(JsonPrimitive("FLC Sầm Sơn"), payload["stay_location_label"])
        assertEquals(JsonPrimitive(19.742), payload["stay_latitude"])
        assertEquals(JsonPrimitive(105.901), payload["stay_longitude"])
        assertEquals(JsonPrimitive(true), payload["prefer_near_stay"])
    }
}
