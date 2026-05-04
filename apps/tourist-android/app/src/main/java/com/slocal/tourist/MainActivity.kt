package vn.sloco.tourist

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import vn.sloco.tourist.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import kotlin.math.roundToInt
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            TouristApp(applicationContext)
        }
    }

    fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return
        requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_PERMISSION_REQUEST)
    }

    private companion object {
        const val NOTIFICATION_PERMISSION_REQUEST = 4101
    }
}

private val Blue = Color(0xFF006DCC)
private val Blue2 = Color(0xFF0B8FEF)
private val BlueSoft = Color(0xFFE0F2FE)
private val Surface = Color(0xFFF5FAFF)
private val Border = Color(0xFFD9E7F2)
private val TextMain = Color(0xFF102033)
private val TextMuted = Color(0xFF5D6B7A)
private val Coral = Color(0xFFFF6B35)
private val Yellow = Color(0xFFFFC83D)
private const val LEGAL_PRIVACY_URL = "https://sloco.vn/privacy"
private const val LEGAL_TERMS_URL = "https://sloco.vn/terms"
private const val LEGAL_SUPPORT_URL = "https://sloco.vn/support"
private const val LEGAL_DELETE_ACCOUNT_URL = "https://sloco.vn/delete-account"

@Composable
private fun TouristApp(context: Context) {
    val state = remember { AppState(context) }
    val activity = LocalContext.current as? MainActivity

    LaunchedEffect(Unit) {
        state.bootstrap()
    }

    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = Blue,
            secondary = Blue2,
            surface = Surface,
            background = Surface,
            onPrimary = Color.White,
            onSurface = TextMain,
        )
    ) {
        Surface(Modifier.fillMaxSize(), color = Surface) {
            Box(Modifier.fillMaxSize()) {
	                when (val screen = state.screen) {
	                    Screen.Main -> MainTabs(state)
	                    is Screen.ServiceDetail -> ServiceDetailScreen(state, screen.service)
	                    is Screen.VendorDetail -> VendorDetailScreen(state, screen.vendor)
	                    is Screen.Checkout -> CheckoutScreen(state, screen.orderId)
                    is Screen.OrderDetail -> OrderDetailScreen(state, screen.orderId)
                    is Screen.VoucherDetail -> VoucherDetailScreen(state, screen.voucher)
                    is Screen.ReservationDetail -> ReservationDetailScreen(state, screen.reservation)
                    Screen.Weather -> WeatherScreen(state)
                    is Screen.Login -> LoginScreen(state, screen.redirect)
                    is Screen.Otp -> OtpScreen(state, screen.phone, screen.redirect)
                    is Screen.Article -> TextShell("Bài viết", screen.title, state::back)
                }

                if (state.message != null) {
                    Box(
                        Modifier
                            .align(Alignment.BottomCenter)
                            .padding(16.dp)
                    ) {
                        Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(Color.White)) {
                            Row(
                                Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(state.message.orEmpty(), color = TextMain, modifier = Modifier.weight(1f, fill = false))
                                Text("Đóng", color = Blue, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { state.message = null })
                            }
                        }
                    }
                }

                if (state.loading) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(Color.White)) {
                            Row(
                                Modifier.padding(20.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(color = Blue, modifier = Modifier.size(24.dp))
                                Text(state.loadingText.ifEmpty { "Đang tải..." }, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MainTabs(state: AppState) {
    Scaffold(
        containerColor = Surface,
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = state.tab == tab,
                        onClick = { state.tab = tab },
                        icon = { Text(tab.icon, fontWeight = FontWeight.Bold) },
                        label = { Text(tab.label, fontSize = 11.sp) },
                    )
                }
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when (state.tab) {
                AppTab.Home -> HomeScreen(state)
                AppTab.Browse -> BrowseScreen(state)
                AppTab.Vouchers -> VouchersScreen(state)
                AppTab.AI -> AIScreen(state)
                AppTab.Profile -> ProfileScreen(state)
            }
        }
    }
}

@Composable
private fun HomeScreen(state: AppState) {
    LazyColumn(
        Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFFDDF6FF), Surface)))
    ) {
        item {
            HomeHeader(state)
            RecommendationTitle(
                title = "Gợi ý cho bạn",
                action = "Xem tất cả",
                onAction = { state.tab = AppTab.Browse }
            )
        }
        val rows = state.services.chunked(2)
        items(rows) { row ->
            Row(Modifier.padding(horizontal = 16.dp, vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { service ->
                    Box(Modifier.weight(1f)) {
                        ServiceCard(service) { state.openService(service) }
                    }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
        item { Spacer(Modifier.height(96.dp)) }
    }
}

@Composable
private fun HomeHeader(state: AppState) {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(top = 28.dp, bottom = 18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.Top,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text("Xin chào,", color = TextMain, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Text("Chào mừng đến Sầm Sơn!", color = TextMain, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
            }
            Box(
                Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(Color.White),
                contentAlignment = Alignment.Center
            ) {
                Text("🔔", fontSize = 16.sp)
                Box(
                    Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 8.dp, end = 7.dp)
                        .size(7.dp)
                        .clip(CircleShape)
                        .background(Yellow)
                )
            }
        }
        HomeSearchBox(
            modifier = Modifier.padding(horizontal = 16.dp),
            onClick = { state.tab = AppTab.Browse }
        )
        HomeCategoryGrid(state)
    }
}

@Composable
private fun HomeSearchBox(modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(
        modifier
            .fillMaxWidth()
            .height(46.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text("⌕", color = TextMuted, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text("Bạn muốn tìm gì?", color = TextMuted, fontSize = 13.sp)
    }
}

@Composable
private fun HomeCategoryGrid(state: AppState) {
    val actions = listOf(
        HomeCategoryAction(R.drawable.category_diem_den, "Điểm đến", "") {
            state.homeCategory = ""
            state.loadServices()
        },
        HomeCategoryAction(R.drawable.category_am_thuc, "Ẩm thực", "am-thuc") {
            state.homeCategory = "am-thuc"
            state.loadServices()
        },
        HomeCategoryAction(R.drawable.category_luu_tru, "Lưu trú", "luu-tru") {
            state.homeCategory = "luu-tru"
            state.loadServices()
        },
        HomeCategoryAction(R.drawable.category_giai_tri, "Giải trí", "giai-tri") {
            state.homeCategory = "giai-tri"
            state.loadServices()
        },
        HomeCategoryAction(R.drawable.category_su_kien, "Sự kiện", "") {
            state.tab = AppTab.Browse
        },
        HomeCategoryAction(R.drawable.category_phuong_tien, "Phương tiện", "xe-dien") {
            state.homeCategory = "xe-dien"
            state.loadServices()
        },
        HomeCategoryAction(R.drawable.category_mua_sam, "Mua sắm", "mua-sam") {
            state.homeCategory = "mua-sam"
            state.loadServices()
        },
        HomeCategoryAction(R.drawable.category_xem_them, "Xem thêm", "") {
            state.tab = AppTab.Browse
        },
    )
    Column(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        actions.chunked(4).forEach { row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { action ->
                    HomeCategoryTile(
                        action = action,
                        active = action.category.isNotEmpty() && state.homeCategory == action.category,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeCategoryTile(action: HomeCategoryAction, active: Boolean, modifier: Modifier = Modifier) {
    Column(
        modifier
            .height(72.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color.White)
            .clickable(onClick = action.onClick)
            .padding(horizontal = 4.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        Box(
            Modifier
                .size(30.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color.Transparent),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(action.icon),
                contentDescription = action.label,
                modifier = Modifier.size(24.dp)
            )
        }
        Text(action.label, color = TextMain, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun RecommendationTitle(title: String, action: String, onAction: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(top = 18.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(title, color = TextMain, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
        Text(action, color = Blue, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable(onClick = onAction))
    }
}

@Composable
private fun BrowseScreen(state: AppState) {
    var query by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var mode by remember { mutableStateOf("services") }
    val scope = rememberCoroutineScope()

    LazyColumn(Modifier.fillMaxSize()) {
        item {
            HeroHeader(
                title = "Tìm trải nghiệm",
                subtitle = "EXPLORE SẦM SƠN",
                searchText = query.ifBlank { "Tìm dịch vụ, cửa hàng..." },
                onSearch = {}
            )
            OutlinedTextField(
                value = query,
                onValueChange = {
                    query = it
                    scope.launch { state.search(query, category) }
                },
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                placeholder = { Text("Tìm dịch vụ, cửa hàng...") },
                singleLine = true
            )
            CategoryChips(category) {
                category = it
                scope.launch { state.search(query, category) }
            }
            Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Pill("Dịch vụ", mode == "services") { mode = "services" }
                Pill("Cửa hàng", mode == "vendors") { mode = "vendors" }
            }
            Spacer(Modifier.height(8.dp))
        }
        if (mode == "services") {
            items(state.searchServices.chunked(2)) { row ->
                Row(Modifier.padding(horizontal = 16.dp, vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    row.forEach { service ->
                        Box(Modifier.weight(1f)) { ServiceCard(service) { state.openService(service) } }
                    }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
	        } else {
	            items(state.vendors) { vendor ->
	                VendorRow(vendor) { state.openVendor(vendor) }
	            }
	        }
        item { Spacer(Modifier.height(96.dp)) }
    }
}

@Composable
private fun ServiceDetailScreen(state: AppState, service: Service) {
    var quantity by remember { mutableIntStateOf(1) }
    var partySize by remember { mutableStateOf("2") }
    var requestedTime by remember { mutableStateOf("2026-05-01T12:00:00.000Z") }
    var note by remember { mutableStateOf("") }
    Column(Modifier.fillMaxSize()) {
        TopBack("Dịch vụ", state::back)
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
        ) {
            Box(
                Modifier
                    .fillMaxWidth()
                    .height(260.dp)
                    .background(Blue),
                contentAlignment = Alignment.BottomStart
            ) {
                Image(
                    painter = painterResource(serviceImageRes(service)),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.56f))))
                )
                Column(Modifier.padding(24.dp)) {
                    Text("S-LOCO", color = Color.White.copy(alpha = 0.72f), fontWeight = FontWeight.Bold)
                    Text("Premium coastal service", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                }
                if (service.discountPercent > 0 || service.appDiscountPercent > 0) {
                    Column(
                        modifier = Modifier.align(Alignment.TopEnd).padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        horizontalAlignment = Alignment.End
                    ) {
                        if (service.discountPercent > 0) DiscountChip("Giá KM ${service.discountPercent}%")
                        if (service.appDiscountPercent > 0) DiscountChip("+App ${service.appDiscountPercent}%")
                    }
                }
            }
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(service.name, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = TextMain)
                Text(service.vendorName.ifBlank { "S-Loco partner" }, color = Blue, fontWeight = FontWeight.SemiBold)
                service.locationSummary()?.let { Text(it, color = TextMuted) }
                Text("★ ${service.rating}", color = TextMuted)
                Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (service.isCoupon) {
                        Text("Coupon · Giảm thêm ${service.appDiscountPercent}%", color = Coral, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    } else if (service.originalPrice > service.price) {
                        Text(formatVnd(service.originalPrice), color = TextMuted)
                        Text(formatVnd(service.price), color = Coral, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                    } else {
                        Text(formatVnd(service.price), color = Coral, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold)
                    }
                }
                Text("Mô tả", fontWeight = FontWeight.Bold, fontSize = 20.sp)
                Text(service.description.ifBlank { "Trải nghiệm địa phương được chọn lọc bởi S-Loco." }, color = TextMuted)
                if (service.durationMinutes > 0) Text("Thời lượng: ${service.durationMinutes} phút", color = TextMuted)
                ApplicabilityPolicySection(service)
                VendorLocationSection(service)
                if (service.isCoupon) {
                    AppCard {
                        Text("Thông tin nhận coupon", color = TextMain, fontWeight = FontWeight.ExtraBold)
                        OutlinedTextField(partySize, { partySize = it }, label = { Text("Số người") }, singleLine = true)
                        OutlinedTextField(requestedTime, { requestedTime = it }, label = { Text("Thời gian mong muốn") }, singleLine = true)
                        OutlinedTextField(note, { note = it }, label = { Text("Ghi chú") })
                    }
                }
            }
        }
        Row(
            Modifier
                .background(Color.White)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (!service.isCoupon) {
                Stepper(quantity, onMinus = { quantity = maxOf(1, quantity - 1) }, onPlus = { quantity += 1 })
            }
            Button(
                onClick = {
                    if (service.isCoupon) {
                        state.createReservation(service, partySize.toIntOrNull() ?: 2, requestedTime, note)
                    } else {
                        state.createOrder(service, quantity)
                    }
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(containerColor = Blue)
            ) {
                Text(if (service.isCoupon) "Nhận coupon" else "Mua ${service.productLabel.lowercase()}")
            }
        }
    }
}

@Composable
private fun ApplicabilityPolicySection(service: Service) {
    val lines = service.applicabilityPolicyLines()
    if (lines.isEmpty()) return
    AppCard {
        Text("Chính sách áp dụng", color = TextMain, fontWeight = FontWeight.ExtraBold)
        lines.forEach { line -> Text("• $line", color = TextMuted, fontSize = 13.sp) }
    }
}

@Composable
private fun VendorLocationSection(service: Service) {
    val context = LocalContext.current
    val hasCoordinate = service.vendorLatitude != null && service.vendorLongitude != null
    AppCard {
        Text("Địa điểm cung cấp dịch vụ", color = TextMain, fontWeight = FontWeight.ExtraBold)
        Text(service.vendorName.ifBlank { "S-Loco partner" }, color = Blue, fontWeight = FontWeight.Bold)
        if (service.vendorAddress.isNotBlank()) {
            Text(service.vendorAddress, color = TextMuted, fontSize = 13.sp)
        }
        service.locationSummary()?.takeIf { it != service.vendorAddress }?.let {
            Text(it, color = TextMuted, fontSize = 13.sp)
        }
        if (hasCoordinate) {
            VendorMapPreview(
                latitude = service.vendorLatitude!!,
                longitude = service.vendorLongitude!!,
                vendorName = service.vendorName,
            )
        } else {
            Text("Vendor chưa ghim vị trí bản đồ.", color = Coral, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
        TextButton(onClick = { openVendorMap(context, service) }) {
            Text(if (hasCoordinate) "Mở bản đồ" else "Tìm trên bản đồ", color = Blue, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun VendorMapPreview(latitude: Double, longitude: Double, vendorName: String) {
    AndroidView(
        modifier = Modifier
            .fillMaxWidth()
            .height(150.dp)
            .clip(RoundedCornerShape(14.dp)),
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
                settings.javaScriptEnabled = true
                settings.loadWithOverviewMode = true
                settings.useWideViewPort = true
                setBackgroundColor(0)
                loadDataWithBaseURL(
                    "https://www.openstreetmap.org",
                    osmEmbedHtml(latitude, longitude, vendorName),
                    "text/html",
                    "UTF-8",
                    null
                )
            }
        }
    )
}

private fun openVendorMap(context: Context, service: Service) {
    val uri = if (service.vendorLatitude != null && service.vendorLongitude != null) {
        Uri.parse("https://www.google.com/maps/search/?api=1&query=${service.vendorLatitude},${service.vendorLongitude}")
    } else {
        val query = Uri.encode(service.vendorAddress.ifBlank { service.vendorName })
        Uri.parse("https://www.google.com/maps/search/?api=1&query=$query")
    }
    context.startActivity(Intent(Intent.ACTION_VIEW, uri))
}

private fun osmEmbedHtml(latitude: Double, longitude: Double, vendorName: String): String {
    val delta = 0.006
    val label = vendorName.ifBlank { "Vendor" }
    return """
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body, iframe { margin: 0; width: 100%; height: 100%; border: 0; overflow: hidden; }
          </style>
        </head>
        <body>
          <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}&layer=mapnik&marker=$latitude%2C$longitude" title="$label"></iframe>
        </body>
        </html>
    """.trimIndent()
}

@Composable
private fun VendorDetailScreen(state: AppState, vendor: Vendor) {
    val services = (state.services + state.searchServices)
        .distinctBy { it.id }
        .filter { it.vendorName.equals(vendor.name, ignoreCase = true) }

    Column(Modifier.fillMaxSize()) {
        TopBack("Đối tác", state::back)
        LazyColumn(Modifier.fillMaxSize()) {
            item {
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(230.dp),
                    contentAlignment = Alignment.BottomStart
                ) {
                    Image(
                        painter = painterResource(R.drawable.tourist_hero),
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.66f))))
                    )
                    Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(vendor.name, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                        Text(vendor.address.ifBlank { "Đối tác địa phương" }, color = Color.White.copy(alpha = 0.86f))
                    }
                }
                AppCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Đánh giá", color = TextMuted)
                        Text("★ ${vendor.rating}", color = Coral, fontWeight = FontWeight.Bold)
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Dịch vụ", color = TextMuted)
                        Text("${services.size}", color = Blue, fontWeight = FontWeight.Bold)
                    }
                    Text("Đối tác địa phương được tuyển chọn trên S-Loco, cung cấp trải nghiệm du lịch và dịch vụ tại điểm đến.", color = TextMuted)
                }
                SectionTitle("Dịch vụ của đối tác")
            }
            if (services.isEmpty()) {
                item {
                    AppCard(horizontal = Alignment.CenterHorizontally) {
                        Text("Chưa có dịch vụ trong bộ nhớ app", fontWeight = FontWeight.ExtraBold, color = TextMain)
                        Text("Quay lại màn Tìm kiếm để tải thêm dữ liệu theo đối tác này.", color = TextMuted)
                    }
                }
            } else {
                items(services.chunked(2)) { row ->
                    Row(Modifier.padding(horizontal = 16.dp, vertical = 6.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        row.forEach { service ->
                            Box(Modifier.weight(1f)) { ServiceCard(service) { state.openService(service) } }
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
            }
            item { Spacer(Modifier.height(32.dp)) }
        }
    }
}

@Composable
private fun CheckoutScreen(state: AppState, orderId: String) {
    LaunchedEffect(orderId) { state.loadOrder(orderId) }
    Column(Modifier.fillMaxSize()) {
        TopBack("Thanh toán", state::back)
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            BlueCard("SECURE CHECKOUT", "Xác nhận voucher/vé", "Thanh toán qua cổng bảo mật, nhận QR trong ví.")
            state.currentOrder?.let { order ->
                AppCard {
                    Text("Đơn hàng #${order.id.take(8).uppercase()}", fontWeight = FontWeight.Bold)
                    order.items.forEach {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${it.quantity}x ${it.name}", modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(formatVnd(it.price * it.quantity))
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Tổng cộng", fontWeight = FontWeight.Bold)
                        Text(formatVnd(order.totalAmount), color = Blue, fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
            AppCard {
                Text("Thanh toán trực tuyến đang được hoàn thiện", fontWeight = FontWeight.ExtraBold, color = TextMain)
                Text(
                    "Bản phát hành này ghi nhận đơn hàng/voucher để nhân viên S-Loco xác nhận. Cổng VNPay, MoMo và SePay sẽ xuất hiện khi được kích hoạt chính thức.",
                    color = TextMuted
                )
            }
        }
        Button(
            onClick = { state.message = "Đơn hàng đã được ghi nhận. S-Loco sẽ thông báo khi cổng thanh toán trực tuyến sẵn sàng." },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Blue)
        ) {
            Text("Ghi nhận đơn hàng")
        }
    }
}

@Composable
private fun OrderDetailScreen(state: AppState, orderId: String) {
    LaunchedEffect(orderId) { state.loadOrder(orderId) }
    Column(Modifier.fillMaxSize()) {
        TopBack("Đơn hàng", state::back)
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            BlueCard("ORDER", "Chi tiết đơn hàng", "Theo dõi trạng thái và QR đã phát hành.")
            state.currentOrder?.let { order ->
                AppCard {
                    Text(order.status, color = Blue, fontWeight = FontWeight.Bold)
                    Text("Mã đơn: ${order.id.take(8)}", color = TextMuted)
                    Text("Tổng cộng: ${formatVnd(order.totalAmount)}", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun VouchersScreen(state: AppState) {
    LaunchedEffect(state.token) { if (state.token != null) { state.loadVouchers(); state.loadReservations() } }
    if (state.token == null) {
        LoginRequired(state)
        return
    }
    LazyColumn(Modifier.fillMaxSize()) {
        item {
            BluePageHeader("MY PASSES", "Voucher & vé của tôi", "Xuất trình QR khi sử dụng dịch vụ")
        }
        items(state.vouchers) { voucher ->
            VoucherCard(voucher) { state.screen = Screen.VoucherDetail(voucher) }
        }
        item { SectionTitle("Coupon / mã giảm giá") }
        items(state.reservations) { reservation ->
            ReservationCard(reservation) { state.screen = Screen.ReservationDetail(reservation) }
        }
        item { Spacer(Modifier.height(96.dp)) }
    }
}

@Composable
private fun ReservationDetailScreen(state: AppState, reservation: Reservation) {
    Column(Modifier.fillMaxSize()) {
        TopBack("Đặt chỗ", state::back)
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            BlueCard("RESERVATION", reservation.serviceName.ifBlank { "Đặt chỗ" }, reservationStatusLabel(reservation.status))
            AppCard {
                InfoRow("Cửa hàng", reservation.vendorName)
                InfoRow("Số người", reservation.partySize.toString())
                InfoRow("Thời gian", reservation.requestedTime)
            }
            reservation.voucherCode?.takeIf { it.isNotBlank() }?.let { code ->
                AppCard(horizontal = Alignment.CenterHorizontally) {
                    Text(code, color = Blue, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                    Text("Đưa mã này cho thu ngân để được giảm ${reservation.discountPercent ?: 0}% trên hóa đơn iPos.", color = TextMuted)
                }
            } ?: AppCard {
                Text("Nhà hàng sẽ liên hệ và xác nhận trước khi phát hành mã ưu đãi.", color = TextMuted)
            }
        }
    }
}

@Composable
private fun VoucherDetailScreen(state: AppState, voucher: Voucher) {
    Column(Modifier.fillMaxSize()) {
        TopBack(voucher.productLabel, state::back)
        Column(
            Modifier
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            BlueCard("S-LOCO ${voucher.productLabel.uppercase()}", voucher.serviceName.ifBlank { voucher.productLabel }, statusLabel(voucher.status))
            if (voucher.qrToken.isNotBlank()) {
                AppCard(horizontal = Alignment.CenterHorizontally) {
                    QrImage(voucher.qrToken)
                    Text("Xuất trình mã QR này cho nhân viên để sử dụng ${voucher.productLabel.lowercase()}.", color = TextMuted)
                }
            } else {
                AppCard { Text("QR sẽ khả dụng sau khi thanh toán.", color = TextMuted) }
            }
            AppCard {
                InfoRow("Cửa hàng", voucher.vendorName)
                InfoRow("Số lượng", voucher.quantity.toString())
                InfoRow("Tổng tiền", formatVnd(voucher.totalAmount))
            }
        }
    }
}

private enum class ItineraryStayMode(val label: String) {
    Slocal("Chọn lưu trú S-Loco"),
    Manual("Nhập nơi lưu trú"),
}

private enum class ItineraryGroupType(val value: String, val label: String) {
    Couple("couple", "Cặp đôi"),
    Family("family", "Gia đình"),
    Friends("friends", "Nhóm bạn"),
    Solo("solo", "Đi một mình"),
}

data class ItineraryStayContext(
    val label: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
)

@Composable
private fun ItineraryGroupTypeSection(selected: ItineraryGroupType, onSelectedChange: (ItineraryGroupType) -> Unit) {
    AppCard {
        Text("Bạn đi cùng ai?", color = TextMain, fontWeight = FontWeight.ExtraBold)
        ItineraryGroupType.entries.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { option ->
                    Box(Modifier.weight(1f)) {
                        Pill(option.label, selected == option) { onSelectedChange(option) }
                    }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun ItineraryStaySection(
    mode: ItineraryStayMode,
    onModeChange: (ItineraryStayMode) -> Unit,
    lodgingServices: List<Service>,
    selectedServiceId: String,
    onSelectedServiceChange: (String) -> Unit,
    manualLabel: String,
    onManualLabelChange: (String) -> Unit,
    preferNearStay: Boolean,
    onPreferNearStayChange: (Boolean) -> Unit,
) {
    AppCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Ưu tiên gần nơi lưu trú", color = TextMain, fontWeight = FontWeight.Bold)
                Text(
                    "Bật để chọn hoặc nhập nơi lưu trú; có tọa độ S-Loco thì ưu tiên gần và hiển thị khoảng cách trên lịch trình.",
                    color = TextMuted,
                    fontSize = 12.sp,
                )
            }
            Switch(checked = preferNearStay, onCheckedChange = onPreferNearStayChange)
        }

        if (preferNearStay) {
            Text("Nơi lưu trú", color = TextMain, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ItineraryStayMode.entries.forEach { option ->
                    Pill(option.label, mode == option) { onModeChange(option) }
                }
            }

            if (mode == ItineraryStayMode.Slocal) {
                if (lodgingServices.isEmpty()) {
                    Text(
                        "Chưa có lưu trú S-Loco khả dụng. Bạn có thể nhập tên khách sạn hoặc địa chỉ thủ công.",
                        color = TextMuted,
                        fontSize = 12.sp,
                    )
                } else {
                    Text("Chọn lưu trú", color = TextMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    lodgingServices.take(4).forEach { service ->
                        StayServiceRow(
                            service = service,
                            selected = service.id == selectedServiceId,
                            onClick = { onSelectedServiceChange(service.id) },
                        )
                    }
                }
            } else {
                OutlinedTextField(
                    value = manualLabel,
                    onValueChange = onManualLabelChange,
                    label = { Text("VD: FLC Sầm Sơn, khách sạn gần biển...") },
                    modifier = Modifier.fillMaxWidth(),
                )
                Text(
                    "Bản v1 chưa định vị địa chỉ nhập tay; AI sẽ dùng nội dung này làm ngữ cảnh.",
                    color = TextMuted,
                    fontSize = 12.sp,
                )
            }
        }
    }
}

@Composable
private fun StayServiceRow(service: Service, selected: Boolean, onClick: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(if (selected) BlueSoft else Surface)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(service.stayLabel(), color = if (selected) Blue else TextMain, fontWeight = FontWeight.Bold)
        if (service.vendorAddress.isNotBlank()) Text(service.vendorAddress, color = TextMuted, fontSize = 12.sp)
        Text(
            if (service.hasVendorCoordinate()) "Có tọa độ để tối ưu khoảng cách." else "Chưa có tọa độ, AI sẽ dùng tên nơi lưu trú làm ngữ cảnh.",
            color = if (service.hasVendorCoordinate()) Blue else Coral,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun AIScreen(state: AppState) {
    var days by remember { mutableStateOf("2") }
    var budget by remember { mutableStateOf("2000000") }
    var preferences by remember { mutableStateOf("ẩm thực, biển, spa") }
    var groupType by remember { mutableStateOf(ItineraryGroupType.Couple) }
    var stayMode by remember { mutableStateOf(ItineraryStayMode.Slocal) }
    var selectedStayServiceId by remember { mutableStateOf("") }
    var manualStayLabel by remember { mutableStateOf("") }
    var preferNearStay by remember { mutableStateOf(false) }
    val lodgingServices = remember(state.services, state.searchServices) {
        (state.services + state.searchServices).filter { it.isLodging() }.distinctBy { it.id }
    }
    val selectedStayService = lodgingServices.firstOrNull { it.id == selectedStayServiceId }
        ?: lodgingServices.firstOrNull()
    LaunchedEffect(lodgingServices.map { it.id }) {
        if (selectedStayServiceId.isBlank() || lodgingServices.none { it.id == selectedStayServiceId }) {
            selectedStayServiceId = lodgingServices.firstOrNull()?.id.orEmpty()
        }
    }
    val scope = rememberCoroutineScope()
    LazyColumn(Modifier.fillMaxSize()) {
        item {
            BluePageHeader("AI PLANNER", "Lịch trình AI", "Tạo lịch trình cá nhân hóa cho chuyến đi Sầm Sơn")
        }
        item {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(days, { days = it }, label = { Text("Số ngày") }, singleLine = true)
                OutlinedTextField(budget, { budget = it }, label = { Text("Ngân sách") }, singleLine = true)
                OutlinedTextField(preferences, { preferences = it }, label = { Text("Sở thích") })
                ItineraryGroupTypeSection(groupType) { groupType = it }
                ItineraryStaySection(
                    mode = stayMode,
                    onModeChange = { stayMode = it },
                    lodgingServices = lodgingServices,
                    selectedServiceId = selectedStayServiceId,
                    onSelectedServiceChange = { selectedStayServiceId = it },
                    manualLabel = manualStayLabel,
                    onManualLabelChange = { manualStayLabel = it },
                    preferNearStay = preferNearStay,
                    onPreferNearStayChange = { preferNearStay = it },
                )
                Button(onClick = {
                    val stay = if (preferNearStay) {
                        when (stayMode) {
                            ItineraryStayMode.Slocal -> selectedStayService?.toStayContext() ?: ItineraryStayContext()
                            ItineraryStayMode.Manual -> ItineraryStayContext(label = manualStayLabel)
                        }
                    } else {
                        ItineraryStayContext()
                    }
                    scope.launch { state.createItinerary(days, budget, preferences, groupType.value, stay, preferNearStay) }
                }, colors = ButtonDefaults.buttonColors(containerColor = Blue)) {
                    Text("Tạo lịch trình")
                }
                state.itinerary?.let { itinerary ->
                    ItineraryTimeline(itinerary) { serviceId -> state.openService(serviceId) }
                }
            }
        }
        item { Spacer(Modifier.height(96.dp)) }
    }
}

@Composable
private fun ItineraryTimeline(itinerary: GeneratedItinerary, onOpenService: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        AppCard {
            Text(itinerary.title.ifBlank { "Lịch trình S-Loco" }, color = Blue, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
            if (itinerary.summary.isNotBlank()) Text(itinerary.summary, color = TextMuted, fontSize = 13.sp)
            if (itinerary.totalEstimatedCost > 0) {
                Text("Tổng ước tính: ${formatVnd(itinerary.totalEstimatedCost)}", color = Coral, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        itinerary.days.forEach { day ->
            AppCard {
                Text("Ngày ${day.day}", color = Blue, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
                if (day.title.isNotBlank()) Text(day.title, color = TextMuted, fontSize = 13.sp)
                Spacer(Modifier.height(8.dp))
                day.activities.forEachIndexed { index, activity ->
                    ItineraryTimelineActivity(
                        activity = activity,
                        isFirst = index == 0,
                        isLast = index == day.activities.lastIndex,
                        onOpenService = onOpenService
                    )
                }
            }
        }

        if (itinerary.tips.isNotEmpty()) {
            AppCard {
                Text("Mẹo hữu ích", color = Coral, fontWeight = FontWeight.ExtraBold)
                itinerary.tips.forEach { tip ->
                    Text("• $tip", color = TextMuted, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun ItineraryTimelineActivity(
    activity: ItineraryActivity,
    isFirst: Boolean,
    isLast: Boolean,
    onOpenService: (String) -> Unit,
) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                Modifier
                    .width(2.dp)
                    .height(12.dp)
                    .background(if (isFirst) Color.Transparent else Border)
            )
            Box(
                Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(if (activity.serviceId.isBlank()) Border else Blue),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                )
            }
            Box(
                Modifier
                    .width(2.dp)
                    .height(if (isLast) 12.dp else 72.dp)
                    .background(if (isLast) Color.Transparent else Border)
            )
        }

        Card(
            Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(Surface),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border)
        ) {
            Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        activity.time,
                        color = Blue,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(BlueSoft)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                    if (activity.estimatedCost > 0) Text(formatVnd(activity.estimatedCost), color = Coral, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Text(activity.title, color = TextMain, fontWeight = FontWeight.ExtraBold)
                if (activity.description.isNotBlank()) Text(activity.description, color = TextMuted, fontSize = 13.sp)
                activity.distanceFromStayKm?.let { km ->
                    Text(
                        String.format("Cách nơi lưu trú · %.1f km", km),
                        color = Blue,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
                if (activity.serviceId.isNotBlank()) {
                    TextButton(onClick = { onOpenService(activity.serviceId) }) {
                        Text("Đặt dịch vụ", color = Blue, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileScreen(state: AppState) {
    val activity = LocalContext.current as? MainActivity

    Column(Modifier.fillMaxSize()) {
        BluePageHeader("ACCOUNT", "Tài khoản", "Quản lý voucher, lịch trình và ưu đãi S-Loco")
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            AppCard {
                Text(state.userName.ifBlank { "Khách S-Loco" }, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold)
                Text(state.userPhone.ifBlank { "Đăng nhập để lưu voucher và theo dõi đơn hàng" }, color = TextMuted)
            }
            if (state.token == null) {
                Button(onClick = { state.screen = Screen.Login(null) }, colors = ButtonDefaults.buttonColors(containerColor = Blue), modifier = Modifier.fillMaxWidth()) {
                    Text("Đăng nhập để cá nhân hóa trải nghiệm")
                }
            } else {
                Button(onClick = { state.logout() }, colors = ButtonDefaults.buttonColors(containerColor = Coral), modifier = Modifier.fillMaxWidth()) {
                    Text("Đăng xuất")
                }
            }
            MenuRow("🎫", "Voucher của tôi") { state.tab = AppTab.Vouchers }
            MenuRow("🍽️", "Đặt chỗ nhà hàng") { state.tab = AppTab.Vouchers }
            MenuRow("🤖", "Lịch trình AI") { state.tab = AppTab.AI }
            MenuRow("🌤️", "Thời tiết") { state.screen = Screen.Weather }
            MenuRow("🔔", "Bật thông báo đơn hàng") {
                activity?.requestNotificationPermissionIfNeeded()
                    ?: run { state.message = "Mở app trên thiết bị Android để bật thông báo." }
            }
            MenuRow("🔐", "Chính sách riêng tư") { openLegalUrl(state.context, LEGAL_PRIVACY_URL) }
            MenuRow("📄", "Điều khoản sử dụng") { openLegalUrl(state.context, LEGAL_TERMS_URL) }
            MenuRow("❔", "Hỗ trợ") { openLegalUrl(state.context, LEGAL_SUPPORT_URL) }
            MenuRow("🗑", "Xóa tài khoản") { openLegalUrl(state.context, LEGAL_DELETE_ACCOUNT_URL) }
        }
    }
}

@Composable
private fun LoginScreen(state: AppState, redirect: Screen?) {
    var phone by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize()) {
        BluePageHeader("S-LOCO ACCOUNT", "Chào mừng đến S-Loco", "Nhập số điện thoại để nhận mã đăng nhập qua SMS")
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(phone, { phone = it }, label = { Text("Số điện thoại") }, singleLine = true)
            Button(onClick = { scope.launch { state.sendOtp(phone, redirect) } }, colors = ButtonDefaults.buttonColors(containerColor = Blue), modifier = Modifier.fillMaxWidth()) {
                Text("Gửi mã OTP")
            }
        }
    }
}

@Composable
private fun OtpScreen(state: AppState, phone: String, redirect: Screen?) {
    var code by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    Column(Modifier.fillMaxSize()) {
        BluePageHeader("OTP VERIFICATION", "Nhập mã OTP", "Mã 4 chữ số đã được gửi đến $phone")
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(code, { if (it.length <= 4) code = it }, label = { Text("OTP") }, singleLine = true)
            Button(onClick = { scope.launch { state.verifyOtp(phone, code, redirect) } }, colors = ButtonDefaults.buttonColors(containerColor = Blue), modifier = Modifier.fillMaxWidth()) {
                Text("Xác minh")
            }
        }
    }
}

@Composable
private fun TextShell(title: String, body: String, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        TopBack(title, onBack)
        Text(body, Modifier.padding(16.dp), color = TextMain)
    }
}

@Composable
private fun WeatherSummaryCard(weather: Weather?, onClick: () -> Unit) {
    AppCard {
        Row(
            Modifier
                .fillMaxWidth()
                .clickable(onClick = onClick),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Thời tiết Sầm Sơn", color = TextMain, fontWeight = FontWeight.ExtraBold)
                Text(
                    weather?.travelTip ?: "UV, mưa, gió, sóng và nhiệt độ biển cho chuyến đi.",
                    color = TextMuted,
                    fontSize = 12.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Text(weather?.let { "${it.temperature}°C" } ?: "Xem", color = Blue, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun WeatherScreen(state: AppState) {
    val scope = rememberCoroutineScope()
    LaunchedEffect(Unit) {
        if (state.weather == null) state.loadWeather()
    }

    LazyColumn(Modifier.fillMaxSize()) {
        item {
            TopBack("Thời tiết", state::back)
            state.weather?.let { weather ->
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    BlueCard(
                        "BÃI BIỂN SẦM SƠN",
                        "${weather.temperature}°C · ${weather.condition}",
                        "Cảm giác như ${weather.apparentTemperature ?: weather.temperature}°C"
                    )
                    WeatherMetricGrid(weather)
                    weather.beach?.let { BeachWeatherCard(it) }
                    AppCard {
                        Text("Gợi ý cho khách du lịch", color = TextMain, fontWeight = FontWeight.ExtraBold)
                        Text(weather.travelTip, color = TextMuted)
                    }
                    Text("Dự báo 7 ngày", color = TextMain, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                }
            } ?: AppCard {
                Text("Chưa có dữ liệu thời tiết", color = TextMain, fontWeight = FontWeight.ExtraBold)
                TextButton(onClick = { scope.launch { state.loadWeather() } }) {
                    Text("Tải lại", color = Blue, fontWeight = FontWeight.Bold)
                }
            }
        }
        items(state.weather?.forecast.orEmpty()) { day ->
            WeatherForecastRow(day)
        }
        item { Spacer(Modifier.height(40.dp)) }
    }
}

@Composable
private fun WeatherMetricGrid(weather: Weather) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        WeatherMetric("Độ ẩm", "${weather.humidity}%", Modifier.weight(1f))
        WeatherMetric("Gió", "${weather.windSpeed} km/h", Modifier.weight(1f))
    }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        WeatherMetric("UV", weather.uvIndex?.toString() ?: "--", Modifier.weight(1f))
        WeatherMetric("Mưa", weather.rainProbability?.let { "$it%" } ?: "--", Modifier.weight(1f))
    }
}

@Composable
private fun WeatherMetric(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border)
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(label, color = TextMuted, fontSize = 12.sp)
            Text(value, color = TextMain, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun BeachWeatherCard(beach: BeachWeather) {
    AppCard {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Biển Sầm Sơn", color = TextMain, fontWeight = FontWeight.ExtraBold)
            Text(beach.safetyLabel, color = Blue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            WeatherMetric("Sóng", beach.waveHeight?.let { "$it m" } ?: "--", Modifier.weight(1f))
            WeatherMetric("Nước biển", beach.seaSurfaceTemperature?.let { "$it°C" } ?: "--", Modifier.weight(1f))
        }
        Text(beach.safetyTip, color = TextMuted)
    }
}

@Composable
private fun WeatherForecastRow(day: WeatherForecastDay) {
    Card(
        Modifier
            .padding(horizontal = 16.dp, vertical = 5.dp)
            .fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Border)
    ) {
        Row(
            Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(day.day, color = TextMain, fontWeight = FontWeight.Bold, modifier = Modifier.width(64.dp))
            Column(Modifier.weight(1f)) {
                Text(day.condition, color = TextMain, fontWeight = FontWeight.SemiBold)
                Text("Mưa ${day.rainProbability ?: 0}% · UV ${day.uvIndex ?: 0.0}", color = TextMuted, fontSize = 12.sp)
            }
            Text("${day.high}°/${day.low}°", color = Blue, fontWeight = FontWeight.ExtraBold)
        }
    }
}

@Composable
private fun HeroHeader(title: String, subtitle: String, trailing: String? = null, searchText: String, onSearch: () -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp))
            .height(240.dp)
    ) {
        Image(
            painter = painterResource(R.drawable.tourist_hero),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )
        Box(
            Modifier
                .fillMaxSize()
                .background(Brush.verticalGradient(listOf(Color.Black.copy(alpha = 0.44f), Blue.copy(alpha = 0.34f))))
        )
        Column(
            Modifier
                .fillMaxSize()
                .padding(16.dp)
                .padding(bottom = 22.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(subtitle, color = Color.White.copy(alpha = 0.86f), fontWeight = FontWeight.SemiBold)
                    Text(title, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                }
                if (trailing != null) {
                    Box(
                        Modifier
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.18f))
                            .padding(horizontal = 16.dp, vertical = 10.dp)
                    ) {
                        Text(trailing, color = Color.White, fontWeight = FontWeight.ExtraBold)
                    }
                }
            }
            Row(
                Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .clip(RoundedCornerShape(25.dp))
                    .background(Color.White)
                    .clickable(onClick = onSearch)
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("🔍")
                Text(searchText, color = TextMuted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun CategoryPanel(state: AppState) {
    Card(
        Modifier
            .padding(horizontal = 16.dp)
            .padding(top = 0.dp)
            .fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(Color.White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        CategoryChips(state.homeCategory) { value ->
            state.homeCategory = value.ifEmpty { "" }
            state.loadServices()
        }
    }
}

@Composable
private fun CategoryChips(selected: String, onSelect: (String) -> Unit) {
    Row(
        Modifier.padding(12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        touristCategories.take(4).forEach { cat -> Pill(cat.label, selected == cat.value) { onSelect(cat.value) } }
    }
    Row(
        Modifier.padding(start = 12.dp, end = 12.dp, bottom = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        touristCategories.drop(4).forEach { cat -> Pill(cat.label, selected == cat.value) { onSelect(cat.value) } }
    }
}

@Composable
private fun Pill(label: String, active: Boolean, onClick: () -> Unit) {
    Text(
        label,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(if (active) Blue else Color.White)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        color = if (active) Color.White else TextMain,
        fontWeight = FontWeight.Bold,
        fontSize = 12.sp
    )
}

@Composable
private fun SectionTitle(title: String, kicker: String? = null) {
    Column(Modifier.padding(horizontal = 16.dp, vertical = 18.dp)) {
        if (kicker != null) Text(kicker, color = Coral, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
        Text(title, color = TextMain, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
    }
}

@Composable
private fun OfferCard(icon: String, title: String, body: String, onClick: () -> Unit) {
    Card(
        Modifier
            .width(170.dp)
            .height(126.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(Color.White)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(icon, fontSize = 24.sp)
            Text(title, color = TextMain, fontWeight = FontWeight.ExtraBold)
            Text(body, color = TextMuted, fontSize = 12.sp, maxLines = 2)
        }
    }
}

@Composable
private fun ServiceCard(service: Service, onClick: () -> Unit) {
    val offerBadge = service.offerBadgeLabel()
    val preAppPrice = service.preAppPrice()
    val appSaving = service.appSavingAmount()
    Card(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(Color.White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(1.12f)
                .background(Blue),
            contentAlignment = Alignment.BottomStart
        ) {
            Image(
                painter = painterResource(serviceImageRes(service)),
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            Box(
                Modifier
                    .fillMaxSize()
                    .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.52f))))
            )
            Text("S-LOCO\nCoastal experience", color = Color.White, modifier = Modifier.padding(12.dp), fontWeight = FontWeight.Bold)
            if (offerBadge != null) {
                OfferBadge(
                    label = offerBadge,
                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
                )
            }
            Text(
                service.category,
                color = Blue,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(8.dp)
                    .clip(RoundedCornerShape(99.dp))
                    .background(Color.White)
                    .padding(horizontal = 9.dp, vertical = 4.dp),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(service.name, color = TextMain, fontWeight = FontWeight.ExtraBold, maxLines = 2)
            Text(service.vendorName, color = TextMuted, fontSize = 12.sp, maxLines = 1)
            service.locationSummary()?.let { Text(it, color = TextMuted, fontSize = 12.sp, maxLines = 1) }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    if (service.isReservation) {
                        Text("Đặt qua app", color = Blue, fontWeight = FontWeight.ExtraBold)
                        if (service.appDiscountPercent > 0) {
                            AppSavingStrip(
                                "Nhận thêm ${service.appDiscountPercent}% tại cửa hàng",
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    } else {
                        if (service.originalPrice > service.price) {
                            Text(
                                formatVnd(service.originalPrice),
                                color = TextMuted,
                                fontSize = 12.sp,
                                textDecoration = TextDecoration.LineThrough
                            )
                        }
                        if (preAppPrice != null && service.discountPercent > 0) {
                            Text("Giá KM: ${formatVnd(preAppPrice)}", color = TextMuted, fontSize = 12.sp, maxLines = 1)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(formatVnd(service.price), color = Blue, fontWeight = FontWeight.ExtraBold)
                            if (service.appDiscountPercent > 0) {
                                Text("giá app", color = Coral, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                        if (appSaving != null) {
                            AppSavingStrip(
                                "Đặt qua app tiết kiệm thêm ${formatVnd(appSaving)}",
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
                Text("★ ${service.rating}", color = TextMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

private fun Service.offerBadgeLabel(): String? = when {
    appDiscountPercent > 0 -> "App -$appDiscountPercent%"
    discountPercent > 0 -> "KM -$discountPercent%"
    else -> null
}

private fun Service.preAppPrice(): Int? {
    if (appDiscountPercent !in 1..99 || price <= 0) return if (discountPercent > 0) price else null
    val value = (price * 100.0 / (100 - appDiscountPercent)).roundToInt()
    return value.takeIf { it > price }
}

private fun Service.appSavingAmount(): Int? {
    val value = preAppPrice()?.minus(price) ?: return null
    return value.takeIf { it > 0 && appDiscountPercent > 0 }
}

@Composable
private fun VendorRow(vendor: Vendor, onClick: () -> Unit) {
    AppCard {
        Column(Modifier.clickable(onClick = onClick), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(vendor.name, fontWeight = FontWeight.ExtraBold, color = TextMain)
            Text(vendor.address, color = TextMuted, maxLines = 1)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("★ ${vendor.rating}", color = Blue, fontWeight = FontWeight.Bold)
                Text("Xem chi tiết →", color = TextMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun VoucherCard(voucher: Voucher, onClick: () -> Unit) {
    Card(
        Modifier
            .padding(horizontal = 16.dp, vertical = 7.dp)
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(Color.White)
    ) {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(BlueSoft),
                contentAlignment = Alignment.Center
            ) { Text(if (voucher.isTicket) "VÉ" else "VC", color = Blue, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp) }
            Column(Modifier.weight(1f)) {
                Text(voucher.serviceName.ifBlank { voucher.productLabel }, fontWeight = FontWeight.ExtraBold, maxLines = 1)
                Text(voucher.vendorName, color = TextMuted, maxLines = 1)
                Text(formatVnd(voucher.totalAmount), color = Blue, fontWeight = FontWeight.Bold)
            }
            Text(statusLabel(voucher.status), color = Blue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun ReservationCard(reservation: Reservation, onClick: () -> Unit) {
    Card(
        Modifier
            .padding(horizontal = 16.dp, vertical = 7.dp)
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(Color.White)
    ) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(reservation.serviceName.ifBlank { "Đặt chỗ" }, fontWeight = FontWeight.ExtraBold, color = TextMain)
                Text(reservationStatusLabel(reservation.status), color = Blue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            Text(reservation.vendorName, color = TextMuted)
            Text("${reservation.partySize} người · ${reservation.requestedTime}", color = TextMuted, fontSize = 12.sp)
            if (!reservation.voucherCode.isNullOrBlank()) Text("Mã iPos: ${reservation.voucherCode}", color = Coral, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun BluePageHeader(kicker: String, title: String, subtitle: String) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 28.dp, bottomEnd = 28.dp))
            .background(Blue)
            .padding(16.dp)
            .padding(bottom = 34.dp)
    ) {
        Text(kicker, color = Color.White.copy(alpha = 0.72f), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
        Text(title, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
        Text(subtitle, color = Color.White.copy(alpha = 0.78f))
    }
}

@Composable
private fun BlueCard(kicker: String, title: String, subtitle: String) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Blue)
            .padding(20.dp)
    ) {
        Text(kicker, color = Color.White.copy(alpha = 0.72f), fontSize = 11.sp, fontWeight = FontWeight.ExtraBold)
        Text(title, color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
        Text(subtitle, color = Color.White.copy(alpha = 0.78f))
    }
}

@Composable
private fun AppCard(horizontal: Alignment.Horizontal = Alignment.Start, content: @Composable ColumnScope.() -> Unit) {
    Card(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(Color.White),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(
            Modifier.padding(16.dp),
            horizontalAlignment = horizontal,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            content = content
        )
    }
}

@Composable
private fun DiscountChip(label: String, fontSize: Int = 13) {
    Text(
        label,
        color = Color.White,
        modifier = Modifier
            .clip(RoundedCornerShape(99.dp))
            .background(Coral)
            .padding(horizontal = 9.dp, vertical = 4.dp),
        fontSize = fontSize.sp,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun OfferBadge(label: String, modifier: Modifier = Modifier) {
    Text(
        label,
        color = Color.White,
        modifier = modifier
            .clip(RoundedCornerShape(99.dp))
            .background(Brush.horizontalGradient(listOf(Coral, Color(0xFFFF8A3D))))
            .padding(horizontal = 8.dp, vertical = 4.dp),
        fontSize = 11.sp,
        fontWeight = FontWeight.ExtraBold
    )
}

@Composable
private fun AppSavingStrip(label: String, modifier: Modifier = Modifier) {
    Text(
        label,
        color = Blue,
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(BlueSoft)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        fontSize = 11.sp,
        fontWeight = FontWeight.ExtraBold,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis
    )
}

@Composable
private fun TopBack(title: String, onBack: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(Color.White)
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("← Quay lại", color = Blue, fontWeight = FontWeight.Bold, modifier = Modifier.clickable(onClick = onBack))
        Text(title, color = TextMain, fontWeight = FontWeight.Bold)
        Spacer(Modifier.width(72.dp))
    }
}

@Composable
private fun Stepper(value: Int, onMinus: () -> Unit, onPlus: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("−", color = Blue, fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable(onClick = onMinus))
        Text(value.toString(), fontWeight = FontWeight.Bold)
        Text("+", color = Blue, fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable(onClick = onPlus))
    }
}
@Composable
private fun InfoRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = TextMuted)
        Text(value, color = TextMain, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun MenuRow(icon: String, label: String, onClick: () -> Unit) {
    AppCard { Row(Modifier.clickable(onClick = onClick), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) { Text(icon); Text(label, fontWeight = FontWeight.Bold) } }
}

private fun openLegalUrl(context: Context, url: String) {
    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
}

@Composable
private fun LoginRequired(state: AppState) {
    Column(Modifier.fillMaxSize()) {
        BluePageHeader("MY PASSES", "Voucher của tôi", "Đăng nhập để xem và sử dụng voucher")
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            AppCard { Text("Bạn vẫn có thể khám phá dịch vụ trước.", color = TextMuted) }
            Button(onClick = { state.screen = Screen.Login(null) }, colors = ButtonDefaults.buttonColors(containerColor = Blue), modifier = Modifier.fillMaxWidth()) {
                Text("Đăng nhập")
            }
        }
    }
}

@Composable
private fun QrImage(value: String) {
    val bitmap = remember(value) { generateQr(value, 220) }
    Image(bitmap.asImageBitmap(), contentDescription = "Voucher QR", modifier = Modifier.size(220.dp))
}

@Composable
private fun AppBackground() {
    Canvas(Modifier.fillMaxSize()) {
        drawRect(Brush.verticalGradient(listOf(Blue, Blue2)))
    }
}

private fun generateQr(value: String, size: Int): Bitmap {
    val matrix = QRCodeWriter().encode(value, BarcodeFormat.QR_CODE, size, size)
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    for (x in 0 until size) {
        for (y in 0 until size) {
            bitmap.setPixel(x, y, if (matrix[x, y]) TextMain.toArgb() else Color.White.toArgb())
        }
    }
    return bitmap
}

private fun serviceImageRes(service: Service): Int {
    val value = "${service.category} ${service.name}".lowercase()
    return when {
        "spa" in value || "massage" in value -> R.drawable.tourist_spa
        "ẩm" in value || "am thuc" in value || "food" in value || "nhà hàng" in value -> R.drawable.tourist_food
        else -> R.drawable.tourist_boat
    }
}

private class AppState(val context: Context) {
    private val prefs = context.getSharedPreferences("tourist", Context.MODE_PRIVATE)
    private val api = ApiClient(prefs)
    private val pushRegistrar = TouristPushRegistrar(context.applicationContext)

    var screen by mutableStateOf<Screen>(Screen.Main)
    var tab by mutableStateOf(AppTab.Home)
    var loading by mutableStateOf(false)
    var loadingText by mutableStateOf("")
    var message by mutableStateOf<String?>(null)
    var token by mutableStateOf(prefs.getString("access_token", null))
    var userName by mutableStateOf("")
    var userPhone by mutableStateOf("")
    var homeCategory by mutableStateOf("")
    var services by mutableStateOf(emptyList<Service>())
    var searchServices by mutableStateOf(emptyList<Service>())
    var vendors by mutableStateOf(emptyList<Vendor>())
    var vouchers by mutableStateOf(emptyList<Voucher>())
    var reservations by mutableStateOf(emptyList<Reservation>())
    var currentOrder by mutableStateOf<Order?>(null)
    var itinerary by mutableStateOf<GeneratedItinerary?>(null)
    var weather by mutableStateOf<Weather?>(null)
    private var refreshJob: Job? = null
    private val stack = mutableListOf<Screen>()

    suspend fun bootstrap() {
        startTokenRefreshLoop()
        if (api.hasRefreshToken()) refreshSessionIfNeeded()
        loadServices()
        loadWeather()
        search("", "")
        if (token != null) {
            registerPushToken()
            loadVouchers()
        }
    }

    fun back() {
        screen = stack.removeLastOrNull() ?: Screen.Main
    }

    fun openService(service: Service) {
        stack.add(screen)
        screen = Screen.ServiceDetail(service)
    }

    fun openService(serviceId: String) {
        val service = services.firstOrNull { it.id == serviceId } ?: searchServices.firstOrNull { it.id == serviceId }
        if (service == null) {
            message = "Không tìm thấy dịch vụ trong danh sách hiện tại."
            return
        }
        openService(service)
    }

    fun openVendor(vendor: Vendor) {
        stack.add(screen)
        screen = Screen.VendorDetail(vendor)
    }

    fun loadServices() {
        run("Đang tải dịch vụ...") {
            services = api.services(category = homeCategory)
        }
    }

    suspend fun search(query: String, category: String) = run("Đang tìm kiếm...") {
        searchServices = api.services(query = query, category = category)
        vendors = api.vendors(query, category)
    }

    fun createOrder(service: Service, quantity: Int) {
        if (token == null) {
            stack.add(screen)
            screen = Screen.Login(Screen.ServiceDetail(service))
            return
        }
        run("Đang tạo đơn hàng...") {
            val orderId = api.createOrder(service.id, quantity)
            stack.add(screen)
            screen = Screen.Checkout(orderId)
        }
    }

    fun createReservation(service: Service, partySize: Int, requestedTime: String, note: String) {
        if (token == null) {
            stack.add(screen)
            screen = Screen.Login(Screen.ServiceDetail(service))
            return
        }
        run("Đang gửi yêu cầu đặt chỗ...") {
            val reservation = api.createReservation(service.id, partySize, requestedTime, note)
            reservations = listOf(reservation) + reservations
            stack.add(screen)
            screen = Screen.ReservationDetail(reservation)
        }
    }

    suspend fun loadOrder(id: String) = run("Đang tải đơn hàng...") {
        currentOrder = api.order(id)
    }

    fun loadVouchers() {
        run("Đang tải voucher...") {
            vouchers = api.vouchers()
        }
    }

    fun loadReservations() {
        run("Đang tải đặt chỗ...") {
            reservations = api.reservations()
        }
    }

    suspend fun sendOtp(phone: String, redirect: Screen?) = run("Đang gửi OTP...") {
        api.sendOtp(phone)
        screen = Screen.Otp(phone, redirect)
    }

    suspend fun verifyOtp(phone: String, code: String, redirect: Screen?) = run("Đang xác minh...") {
        val auth = api.verifyOtp(phone, code)
        token = auth.token
        userName = auth.name
        userPhone = phone
        startTokenRefreshLoop()
        registerPushToken()
        loadVouchers()
        screen = redirect ?: Screen.Main
    }

    suspend fun createItinerary(
        days: String,
        budget: String,
        preferences: String,
        groupType: String = "couple",
        stay: ItineraryStayContext = ItineraryStayContext(),
        preferNearStay: Boolean = false,
    ) = run("Đang tạo lịch trình...") {
        itinerary = api.itinerary(
            days.toIntOrNull() ?: 2,
            budget.toIntOrNull() ?: 2_000_000,
            preferences,
            groupType,
            stay,
            preferNearStay,
        )
    }

    fun loadWeather() {
        run("Đang tải thời tiết...") {
            weather = api.weather()
        }
    }

    fun logout() {
        refreshJob?.cancel()
        refreshJob = null
        prefs.edit().clear().apply()
        token = null
        userName = ""
        userPhone = ""
        vouchers = emptyList()
        reservations = emptyList()
        currentOrder = null
        itinerary = null
    }

    private fun run(text: String, block: suspend () -> Unit) {
        kotlinx.coroutines.MainScope().launch {
            loading = true
            loadingText = text
            try {
                block()
            } catch (e: SessionExpiredException) {
                expireSession(true)
            } catch (e: Exception) {
                message = e.message ?: "Không thể kết nối API."
            } finally {
                loading = false
                loadingText = ""
            }
        }
    }

    private fun startTokenRefreshLoop() {
        if (refreshJob != null) return
        refreshJob = kotlinx.coroutines.MainScope().launch {
            while (true) {
                delay(60_000)
                refreshSessionIfNeeded()
            }
        }
    }

    private suspend fun refreshSessionIfNeeded() {
        if (!api.hasRefreshToken()) return
        try {
            if (api.refreshAccessTokenIfNeeded()) {
                token = prefs.getString("access_token", null)
            }
        } catch (_: SessionExpiredException) {
            expireSession(true)
        }
    }

    private fun expireSession(showMessage: Boolean) {
        refreshJob?.cancel()
        refreshJob = null
        prefs.edit().clear().apply()
        token = null
        userName = ""
        userPhone = ""
        vouchers = emptyList()
        reservations = emptyList()
        currentOrder = null
        itinerary = null
        screen = Screen.Main
        tab = AppTab.Home
        if (showMessage) message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    }

    private suspend fun registerPushToken() {
        try {
            pushRegistrar.registerCurrentToken()
        } catch (error: Exception) {
            println("Unable to register FCM token: ${error.message}")
        }
    }
}

private class ApiClient(private val prefs: android.content.SharedPreferences) {
    private val client = OkHttpClient()
    private val itineraryClient = client.newBuilder()
        .callTimeout(120, TimeUnit.SECONDS)
        .readTimeout(120, TimeUnit.SECONDS)
        .build()
    private val json = Json { ignoreUnknownKeys = true }
    private val baseUrl = BuildConfig.API_BASE_URL
    private val refreshSkewMs = 120_000L

    fun hasRefreshToken(): Boolean = !prefs.getString("refresh_token", null).isNullOrBlank()

    suspend fun services(query: String = "", category: String = ""): List<Service> {
        var path = "/services?page=1&limit=30"
        val categoryValue = touristCategoryApiValue(category)
        if (query.isNotBlank()) path += "&q=${query.urlEncode()}"
        if (categoryValue.isNotBlank()) path += "&category=${categoryValue.urlEncode()}"
        val data = request(path)
        return data.obj("data")?.array("items").orEmpty().mapNotNull { parseService(it.jsonObject) }
    }

    suspend fun vendors(query: String = "", category: String = ""): List<Vendor> {
        var path = "/vendors?page=1"
        val categoryValue = touristCategoryApiValue(category)
        if (query.isNotBlank()) path += "&q=${query.urlEncode()}"
        if (categoryValue.isNotBlank()) path += "&category=${categoryValue.urlEncode()}"
        val data = request(path)
        return data.obj("data")?.array("items").orEmpty().map { raw ->
            val obj = raw.jsonObject
            Vendor(
                id = obj.str("id"),
                name = obj.str("name").ifBlank { "Cửa hàng" },
                address = obj.str("address"),
                rating = obj.num("rating", "ratingAvg"),
            )
        }
    }

    suspend fun sendOtp(phone: String) {
        request("/auth/otp/send", "POST", buildJsonObject { put("phone", phone) }, canRefresh = false)
    }

    suspend fun verifyOtp(phone: String, code: String): AuthResult {
        val res = request("/auth/otp/verify", "POST", buildJsonObject { put("phone", phone); put("code", code) }, canRefresh = false)
        val data = res.obj("data") ?: JsonObject(emptyMap())
        val tokens = data.obj("tokens")
        val token = data.str("access_token").ifBlank { tokens?.str("access_token").orEmpty() }
        val refreshToken = data.str("refresh_token").ifBlank { tokens?.str("refresh_token").orEmpty() }
        val expiresIn = data.int("expires_in").takeIf { it > 0 } ?: tokens?.int("expires_in")?.takeIf { it > 0 } ?: 900
        saveTokens(token, refreshToken, expiresIn)
        val user = data.obj("user")
        return AuthResult(token, refreshToken, expiresIn, user?.str("full_name", "fullName").orEmpty())
    }

    suspend fun createOrder(serviceId: String, quantity: Int): String {
        val body = buildJsonObject {
            put("items", JsonArray(listOf(buildJsonObject { put("service_id", serviceId); put("quantity", quantity) })))
        }
        val res = request("/orders", "POST", body)
        return res.obj("data")?.obj("order")?.str("id") ?: error("Không tạo được đơn hàng.")
    }

    suspend fun createReservation(serviceId: String, partySize: Int, requestedTime: String, note: String): Reservation {
        val body = buildJsonObject {
            put("service_id", serviceId)
            put("party_size", partySize)
            put("requested_time", requestedTime)
            if (note.isNotBlank()) put("customer_note", note)
        }
        val res = request("/reservations", "POST", body)
        val reservation = res.obj("data")?.obj("reservation") ?: error("Không tạo được đặt chỗ.")
        return parseReservation(buildJsonObject {
            put("reservation", reservation)
        })
    }

    suspend fun reservations(): List<Reservation> {
        val data = request("/reservations?page=1&limit=50").obj("data")
        return data?.array("items").orEmpty().map { parseReservation(it.jsonObject) }
    }

    suspend fun order(id: String): Order {
        val data = request("/orders/$id").obj("data") ?: JsonObject(emptyMap())
        val order = data.obj("order") ?: data
        val items = data.array("items").map {
            val obj = it.jsonObject
            val snap = obj.obj("serviceSnapshot")
            OrderLine(
                name = snap?.str("name").ifNullOrBlank { obj.str("service_name").ifBlank { "Dịch vụ" } },
                quantity = obj.int("quantity").coerceAtLeast(1),
                price = obj.money("unitPrice", "price")
            )
        }
        return Order(order.str("id"), order.str("status"), order.money("finalAmount", "total_amount", "totalAmount"), items)
    }

    suspend fun vouchers(): List<Voucher> {
        val data = request("/vouchers?page=1&limit=50").obj("data")
        return data?.array("items").orEmpty().map { parseVoucher(it.jsonObject) }
    }

    suspend fun itinerary(
        days: Int,
        budget: Int,
        preferences: String,
        groupType: String = "couple",
        stay: ItineraryStayContext = ItineraryStayContext(),
        preferNearStay: Boolean = false,
    ): GeneratedItinerary {
        val res = request("/itinerary/generate", "POST", itineraryPayload(days, budget, preferences, groupType, stay, preferNearStay))
        val data = res.obj("data") ?: JsonObject(emptyMap())
        return parseItinerary(data.obj("itinerary") ?: data)
    }

    suspend fun weather(): Weather {
        val data = request("/content/weather", canRefresh = false).obj("data") ?: JsonObject(emptyMap())
        return parseWeather(data.obj("weather") ?: data)
    }

    suspend fun refreshAccessTokenIfNeeded(force: Boolean = false): Boolean = withContext(Dispatchers.IO) {
        val refreshToken = prefs.getString("refresh_token", null).orEmpty()
        if (refreshToken.isBlank()) {
            if (force) throw SessionExpiredException()
            return@withContext false
        }

        val expiresAt = prefs.getLong("access_token_expires_at_ms", 0L)
        if (!force && expiresAt > System.currentTimeMillis() + refreshSkewMs) {
            return@withContext true
        }

        val result = executeRequest("/auth/refresh", "POST", buildJsonObject {
            put("refresh_token", refreshToken)
        })
        if (result.statusCode == 401) throw SessionExpiredException()
        val parsed = parseSuccessfulResponse(result)
        val data = parsed.obj("data") ?: JsonObject(emptyMap())
        val accessToken = data.str("access_token")
        val newRefreshToken = data.str("refresh_token")
        if (accessToken.isBlank() || newRefreshToken.isBlank()) throw SessionExpiredException()
        saveTokens(accessToken, newRefreshToken, data.int("expires_in").takeIf { it > 0 } ?: 900)
        true
    }

    private suspend fun request(path: String, method: String = "GET", body: JsonObject? = null, canRefresh: Boolean = true): JsonObject = withContext(Dispatchers.IO) {
        if (canRefresh && hasRefreshToken()) refreshAccessTokenIfNeeded()
        val result = executeRequest(path, method, body)
        if (result.statusCode == 401 && canRefresh && hasRefreshToken()) {
            try {
                refreshAccessTokenIfNeeded(force = true)
                return@withContext parseSuccessfulResponse(executeRequest(path, method, body))
            } catch (_: SessionExpiredException) {
                clearTokens()
                throw SessionExpiredException()
            }
        }
        parseSuccessfulResponse(result)
    }

    private fun executeRequest(path: String, method: String = "GET", body: JsonObject? = null): HttpJsonResponse {
        val builder = Request.Builder()
            .url(baseUrl + path)
            .header("Content-Type", "application/json")
        prefs.getString("access_token", null)?.let { builder.header("Authorization", "Bearer $it") }
        val requestBody = body?.toString()?.toRequestBody("application/json".toMediaType())
        val request = builder.method(method, requestBody).build()
        val requestClient = if (path == "/itinerary/generate") itineraryClient else client
        return requestClient.newCall(request).execute().use { response ->
            val text = response.body?.string().orEmpty()
            val parsed = json.parseToJsonElement(text).jsonObject
            HttpJsonResponse(response.code, response.isSuccessful, parsed)
        }
    }

    private fun parseSuccessfulResponse(result: HttpJsonResponse): JsonObject {
        if (!result.isSuccessful || result.body["success"]?.jsonPrimitive?.content == "false") {
            if (result.statusCode == 401) throw SessionExpiredException()
            val message = result.body.obj("error")?.str("message").ifNullOrBlank { "API lỗi ${result.statusCode}" }
            error(message)
        }
        return result.body
    }

    private fun saveTokens(accessToken: String, refreshToken: String, expiresIn: Int) {
        prefs.edit()
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)
            .putLong("access_token_expires_at_ms", System.currentTimeMillis() + expiresIn * 1000L)
            .apply()
    }

    private fun clearTokens() {
        prefs.edit()
            .remove("access_token")
            .remove("refresh_token")
            .remove("access_token_expires_at_ms")
            .apply()
    }
}

private fun parseService(obj: JsonObject): Service? {
    val service = obj.obj("service") ?: obj
    val vendor = obj.obj("vendor")
    val category = obj.obj("category")
    val pricing = service.obj("pricing")
    val id = service.str("id")
    if (id.isBlank()) return null
    val original = service.money("originalPrice", "original_price")
    val vendorPrice = service.money("discountPrice", "discount_price").takeIf { it > 0 } ?: original
    val price = pricing?.money("final_price")?.takeIf { it > 0 } ?: vendorPrice
    val discount = pricing?.num("vendor_discount_percent")?.toInt()?.takeIf { it > 0 }
        ?: service.num("discountPercent", "discount_percent").toInt().takeIf { it > 0 }
        ?: if (original > vendorPrice && original > 0) ((1 - vendorPrice.toDouble() / original) * 100).toInt() else 0
    val appDiscount = pricing?.num("app_discount_percent")?.toInt()?.takeIf { it > 0 }
        ?: service.num("reservationDiscountPercent", "reservation_discount_percent").toInt()
    val fulfillmentType = service.str("fulfillmentType", "fulfillment_type").ifBlank { "fixed_price" }
    val productType = service.str("productType", "product_type").ifBlank {
        if (fulfillmentType == "reservation") "coupon" else "voucher"
    }
    return Service(
        id = id,
        name = service.str("name").ifBlank { "Dịch vụ" },
        description = service.str("description"),
        category = category?.str("name").ifNullOrBlank { service.str("category") },
        vendorName = vendor?.str("name").ifNullOrBlank { service.str("vendor_name") },
        vendorAddress = vendor?.str("address").orEmpty(),
        vendorLatitude = vendor?.numOrNull("latitude")?.takeIf { it in -90.0..90.0 },
        vendorLongitude = vendor?.numOrNull("longitude")?.takeIf { it in -180.0..180.0 },
        distanceFromOriginKm = obj.num("distanceFromOriginKm", "distance_from_origin_km").takeIf { it > 0 },
        originalPrice = original,
        price = price,
        discountPercent = discount,
        appDiscountPercent = appDiscount,
        fulfillmentType = fulfillmentType,
        productType = productType,
        reservationDiscountPercent = appDiscount,
        applicabilityPolicy = service.obj("applicabilityPolicy") ?: service.obj("applicability_policy"),
        rating = service.num("averageRating", "rating"),
        durationMinutes = service.int("durationMinutes", "duration_minutes")
    )
}

private fun parseReservation(obj: JsonObject): Reservation {
    val reservation = obj.obj("reservation") ?: obj
    val service = obj.obj("service")
    val vendor = obj.obj("vendor")
    val voucher = obj.obj("voucher")
    return Reservation(
        id = reservation.str("id"),
        status = reservation.str("status"),
        serviceName = service?.str("name").orEmpty(),
        vendorName = vendor?.str("name").orEmpty(),
        partySize = reservation.int("partySize", "party_size").coerceAtLeast(1),
        requestedTime = reservation.str("requestedTime", "requested_time"),
        voucherCode = voucher?.str("iposVoucherCode", "ipos_voucher_code"),
        discountPercent = voucher?.num("discountPercent", "discount_percent")?.toInt(),
    )
}

private fun parseVoucher(obj: JsonObject): Voucher {
    val voucher = obj.obj("voucher") ?: obj
    val service = obj.obj("service")
    val vendor = obj.obj("vendor")
    val snapshot = obj.obj("serviceSnapshot")
    val artifactType = voucher.str("artifact_type", "artifactType").ifBlank { snapshot?.str("artifactType", "artifact_type").orEmpty() }
    val productType = voucher.str("product_type", "productType").ifBlank {
        when (artifactType) {
            "ticket" -> "ticket"
            else -> "voucher"
        }
    }
    return Voucher(
        id = voucher.str("id"),
        status = voucher.str("status"),
        serviceName = obj.str("service_name").ifBlank { service?.str("name").ifNullOrBlank { snapshot?.str("name").orEmpty() } },
        vendorName = obj.str("vendor_name").ifBlank { vendor?.str("name").orEmpty() },
        quantity = obj.int("quantity").takeIf { it > 0 } ?: voucher.int("quantity").takeIf { it > 0 } ?: 1,
        totalAmount = obj.money("total_amount", "totalAmount", "totalPrice"),
        qrToken = voucher.str("qr_token", "qrToken"),
        productType = productType,
        artifactType = artifactType.ifBlank { if (productType == "ticket") "ticket" else "voucher" },
    )
}

private fun parseItinerary(obj: JsonObject): GeneratedItinerary {
    return GeneratedItinerary(
        title = obj.str("title").ifBlank { "Lịch trình S-Loco" },
        summary = obj.str("summary"),
        days = obj.array("days").map { dayElement ->
            val day = dayElement.jsonObject
            ItineraryDay(
                day = day.int("day").takeIf { it > 0 } ?: 1,
                title = day.str("title"),
                activities = day.array("activities").map { activityElement ->
                    val activity = activityElement.jsonObject
                    ItineraryActivity(
                        time = activity.str("time"),
                        title = activity.str("title").ifBlank { "Hoạt động" },
                        description = activity.str("description"),
                        serviceId = activity.str("service_id", "serviceId"),
                        estimatedCost = activity.money("estimated_cost", "estimatedCost"),
                        distanceFromStayKm = activity.numOrNull("distance_from_stay_km", "distanceFromStayKm"),
                    )
                }
            )
        },
        totalEstimatedCost = obj.money("total_estimated_cost", "totalEstimatedCost"),
        tips = obj.array("tips").mapNotNull { (it as? JsonPrimitive)?.contentOrNull }.filter { it.isNotBlank() }
    )
}

private fun parseWeather(obj: JsonObject): Weather {
    val beach = obj.obj("beach")?.let {
        BeachWeather(
            waveHeight = it.num("wave_height").takeIf { value -> value > 0 },
            wavePeriod = it.num("wave_period").takeIf { value -> value > 0 },
            seaSurfaceTemperature = it.num("sea_surface_temperature").takeIf { value -> value > 0 },
            safetyLabel = it.str("safety_label").ifBlank { "Đang cập nhật" },
            safetyTip = it.str("safety_tip")
        )
    }
    return Weather(
        temperature = obj.int("temperature"),
        apparentTemperature = obj.int("apparent_temperature").takeIf { it > 0 },
        condition = obj.str("condition").ifBlank { "Đang cập nhật" },
        humidity = obj.int("humidity"),
        windSpeed = obj.int("wind_speed"),
        windGusts = obj.int("wind_gusts").takeIf { it > 0 },
        uvIndex = obj.num("uv_index").takeIf { it > 0 },
        rainProbability = obj.int("rain_probability").takeIf { it >= 0 },
        cloudCover = obj.int("cloud_cover").takeIf { it >= 0 },
        travelTip = obj.str("travel_tip").ifBlank { "Theo dõi thời tiết trước khi đặt hoạt động ngoài trời." },
        beach = beach,
        forecast = obj.array("forecast").map { item ->
            val day = item.jsonObject
            WeatherForecastDay(
                day = day.str("day").ifBlank { day.str("date") },
                high = day.int("high"),
                low = day.int("low"),
                condition = day.str("condition").ifBlank { "Đang cập nhật" },
                rainProbability = day.int("rain_probability").takeIf { it >= 0 },
                uvIndex = day.num("uv_index").takeIf { it > 0 }
            )
        }
    )
}

data class TouristCategory(val value: String, val label: String)
private data class HomeCategoryAction(val icon: Int, val label: String, val category: String, val onClick: () -> Unit)

val touristCategories = listOf(
    TouristCategory("", "Tất cả"),
    TouristCategory("am-thuc", "Ẩm thực"),
    TouristCategory("luu-tru", "Lưu trú"),
    TouristCategory("spa-massage", "Spa"),
    TouristCategory("xe-dien", "Xe điện"),
    TouristCategory("giai-tri", "Giải trí"),
    TouristCategory("mua-sam", "Mua sắm")
)

fun touristCategoryApiValue(value: String): String {
    val trimmed = value.trim()
    if (trimmed.isEmpty() || trimmed == "Tất cả") return ""
    if (touristCategories.any { it.value == trimmed }) return trimmed
    if (trimmed == "Spa & Massage") return "spa-massage"
    return touristCategories.firstOrNull { it.label == trimmed }?.value ?: trimmed
}

fun itineraryPayload(
    days: Int,
    budget: Int,
    preferences: String,
    groupType: String = "couple",
    stay: ItineraryStayContext = ItineraryStayContext(),
    preferNearStay: Boolean = false,
): JsonObject {
    val preferenceList = preferences.split(",").map { it.trim() }.filter { it.isNotBlank() }
    return buildJsonObject {
        put("days", days)
        put("budget", budget)
        put("preferences", JsonArray(preferenceList.map { JsonPrimitive(it) }))
        put("group_type", groupType.ifBlank { "couple" })
        if (preferNearStay) {
            val stayLabel = stay.label?.trim().orEmpty()
            if (stayLabel.isNotBlank()) put("stay_location_label", stayLabel)
            if (stay.latitude != null) put("stay_latitude", stay.latitude)
            if (stay.longitude != null) put("stay_longitude", stay.longitude)
            put("prefer_near_stay", true)
        }
    }
}

private enum class AppTab(val label: String, val icon: String) {
    Home("Trang chủ", "⌂"),
    Browse("Tìm kiếm", "🔍"),
    Vouchers("Vé của tôi", "🎫"),
    AI("AI", "AI"),
    Profile("Tài khoản", "☺"),
}

private sealed class Screen {
    data object Main : Screen()
    data class ServiceDetail(val service: Service) : Screen()
    data class VendorDetail(val vendor: Vendor) : Screen()
    data class Checkout(val orderId: String) : Screen()
    data class OrderDetail(val orderId: String) : Screen()
    data class VoucherDetail(val voucher: Voucher) : Screen()
    data class ReservationDetail(val reservation: Reservation) : Screen()
    data class Login(val redirect: Screen?) : Screen()
    data class Otp(val phone: String, val redirect: Screen?) : Screen()
    data class Article(val title: String) : Screen()
    data object Weather : Screen()
}

private data class Service(
    val id: String,
    val name: String,
    val description: String,
    val category: String,
    val vendorName: String,
    val vendorAddress: String,
    val vendorLatitude: Double?,
    val vendorLongitude: Double?,
    val distanceFromOriginKm: Double?,
    val originalPrice: Int,
    val price: Int,
    val discountPercent: Int,
    val appDiscountPercent: Int,
    val fulfillmentType: String,
    val productType: String,
    val reservationDiscountPercent: Int,
    val applicabilityPolicy: JsonObject?,
    val rating: Double,
    val durationMinutes: Int,
) {
    val isCoupon: Boolean get() = productType == "coupon" || fulfillmentType == "reservation"
    val isTicket: Boolean get() = productType == "ticket"
    val isReservation: Boolean get() = isCoupon
    val productLabel: String get() = when {
        isCoupon -> "Coupon"
        isTicket -> "Vé"
        else -> "Voucher"
    }
    fun locationSummary(): String? = distanceFromOriginKm?.let { String.format("%.1f km", it) }
        ?: vendorAddress.takeIf { it.isNotBlank() }
    fun applicabilityPolicyLines(): List<String> {
        val policy = applicabilityPolicy ?: return emptyList()
        val lines = mutableListOf<String>()
        val weekdays = (policy["weekdays"] as? JsonArray)?.mapNotNull { it.jsonPrimitive.intOrNull }?.filter { it in 1..7 }.orEmpty()
        if (weekdays.isNotEmpty()) lines += "Áp dụng: ${weekdays.joinToString(", ") { weekdayLabel(it) }}"
        if (policy["exclude_public_holidays"]?.jsonPrimitive?.contentOrNull == "true") lines += "Không áp dụng ngày lễ."
        val blackoutDates = (policy["blackout_dates"] as? JsonArray)?.mapNotNull { it.jsonPrimitive.contentOrNull }.orEmpty()
        if (blackoutDates.isNotEmpty()) lines += "Không áp dụng: ${blackoutDates.joinToString(", ")}"
        policy["conditions"]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }?.let { lines += it }
        return lines
    }
    fun isLodging(): Boolean {
        val normalized = category.normalizeVietnamese()
        return normalized.contains("luu tru") || category.contains("Lưu trú", ignoreCase = true)
    }

    fun stayLabel(): String = if (vendorName.isBlank()) name else "$name - $vendorName"
    fun hasVendorCoordinate(): Boolean = vendorLatitude != null && vendorLongitude != null
    fun toStayContext(): ItineraryStayContext = ItineraryStayContext(stayLabel(), vendorLatitude, vendorLongitude)
}

private fun weekdayLabel(day: Int): String = when (day) {
    1 -> "Thứ 2"
    2 -> "Thứ 3"
    3 -> "Thứ 4"
    4 -> "Thứ 5"
    5 -> "Thứ 6"
    6 -> "Thứ 7"
    7 -> "Chủ nhật"
    else -> "Ngày $day"
}

private data class Vendor(val id: String, val name: String, val address: String, val rating: Double)
private data class Voucher(
    val id: String,
    val status: String,
    val serviceName: String,
    val vendorName: String,
    val quantity: Int,
    val totalAmount: Int,
    val qrToken: String,
    val productType: String,
    val artifactType: String,
) {
    val isTicket: Boolean get() = productType == "ticket" || artifactType == "ticket"
    val productLabel: String get() = if (isTicket) "Vé" else "Voucher"
}
private data class Reservation(
    val id: String,
    val status: String,
    val serviceName: String,
    val vendorName: String,
    val partySize: Int,
    val requestedTime: String,
    val voucherCode: String?,
    val discountPercent: Int?,
)
private data class Order(val id: String, val status: String, val totalAmount: Int, val items: List<OrderLine>)
private data class OrderLine(val name: String, val quantity: Int, val price: Int)
private data class AuthResult(val token: String, val refreshToken: String, val expiresIn: Int, val name: String)
private data class Weather(
    val temperature: Int,
    val apparentTemperature: Int?,
    val condition: String,
    val humidity: Int,
    val windSpeed: Int,
    val windGusts: Int?,
    val uvIndex: Double?,
    val rainProbability: Int?,
    val cloudCover: Int?,
    val travelTip: String,
    val beach: BeachWeather?,
    val forecast: List<WeatherForecastDay>,
)
private data class BeachWeather(
    val waveHeight: Double?,
    val wavePeriod: Double?,
    val seaSurfaceTemperature: Double?,
    val safetyLabel: String,
    val safetyTip: String,
)
private data class WeatherForecastDay(
    val day: String,
    val high: Int,
    val low: Int,
    val condition: String,
    val rainProbability: Int?,
    val uvIndex: Double?,
)
private data class GeneratedItinerary(val title: String, val summary: String, val days: List<ItineraryDay>, val totalEstimatedCost: Int, val tips: List<String>)
private data class ItineraryDay(val day: Int, val title: String, val activities: List<ItineraryActivity>)
private data class ItineraryActivity(
    val time: String,
    val title: String,
    val description: String,
    val serviceId: String,
    val estimatedCost: Int,
    val distanceFromStayKm: Double? = null,
)
private data class HttpJsonResponse(val statusCode: Int, val isSuccessful: Boolean, val body: JsonObject)
private class SessionExpiredException : RuntimeException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")

private fun JsonObject.obj(key: String): JsonObject? = this[key] as? JsonObject
private fun JsonObject.array(key: String): List<JsonElement> = (this[key] as? JsonArray)?.toList().orEmpty()
private fun JsonObject.str(vararg keys: String): String {
    for (key in keys) {
        val value = this[key]
        if (value is JsonPrimitive) return value.contentOrNull.orEmpty()
    }
    return ""
}
private fun JsonObject.num(vararg keys: String): Double {
    for (key in keys) {
        val value = this[key]
        if (value is JsonPrimitive) return value.doubleOrNull ?: value.contentOrNull?.toDoubleOrNull() ?: 0.0
    }
    return 0.0
}
private fun JsonObject.numOrNull(vararg keys: String): Double? {
    for (key in keys) {
        val value = this[key]
        if (value is JsonPrimitive) return value.doubleOrNull ?: value.contentOrNull?.toDoubleOrNull()
    }
    return null
}
private fun JsonObject.int(vararg keys: String): Int {
    for (key in keys) {
        val value = this[key]
        if (value is JsonPrimitive) return value.intOrNull ?: value.contentOrNull?.toIntOrNull() ?: 0
    }
    return 0
}
private fun JsonObject.money(vararg keys: String): Int = num(*keys).toInt()
private fun String?.ifNullOrBlank(fallback: () -> String): String = if (this.isNullOrBlank()) fallback() else this
private fun formatVnd(value: Int): String = "%,d₫".format(value).replace(',', '.')
private fun String.normalizeVietnamese(): String = java.text.Normalizer
    .normalize(this, java.text.Normalizer.Form.NFD)
    .replace("\\p{Mn}+".toRegex(), "")
    .lowercase()
private fun statusLabel(status: String): String = when (status) {
    "created" -> "Chờ thanh toán"
    "paid" -> "Đã thanh toán"
    "redeemed" -> "Đã sử dụng"
    "completed" -> "Hoàn thành"
    "refunded" -> "Đã hoàn tiền"
    else -> status
}
private fun reservationStatusLabel(status: String): String = when (status) {
    "requested" -> "Chờ liên hệ"
    "confirmed" -> "Đã xác nhận"
    "voucher_issued" -> "Đã có mã ưu đãi"
    "used" -> "Đã sử dụng"
    "settled" -> "Đã đối soát"
    "rejected" -> "Bị từ chối"
    "cancelled" -> "Đã hủy"
    else -> status
}
private fun String.urlEncode(): String = java.net.URLEncoder.encode(this, "UTF-8")
