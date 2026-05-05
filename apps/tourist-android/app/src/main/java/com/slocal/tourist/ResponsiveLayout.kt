package vn.sloco.tourist

internal const val TABLET_BREAKPOINT_DP = 600
internal const val TOURIST_CONTENT_MAX_WIDTH_DP = 980
internal const val TOURIST_DETAIL_MAX_WIDTH_DP = 860

internal fun isTabletWidth(widthDp: Int): Boolean = widthDp >= TABLET_BREAKPOINT_DP

internal fun serviceGridColumnsForWidth(widthDp: Int): Int = when {
    widthDp >= 900 -> 4
    widthDp >= TABLET_BREAKPOINT_DP -> 3
    else -> 2
}

internal fun readableContentWidthForWidth(
    widthDp: Int,
    maxWidthDp: Int = TOURIST_CONTENT_MAX_WIDTH_DP,
): Int = minOf(widthDp, maxWidthDp)
