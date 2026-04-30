package com.slocal.vendor.ui

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.slocal.vendor.data.ApiException
import com.slocal.vendor.data.Dashboard
import com.slocal.vendor.data.Settlement
import com.slocal.vendor.data.ReservationWire
import com.slocal.vendor.data.SessionExpiredException
import com.slocal.vendor.data.TokenStore
import com.slocal.vendor.data.VendorApi
import com.slocal.vendor.data.VendorProfile
import com.slocal.vendor.data.VendorUser
import com.slocal.vendor.data.Voucher
import com.slocal.vendor.data.VoucherPreview
import com.slocal.vendor.VendorPushRegistrar
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class AppState(context: Context) {
    private val tokenStore = TokenStore(context)
    private val api = VendorApi(tokenStore)
    private val pushRegistrar = VendorPushRegistrar(context.applicationContext)

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
    var reservations by mutableStateOf<List<ReservationWire>>(emptyList())
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
    var selectedReservation by mutableStateOf<ReservationWire?>(null)
        private set
    private var refreshJob: Job? = null

    val isAuthenticated: Boolean
        get() = !tokenStore.accessToken.isNullOrBlank() || !tokenStore.refreshToken.isNullOrBlank()

    val isLoading: Boolean
        get() = loadingTask != null

    val loadingMessage: String
        get() = loadingTask?.message.orEmpty()

    suspend fun bootstrap() = runLoading(LoadingTask.Home) {
        if (!isAuthenticated) return@runLoading
        startTokenRefreshLoop()
        api.refreshAccessTokenIfNeeded()
        registerPushToken()
        reloadHome()
    }

    suspend fun login(email: String, password: String) = runLoading(LoadingTask.Login) {
        val login = api.login(email.trim(), password)
        user = login.user
        startTokenRefreshLoop()
        vendor = api.vendorProfile()
        registerPushToken()
        reloadHome()
        message = null
    }

    suspend fun refreshHome() = runLoading(LoadingTask.Home) {
        if (isAuthenticated) registerPushToken()
        reloadHome()
    }

    suspend fun refreshOrders(status: String? = null) = runLoading(LoadingTask.Orders) {
        vouchers = api.vouchers(status)
    }

    suspend fun refreshReservations(status: String? = null) = runLoading(LoadingTask.Reservations) {
        reservations = api.reservations(status)
    }

    suspend fun confirmReservation(id: String) = runLoading(LoadingTask.ReservationAction) {
        api.confirmReservation(id)
        reservations = api.reservations()
        selectedReservation = reservations.firstOrNull { it.id == id } ?: selectedReservation
        message = "Đã xác nhận và phát hành voucher iPos."
    }

    suspend fun rejectReservation(id: String) = runLoading(LoadingTask.ReservationAction) {
        api.rejectReservation(id)
        reservations = api.reservations()
        selectedReservation = reservations.firstOrNull { it.id == id } ?: selectedReservation
        message = "Đã từ chối đặt chỗ."
    }

    suspend fun retryReservationVoucher(voucherId: String) = runLoading(LoadingTask.ReservationAction) {
        api.retryReservationVoucher(voucherId)
        reservations = api.reservations()
        selectedReservation = selectedReservation?.let { current ->
            reservations.firstOrNull { it.id == current.id } ?: current
        }
        message = "Đã thử phát hành lại voucher iPos."
    }

    suspend fun updateIposStoreId(value: String) = runLoading(LoadingTask.Settings) {
        val currentVendor = vendor ?: throw IllegalStateException("Chưa tải thông tin cửa hàng.")
        vendor = api.updateIposStoreId(currentVendor.id, value.trim())
        message = "Đã lưu iPos store ID."
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
        refreshJob?.cancel()
        refreshJob = null
        tokenStore.clear()
        user = null
        vendor = null
        dashboard = null
        vouchers = emptyList()
        settlements = emptyList()
        reservations = emptyList()
        selectedReservation = null
        selectedTab = AppTab.Dashboard
        message = null
    }

    fun openReservation(reservation: ReservationWire) {
        selectedReservation = reservation
    }

    fun closeReservation() {
        selectedReservation = null
    }

    fun clearMessage() {
        message = null
    }

    private suspend fun reloadHome() {
        dashboard = api.dashboard()
        vouchers = api.vouchers()
        settlements = api.settlements()
        reservations = api.reservations()
    }

    private suspend fun registerPushToken() {
        try {
            pushRegistrar.registerCurrentToken()
        } catch (error: Exception) {
            println("Unable to register FCM token: ${error.message}")
        }
    }

    private fun startTokenRefreshLoop() {
        if (refreshJob != null) return
        refreshJob = MainScope().launch {
            while (true) {
                delay(60_000)
                refreshSessionIfNeeded()
            }
        }
    }

    private suspend fun refreshSessionIfNeeded() {
        if (!isAuthenticated) return
        try {
            api.refreshAccessTokenIfNeeded()
        } catch (_: Exception) {
            expireSession(showMessage = true)
        }
    }

    private fun expireSession(showMessage: Boolean) {
        refreshJob?.cancel()
        refreshJob = null
        tokenStore.clear()
        user = null
        vendor = null
        dashboard = null
        vouchers = emptyList()
        settlements = emptyList()
        reservations = emptyList()
        selectedReservation = null
        selectedTab = AppTab.Dashboard
        qrPreview = null
        redeemedVoucher = null
        if (showMessage) message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    }

    private suspend fun runLoading(task: LoadingTask, block: suspend () -> Unit) {
        loadingTask = task
        try {
            block()
        } catch (error: SessionExpiredException) {
            expireSession(showMessage = true)
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
