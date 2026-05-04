package vn.sloco.vendor.ui

import android.Manifest
import android.annotation.SuppressLint
import android.app.DatePickerDialog
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.Looper
import android.webkit.WebView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.AssistChip
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import vn.sloco.vendor.MainActivity
import vn.sloco.vendor.data.Settlement
import vn.sloco.vendor.data.ReservationWire
import vn.sloco.vendor.data.ReservationStatusTone
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import vn.sloco.vendor.data.PRODUCT_TYPE_COUPON
import vn.sloco.vendor.data.PRODUCT_TYPE_TICKET
import vn.sloco.vendor.data.PRODUCT_TYPE_VOUCHER
import vn.sloco.vendor.data.ServiceCategory
import vn.sloco.vendor.data.VendorProfile
import vn.sloco.vendor.data.VendorService
import vn.sloco.vendor.data.Voucher
import java.text.NumberFormat
import java.util.Calendar
import java.util.Locale
import kotlinx.coroutines.launch

private val Primary = Color(0xFF005E97)
private val SurfaceBg = Color(0xFFF4F7FB)
private val Success = Color(0xFF2E7D32)
private val Warning = Color(0xFFE65100)
private val Danger = Color(0xFFC62828)
private const val LEGAL_PRIVACY_URL = "https://sloco.vn/privacy"
private const val LEGAL_TERMS_URL = "https://sloco.vn/terms"
private const val LEGAL_SUPPORT_URL = "https://sloco.vn/support"
private const val LEGAL_DELETE_ACCOUNT_URL = "https://sloco.vn/delete-account"

@Composable
fun VendorApp() {
    val context = LocalContext.current.applicationContext
    val state = remember { AppState(context) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        state.bootstrap()
    }

    LaunchedEffect(state.message) {
        val message = state.message ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(message)
        state.clearMessage()
    }

    MaterialTheme {
        Surface(modifier = Modifier.fillMaxSize(), color = SurfaceBg) {
            Box(Modifier.fillMaxSize()) {
                if (!state.isAuthenticated) {
                    LoginScreen(state)
                } else {
                    Scaffold(
                        bottomBar = {
                            NavigationBar {
                                AppTab.visibleEntries.forEach { tab ->
                                    NavigationBarItem(
                                        selected = state.selectedTab == tab,
                                        onClick = { state.selectedTab = tab },
                                        icon = { Text(tab.label.take(1)) },
                                        label = { Text(tab.label) },
                                    )
                                }
                            }
                        },
                    ) { padding ->
                        Box(Modifier.padding(padding)) {
                            val selectedReservation = state.selectedReservation
                            if (selectedReservation != null) {
                                ReservationDetailScreen(state, selectedReservation)
                            } else {
                                when (state.selectedTab) {
                                    AppTab.Dashboard -> DashboardScreen(state)
                                    AppTab.Scan -> ScanScreen(state)
                                    AppTab.Orders -> OrdersScreen(state)
                                    AppTab.Services -> {
                                        if (state.isCreatingService || state.editingService != null) {
                                            ServiceEditorScreen(state, state.editingService)
                                        } else {
                                            ServicesScreen(state)
                                        }
                                    }
                                    AppTab.Earnings -> EarningsScreen(state)
                                    AppTab.Settings -> SettingsScreen(state)
                                }
                            }
                        }
                    }
                }

                if (state.isLoading) {
                    LoadingOverlay(state.loadingMessage)
                }
                SnackbarHost(
                    hostState = snackbarHostState,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                )
            }
        }
    }
}

@Composable
private fun LoadingOverlay(message: String) {
    Box(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.12f)),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.White),
            shape = RoundedCornerShape(14.dp),
        ) {
            Column(
                Modifier
                    .widthIn(min = 220.dp, max = 300.dp)
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                CircularProgressIndicator(color = Primary)
                Text(
                    text = message.ifBlank { "Đang tải..." },
                    color = Color(0xFF161B2E),
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}

@Composable
private fun LoginScreen(state: AppState) {
    val scope = rememberCoroutineScope()
    varTextField(
        title = "S-Loco Vendor",
        subtitle = "Quản lý cửa hàng của bạn",
        buttonLabel = "Đăng nhập",
        secureSecond = true,
        firstLabel = "Email",
        secondLabel = "Mật khẩu",
        firstPlaceholder = "vendor@samson.vn",
        secondPlaceholder = "••••••••",
        enabled = !state.isLoading,
        onSubmit = { email, password -> scope.launch { state.login(email, password) } },
    )
}

@Composable
private fun DashboardScreen(state: AppState) {
    ScreenList(title = "Chào ${state.vendor?.name ?: state.user?.fullName ?: "chủ cửa hàng"}") {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                StatCard("Đơn hôm nay", "${state.dashboard?.today?.orders ?: 0}", Modifier.weight(1f))
                StatCard("Doanh thu", formatVnd(state.dashboard?.today?.revenue), Modifier.weight(1f))
            }
        }
        item {
            StatCard("Chờ giải ngân", formatVnd(state.dashboard?.settlement?.pendingAmount), Modifier.fillMaxWidth(), Warning)
        }
        item { SectionTitle("Voucher gần đây") }
        items(state.dashboard?.recentOrders ?: state.vouchers.take(5)) { voucher ->
            VoucherCard(voucher)
        }
        item { SectionTitle("Đặt chỗ mới") }
        items(state.reservations.take(5)) { reservation ->
            ReservationCard(state, reservation)
        }
    }
}

@Composable
private fun ScanScreen(state: AppState) {
    val scope = rememberCoroutineScope()
    varTextField(
        title = "Quét QR",
        subtitle = "Nhập hoặc dán QR token để xác thực với API thật.",
        buttonLabel = "Xác thực và đổi voucher",
        firstLabel = "QR token",
        secondLabel = "Ghi chú",
        firstPlaceholder = "eyJhbGciOiJI...",
        secondPlaceholder = "Không bắt buộc",
        enabled = !state.isLoading,
        onSubmit = { token, _ -> scope.launch { state.redeemQr(token) } },
        extra = {
            state.qrPreview?.let { preview ->
                InfoCard("Kết quả kiểm tra", "${preview.code} · ${preview.status} · ${if (preview.canRedeem) "Có thể đổi" else "Không thể đổi"}")
            }
            state.redeemedVoucher?.let { voucher ->
                InfoCard("Đã đổi voucher", "${voucher.serviceName ?: voucher.id} · ${formatVnd(voucher.finalAmount)}")
                Button(
                    onClick = { scope.launch { state.completeRedeemedVoucher() } },
                    enabled = !state.isLoading,
                ) {
                    Text("Hoàn thành dịch vụ")
                }
            }
        },
    )
}

@Composable
private fun OrdersScreen(state: AppState) {
    val scope = rememberCoroutineScope()
    val filters = listOf(null to "Tất cả", "paid" to "Chờ đổi", "redeemed" to "Đã đổi", "completed" to "Hoàn thành")
    ScreenList(title = "Đơn hàng") {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                filters.forEach { (status, label) ->
                    OutlinedButton(
                        onClick = { scope.launch { state.refreshOrders(status) } },
                        enabled = !state.isLoading,
                    ) {
                        Text(label)
                    }
                }
            }
        }
        items(state.vouchers) { VoucherCard(it) }
        item { SectionTitle("Đặt chỗ nhà hàng") }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                listOf(null to "Tất cả", "requested" to "Chờ gọi", "voucher_issued" to "Đã có mã", "used" to "Đã dùng").forEach { (status, label) ->
                    OutlinedButton(
                        onClick = { scope.launch { state.refreshReservations(status) } },
                        enabled = !state.isLoading,
                    ) {
                        Text(label)
                    }
                }
            }
        }
        items(state.reservations) { ReservationCard(state, it) }
    }
}

@Composable
private fun ServicesScreen(state: AppState) {
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        if (state.services.isEmpty() && !state.isLoading) {
            state.refreshServices()
        }
    }
    ScreenList(title = "Dịch vụ") {
        item {
            Button(
                onClick = { state.openNewService() },
                enabled = !state.isLoading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Thêm dịch vụ")
            }
        }
        item {
            OutlinedButton(
                onClick = { scope.launch { state.refreshServices() } },
                enabled = !state.isLoading,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Tải lại danh sách")
            }
        }
        if (state.services.isEmpty()) {
            item { InfoCard("Chưa có dịch vụ", "Thêm dịch vụ để khách có thể đặt mua trên S-Loco.") }
        } else {
            items(state.services) { service ->
                ServiceCard(
                    service = service,
                    category = state.serviceCategories.firstOrNull { it.id == service.categoryIdValue },
                    onEdit = { state.openEditService(service) },
                )
            }
        }
    }
}

@Composable
private fun ServiceCard(service: VendorService, category: ServiceCategory?, onEdit: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.clickable(onClick = onEdit),
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(service.name, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Text(category?.name ?: "Chưa rõ danh mục", color = Color(0xFF3B4460), fontSize = 13.sp)
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    ServicePill(service.productLabel, Primary)
                    ServicePill(
                        if (service.activeValue) "Đang bán" else "Tạm ẩn",
                        if (service.activeValue) Success else Warning,
                    )
                }
            }
            if (!service.description.isNullOrBlank()) {
                Text(service.description, color = Color(0xFF3B4460), fontSize = 13.sp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                if (service.productTypeValue == PRODUCT_TYPE_COUPON) {
                    Text("Coupon giảm ${service.reservationDiscountPercentValue.ifBlank { "0" }}% trên hóa đơn", color = Warning, fontWeight = FontWeight.Bold)
                } else {
                    Text(formatVnd(service.originalPriceValue), color = Primary, fontWeight = FontWeight.Bold)
                    service.discountPriceValue?.let {
                        Text("KM ${formatVnd(it)}", color = Warning, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
            TextButton(onClick = onEdit) {
                Text("Sửa dịch vụ")
            }
        }
    }
}

@Composable
private fun ServicePill(text: String, color: Color) {
    Text(
        text = text,
        color = color,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
    )
}

@Composable
private fun ServiceEditorScreen(state: AppState, service: VendorService?) {
    val scope = rememberCoroutineScope()
    val categories = state.serviceCategories
    var name by remember(service?.id) { mutableStateOf(service?.name.orEmpty()) }
    var categoryId by remember(service?.id, categories) {
        mutableStateOf(service?.categoryIdValue?.takeIf { it.isNotBlank() } ?: categories.firstOrNull()?.id.orEmpty())
    }
    var description by remember(service?.id) { mutableStateOf(service?.description.orEmpty()) }
    var productType by remember(service?.id) { mutableStateOf(service?.productTypeValue ?: PRODUCT_TYPE_VOUCHER) }
    var originalPrice by remember(service?.id) { mutableStateOf(service?.originalPriceValue?.takeIf { it > 0 }?.toString().orEmpty()) }
    var discountPrice by remember(service?.id) { mutableStateOf(service?.discountPriceValue?.toString().orEmpty()) }
    var reservationDiscountPercent by remember(service?.id) { mutableStateOf(service?.reservationDiscountPercentValue.orEmpty()) }
    var policyWeekdays by remember(service?.id) {
        mutableStateOf(service?.applicabilityPolicyValue.weekdaysFromPolicy()?.toSet() ?: (1..7).toSet())
    }
    var excludePublicHolidays by remember(service?.id) { mutableStateOf(service?.applicabilityPolicyValue.booleanFromPolicy("exclude_public_holidays") ?: false) }
    var blackoutDates by remember(service?.id) { mutableStateOf(service?.applicabilityPolicyValue.stringArrayFromPolicy("blackout_dates").toSet()) }
    var policyConditions by remember(service?.id) { mutableStateOf(service?.applicabilityPolicyValue.stringFromPolicy("conditions")) }
    var durationMinutes by remember(service?.id) { mutableStateOf(service?.durationMinutesValue?.toString().orEmpty()) }
    var maxQuantity by remember(service?.id) { mutableStateOf(service?.maxQuantityPerOrderValue?.toString() ?: "10") }
    var imageUrls by remember(service?.id) { mutableStateOf(service?.images?.joinToString("\n").orEmpty()) }
    var isUploadingImages by remember(service?.id) { mutableStateOf(false) }
    var uploadError by remember(service?.id) { mutableStateOf("") }
    var isActive by remember(service?.id) { mutableStateOf(service?.activeValue ?: true) }
    var confirmDelete by remember(service?.id) { mutableStateOf(false) }
    val imageUrlList = remember(imageUrls) {
        imageUrls.lineSequence().map { it.trim() }.filter { it.isNotBlank() }.toList()
    }
    fun setImageUrlList(urls: List<String>) {
        imageUrls = urls.joinToString("\n")
    }
    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        if (uris.isEmpty()) return@rememberLauncherForActivityResult
        scope.launch {
            isUploadingImages = true
            uploadError = ""
            val urls = imageUrlList.toMutableList()
            try {
                uris.forEach { uri ->
                    urls += state.uploadServiceImage(uri)
                }
                setImageUrlList(urls)
            } catch (error: Exception) {
                uploadError = error.message ?: "Không thể upload ảnh."
            } finally {
                isUploadingImages = false
            }
        }
    }

    ScreenList(title = if (service == null) "Thêm dịch vụ" else "Sửa dịch vụ") {
        item {
            OutlinedButton(onClick = { state.closeServiceEditor() }, enabled = !state.isLoading) {
                Text("Quay lại")
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Tên dịch vụ *") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    Text("Danh mục", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    if (categories.isEmpty()) {
                        Text("Chưa tải được danh mục.", color = Danger)
                    } else {
                        categories.forEach { category ->
                            OutlinedButton(
                                onClick = { categoryId = category.id },
                                enabled = !state.isLoading,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text(if (category.id == categoryId) "✓ ${category.name}" else category.name)
                            }
                        }
                    }
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Mô tả") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    Text("Loại sản phẩm", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { productType = PRODUCT_TYPE_VOUCHER },
                                enabled = !state.isLoading,
                                modifier = Modifier.weight(1f),
                            ) {
                                Text(if (productType == PRODUCT_TYPE_VOUCHER) "✓ Voucher" else "Voucher")
                            }
                            OutlinedButton(
                                onClick = { productType = PRODUCT_TYPE_TICKET },
                                enabled = !state.isLoading,
                                modifier = Modifier.weight(1f),
                            ) {
                                Text(if (productType == PRODUCT_TYPE_TICKET) "✓ Vé" else "Vé")
                            }
                        }
                        OutlinedButton(
                            onClick = { productType = PRODUCT_TYPE_COUPON },
                            enabled = !state.isLoading,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(if (productType == PRODUCT_TYPE_COUPON) "✓ Coupon" else "Coupon")
                        }
                    }
                    if (productType == PRODUCT_TYPE_COUPON) {
                        Text("Coupon: Khách không trả trước; vendor thu tại quầy và trả hoa hồng cho S-Loco sau khi dùng.", color = Color(0xFF3B4460), fontSize = 12.sp)
                    } else if (productType == PRODUCT_TYPE_TICKET) {
                        Text("Vé: Khách trả trước, QR scan xong được hoàn tất ngay để đối soát S-Loco trả vendor.", color = Color(0xFF3B4460), fontSize = 12.sp)
                    } else {
                        Text("Voucher: Khách trả trước; QR scan ghi nhận đã dùng, vendor hoàn thành dịch vụ để đối soát S-Loco trả vendor.", color = Color(0xFF3B4460), fontSize = 12.sp)
                    }
                    OutlinedTextField(
                        value = originalPrice,
                        onValueChange = { originalPrice = it },
                        label = { Text(if (productType == PRODUCT_TYPE_COUPON) "Giá tham chiếu" else "Giá gốc *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    if (productType == PRODUCT_TYPE_COUPON) {
                        OutlinedTextField(
                            value = reservationDiscountPercent,
                            onValueChange = { reservationDiscountPercent = it },
                            label = { Text("Ưu đãi coupon (%) *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.isLoading,
                        )
                    } else {
                        OutlinedTextField(
                            value = discountPrice,
                            onValueChange = { discountPrice = it },
                            label = { Text("Giá khuyến mãi") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.isLoading,
                        )
                    }
                    Text("Chính sách áp dụng", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Text("Thông tin này hiển thị cho Khách trước khi mua/nhận voucher.", color = Color(0xFF3B4460), fontSize = 12.sp)
                    Text("Ngày áp dụng", fontWeight = FontWeight.SemiBold, color = Color(0xFF161B2E), fontSize = 13.sp)
                    val weekdayLabels = listOf(1 to "T2", 2 to "T3", 3 to "T4", 4 to "T5", 5 to "T6", 6 to "T7", 7 to "CN")
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                        weekdayLabels.forEach { (day, label) ->
                            OutlinedButton(
                                onClick = {
                                    policyWeekdays = if (policyWeekdays.contains(day)) policyWeekdays - day else policyWeekdays + day
                                },
                                enabled = !state.isLoading,
                                modifier = Modifier.weight(1f),
                            ) {
                                Text(label, fontSize = 11.sp, color = if (policyWeekdays.contains(day)) Primary else Color(0xFF3B4460), fontWeight = if (policyWeekdays.contains(day)) FontWeight.ExtraBold else FontWeight.SemiBold)
                            }
                        }
                    }
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("Không áp dụng ngày lễ", color = Color(0xFF161B2E))
                        Switch(checked = excludePublicHolidays, onCheckedChange = { excludePublicHolidays = it }, enabled = !state.isLoading)
                    }
                    BlackoutDatePickerSection(
                        blackoutDates = blackoutDates,
                        enabled = !state.isLoading,
                        onAddDate = { date -> blackoutDates = blackoutDates + date },
                        onRemoveDate = { date -> blackoutDates = blackoutDates - date },
                    )
                    OutlinedTextField(
                        value = policyConditions,
                        onValueChange = { policyConditions = it },
                        label = { Text("Điều kiện khác") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = durationMinutes,
                            onValueChange = { durationMinutes = it },
                            label = { Text("Thời lượng") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            enabled = !state.isLoading,
                        )
                        OutlinedTextField(
                            value = maxQuantity,
                            onValueChange = { maxQuantity = it },
                            label = { Text("SL tối đa") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            enabled = !state.isLoading,
                        )
                    }
                    Text("Hình ảnh", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Text("Chọn ảnh để upload lên server. Ảnh sẽ được tải lên ngay khi chọn.", color = Color(0xFF3B4460), fontSize = 12.sp)
                    OutlinedButton(
                        onClick = { imagePicker.launch("image/*") },
                        enabled = !state.isLoading && !isUploadingImages,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (isUploadingImages) "Đang tải ảnh..." else "Chọn ảnh dịch vụ")
                    }
                    if (isUploadingImages) {
                        CircularProgressIndicator(color = Primary)
                    }
                    if (uploadError.isNotBlank()) {
                        Text(uploadError, color = Danger, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    if (imageUrlList.isEmpty()) {
                        Text("Chưa có ảnh dịch vụ.", color = Color(0xFF3B4460), fontSize = 12.sp)
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            imageUrlList.forEachIndexed { index, url ->
                                AssistChip(
                                    onClick = { setImageUrlList(imageUrlList.filter { it != url }) },
                                    label = { Text("Xóa ảnh ${index + 1}") },
                                    enabled = !state.isLoading && !isUploadingImages,
                                )
                            }
                        }
                    }
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("Đang bán", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                        Switch(checked = isActive, onCheckedChange = { isActive = it }, enabled = !state.isLoading)
                    }
                    Button(
                        onClick = {
                            scope.launch {
                                state.saveService(
                                    service = service,
                                    name = name,
                                    categoryId = categoryId,
                                    description = description,
                                    productType = productType,
                                    originalPrice = originalPrice,
                                    discountPrice = discountPrice,
                                    reservationDiscountPercent = reservationDiscountPercent,
                                    policyWeekdays = policyWeekdays,
                                    excludePublicHolidays = excludePublicHolidays,
                                    blackoutDates = blackoutDates.sorted().joinToString("\n"),
                                    policyConditions = policyConditions,
                                    durationMinutes = durationMinutes,
                                    maxQuantityPerOrder = maxQuantity,
                                    imageUrls = imageUrls,
                                    isActive = isActive,
                                )
                            }
                        },
                        enabled = !state.isLoading &&
                            name.isNotBlank() &&
                            categoryId.isNotBlank() &&
                            !isUploadingImages &&
                            (productType == PRODUCT_TYPE_COUPON || originalPrice.isNotBlank()) &&
                            (productType != PRODUCT_TYPE_COUPON || reservationDiscountPercent.isNotBlank()),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (service == null) "Thêm dịch vụ" else "Lưu thay đổi")
                    }
                    if (service != null) {
                        OutlinedButton(
                            onClick = {
                                if (confirmDelete) {
                                    scope.launch { state.deleteService(service) }
                                } else {
                                    confirmDelete = true
                                }
                            },
                            enabled = !state.isLoading,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(if (confirmDelete) "Bấm lần nữa để xóa" else "Xóa dịch vụ")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BlackoutDatePickerSection(
    blackoutDates: Set<String>,
    enabled: Boolean,
    onAddDate: (String) -> Unit,
    onRemoveDate: (String) -> Unit,
) {
    val context = LocalContext.current
    val calendar = remember { Calendar.getInstance() }
    val datePickerDialog = remember {
        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                onAddDate("%04d-%02d-%02d".format(Locale.US, year, month + 1, dayOfMonth))
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH),
        )
    }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        Text("Ngày không áp dụng", fontWeight = FontWeight.SemiBold, color = Color(0xFF161B2E), fontSize = 13.sp)
        OutlinedButton(
            onClick = { datePickerDialog.show() },
            enabled = enabled,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Chọn ngày không áp dụng")
        }
        if (blackoutDates.isEmpty()) {
            Text("Chưa chọn ngày không áp dụng.", color = Color(0xFF3B4460), fontSize = 12.sp)
        } else {
            blackoutDates.sorted().forEach { date ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF4F7FB), RoundedCornerShape(999.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(date, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF161B2E))
                    Spacer(Modifier.width(8.dp))
                    TextButton(onClick = { onRemoveDate(date) }, enabled = enabled) {
                        Text("Xóa", color = Danger, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun EarningsScreen(state: AppState, onBack: (() -> Unit)? = null) {
    ScreenList(title = "Thu nhập") {
        if (onBack != null) {
            item {
                OutlinedButton(onClick = onBack, enabled = !state.isLoading) {
                    Text("Quay lại")
                }
            }
        }
        item {
            StatCard("Tổng doanh thu", formatVnd(state.dashboard?.total?.revenue), Modifier.fillMaxWidth(), Primary)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                StatCard("Đã thanh toán", formatVnd(state.dashboard?.settlement?.settledAmount), Modifier.weight(1f), Success)
                StatCard("Chờ giải ngân", formatVnd(state.dashboard?.settlement?.pendingAmount), Modifier.weight(1f), Warning)
            }
        }
        item { SectionTitle("Lịch sử đối soát") }
        items(state.settlements) { SettlementCard(it) }
    }
}

@Composable
private fun SettingsScreen(state: AppState) {
    val scope = rememberCoroutineScope()
    var section by remember { mutableStateOf(MoreSection.Home) }
    var iposStoreId by remember(state.vendor?.id, state.vendor?.metadata) {
        mutableStateOf(iposStoreId(state.vendor))
    }
    var address by remember(state.vendor?.id, state.vendor?.address) {
        mutableStateOf(state.vendor?.address.orEmpty())
    }
    var latitude by remember(state.vendor?.id, state.vendor?.latitude) {
        mutableStateOf(state.vendor?.latitude.orEmpty())
    }
    var longitude by remember(state.vendor?.id, state.vendor?.longitude) {
        mutableStateOf(state.vendor?.longitude.orEmpty())
    }

    when (section) {
        MoreSection.Home -> MoreDashboardScreen(
            state = state,
            onOpenSettings = { section = MoreSection.Settings },
            onOpenSecurity = { section = MoreSection.Security },
            onOpenEarnings = { section = MoreSection.Earnings },
        )
        MoreSection.Settings -> IposSettingsScreen(
            state = state,
            iposStoreId = iposStoreId,
            address = address,
            latitude = latitude,
            longitude = longitude,
            onIposStoreIdChange = { iposStoreId = it },
            onAddressChange = { address = it },
            onLatitudeChange = { latitude = it },
            onLongitudeChange = { longitude = it },
            onBack = { section = MoreSection.Home },
            onSave = { scope.launch { state.updateIposStoreId(iposStoreId) } },
            onSaveLocation = { scope.launch { state.updateVendorSettings(address, latitude, longitude) } },
        )
        MoreSection.Security -> SecurityScreen(
            state = state,
            onBack = { section = MoreSection.Home },
        )
        MoreSection.Earnings -> EarningsScreen(
            state = state,
            onBack = { section = MoreSection.Home },
        )
    }
}

private enum class MoreSection {
    Home,
    Settings,
    Security,
    Earnings,
}

@Composable
private fun MoreDashboardScreen(
    state: AppState,
    onOpenSettings: () -> Unit,
    onOpenSecurity: () -> Unit,
    onOpenEarnings: () -> Unit,
) {
    val context = LocalContext.current
    val activity = context as? MainActivity

    ScreenList(title = null) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(state.vendor?.name ?: "Chưa tải cửa hàng", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Text(state.vendor?.address ?: state.vendor?.email ?: state.user?.email ?: "Chưa có thông tin liên hệ", color = Color(0xFF3B4460))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        ServicePill("${state.services.size} dịch vụ", Primary)
                        ServicePill("${state.reservations.count { it.needsVendorAttention }} cần xử lý", Warning)
                    }
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                StatCard("Hôm nay", formatVnd(state.dashboard?.today?.revenue), Modifier.weight(1f), Primary)
                StatCard("Tổng doanh thu", formatVnd(state.dashboard?.total?.revenue), Modifier.weight(1f), Success)
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                StatCard("Chờ giải ngân", formatVnd(state.dashboard?.settlement?.pendingAmount), Modifier.weight(1f), Warning)
                StatCard("Đã thanh toán", formatVnd(state.dashboard?.settlement?.settledAmount), Modifier.weight(1f), Primary)
            }
        }
        item { SectionTitle("Chức năng") }
        item {
            MoreMenuButton("Cài đặt", "Vị trí cửa hàng và iPos", onOpenSettings)
        }
        item {
            MoreMenuButton("Thu nhập", "Xem lịch sử đối soát chi tiết") {
                onOpenEarnings()
            }
        }
        item {
            MoreMenuButton("Dịch vụ", "Quản lý sản phẩm, đặt bàn và ưu đãi") {
                state.selectedTab = AppTab.Services
            }
        }
        item {
            MoreMenuButton("Bảo mật", "Đổi mật khẩu hoặc tạo mật khẩu tạm thời", onOpenSecurity)
        }
        item { SectionTitle("Pháp lý & hỗ trợ") }
        item {
            MoreMenuButton("Bật thông báo đơn hàng", "Nhận cập nhật voucher, đặt chỗ và đối soát") {
                activity?.requestNotificationPermissionIfNeeded()
                    ?: state.showMessage("Mở app trên thiết bị Android để bật thông báo.")
            }
        }
        item {
            MoreMenuButton("Chính sách riêng tư", "Dữ liệu, quyền riêng tư và Firebase") {
                openLegalUrl(context, LEGAL_PRIVACY_URL)
            }
        }
        item {
            MoreMenuButton("Điều khoản sử dụng", "Quy định vận hành trên S-Loco") {
                openLegalUrl(context, LEGAL_TERMS_URL)
            }
        }
        item {
            MoreMenuButton("Hỗ trợ", "Liên hệ S-Loco support") {
                openLegalUrl(context, LEGAL_SUPPORT_URL)
            }
        }
        item {
            MoreMenuButton("Xóa tài khoản", "Yêu cầu xóa tài khoản và dữ liệu") {
                openLegalUrl(context, LEGAL_DELETE_ACCOUNT_URL)
            }
        }
        item {
            Button(onClick = { state.logout() }, enabled = !state.isLoading, modifier = Modifier.fillMaxWidth()) {
                Text("Đăng xuất")
            }
        }
    }
}

@Composable
private fun IposSettingsScreen(
    state: AppState,
    iposStoreId: String,
    address: String,
    latitude: String,
    longitude: String,
    onIposStoreIdChange: (String) -> Unit,
    onAddressChange: (String) -> Unit,
    onLatitudeChange: (String) -> Unit,
    onLongitudeChange: (String) -> Unit,
    onBack: () -> Unit,
    onSave: () -> Unit,
    onSaveLocation: () -> Unit,
) {
    val context = LocalContext.current
    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { result ->
        if (result.values.any { it }) {
            applyCurrentLocation(context, state, onLatitudeChange, onLongitudeChange)
        } else {
            state.showMessage("Ứng dụng cần quyền vị trí để lấy tọa độ hiện tại.")
        }
    }

    ScreenList(title = "Cài đặt") {
        item {
            OutlinedButton(onClick = onBack, enabled = !state.isLoading) {
                Text("Quay lại")
            }
        }
        item { InfoCard("Cửa hàng", state.vendor?.name ?: "Chưa tải thông tin") }
        item { InfoCard("Email", state.user?.email ?: state.vendor?.email ?: "Không có") }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Vị trí cửa hàng", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    OutlinedTextField(
                        value = address,
                        onValueChange = onAddressChange,
                        label = { Text("Địa chỉ") },
                        placeholder = { Text("Số nhà, đường, phường/xã") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = latitude,
                            onValueChange = onLatitudeChange,
                            label = { Text("Vĩ độ") },
                            placeholder = { Text("19.7450000") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            enabled = !state.isLoading,
                        )
                        OutlinedTextField(
                            value = longitude,
                            onValueChange = onLongitudeChange,
                            label = { Text("Kinh độ") },
                            placeholder = { Text("105.9010000") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            modifier = Modifier.weight(1f),
                            enabled = !state.isLoading,
                        )
                    }
                    if (latitude.isBlank() || longitude.isBlank()) {
                        Text(
                            "Thiếu tọa độ thì bản đồ và AI planner chưa thể ưu tiên vị trí cửa hàng này.",
                            color = Color(0xFF3B4460),
                            fontSize = 12.sp,
                        )
                    }
                    VendorLocationMap(latitude, longitude)
                    Text(
                        "S-Loco chỉ dùng vị trí khi bạn bấm nút này để điền tọa độ cửa hàng; quyền vị trí không được dùng để theo dõi nền.",
                        color = Color(0xFF3B4460),
                        fontSize = 12.sp,
                    )
                    OutlinedButton(
                        onClick = {
                            if (hasLocationPermission(context)) {
                                applyCurrentLocation(context, state, onLatitudeChange, onLongitudeChange)
                            } else {
                                permissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION,
                                    ),
                                )
                            }
                        },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Lấy vị trí hiện tại")
                    }
                    Button(
                        onClick = onSaveLocation,
                        enabled = !state.isLoading && state.vendor != null,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Lưu vị trí cửa hàng")
                    }
                }
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("iPos", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    OutlinedTextField(
                        value = iposStoreId,
                        onValueChange = onIposStoreIdChange,
                        label = { Text("Store ID") },
                        placeholder = { Text("Mã cửa hàng trên iPos") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    Button(
                        onClick = onSave,
                        enabled = !state.isLoading && state.vendor != null,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Lưu iPos store ID")
                    }
                }
            }
        }
    }
}

@Composable
private fun VendorLocationMap(latitude: String, longitude: String) {
    val lat = latitude.trim().toDoubleOrNull()
    val lng = longitude.trim().toDoubleOrNull()
    if (lat == null || lng == null || lat !in -90.0..90.0 || lng !in -180.0..180.0) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(180.dp)
                .background(Color(0xFFE8EEF5), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text("Nhập tọa độ để xem vị trí trên bản đồ", color = Color(0xFF3B4460), fontSize = 13.sp)
        }
        return
    }

    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                setBackgroundColor(android.graphics.Color.TRANSPARENT)
            }
        },
        update = { webView ->
            webView.loadDataWithBaseURL(
                "https://www.openstreetmap.org/",
                vendorMapHtml(lat, lng),
                "text/html",
                "UTF-8",
                null,
            )
        },
        modifier = Modifier
            .fillMaxWidth()
            .height(180.dp),
    )
}

private fun hasLocationPermission(context: Context): Boolean {
    return ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
}

@SuppressLint("MissingPermission")
private fun applyCurrentLocation(
    context: Context,
    state: AppState,
    onLatitudeChange: (String) -> Unit,
    onLongitudeChange: (String) -> Unit,
) {
    readCurrentLocation(context) { location ->
        if (location == null) {
            state.showMessage("Chưa lấy được vị trí hiện tại. Hãy bật định vị và thử lại.")
            return@readCurrentLocation
        }
        onLatitudeChange(formatCoordinate(location.latitude))
        onLongitudeChange(formatCoordinate(location.longitude))
        state.showMessage("Đã lấy vị trí hiện tại. Bấm lưu để cập nhật cửa hàng.")
    }
}

@SuppressLint("MissingPermission")
private fun readCurrentLocation(context: Context, onResult: (Location?) -> Unit) {
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    if (manager == null) {
        onResult(null)
        return
    }

    val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        .filter { provider -> runCatching { manager.isProviderEnabled(provider) }.getOrDefault(false) }
    val provider = providers.firstOrNull() ?: run {
        onResult(null)
        return
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        manager.getCurrentLocation(provider, null, ContextCompat.getMainExecutor(context)) { location ->
            onResult(location ?: bestLastKnownLocation(manager, providers))
        }
        return
    }

    val listener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            manager.removeUpdates(this)
            onResult(location)
        }
    }
    runCatching {
        manager.requestSingleUpdate(provider, listener, Looper.getMainLooper())
    }.onFailure {
        onResult(bestLastKnownLocation(manager, providers))
    }
}

@SuppressLint("MissingPermission")
private fun bestLastKnownLocation(manager: LocationManager, providers: List<String>): Location? {
    return providers
        .mapNotNull { provider -> runCatching { manager.getLastKnownLocation(provider) }.getOrNull() }
        .maxByOrNull { it.time }
}

private fun formatCoordinate(value: Double): String = String.format(Locale.US, "%.7f", value)

private fun vendorMapHtml(latitude: Double, longitude: Double): String {
    return """
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; }
            .leaflet-control-attribution { font-size: 10px; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const lat = $latitude;
            const lng = $longitude;
            const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lng], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap'
            }).addTo(map);
            L.marker([lat, lng]).addTo(map);
          </script>
        </body>
        </html>
    """.trimIndent()
}

@Composable
private fun SecurityScreen(state: AppState, onBack: () -> Unit) {
    val scope = rememberCoroutineScope()
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var confirmReset by remember { mutableStateOf(false) }

    ScreenList(title = "Bảo mật") {
        item {
            OutlinedButton(onClick = onBack, enabled = !state.isLoading) {
                Text("Quay lại")
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Đổi mật khẩu", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    OutlinedTextField(
                        value = currentPassword,
                        onValueChange = { currentPassword = it },
                        label = { Text("Mật khẩu hiện tại") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    OutlinedTextField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        label = { Text("Mật khẩu mới") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        label = { Text("Nhập lại mật khẩu mới") },
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    )
                    Button(
                        onClick = {
                            scope.launch {
                                state.changePassword(currentPassword, newPassword, confirmPassword)
                            }
                        },
                        enabled = !state.isLoading &&
                            currentPassword.length >= 8 &&
                            newPassword.length >= 8 &&
                            confirmPassword.length >= 8,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Đổi mật khẩu")
                    }
                }
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Reset mật khẩu", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Text("Tạo mật khẩu tạm thời và đăng xuất khỏi các phiên hiện tại.", color = Color(0xFF3B4460), fontSize = 13.sp)
                    OutlinedButton(
                        onClick = {
                            if (confirmReset) {
                                scope.launch { state.resetPassword() }
                            } else {
                                confirmReset = true
                            }
                        },
                        enabled = !state.isLoading,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (confirmReset) "Bấm lần nữa để reset" else "Reset mật khẩu")
                    }
                }
            }
        }
    }
}

@Composable
private fun MoreMenuButton(title: String, subtitle: String, onClick: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color.White),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.clickable(onClick = onClick),
    ) {
        Row(
            Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                Text(subtitle, color = Color(0xFF3B4460), fontSize = 13.sp)
            }
            Text("›", fontSize = 24.sp, color = Primary, fontWeight = FontWeight.Bold)
        }
    }
}

private fun iposStoreId(vendor: VendorProfile?): String {
    return vendor?.metadata?.get("ipos_store_id")?.jsonPrimitive?.contentOrNull.orEmpty()
}

private fun openLegalUrl(context: Context, url: String) {
    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
}

@Composable
private fun ScreenList(title: String?, content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (!title.isNullOrBlank()) {
            item {
                Text(title, fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
            }
        }
        content()
    }
}

@Composable
private fun StatCard(title: String, value: String, modifier: Modifier, color: Color = Primary) {
    Card(modifier = modifier, colors = CardDefaults.cardColors(containerColor = color), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.padding(16.dp)) {
            Text(title, color = Color.White.copy(alpha = 0.75f), fontSize = 12.sp)
            Spacer(Modifier.height(6.dp))
            Text(value, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun VoucherCard(voucher: Voucher) {
    InfoCard(
        title = "${voucher.productLabel}: ${voucher.serviceName ?: voucher.id}",
        body = "${voucher.customerName ?: "Khách hàng"} · ${voucher.status} · ${formatVnd(voucher.finalAmount)}",
    )
}

@Composable
private fun ReservationCard(state: AppState, item: ReservationWire) {
    val scope = rememberCoroutineScope()
    val reservation = item.reservation
    val voucher = item.voucher
    val tone = item.statusTone
    val accent = statusColor(tone)
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (item.needsVendorAttention) accent.copy(alpha = 0.10f) else Color.White,
        ),
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier.clickable { state.openReservation(item) },
    ) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(item.serviceDisplayName, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Text("${item.customerDisplayName} · ${reservation.partySize} người", color = Color(0xFF3B4460))
                }
                StatusBadge(item)
            }
            item.customerPhoneNumber?.let { Text(it, color = Color(0xFF3B4460), fontSize = 13.sp) }
            Text(reservation.requestedTime, color = Color(0xFF3B4460), fontSize = 13.sp)
            if (!reservation.customerNote.isNullOrBlank()) Text(reservation.customerNote, color = Color(0xFF3B4460), fontSize = 13.sp)
            if (!voucher?.iposVoucherCode.isNullOrBlank()) {
                Text("Mã iPos: ${voucher?.iposVoucherCode}", color = Warning, fontWeight = FontWeight.Bold)
            }
            if (!voucher?.issueError.isNullOrBlank()) {
                Text(voucher?.issueError.orEmpty(), color = Danger, fontSize = 12.sp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                if (reservation.status == "requested") {
                    Button(onClick = { scope.launch { state.confirmReservation(reservation.id) } }) {
                        Text("Xác nhận")
                    }
                    OutlinedButton(onClick = { scope.launch { state.rejectReservation(reservation.id) } }) {
                        Text("Từ chối")
                    }
                }
                if (voucher?.status == "issue_failed") {
                    Button(onClick = { scope.launch { state.retryReservationVoucher(voucher.id) } }) {
                        Text("Thử lại iPos")
                    }
                }
            }
        }
    }
}

@Composable
private fun SettlementCard(settlement: Settlement) {
    InfoCard(
        title = "Đối soát ${settlement.status}",
        body = "${settlement.directionLabel} · ${formatVnd(settlement.netAmountValue)} · ${settlement.voucherCountValue ?: 0} voucher/vé",
    )
}

@Composable
private fun ReservationDetailScreen(state: AppState, item: ReservationWire) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val current = state.reservations.firstOrNull { it.id == item.id } ?: item
    val phone = current.customerPhoneNumber

    ScreenList(title = "Chi tiết đặt chỗ") {
        item {
            OutlinedButton(onClick = { state.closeReservation() }, enabled = !state.isLoading) {
                Text("Quay lại")
            }
        }
        item { StatusBanner(current) }
        item {
            InfoCard(
                title = "Thông tin đặt chỗ",
                body = listOf(
                    "Dịch vụ: ${current.serviceDisplayName}",
                    "Thời gian: ${current.reservation.requestedTime}",
                    "Số người: ${current.reservation.partySize}",
                    "Ghi chú: ${current.reservation.customerNote?.takeIf { it.isNotBlank() } ?: "Không có"}",
                ).joinToString("\n"),
            )
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Liên hệ khách", fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
                    Text("Tên khách: ${current.customerDisplayName}", color = Color(0xFF3B4460))
                    Text("Số điện thoại: ${phone ?: "Chưa có"}", color = Color(0xFF3B4460))
                    if (!phone.isNullOrBlank()) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            Button(
                                onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))) },
                                enabled = !state.isLoading,
                            ) {
                                Text("Gọi khách")
                            }
                            OutlinedButton(
                                onClick = { context.startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:$phone"))) },
                                enabled = !state.isLoading,
                            ) {
                                Text("Nhắn tin")
                            }
                        }
                    }
                }
            }
        }
        item {
            val voucher = current.voucher
            InfoCard(
                title = "Voucher iPos",
                body = if (voucher == null) {
                    "Chưa phát hành voucher. Xác nhận đặt chỗ để tạo voucher cho Khách."
                } else {
                    listOfNotNull(
                        "Trạng thái: ${voucherStatusLabel(voucher.status)}",
                        voucher.discountPercent?.takeIf { it.isNotBlank() }?.let { "Ưu đãi: $it%" },
                        voucher.iposVoucherCode?.takeIf { it.isNotBlank() }?.let { "Mã iPos: $it" },
                        voucher.issueError?.takeIf { it.isNotBlank() }?.let { "Lỗi: $it" },
                    ).joinToString("\n")
                },
            )
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                if (current.canConfirm) {
                    Button(
                        onClick = { scope.launch { state.confirmReservation(current.reservation.id) } },
                        enabled = !state.isLoading,
                    ) {
                        Text("Xác nhận & tạo voucher")
                    }
                    OutlinedButton(
                        onClick = { scope.launch { state.rejectReservation(current.reservation.id) } },
                        enabled = !state.isLoading,
                    ) {
                        Text("Từ chối")
                    }
                }
                if (current.voucher?.status == "issue_failed") {
                    Button(
                        onClick = { scope.launch { state.retryReservationVoucher(current.voucher.id) } },
                        enabled = !state.isLoading,
                    ) {
                        Text("Thử lại iPos")
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusBadge(item: ReservationWire) {
    val color = statusColor(item.statusTone)
    Text(
        text = statusText(item),
        color = color,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        modifier = Modifier
            .background(color.copy(alpha = 0.14f), RoundedCornerShape(999.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
    )
}

@Composable
private fun StatusBanner(item: ReservationWire) {
    val color = statusColor(item.statusTone)
    Card(colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.14f)), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(statusText(item), color = color, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(statusDescription(item), color = color.copy(alpha = 0.86f))
        }
    }
}

@Composable
private fun InfoCard(title: String, body: String) {
    Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text(title, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
            Spacer(Modifier.height(4.dp))
            Text(body, color = Color(0xFF3B4460))
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
}

@Composable
private fun varTextField(
    title: String,
    subtitle: String,
    buttonLabel: String,
    firstLabel: String,
    secondLabel: String,
    firstPlaceholder: String,
    secondPlaceholder: String,
    secureSecond: Boolean = false,
    enabled: Boolean = true,
    onSubmit: (String, String) -> Unit,
    extra: @Composable () -> Unit = {},
) {
    var first by remember { mutableStateOf("") }
    var second by remember { mutableStateOf("") }

    Column(
        Modifier
            .fillMaxSize()
            .background(SurfaceBg)
            .padding(20.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text(title, fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Primary)
        Text(subtitle, color = Color(0xFF3B4460))
        Spacer(Modifier.height(20.dp))
        OutlinedTextField(
            value = first,
            onValueChange = { first = it },
            label = { Text(firstLabel) },
            placeholder = { Text(firstPlaceholder) },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = second,
            onValueChange = { second = it },
            label = { Text(secondLabel) },
            placeholder = { Text(secondPlaceholder) },
            visualTransformation = if (secureSecond) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(18.dp))
        Button(
            onClick = { onSubmit(first, second) },
            enabled = enabled && first.isNotBlank() && (!secureSecond || second.isNotBlank()),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(buttonLabel)
        }
        Spacer(Modifier.height(16.dp))
        extra()
    }
}

private fun JsonObject?.weekdaysFromPolicy(): List<Int>? =
    (this?.get("weekdays") as? JsonArray)
        ?.mapNotNull { it.jsonPrimitive.intOrNull }
        ?.filter { it in 1..7 }

private fun JsonObject?.stringArrayFromPolicy(key: String): List<String> =
    (this?.get(key) as? JsonArray)
        ?.mapNotNull { it.jsonPrimitive.contentOrNull }
        ?: emptyList()

private fun JsonObject?.booleanFromPolicy(key: String): Boolean? =
    this?.get(key)?.jsonPrimitive?.booleanOrNull

private fun JsonObject?.stringFromPolicy(key: String): String =
    this?.get(key)?.jsonPrimitive?.contentOrNull.orEmpty()

private fun formatVnd(value: Long?): String {
    val amount = value ?: 0
    return NumberFormat.getNumberInstance(Locale("vi", "VN")).format(amount) + "₫"
}

private fun reservationStatusLabel(status: String): String = when (status) {
    "requested" -> "Chờ liên hệ"
    "confirmed" -> "Đã xác nhận"
    "voucher_issued" -> "Đã có mã"
    "used" -> "Đã dùng"
    "settled" -> "Đã đối soát"
    "rejected" -> "Từ chối"
    "cancelled" -> "Đã hủy"
    else -> status
}

private fun voucherStatusLabel(status: String): String = when (status) {
    "issuing" -> "Đang tạo"
    "active" -> "Đã phát hành"
    "used" -> "Đã sử dụng"
    "issue_failed" -> "Tạo lỗi"
    else -> status
}

private fun statusText(item: ReservationWire): String {
    if (item.voucher?.status == "issue_failed") return "Lỗi tạo voucher"
    return reservationStatusLabel(item.reservation.status)
}

private fun statusDescription(item: ReservationWire): String {
    if (item.voucher?.status == "issue_failed") return "Cần thử tạo lại voucher iPos cho Khách."
    return when (item.reservation.status) {
        "requested" -> "Cần liên hệ khách và xác nhận để tạo voucher."
        "confirmed" -> "Đã xác nhận, hệ thống đang xử lý voucher."
        "voucher_issued" -> "Voucher đã sẵn sàng cho Khách sử dụng."
        "used" -> "Khách đã sử dụng voucher tại quầy."
        "settled" -> "Đặt chỗ đã hoàn tất đối soát."
        "rejected" -> "Đặt chỗ đã bị từ chối."
        "cancelled" -> "Đặt chỗ đã bị hủy."
        else -> "Theo dõi trạng thái đặt chỗ."
    }
}

private fun statusColor(tone: ReservationStatusTone): Color = when (tone) {
    ReservationStatusTone.Attention -> Warning
    ReservationStatusTone.Danger -> Danger
    ReservationStatusTone.InProgress -> Primary
    ReservationStatusTone.Success -> Success
    ReservationStatusTone.Muted -> Color(0xFF5B6478)
    ReservationStatusTone.Neutral -> Primary
}
