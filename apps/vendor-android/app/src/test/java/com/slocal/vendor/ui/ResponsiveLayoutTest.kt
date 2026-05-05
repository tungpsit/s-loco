package vn.sloco.vendor.ui

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
    fun readableWidthCapsTabletContent() {
        assertEquals(412, readableContentWidthForWidth(412))
        assertEquals(920, readableContentWidthForWidth(1200))
    }
}
