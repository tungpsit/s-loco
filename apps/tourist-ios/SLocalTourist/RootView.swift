import SwiftUI

struct RootView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        ZStack {
            adaptiveTabs

            if state.isLoading {
                LoadingOverlay(message: state.loadingMessage)
            }
        }
        .sheet(item: $state.route) { route in
            RouteSheet(route: route)
                .environmentObject(state)
        }
        .alert("S-Loco", isPresented: Binding(
            get: { state.message != nil },
            set: { if !$0 { state.message = nil } }
        )) {
            Button("Đóng", role: .cancel) { state.message = nil }
        } message: {
            Text(state.message ?? "")
        }
    }

    @ViewBuilder
    private var adaptiveTabs: some View {
        if #available(iOS 18.0, *) {
            tabs
                .tabViewStyle(.sidebarAdaptable)
        } else {
            tabs
        }
    }

    private var tabs: some View {
        TabView(selection: $state.tab) {
            DashboardView()
                .tabItem { Label(AppTab.home.rawValue, systemImage: AppTab.home.icon) }
                .tag(AppTab.home)

            OrdersView()
                .tabItem { Label(AppTab.browse.rawValue, systemImage: AppTab.browse.icon) }
                .tag(AppTab.browse)

            EarningsView()
                .tabItem { Label(AppTab.vouchers.rawValue, systemImage: AppTab.vouchers.icon) }
                .tag(AppTab.vouchers)

            ScanView()
                .tabItem { Label(AppTab.ai.rawValue, systemImage: AppTab.ai.icon) }
                .tag(AppTab.ai)

            SettingsView()
                .tabItem { Label(AppTab.profile.rawValue, systemImage: AppTab.profile.icon) }
                .tag(AppTab.profile)
        }
        .tint(TouristTheme.primary)
    }
}

private struct RouteSheet: View {
    let route: AppRoute

    var body: some View {
        switch route {
        case .service(let service):
            ServiceDetailView(service: service)
        case .vendor(let vendor):
            VendorDetailView(vendor: vendor)
        case .checkout(let id):
            CheckoutView(orderId: id)
        case .voucher(let voucher):
            VoucherDetailView(voucher: voucher)
        case .reservation(let reservation):
            ReservationDetailView(reservation: reservation)
        case .weather:
            WeatherView()
        case .login(let redirect):
            LoginView(redirect: redirect)
        case .otp(let phone, let redirect):
            OtpView(phone: phone, redirect: redirect)
        }
    }
}

private struct LoadingOverlay: View {
    let message: String

    var body: some View {
        ZStack {
            Color.black.opacity(0.18).ignoresSafeArea()
            VStack(spacing: 12) {
                ProgressView()
                    .tint(TouristTheme.primary)
                Text(message)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TouristTheme.text)
            }
            .padding(20)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 14))
        }
    }
}
