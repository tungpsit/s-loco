import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var state: AppState

    private let categories = TouristCategoryOption.home

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    homeHeader
                    VStack(alignment: .leading, spacing: 18) {
                        sectionHeader("Gợi ý cho bạn", action: "Xem tất cả") {
                            state.tab = .browse
                        }
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(state.services.prefix(8)) { service in
                                ServiceCard(service: service) {
                                    state.route = .service(service)
                                }
                            }
                        }
                        sectionHeader("Đối tác nổi bật", action: nil, actionHandler: nil)
                        VStack(spacing: 10) {
                            ForEach(state.vendors.prefix(5)) { vendor in
                                VendorRow(vendor: vendor) {
                                    state.route = .vendor(vendor)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
                }
            }
            .background(
                LinearGradient(
                    colors: [Color(red: 0.867, green: 0.965, blue: 1.0), TouristTheme.surface],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
            )
            .navigationTitle("")
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await state.refreshHome() }
        }
    }

    private var homeHeader: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Xin chào,")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TouristTheme.text)
                    Text("Chào mừng đến Sầm Sơn!")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(TouristTheme.text)
                }
                Spacer()
                Button {
                } label: {
                    ZStack(alignment: .topTrailing) {
                        Circle()
                            .fill(.white)
                            .frame(width: 34, height: 34)
                            .overlay(Image(systemName: "bell.fill").font(.subheadline).foregroundStyle(TouristTheme.primary))
                        Circle()
                            .fill(Color(red: 1.0, green: 0.784, blue: 0.239))
                            .frame(width: 7, height: 7)
                            .offset(x: -4, y: 5)
                    }
                }
                .buttonStyle(.plain)
            }

            Button {
                state.tab = .browse
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                    Text("Bạn muốn tìm gì?")
                    Spacer()
                }
                .font(.subheadline)
                .foregroundStyle(TouristTheme.muted)
                .padding(.horizontal, 14)
                .frame(height: 46)
                .background(.white, in: RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4), spacing: 8) {
                ForEach(homeCategoryActions, id: \.assetName) { action in
                    HomeCategoryTile(
                        action: action,
                        active: !action.category.isEmpty && state.selectedCategory == action.category
                    )
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 18)
        .padding(.bottom, 18)
    }

    private var homeCategoryActions: [HomeCategoryAction] {
        [
            HomeCategoryAction(assetName: "category_diem_den", label: "Điểm đến", category: "") {
                state.selectedCategory = ""
                Task { await state.refreshHome() }
            },
            HomeCategoryAction(assetName: "category_am_thuc", label: "Ẩm thực", category: "am-thuc") {
                state.selectedCategory = "am-thuc"
                Task { await state.refreshHome() }
            },
            HomeCategoryAction(assetName: "category_luu_tru", label: "Lưu trú", category: "luu-tru") {
                state.selectedCategory = "luu-tru"
                Task { await state.refreshHome() }
            },
            HomeCategoryAction(assetName: "category_giai_tri", label: "Giải trí", category: "giai-tri") {
                state.selectedCategory = "giai-tri"
                Task { await state.refreshHome() }
            },
            HomeCategoryAction(assetName: "category_su_kien", label: "Sự kiện", category: "") {
                state.tab = .browse
            },
            HomeCategoryAction(assetName: "category_phuong_tien", label: "Phương tiện", category: "xe-dien") {
                state.selectedCategory = "xe-dien"
                Task { await state.refreshHome() }
            },
            HomeCategoryAction(assetName: "category_mua_sam", label: "Mua sắm", category: "mua-sam") {
                state.selectedCategory = "mua-sam"
                Task { await state.refreshHome() }
            },
            HomeCategoryAction(assetName: "category_xem_them", label: "Xem thêm", category: "") {
                state.tab = .browse
            },
        ]
    }

    private func sectionHeader(_ title: String, action: String?, actionHandler: (() -> Void)?) -> some View {
        HStack {
            Text(title)
                .font(.headline)
                .foregroundStyle(TouristTheme.text)
            Spacer()
            if let action, let actionHandler {
                Button(action, action: actionHandler)
                    .font(.subheadline.weight(.semibold))
            }
        }
        .padding(.vertical, 6)
    }
}

struct HomeCategoryAction {
    let assetName: String
    let label: String
    let category: String
    let action: () -> Void
}

struct HomeCategoryTile: View {
    let action: HomeCategoryAction
    let active: Bool

    var body: some View {
        Button(action: action.action) {
            VStack(spacing: 5) {
                ZStack {
                    Image(action.assetName)
                        .renderingMode(.original)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 24, height: 24)
                }
                Text(action.label)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(TouristTheme.text)
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 72)
            .background(.white, in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }
}

struct WeatherView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let weather = state.weather {
                        currentCard(weather)
                        travelCard(weather)
                        beachCard(weather.beach)
                        forecastList(weather.forecast ?? [])
                    } else {
                        ContentUnavailableView("Chưa có dữ liệu thời tiết", systemImage: "cloud.sun", description: Text("Kéo để tải lại dữ liệu Sầm Sơn."))
                    }
                }
                .padding(16)
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("Thời tiết Sầm Sơn")
            .refreshable { await state.loadWeather() }
            .task {
                if state.weather == nil {
                    await state.loadWeather()
                }
            }
        }
    }

    private func currentCard(_ weather: TouristWeather) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(weather.location?.name ?? "Bãi biển Sầm Sơn, Thanh Hóa")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white.opacity(0.78))
            HStack(alignment: .center) {
                Image(systemName: "cloud.sun.fill")
                    .font(.system(size: 52))
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(weather.temperature)°C")
                        .font(.system(size: 44, weight: .bold))
                    Text(weather.condition)
                        .font(.headline)
                    if let apparent = weather.apparentTemperature {
                        Text("Cảm giác như \(apparent)°C")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.76))
                    }
                }
                Spacer()
            }
            HStack {
                WeatherMetric("Độ ẩm", "\(weather.humidity)%")
                WeatherMetric("Gió", "\(weather.windSpeed) km/h")
                WeatherMetric("UV", weather.uvIndex.map { String(format: "%.1f", $0) } ?? "--")
                WeatherMetric("Mưa", weather.rainProbability.map { "\($0)%" } ?? "--")
            }
        }
        .foregroundStyle(.white)
        .padding(18)
        .background(TouristTheme.primary, in: RoundedRectangle(cornerRadius: 18))
    }

    private func travelCard(_ weather: TouristWeather) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Gợi ý cho khách du lịch")
                .font(.headline)
            Text(weather.travelTip ?? "Theo dõi thời tiết trước khi đặt hoạt động ngoài trời.")
                .font(.subheadline)
                .foregroundStyle(TouristTheme.muted)
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
    }

    @ViewBuilder
    private func beachCard(_ beach: BeachWeather?) -> some View {
        if let beach {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("Biển Sầm Sơn")
                        .font(.headline)
                    Spacer()
                    Text(beach.safetyLabel ?? "Đang cập nhật")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(TouristTheme.primary)
                }
                HStack {
                    WeatherMetric("Sóng", beach.waveHeight.map { "\($0) m" } ?? "--", dark: true)
                    WeatherMetric("Nước biển", beach.seaSurfaceTemperature.map { "\($0)°C" } ?? "--", dark: true)
                    WeatherMetric("Chu kỳ", beach.wavePeriod.map { "\($0) s" } ?? "--", dark: true)
                }
                Text(beach.safetyTip ?? "")
                    .font(.subheadline)
                    .foregroundStyle(TouristTheme.muted)
            }
            .padding(16)
            .background(.white, in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
        }
    }

    private func forecastList(_ forecast: [WeatherForecastDay]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Dự báo 7 ngày")
                .font(.headline)
            ForEach(forecast) { day in
                HStack(spacing: 12) {
                    Text(day.day)
                        .font(.subheadline.weight(.semibold))
                        .frame(width: 66, alignment: .leading)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(day.condition)
                            .font(.subheadline.weight(.semibold))
                        Text("Mưa \(day.rainProbability.map { "\($0)%" } ?? "--") · UV \(day.uvIndex.map { String(format: "%.1f", $0) } ?? "--")")
                            .font(.caption)
                            .foregroundStyle(TouristTheme.muted)
                    }
                    Spacer()
                    Text("\(day.high)°/\(day.low)°")
                        .font(.subheadline.bold())
                }
                .padding(12)
                .background(.white, in: RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
            }
        }
    }
}

private struct WeatherMetric: View {
    let label: String
    let value: String
    let dark: Bool

    init(_ label: String, _ value: String, dark: Bool = false) {
        self.label = label
        self.value = value
        self.dark = dark
    }

    var body: some View {
        VStack(spacing: 3) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(dark ? TouristTheme.muted : .white.opacity(0.7))
            Text(value)
                .font(.caption.weight(.bold))
                .foregroundStyle(dark ? TouristTheme.text : .white)
        }
        .frame(maxWidth: .infinity)
    }
}

struct ServiceCard: View {
    let service: TouristService
    let onTap: () -> Void

    private var offerBadgeLabel: String? {
        if service.appDiscountPercent > 0 {
            return "App -\(service.appDiscountPercent)%"
        }
        if service.discountPercent > 0 {
            return "KM -\(service.discountPercent)%"
        }
        return nil
    }

    private var preAppPrice: Int? {
        if service.appDiscountPercent > 0 && service.appDiscountPercent < 100 && service.price > 0 {
            let value = Int((Double(service.price) * 100 / Double(100 - service.appDiscountPercent)).rounded())
            return value > service.price ? value : nil
        }
        return service.discountPercent > 0 ? service.price : nil
    }

    private var appSaving: Int? {
        guard service.appDiscountPercent > 0, let preAppPrice else { return nil }
        let value = preAppPrice - service.price
        return value > 0 ? value : nil
    }

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                ZStack(alignment: .topTrailing) {
                    ServiceImage(url: service.imageURL, category: service.category, serviceName: service.name)
                        .frame(height: 112)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                    if let offerBadgeLabel {
                        Text(offerBadgeLabel)
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(TouristTheme.coral, in: Capsule())
                            .padding(8)
                    }
                }

                Text(service.name)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TouristTheme.text)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if let locationSummary = service.locationSummary {
                    Label(locationSummary, systemImage: "mappin.and.ellipse")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TouristTheme.muted)
                        .lineLimit(1)
                }

                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .foregroundStyle(.yellow)
                    Text(String(format: "%.1f", service.rating))
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(TouristTheme.muted)

                VStack(alignment: .leading, spacing: 2) {
                    if service.isReservation {
                        Text("Đặt qua app")
                            .font(.callout.bold())
                            .foregroundStyle(TouristTheme.primary)
                        if service.appDiscountPercent > 0 {
                            AppSavingStrip("Nhận thêm \(service.appDiscountPercent)% tại cửa hàng")
                        }
                    } else {
                        if service.originalPrice > service.price {
                            Text(service.originalPrice.vnd)
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(TouristTheme.muted)
                                .strikethrough()
                        }
                        if let preAppPrice, service.discountPercent > 0 {
                            Text("Giá KM: \(preAppPrice.vnd)")
                                .font(.caption2.weight(.semibold))
                                .foregroundStyle(TouristTheme.muted)
                                .lineLimit(1)
                        }
                        HStack(spacing: 6) {
                            Text(service.price.vnd)
                                .font(.callout.bold())
                                .foregroundStyle(TouristTheme.primary)
                            if service.appDiscountPercent > 0 {
                                Text("giá app")
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(TouristTheme.coral)
                            }
                        }
                        if let appSaving {
                            AppSavingStrip("Đặt qua app tiết kiệm thêm \(appSaving.vnd)")
                        }
                    }
                }
            }
            .padding(10)
            .background(.white, in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
        }
        .buttonStyle(.plain)
    }
}

struct AppSavingStrip: View {
    let label: String

    init(_ label: String) {
        self.label = label
    }

    var body: some View {
        Text(label)
            .font(.caption2.weight(.bold))
            .foregroundStyle(TouristTheme.primary)
            .lineLimit(1)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(TouristTheme.primarySoft, in: RoundedRectangle(cornerRadius: 8))
    }
}

struct ServiceImage: View {
    let url: String?
    let category: String
    let serviceName: String

    var body: some View {
        ZStack {
            Rectangle()
                .fill(TouristTheme.primarySoft)
            if let url, let imageURL = URL(string: url) {
                AsyncImage(url: imageURL) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFill()
                    case .failure:
                        placeholder
                    default:
                        ProgressView().tint(TouristTheme.primary)
                    }
                }
            } else {
                placeholder
            }
        }
        .clipped()
    }

    private var placeholder: some View {
        Image(assetName)
            .resizable()
            .scaledToFill()
    }

    private var assetName: String {
        let value = "\(category) \(serviceName)".lowercased()
        if value.contains("spa") || value.contains("massage") { return "tourist_spa" }
        if value.contains("ẩm") || value.contains("am thuc") || value.contains("food") || value.contains("nhà hàng") { return "tourist_food" }
        return "tourist_boat"
    }
}

private struct HeroPill: View {
    let icon: String
    let text: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                Text(text)
            }
            .font(.caption.weight(.semibold))
            .foregroundStyle(.white)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(.white.opacity(0.18), in: Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct VendorRow: View {
    let vendor: Vendor
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 12)
                    .fill(TouristTheme.primarySoft)
                    .frame(width: 48, height: 48)
                    .overlay(Image(systemName: "storefront.fill").foregroundStyle(TouristTheme.primary))
                VStack(alignment: .leading, spacing: 4) {
                    Text(vendor.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TouristTheme.text)
                    Text(vendor.address ?? vendor.slug ?? "Đối tác địa phương")
                        .font(.caption)
                        .foregroundStyle(TouristTheme.muted)
                        .lineLimit(1)
                }
                Spacer()
                Label(vendor.ratingAvg ?? "4.8", systemImage: "star.fill")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(TouristTheme.coral)
                Image(systemName: "chevron.right")
                    .font(.caption.bold())
                    .foregroundStyle(TouristTheme.muted)
            }
        }
        .buttonStyle(.plain)
        .padding(12)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
    }
}

struct VendorDetailView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.dismiss) private var dismiss
    let vendor: Vendor

    private var vendorServices: [TouristService] {
        var seen = Set<String>()
        return (state.services + state.searchServices).filter { service in
            guard service.vendorName.localizedCaseInsensitiveCompare(vendor.name) == .orderedSame else { return false }
            return seen.insert(service.id).inserted
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    hero
                    infoCard

                    HStack {
                        Text("Dịch vụ của đối tác")
                            .font(.headline)
                            .foregroundStyle(TouristTheme.text)
                        Spacer()
                        Text("\(vendorServices.count)")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(TouristTheme.primary)
                    }

                    if vendorServices.isEmpty {
                        EmptyState(
                            icon: "storefront",
                            title: "Chưa có dịch vụ trong bộ nhớ app",
                            message: "Quay lại màn Tìm kiếm để tải thêm dữ liệu theo đối tác này."
                        )
                        .frame(minHeight: 220)
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(vendorServices) { service in
                                ServiceCard(service: service) {
                                    state.route = .service(service)
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("Đối tác")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Đóng") { dismiss() }
                }
            }
        }
    }

    private var hero: some View {
        ZStack(alignment: .bottomLeading) {
            Image("tourist_hero")
                .resizable()
                .scaledToFill()
                .frame(height: 190)
            LinearGradient(colors: [.clear, .black.opacity(0.64)], startPoint: .top, endPoint: .bottom)
            VStack(alignment: .leading, spacing: 6) {
                Text(vendor.name)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                Text(vendor.address ?? vendor.slug ?? "Đối tác địa phương")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.86))
                    .lineLimit(2)
            }
            .padding(16)
        }
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private var infoCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                VendorStat(icon: "star.fill", title: "Đánh giá", value: vendor.ratingAvg ?? "4.8")
                VendorStat(icon: "text.bubble.fill", title: "Lượt review", value: "\(vendor.reviewCount ?? 0)")
            }
            Text(vendor.description ?? "Đối tác địa phương được tuyển chọn trên S-Loco, cung cấp trải nghiệm du lịch và dịch vụ tại điểm đến.")
                .font(.subheadline)
                .foregroundStyle(TouristTheme.muted)
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
    }
}

private struct VendorStat: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(TouristTheme.primary)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(TouristTheme.muted)
                Text(value)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TouristTheme.text)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(TouristTheme.primarySoft, in: RoundedRectangle(cornerRadius: 12))
    }
}
