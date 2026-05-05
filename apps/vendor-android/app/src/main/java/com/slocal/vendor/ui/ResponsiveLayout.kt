package vn.sloco.vendor.ui

internal const val TABLET_BREAKPOINT_DP = 600
internal const val VENDOR_CONTENT_MAX_WIDTH_DP = 920
internal const val VENDOR_FORM_MAX_WIDTH_DP = 520

internal fun isTabletWidth(widthDp: Int): Boolean = widthDp >= TABLET_BREAKPOINT_DP

internal fun readableContentWidthForWidth(
    widthDp: Int,
    maxWidthDp: Int = VENDOR_CONTENT_MAX_WIDTH_DP,
): Int = minOf(widthDp, maxWidthDp)
