package vn.sloco.vendor.ui

import org.junit.Assert.assertEquals
import org.junit.Test

class LoadingTaskTest {
    @Test
    fun loadingTasksExposeVietnameseMessagesForApiWork() {
        assertEquals("Đang đăng nhập...", LoadingTask.Login.message)
        assertEquals("Đang tải dữ liệu cửa hàng...", LoadingTask.Home.message)
        assertEquals("Đang tải đơn hàng...", LoadingTask.Orders.message)
        assertEquals("Đang xác thực voucher...", LoadingTask.RedeemQr.message)
        assertEquals("Đang hoàn thành voucher...", LoadingTask.CompleteVoucher.message)
    }
}
