import CoreLocation
import SwiftUI
import WebKit

private enum LegalLink {
    static let privacy = URL(string: "https://sloco.vn/privacy")!
    static let terms = URL(string: "https://sloco.vn/terms")!
    static let support = URL(string: "https://sloco.vn/support")!
    static let deleteAccount = URL(string: "https://sloco.vn/delete-account")!
}

struct SettingsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(state.vendor?.name ?? "Chưa tải cửa hàng")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(VendorTheme.text)
                        Text(state.vendor?.address ?? state.vendor?.email ?? state.user?.email ?? "Chưa có thông tin liên hệ")
                            .font(.subheadline)
                            .foregroundStyle(VendorTheme.secondaryText)
                        HStack(spacing: 8) {
                            MorePill(text: "\(state.services.count) dịch vụ", color: VendorTheme.primary)
                            MorePill(text: "\(state.reservations.filter { $0.needsVendorAttention }.count) cần xử lý", color: VendorTheme.warning)
                        }
                    }
                    .padding(.vertical, 6)
                }

                Section {
                    HStack(spacing: 12) {
                        StatTile(title: "Hôm nay", value: formatVnd(state.dashboard?.today.revenue), color: VendorTheme.primary)
                        StatTile(title: "Tổng doanh thu", value: formatVnd(state.dashboard?.total.revenue), color: VendorTheme.success)
                    }
                    HStack(spacing: 12) {
                        StatTile(title: "Chờ giải ngân", value: formatVnd(state.dashboard?.settlement.pending), color: VendorTheme.warning)
                        StatTile(title: "Đã thanh toán", value: formatVnd(state.dashboard?.settlement.settled), color: VendorTheme.primaryContainer)
                    }
                }
                .listRowBackground(Color.clear)

                Section("Chức năng") {
                    NavigationLink {
                        IposSettingsView()
                    } label: {
                        MoreMenuRow(title: "Cài đặt", subtitle: "Vị trí cửa hàng và iPos", systemImage: "gearshape")
                    }
                    NavigationLink {
                        EarningsView()
                    } label: {
                        MoreMenuRow(title: "Thu nhập", subtitle: "Xem lịch sử đối soát chi tiết", systemImage: "creditcard")
                    }
                    Button {
                        state.selectedTab = .services
                    } label: {
                        MoreMenuRow(title: "Dịch vụ", subtitle: "Quản lý sản phẩm, đặt bàn và ưu đãi", systemImage: "ticket")
                    }
                    NavigationLink {
                        SecuritySettingsView()
                    } label: {
                        MoreMenuRow(title: "Bảo mật", subtitle: "Đổi mật khẩu hoặc tạo mật khẩu tạm thời", systemImage: "lock")
                    }
                }

                Section("Pháp lý & hỗ trợ") {
                    Button {
                        Task { await state.registerPushNotifications() }
                    } label: {
                        MoreMenuRow(title: "Bật thông báo đơn hàng", subtitle: "Nhận cập nhật voucher, đặt chỗ và đối soát", systemImage: "bell.badge")
                    }
                    Link(destination: LegalLink.privacy) {
                        MoreMenuRow(title: "Chính sách riêng tư", subtitle: "Dữ liệu, quyền riêng tư và Firebase", systemImage: "hand.raised")
                    }
                    Link(destination: LegalLink.terms) {
                        MoreMenuRow(title: "Điều khoản sử dụng", subtitle: "Quy định vận hành trên S-Loco", systemImage: "doc.text")
                    }
                    Link(destination: LegalLink.support) {
                        MoreMenuRow(title: "Hỗ trợ", subtitle: "Liên hệ S-Loco support", systemImage: "questionmark.circle")
                    }
                    Link(destination: LegalLink.deleteAccount) {
                        MoreMenuRow(title: "Xóa tài khoản", subtitle: "Yêu cầu xóa tài khoản và dữ liệu", systemImage: "person.crop.circle.badge.xmark")
                    }
                }

                Section {
                    Button("Đăng xuất", role: .destructive) {
                        state.logout()
                    }
                    .disabled(state.isLoading)
                }
            }
            .refreshable { await state.refreshHome() }
            .scrollContentBackground(.hidden)
            .background(VendorTheme.surface)
        }
    }
}

private struct IposSettingsView: View {
    @EnvironmentObject private var state: AppState
    @StateObject private var locationProvider = CurrentLocationProvider()
    @State private var iposStoreId = ""
    @State private var address = ""
    @State private var latitude = ""
    @State private var longitude = ""

    var body: some View {
        Form {
            Section("Cửa hàng") {
                LabeledContent("Tên", value: state.vendor?.name ?? "Chưa tải")
                LabeledContent("Email", value: state.user?.email ?? state.vendor?.email ?? "Không có")
            }
            Section("Vị trí cửa hàng") {
                TextField("Địa chỉ", text: $address, axis: .vertical)
                    .lineLimit(2...3)
                TextField("Vĩ độ", text: $latitude)
                    .keyboardType(.decimalPad)
                TextField("Kinh độ", text: $longitude)
                    .keyboardType(.decimalPad)
                if latitude.isEmpty || longitude.isEmpty {
                    Text("Thiếu tọa độ thì bản đồ và AI planner chưa thể ưu tiên vị trí cửa hàng này.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                VendorLocationMap(latitude: latitude, longitude: longitude)
                    .frame(height: 180)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                Text("S-Loco chỉ dùng vị trí khi bạn bấm nút này để điền tọa độ cửa hàng; quyền vị trí không được dùng để theo dõi nền.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button("Lấy vị trí hiện tại") {
                    locationProvider.requestLocation { location, message in
                        if let location {
                            latitude = formatCoordinate(location.coordinate.latitude)
                            longitude = formatCoordinate(location.coordinate.longitude)
                            state.message = "Đã lấy vị trí hiện tại. Bấm lưu để cập nhật cửa hàng."
                        } else {
                            state.message = message ?? "Chưa lấy được vị trí hiện tại. Hãy bật định vị và thử lại."
                        }
                    }
                }
                .disabled(state.isLoading)
                Button("Lưu vị trí cửa hàng") {
                    Task {
                        await state.updateVendorSettings(
                            address: address,
                            latitude: latitude,
                            longitude: longitude
                        )
                    }
                }
                .disabled(state.isLoading || state.vendor == nil)
            }
            Section("iPos") {
                TextField("Mã cửa hàng trên iPos", text: $iposStoreId)
                Button("Lưu iPos store ID") {
                    Task { await state.updateIposStoreId(iposStoreId) }
                }
                .disabled(state.isLoading || state.vendor == nil)
            }
        }
        .navigationTitle("Cài đặt")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: state.vendor?.id) {
            iposStoreId = state.vendor?.metadata?.iposStoreId ?? ""
            address = state.vendor?.address ?? ""
            latitude = state.vendor?.latitude ?? ""
            longitude = state.vendor?.longitude ?? ""
        }
        .scrollContentBackground(.hidden)
        .background(VendorTheme.surface)
    }
}

private struct VendorLocationMap: View {
    let latitude: String
    let longitude: String

    private var coordinate: (Double, Double)? {
        guard
            let lat = Double(latitude.trimmingCharacters(in: .whitespacesAndNewlines)),
            let lng = Double(longitude.trimmingCharacters(in: .whitespacesAndNewlines)),
            (-90...90).contains(lat),
            (-180...180).contains(lng)
        else {
            return nil
        }
        return (lat, lng)
    }

    var body: some View {
        if let coordinate {
            LeafletMapView(latitude: coordinate.0, longitude: coordinate.1)
        } else {
            ZStack {
                Color(red: 0.91, green: 0.94, blue: 0.97)
                Text("Nhập tọa độ để xem vị trí trên bản đồ")
                    .font(.footnote)
                    .foregroundStyle(VendorTheme.secondaryText)
            }
        }
    }
}

private struct LeafletMapView: UIViewRepresentable {
    let latitude: Double
    let longitude: Double

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView(frame: .zero)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.isScrollEnabled = false
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        webView.loadHTMLString(vendorMapHtml(latitude: latitude, longitude: longitude), baseURL: URL(string: "https://www.openstreetmap.org/"))
    }
}

@MainActor
private final class CurrentLocationProvider: NSObject, ObservableObject, @preconcurrency CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var completion: ((CLLocation?, String?) -> Void)?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
    }

    func requestLocation(_ completion: @escaping (CLLocation?, String?) -> Void) {
        self.completion = completion
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            manager.requestLocation()
        case .denied, .restricted:
            finish(nil, "Ứng dụng cần quyền vị trí để lấy tọa độ hiện tại.")
        @unknown default:
            finish(nil, "Chưa lấy được vị trí hiện tại.")
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard completion != nil else { return }
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            manager.requestLocation()
        case .denied, .restricted:
            finish(nil, "Ứng dụng cần quyền vị trí để lấy tọa độ hiện tại.")
        case .notDetermined:
            break
        @unknown default:
            finish(nil, "Chưa lấy được vị trí hiện tại.")
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        finish(locations.last, nil)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        finish(nil, "Chưa lấy được vị trí hiện tại. Hãy bật định vị và thử lại.")
    }

    private func finish(_ location: CLLocation?, _ message: String?) {
        let callback = completion
        completion = nil
        callback?(location, message)
    }
}

private func formatCoordinate(_ value: Double) -> String {
    String(format: "%.7f", locale: Locale(identifier: "en_US_POSIX"), value)
}

private func vendorMapHtml(latitude: Double, longitude: Double) -> String {
    """
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
        const lat = \(latitude);
        const lng = \(longitude);
        const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);
        L.marker([lat, lng]).addTo(map);
      </script>
    </body>
    </html>
    """
}

private struct SecuritySettingsView: View {
    @EnvironmentObject private var state: AppState
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var confirmReset = false

    var body: some View {
        Form {
            Section("Đổi mật khẩu") {
                SecureField("Mật khẩu hiện tại", text: $currentPassword)
                SecureField("Mật khẩu mới", text: $newPassword)
                SecureField("Nhập lại mật khẩu mới", text: $confirmPassword)
                Button("Đổi mật khẩu") {
                    Task {
                        await state.changePassword(
                            currentPassword: currentPassword,
                            newPassword: newPassword,
                            confirmPassword: confirmPassword
                        )
                    }
                }
                .disabled(
                    state.isLoading ||
                        currentPassword.count < 8 ||
                        newPassword.count < 8 ||
                        confirmPassword.count < 8
                )
            }

            Section("Reset mật khẩu") {
                Text("Tạo mật khẩu tạm thời và đăng xuất khỏi các phiên hiện tại.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button(confirmReset ? "Bấm lần nữa để reset" : "Reset mật khẩu", role: .destructive) {
                    if confirmReset {
                        Task { await state.resetPassword() }
                    } else {
                        confirmReset = true
                    }
                }
                .disabled(state.isLoading)
            }
        }
        .navigationTitle("Bảo mật")
        .navigationBarTitleDisplayMode(.inline)
        .scrollContentBackground(.hidden)
        .background(VendorTheme.surface)
    }
}

private struct MoreMenuRow: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        Label {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(VendorTheme.text)
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(VendorTheme.secondaryText)
            }
        } icon: {
            Image(systemName: systemImage)
                .foregroundStyle(VendorTheme.primary)
        }
        .padding(.vertical, 4)
    }
}

private struct MorePill: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption.weight(.bold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}
