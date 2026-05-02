package com.slocal.vendor.ui

enum class LoadingTask(val message: String) {
    Login("Đang đăng nhập..."),
    Home("Đang tải dữ liệu cửa hàng..."),
    Orders("Đang tải đơn hàng..."),
    Services("Đang tải dịch vụ..."),
    RedeemQr("Đang xác thực voucher..."),
    CompleteVoucher("Đang hoàn thành voucher..."),
    Reservations("Đang tải đặt chỗ..."),
    ReservationAction("Đang xử lý đặt chỗ..."),
    Settings("Đang lưu cài đặt..."),
}
