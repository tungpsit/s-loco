import SwiftUI

struct RootView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        ZStack {
            if state.isAuthenticated {
                TabView(selection: $state.selectedTab) {
                    DashboardView().tabItem { Label(AppTab.dashboard.rawValue, systemImage: "house") }.tag(AppTab.dashboard)
                    ScanView().tabItem { Label(AppTab.scan.rawValue, systemImage: "qrcode.viewfinder") }.tag(AppTab.scan)
                    OrdersView().tabItem { Label(AppTab.orders.rawValue, systemImage: "bag") }.tag(AppTab.orders)
                    EarningsView().tabItem { Label(AppTab.earnings.rawValue, systemImage: "creditcard") }.tag(AppTab.earnings)
                    SettingsView().tabItem { Label(AppTab.settings.rawValue, systemImage: "gearshape") }.tag(AppTab.settings)
                }
            } else {
                LoginView()
            }

            if state.isLoading {
                Color.black.opacity(0.12).ignoresSafeArea()
                VStack(spacing: 12) {
                    ProgressView()
                        .tint(VendorTheme.primary)
                        .scaleEffect(1.2)
                    Text(state.loadingMessage.isEmpty ? "Đang tải..." : state.loadingMessage)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(VendorTheme.text)
                }
                .padding(20)
                .frame(minWidth: 220)
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(radius: 12)
            }
        }
        .alert("S-Loco Vendor", isPresented: Binding(
            get: { state.message != nil },
            set: { if !$0 { state.message = nil } }
        )) {
            Button("OK", role: .cancel) { state.message = nil }
        } message: {
            Text(state.message ?? "")
        }
    }
}
