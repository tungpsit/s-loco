package vn.sloco.vendor.ui

import android.content.Context
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import vn.sloco.vendor.data.ApiException
import vn.sloco.vendor.data.ApplicabilityPolicyRequest
import vn.sloco.vendor.data.CreateServiceRequest
import vn.sloco.vendor.data.Dashboard
import vn.sloco.vendor.data.ReservationWire
import vn.sloco.vendor.data.Settlement
import vn.sloco.vendor.data.PRODUCT_TYPE_COUPON
import vn.sloco.vendor.data.fulfillmentTypeForProductType
import vn.sloco.vendor.data.SessionExpiredException
import vn.sloco.vendor.data.ServiceCategory
import vn.sloco.vendor.data.TokenStore
import vn.sloco.vendor.data.UpdateServiceRequest
import vn.sloco.vendor.data.VendorApi
import vn.sloco.vendor.data.VendorProfile
import vn.sloco.vendor.data.VendorService
import vn.sloco.vendor.data.VendorUser
import vn.sloco.vendor.data.Voucher
import vn.sloco.vendor.data.VoucherPreview
import vn.sloco.vendor.VendorPushRegistrar
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class AppState(context: Context) {
    private val appContext = context.applicationContext
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
    var services by mutableStateOf<List<VendorService>>(emptyList())
        private set
    var serviceCategories by mutableStateOf<List<ServiceCategory>>(emptyList())
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
    var editingService by mutableStateOf<VendorService?>(null)
        private set
    var isCreatingService by mutableStateOf(false)
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
        vendor = api.vendorProfile()
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

    suspend fun refreshServices() = runLoading(LoadingTask.Services) {
        serviceCategories = api.serviceCategories()
        val currentVendor = vendor ?: api.vendorProfile().also { vendor = it }
        services = api.services(currentVendor.id)
    }

    suspend fun uploadServiceImage(uri: Uri): String {
        val resolver = appContext.contentResolver
        val mimeType = resolver.getType(uri) ?: "image/jpeg"
        require(mimeType in allowedImageMimeTypes) { "Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc GIF." }
        val bytes = resolver.openInputStream(uri)?.use { it.readBytes() }
            ?: throw IllegalArgumentException("Không đọc được ảnh đã chọn.")
        require(bytes.size <= maxImageBytes) { "Ảnh không được vượt quá 5MB." }
        val extension = when (mimeType) {
            "image/png" -> "png"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            else -> "jpg"
        }
        return api.uploadServiceImage(
            bytes = bytes,
            filename = "service-${System.currentTimeMillis()}.$extension",
            mimeType = mimeType,
        ).url
    }

    suspend fun saveService(
        service: VendorService?,
        name: String,
        categoryId: String,
        description: String,
        productType: String,
        originalPrice: String,
        discountPrice: String,
        reservationDiscountPercent: String,
        policyWeekdays: Set<Int>,
        excludePublicHolidays: Boolean,
        blackoutDates: String,
        policyConditions: String,
        durationMinutes: String,
        maxQuantityPerOrder: String,
        imageUrls: String,
        isActive: Boolean,
    ) = runLoading(LoadingTask.Services) {
        val currentVendor = vendor ?: api.vendorProfile().also { vendor = it }
        val cleanedName = name.trim()
        val cleanedCategoryId = categoryId.trim()
        val isCoupon = productType == PRODUCT_TYPE_COUPON
        val fulfillmentType = fulfillmentTypeForProductType(productType)
        val cleanedPrice = originalPrice.onlyDigits().ifBlank { if (isCoupon) "0" else "" }
        val cleanedDiscount = discountPrice.onlyDigits()
        val cleanedReservationDiscount = reservationDiscountPercent.onlyPercent()
        require(cleanedName.length >= 2) { "Vui lòng nhập tên dịch vụ." }
        require(cleanedCategoryId.isNotBlank()) { "Vui lòng chọn danh mục." }
        require(cleanedPrice.isNotBlank()) { "Vui lòng nhập giá gốc." }
        if (isCoupon) {
            require(cleanedReservationDiscount.isNotBlank()) { "Vui lòng nhập % ưu đãi coupon." }
        }
        if (!isCoupon && cleanedDiscount.isNotBlank()) {
            require(cleanedDiscount.toLong() <= cleanedPrice.toLong()) { "Giá khuyến mãi không được lớn hơn giá gốc." }
        }
        val duration = durationMinutes.onlyDigits().toIntOrNull()
        val maxQuantity = maxQuantityPerOrder.onlyDigits().toIntOrNull()
        val cleanedBlackoutDates = blackoutDates
            .lineSequence()
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .toList()
        val policy = ApplicabilityPolicyRequest(
            weekdays = policyWeekdays.sorted().takeIf { it.isNotEmpty() },
            excludePublicHolidays = excludePublicHolidays.takeIf { it },
            blackoutDates = cleanedBlackoutDates.takeIf { it.isNotEmpty() },
            conditions = policyConditions.trim().takeIf { it.isNotBlank() },
        )
        val images = imageUrls
            .lineSequence()
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .toList()
            .takeIf { it.isNotEmpty() }

        if (service == null) {
            api.createService(
                currentVendor.id,
                CreateServiceRequest(
                    name = cleanedName,
                    slug = slugify(cleanedName),
                    categoryId = cleanedCategoryId,
                    description = description.trim().takeIf { it.isNotBlank() },
                    originalPrice = cleanedPrice,
                    discountPrice = cleanedDiscount.takeIf { !isCoupon && it.isNotBlank() },
                    productType = productType,
                    fulfillmentType = fulfillmentType,
                    reservationDiscountPercent = cleanedReservationDiscount.takeIf { isCoupon },
                    applicabilityPolicy = policy,
                    durationMinutes = duration,
                    maxQuantityPerOrder = maxQuantity,
                    images = images,
                ),
            )
            message = "Đã thêm dịch vụ."
        } else {
            api.updateService(
                service.id,
                UpdateServiceRequest(
                    name = cleanedName,
                    categoryId = cleanedCategoryId,
                    description = description.trim().takeIf { it.isNotBlank() },
                    originalPrice = cleanedPrice,
                    discountPrice = cleanedDiscount.takeIf { !isCoupon && it.isNotBlank() },
                    productType = productType,
                    fulfillmentType = fulfillmentType,
                    reservationDiscountPercent = cleanedReservationDiscount.takeIf { isCoupon },
                    applicabilityPolicy = policy,
                    durationMinutes = duration,
                    maxQuantityPerOrder = maxQuantity,
                    isActive = isActive,
                    images = images,
                ),
            )
            message = "Đã cập nhật dịch vụ."
        }
        services = api.services(currentVendor.id)
        closeServiceEditor()
    }

    suspend fun deleteService(service: VendorService) = runLoading(LoadingTask.Services) {
        api.deleteService(service.id)
        val currentVendor = vendor ?: api.vendorProfile().also { vendor = it }
        services = api.services(currentVendor.id)
        closeServiceEditor()
        message = "Đã xóa dịch vụ."
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

    suspend fun updateVendorSettings(address: String, latitude: String, longitude: String) = runLoading(LoadingTask.Settings) {
        val currentVendor = vendor ?: throw IllegalStateException("Chưa tải thông tin cửa hàng.")
        val cleanedLatitude = latitude.trim()
        val cleanedLongitude = longitude.trim()
        validateCoordinate(cleanedLatitude, -90.0, 90.0, "Vĩ độ")
        validateCoordinate(cleanedLongitude, -180.0, 180.0, "Kinh độ")
        vendor = api.updateVendorSettings(
            vendorId = currentVendor.id,
            address = address.trim(),
            latitude = cleanedLatitude.ifBlank { null },
            longitude = cleanedLongitude.ifBlank { null },
        )
        message = "Đã lưu vị trí cửa hàng."
    }

    suspend fun changePassword(currentPassword: String, newPassword: String, confirmPassword: String) = runLoading(LoadingTask.Settings) {
        require(newPassword == confirmPassword) { "Mật khẩu xác nhận không khớp." }
        api.changePassword(currentPassword, newPassword)
        logout()
        message = "Đã đổi mật khẩu. Vui lòng đăng nhập lại."
    }

    suspend fun resetPassword() = runLoading(LoadingTask.Settings) {
        val result = api.resetPassword()
        logout()
        message = "Mật khẩu tạm thời: ${result.temporaryPassword}. Vui lòng đăng nhập lại và đổi mật khẩu."
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
        services = emptyList()
        serviceCategories = emptyList()
        selectedReservation = null
        closeServiceEditor()
        selectedTab = AppTab.Dashboard
        message = null
    }

    fun openReservation(reservation: ReservationWire) {
        selectedReservation = reservation
    }

    fun closeReservation() {
        selectedReservation = null
    }

    fun openNewService() {
        isCreatingService = true
        editingService = null
    }

    fun openEditService(service: VendorService) {
        editingService = service
        isCreatingService = false
    }

    fun closeServiceEditor() {
        isCreatingService = false
        editingService = null
    }

    fun clearMessage() {
        message = null
    }

    fun showMessage(value: String) {
        message = value
    }

    private suspend fun reloadHome() {
        serviceCategories = api.serviceCategories()
        val currentVendor = vendor ?: api.vendorProfile().also { vendor = it }
        dashboard = api.dashboard()
        vouchers = api.vouchers()
        settlements = api.settlements()
        reservations = api.reservations()
        services = api.services(currentVendor.id)
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
        services = emptyList()
        serviceCategories = emptyList()
        selectedReservation = null
        closeServiceEditor()
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
    Services("Dịch vụ"),
    Earnings("Thu nhập"),
    Settings("Thêm"),

    ;

    companion object {
        val visibleEntries = listOf(Dashboard, Scan, Orders, Services, Settings)
    }
}

private fun String.onlyDigits(): String = filter { it.isDigit() }

private fun String.onlyPercent(): String = filter { it.isDigit() || it == '.' }.trim('.')

private val allowedImageMimeTypes = setOf("image/jpeg", "image/png", "image/webp", "image/gif")
private const val maxImageBytes = 5 * 1024 * 1024

private fun validateCoordinate(value: String, min: Double, max: Double, label: String) {
    if (value.isBlank()) return
    val number = value.toDoubleOrNull()
    require(number != null && number in min..max) { "$label không hợp lệ." }
}

private fun slugify(value: String): String {
    val normalized = java.text.Normalizer
        .normalize(value.lowercase(), java.text.Normalizer.Form.NFD)
        .replace("\\p{Mn}+".toRegex(), "")
        .replace("đ", "d")
    return normalized
        .replace("[^a-z0-9\\s-]".toRegex(), "")
        .trim()
        .replace("\\s+".toRegex(), "-")
        .ifBlank { "dich-vu-${System.currentTimeMillis()}" }
}
