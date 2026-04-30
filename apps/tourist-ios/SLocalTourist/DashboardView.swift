import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var state: AppState

    private let categories = TouristCategoryOption.home

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    hero
                    categoryRow
                    sectionHeader("Đề xuất hôm nay", action: "Làm mới") {
                        Task { await state.refreshHome() }
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
                .padding(16)
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("S-Loco")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        state.tab = .browse
                    } label: {
                        Image(systemName: "magnifyingglass")
                    }
                }
            }
            .refreshable { await state.refreshHome() }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Khám phá trải nghiệm xanh")
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                    Text("Tour, vé tham quan và dịch vụ địa phương được gom trong một app.")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.86))
                }
                Spacer()
                Button {
                    state.route = .weather
                } label: {
                    VStack(spacing: 2) {
                        Image(systemName: "cloud.sun.fill")
                            .font(.title2)
                        Text(state.weather.map { "\($0.temperature)°" } ?? "Thời tiết")
                            .font(.caption.weight(.bold))
                    }
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(.white.opacity(0.18), in: RoundedRectangle(cornerRadius: 14))
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 10) {
                HeroPill(icon: "ticket", text: "Voucher QR") {
                    state.tab = .vouchers
                }
                HeroPill(icon: "sparkles", text: "AI itinerary") {
                    state.tab = .ai
                }
                HeroPill(icon: "cloud.sun", text: "Thời tiết") {
                    state.route = .weather
                }
            }
        }
        .padding(18)
        .background {
            ZStack {
                Image("tourist_hero")
                    .resizable()
                    .scaledToFill()
                LinearGradient(colors: [.black.opacity(0.54), TouristTheme.primary.opacity(0.18)], startPoint: .topLeading, endPoint: .bottomTrailing)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 18))
    }

    private var categoryRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(categories, id: \.value) { item in
                    Button {
                        state.selectedCategory = item.value
                        Task { await state.refreshHome() }
                    } label: {
                        Text(item.label)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(state.selectedCategory == item.value ? .white : TouristTheme.primary)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(state.selectedCategory == item.value ? TouristTheme.primary : .white, in: Capsule())
                            .overlay(Capsule().stroke(TouristTheme.border))
                    }
                }
            }
        }
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

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                ServiceImage(url: service.imageURL, category: service.category, serviceName: service.name)
                    .frame(height: 112)
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                Text(service.name)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TouristTheme.text)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)

                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .foregroundStyle(.yellow)
                    Text(String(format: "%.1f", service.rating))
                    Spacer()
                    if service.discountPercent > 0 || service.isReservation {
                        Text("-\(service.isReservation ? service.reservationDiscountPercent : service.discountPercent)%")
                            .foregroundStyle(TouristTheme.coral)
                    }
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(TouristTheme.muted)

                Text(service.isReservation ? "Đặt chỗ" : service.price.vnd)
                    .font(.callout.bold())
                    .foregroundStyle(TouristTheme.primary)
            }
            .padding(10)
            .background(.white, in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
        }
        .buttonStyle(.plain)
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
