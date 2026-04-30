package com.slocal.vendor.ui

enum class LoadingTask(val message: String) {
    Login("Đang đăng nhập..."),
    Home("Đang tải dữ liệu cửa hàng..."),
    Orders("Đang tải đơn hàng..."),
    RedeemQr("Đang xác thực voucher..."),
    CompleteVoucher("Đang hoàn thành voucher..."),
}
