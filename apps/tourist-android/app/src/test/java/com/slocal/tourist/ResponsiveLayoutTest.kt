package vn.sloco.tourist

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ResponsiveLayoutTest {
    @Test
    fun tabletBreakpointStartsAtExpandedWidth() {
        assertFalse(isTabletWidth(599))
        assertTrue(isTabletWidth(600))
    }

    @Test
    fun serviceGridUsesMoreColumnsOnWideScreens() {
        assertEquals(2, serviceGridColumnsForWidth(390))
        assertEquals(3, serviceGridColumnsForWidth(700))
        assertEquals(4, serviceGridColumnsForWidth(980))
    }

    @Test
    fun readableWidthCapsTabletContent() {
        assertEquals(390, readableContentWidthForWidth(390))
        assertEquals(980, readableContentWidthForWidth(1200))
    }
}
