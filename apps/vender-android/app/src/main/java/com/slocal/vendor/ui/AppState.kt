package com.slocal.vendor.ui

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.slocal.vendor.data.ApiException
import com.slocal.vendor.data.Dashboard
import com.slocal.vendor.data.Settlement
import com.slocal.vendor.data.TokenStore
import com.slocal.vendor.data.VendorApi
import com.slocal.vendor.data.VendorProfile
import com.slocal.vendor.data.VendorUser
import com.slocal.vendor.data.Voucher
import com.slocal.vendor.data.VoucherPreview

class AppState(context: Context) {
    private val tokenStore = TokenStore(context)
    private val api = VendorApi(tokenStore)

    var user by mutableStateOf<VendorUser?>(null)
        private set
    var vendor by mutableStateOf<VendorProfile?>(null)
        private set
    var dashboard by mutableStateOf<Dashboard?>(null)
        private set
    var vouchers by mutableStateOf<List<Voucher>>(emptyList())
        private set
    var settlements by mutableStateOf<List<Settlement>>(emptyList())
        private set
    var selectedTab by mutableStateOf(AppTab.Dashboard)
    var loadingTask by mutableStateOf<LoadingTask?>(null)
        private set
    var message by mutableStateOf<String?>(null)
        private set
    var qrPreview by mutableStateOf<VoucherPreview?>(null)
        private set
    var redeemedVoucher by mutableStateOf<Voucher?>(null)
        private set

    val isAuthenticated: Boolean
        get() = !tokenStore.accessToken.isNullOrBlank()

    val isLoading: Boolean
        get() = loadingTask != null

    val loadingMessage: String
        get() = loadingTask?.message.orEmpty()

    suspend fun login(email: String, password: String) = runLoading(LoadingTask.Login) {
        val login = api.login(email.trim(), password)
        user = login.user
        vendor = api.vendorProfile()
        reloadHome()
        message = null
    }

    suspend fun refreshHome() = runLoading(LoadingTask.Home) {
        reloadHome()
    }

    suspend fun refreshOrders(status: String? = null) = runLoading(LoadingTask.Orders) {
        vouchers = api.vouchers(status)
    }

    suspend fun verifyQr(token: String) = runLoading(LoadingTask.RedeemQr) {
        qrPreview = api.verifyQr(token.trim())
        redeemedVoucher = null
    }

    suspend fun redeemQr(token: String) = runLoading(LoadingTask.RedeemQr) {
        val preview = api.verifyQr(token.trim())
        if (!preview.canRedeem) {
            throw IllegalStateException("Voucher trạng thái ${preview.status}, không thể đổi.")
        }
        qrPreview = preview
        redeemedVoucher = api.redeemQr(token.trim())
        vouchers = api.vouchers()
    }

    suspend fun completeRedeemedVoucher() {
        val voucher = redeemedVoucher ?: return
        runLoading(LoadingTask.CompleteVoucher) {
            redeemedVoucher = api.completeVoucher(voucher.id)
            vouchers = api.vouchers()
        }
    }

    fun logout() {
        tokenStore.clear()
        user = null
        vendor = null
        dashboard = null
        vouchers = emptyList()
        settlements = emptyList()
        selectedTab = AppTab.Dashboard
        message = null
    }

    fun clearMessage() {
        message = null
    }

    private suspend fun reloadHome() {
        dashboard = api.dashboard()
        vouchers = api.vouchers()
        settlements = api.settlements()
    }

    private suspend fun runLoading(task: LoadingTask, block: suspend () -> Unit) {
        loadingTask = task
        try {
            block()
        } catch (error: ApiException) {
            message = error.message
        } catch (error: Exception) {
            message = error.message ?: "Đã có lỗi xảy ra."
        } finally {
            loadingTask = null
        }
    }
}

enum class AppTab(val label: String) {
    Dashboard("Trang chủ"),
    Scan("Quét QR"),
    Orders("Đơn hàng"),
    Earnings("Thu nhập"),
    Settings("Cài đặt"),
}
