package com.slocal.vendor.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
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
import androidx.compose.material3.Text
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
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.slocal.vendor.data.Settlement
import com.slocal.vendor.data.Voucher
import java.text.NumberFormat
import java.util.Locale
import kotlinx.coroutines.launch

private val Primary = Color(0xFF005E97)
private val SurfaceBg = Color(0xFFF4F7FB)
private val Success = Color(0xFF2E7D32)
private val Warning = Color(0xFFE65100)

@Composable
fun VendorApp() {
    val context = LocalContext.current.applicationContext
    val state = remember { AppState(context) }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        if (state.isAuthenticated) state.refreshHome()
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
                        snackbarHost = { SnackbarHost(snackbarHostState) },
                        bottomBar = {
                            NavigationBar {
                                AppTab.entries.forEach { tab ->
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
                            when (state.selectedTab) {
                                AppTab.Dashboard -> DashboardScreen(state)
                                AppTab.Scan -> ScanScreen(state)
                                AppTab.Orders -> OrdersScreen(state)
                                AppTab.Earnings -> EarningsScreen(state)
                                AppTab.Settings -> SettingsScreen(state)
                            }
                        }
                    }
                }

                if (state.isLoading) {
                    LoadingOverlay(state.loadingMessage)
                }
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
            StatCard("Chờ giải ngân", formatVnd(state.dashboard?.settlement?.pending), Modifier.fillMaxWidth(), Warning)
        }
        item { SectionTitle("Voucher gần đây") }
        items(state.dashboard?.recentOrders ?: state.vouchers.take(5)) { voucher ->
            VoucherCard(voucher)
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
    }
}

@Composable
private fun EarningsScreen(state: AppState) {
    ScreenList(title = "Thu nhập") {
        item {
            StatCard("Tổng doanh thu", formatVnd(state.dashboard?.total?.revenue), Modifier.fillMaxWidth(), Primary)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                StatCard("Đã thanh toán", formatVnd(state.dashboard?.settlement?.settled), Modifier.weight(1f), Success)
                StatCard("Chờ giải ngân", formatVnd(state.dashboard?.settlement?.pending), Modifier.weight(1f), Warning)
            }
        }
        item { SectionTitle("Lịch sử đối soát") }
        items(state.settlements) { SettlementCard(it) }
    }
}

@Composable
private fun SettingsScreen(state: AppState) {
    ScreenList(title = "Cài đặt") {
        item { InfoCard("Cửa hàng", state.vendor?.name ?: "Chưa tải thông tin") }
        item { InfoCard("Email", state.user?.email ?: state.vendor?.email ?: "Không có") }
        item { InfoCard("API", "http://10.0.2.2:3000/api/v1") }
        item {
            Button(onClick = { state.logout() }, modifier = Modifier.fillMaxWidth()) {
                Text("Đăng xuất")
            }
        }
    }
}

@Composable
private fun ScreenList(title: String, content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(title, fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Color(0xFF161B2E))
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
        title = voucher.serviceName ?: voucher.id,
        body = "${voucher.customerName ?: "Khách hàng"} · ${voucher.status} · ${formatVnd(voucher.finalAmount)}",
    )
}

@Composable
private fun SettlementCard(settlement: Settlement) {
    InfoCard(
        title = "Đối soát ${settlement.status}",
        body = "${formatVnd(settlement.netAmount)} · ${settlement.voucherCount ?: 0} voucher",
    )
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

private fun formatVnd(value: Long?): String {
    val amount = value ?: 0
    return NumberFormat.getNumberInstance(Locale("vi", "VN")).format(amount) + "₫"
}
