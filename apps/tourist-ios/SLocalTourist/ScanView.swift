import SwiftUI

struct ScanView: View {
    @EnvironmentObject private var state: AppState
    @State private var days = 3.0
    @State private var budget = "3000000"
    @State private var preferences = "Ẩm thực địa phương, điểm tham quan nhẹ nhàng"
    @State private var groupType = ItineraryGroupType.couple
    @State private var stayMode = ItineraryStayMode.sloco
    @State private var selectedStayServiceId = ""
    @State private var manualStayLabel = ""
    @State private var preferNearStay = false

    private var lodgingServices: [TouristService] {
        (state.services + state.searchServices)
            .filter(\.isLodging)
            .uniquedById
    }

    private var selectedStayService: TouristService? {
        lodgingServices.first { $0.id == selectedStayServiceId } ?? lodgingServices.first
    }

    private var stayContext: ItineraryStayContext {
        switch stayMode {
        case .sloco:
            guard let selectedStayService else { return ItineraryStayContext() }
            return ItineraryStayContext(
                label: selectedStayService.stayLabel,
                latitude: selectedStayService.vendorLatitude,
                longitude: selectedStayService.vendorLongitude
            )
        case .manual:
            return ItineraryStayContext(label: manualStayLabel)
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Tạo lịch trình AI", systemImage: "sparkles")
                            .font(.title2.bold())
                            .foregroundStyle(TouristTheme.primary)
                        Text("Đề xuất lịch trình nhanh theo số ngày, ngân sách và sở thích của bạn.")
                            .font(.subheadline)
                            .foregroundStyle(TouristTheme.muted)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))

                    VStack(alignment: .leading, spacing: 14) {
                        Text("Số ngày: \(Int(days))")
                            .font(.headline)
                        Slider(value: $days, in: 1...7, step: 1)
                            .tint(TouristTheme.primary)

                        Text("Ngân sách")
                            .font(.headline)
                        TextField("VD: 3000000", text: $budget)
                            .keyboardType(.numberPad)
                            .textFieldStyle(TouristTextFieldStyle())

                        Text("Sở thích")
                            .font(.headline)
                        TextEditor(text: $preferences)
                            .frame(minHeight: 110)
                            .padding(8)
                            .background(.white, in: RoundedRectangle(cornerRadius: 12))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(TouristTheme.border))

                        ItineraryGroupTypeSection(selection: $groupType)

                        ItineraryStaySection(
                            mode: $stayMode,
                            selectedServiceId: $selectedStayServiceId,
                            manualLabel: $manualStayLabel,
                            preferNearStay: $preferNearStay,
                            lodgingServices: lodgingServices
                        )

                        Button {
                            Task {
                                let stay = preferNearStay ? stayContext : ItineraryStayContext()
                                await state.createItinerary(
                                    days: Int(days),
                                    budget: Int(budget) ?? 0,
                                    preferences: preferences,
                                    groupType: groupType.rawValue,
                                    stayLocationLabel: stay.label,
                                    stayLatitude: stay.latitude,
                                    stayLongitude: stay.longitude,
                                    preferNearStay: preferNearStay
                                )
                            }
                        } label: {
                            Label("Tạo lịch trình", systemImage: "sparkles")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(PrimaryButtonStyle())
                    }
                    .padding(16)
                    .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))

                    if let itinerary = state.itinerary {
                        ItineraryTimelineView(itinerary: itinerary) { serviceId in
                            Task {
                                await state.openServiceFromItinerary(serviceId)
                            }
                        }
                    }
                }
                .padding(16)
                .touristReadableContent(maxWidth: TouristLayout.detailMaxWidth)
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("AI")
        }
    }
}

private enum ItineraryStayMode: String, CaseIterable, Identifiable {
    case sloco = "Chọn lưu trú S-Loco"
    case manual = "Nhập nơi lưu trú"

    var id: String { rawValue }
}

private enum ItineraryGroupType: String, CaseIterable, Identifiable {
    case couple
    case family
    case friends
    case solo

    var id: String { rawValue }

    var label: String {
        switch self {
        case .couple: "Cặp đôi"
        case .family: "Gia đình"
        case .friends: "Nhóm bạn"
        case .solo: "Đi một mình"
        }
    }
}

private struct ItineraryGroupTypeSection: View {
    @Binding var selection: ItineraryGroupType

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Bạn đi cùng ai?")
                .font(.headline)
            Picker("Loại nhóm", selection: $selection) {
                ForEach(ItineraryGroupType.allCases) { option in
                    Text(option.label).tag(option)
                }
            }
            .pickerStyle(.segmented)
        }
    }
}

private struct ItineraryStayContext {
    let label: String?
    let latitude: Double?
    let longitude: Double?

    init(label: String? = nil, latitude: Double? = nil, longitude: Double? = nil) {
        let trimmed = label?.trimmingCharacters(in: .whitespacesAndNewlines)
        self.label = trimmed?.isEmpty == false ? trimmed : nil
        self.latitude = latitude
        self.longitude = longitude
    }
}

private struct ItineraryStaySection: View {
    @Binding var mode: ItineraryStayMode
    @Binding var selectedServiceId: String
    @Binding var manualLabel: String
    @Binding var preferNearStay: Bool
    let lodgingServices: [TouristService]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle("Ưu tiên gần nơi lưu trú", isOn: $preferNearStay)
                .tint(TouristTheme.primary)
            Text("Bật để chọn hoặc nhập nơi lưu trú; khi có tọa độ S-Loco, lịch trình ưu tiên dịch vụ gần hơn và hiển thị khoảng cách.")
                .font(.caption)
                .foregroundStyle(TouristTheme.muted)

            if preferNearStay {
                Text("Nơi lưu trú")
                    .font(.headline)

                Picker("Nơi lưu trú", selection: $mode) {
                    ForEach(ItineraryStayMode.allCases) { option in
                        Text(option.rawValue).tag(option)
                    }
                }
                .pickerStyle(.segmented)

                if mode == .sloco {
                    if lodgingServices.isEmpty {
                        Text("Chưa có lưu trú S-Loco khả dụng. Bạn có thể nhập tên khách sạn hoặc địa chỉ thủ công.")
                            .font(.caption)
                            .foregroundStyle(TouristTheme.muted)
                    } else {
                        Picker("Chọn lưu trú", selection: $selectedServiceId) {
                            ForEach(lodgingServices) { service in
                                Text(service.stayLabel).tag(service.id)
                            }
                        }
                        .pickerStyle(.menu)
                        .onAppear {
                            if selectedServiceId.isEmpty {
                                selectedServiceId = lodgingServices.first?.id ?? ""
                            }
                        }
                        .onChange(of: lodgingServices.map(\.id)) { _, ids in
                            if selectedServiceId.isEmpty || !ids.contains(selectedServiceId) {
                                selectedServiceId = ids.first ?? ""
                            }
                        }

                        if let selected = lodgingServices.first(where: { $0.id == selectedServiceId }) ?? lodgingServices.first {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(selected.vendorName)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(TouristTheme.primary)
                                if let address = selected.vendorAddress, !address.isEmpty {
                                    Text(address)
                                        .font(.caption)
                                        .foregroundStyle(TouristTheme.muted)
                                }
                                Text(selected.hasVendorCoordinate ? "Có tọa độ để tối ưu khoảng cách." : "Chưa có tọa độ, AI sẽ dùng tên nơi lưu trú làm ngữ cảnh.")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(selected.hasVendorCoordinate ? TouristTheme.primary : TouristTheme.coral)
                            }
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(TouristTheme.surface, in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                } else {
                    TextField("VD: FLC Sầm Sơn, khách sạn gần biển...", text: $manualLabel)
                        .textFieldStyle(TouristTextFieldStyle())
                    Text("Bản v1 chưa định vị địa chỉ nhập tay; AI sẽ dùng nội dung này làm ngữ cảnh.")
                        .font(.caption)
                        .foregroundStyle(TouristTheme.muted)
                }
            }
        }
    }
}

private struct ItineraryTimelineView: View {
    let itinerary: GeneratedItinerary
    let onOpenService: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text(itinerary.title)
                    .font(.title3.bold())
                    .foregroundStyle(TouristTheme.primary)
                if let summary = itinerary.summary, !summary.isEmpty {
                    Text(summary)
                        .font(.subheadline)
                        .foregroundStyle(TouristTheme.muted)
                }
                if let total = itinerary.totalEstimatedCost {
                    Text("Tổng ước tính: \(total.vnd)")
                        .font(.caption.bold())
                        .foregroundStyle(TouristTheme.coral)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(TouristTheme.primarySoft, in: Capsule())
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.white, in: RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))

            ForEach(itinerary.days, id: \.day) { day in
                ItineraryDayTimeline(day: day, onOpenService: onOpenService)
            }

            if let tips = itinerary.tips, !tips.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Mẹo hữu ích", systemImage: "lightbulb")
                        .font(.headline)
                        .foregroundStyle(TouristTheme.coral)
                    ForEach(tips, id: \.self) { tip in
                        Text("• \(tip)")
                            .font(.subheadline)
                            .foregroundStyle(TouristTheme.muted)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(red: 1.0, green: 0.973, blue: 0.894), in: RoundedRectangle(cornerRadius: 16))
            }
        }
    }
}

private struct ItineraryDayTimeline: View {
    let day: GeneratedItineraryDay
    let onOpenService: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("Ngày \(day.day)")
                    .font(.headline.bold())
                    .foregroundStyle(TouristTheme.primary)
                Text(day.title)
                    .font(.subheadline)
                    .foregroundStyle(TouristTheme.muted)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }
            .padding(.bottom, 4)

            VStack(spacing: 10) {
                ForEach(Array(day.activities.enumerated()), id: \.offset) { index, activity in
                    ItineraryTimelineActivity(
                        activity: activity,
                        isFirst: index == 0,
                        isLast: index == day.activities.count - 1,
                        onOpenService: onOpenService
                    )
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
    }
}

private struct ItineraryTimelineActivity: View {
    let activity: GeneratedItineraryActivity
    let isFirst: Bool
    let isLast: Bool
    let onOpenService: (String) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                Rectangle()
                    .fill(isFirst ? Color.clear : TouristTheme.border)
                    .frame(width: 2, height: 16)
                Circle()
                    .stroke(activity.serviceId == nil ? TouristTheme.border : TouristTheme.primary, lineWidth: 2)
                    .frame(width: 18, height: 18)
                    .overlay(Circle().fill(TouristTheme.primary).frame(width: 6, height: 6))
                Rectangle()
                    .fill(isLast ? Color.clear : TouristTheme.border)
                    .frame(width: 2)
                    .frame(maxHeight: .infinity)
            }
            .frame(width: 28)
            .frame(minHeight: 126)

            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 8) {
                    Text(activity.time)
                        .font(.caption.bold())
                        .foregroundStyle(TouristTheme.primary)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(TouristTheme.primarySoft, in: Capsule())
                    Spacer(minLength: 8)
                    if let cost = activity.estimatedCost {
                        Text(cost.vnd)
                            .font(.caption.bold())
                            .foregroundStyle(TouristTheme.coral)
                            .lineLimit(1)
                            .fixedSize(horizontal: true, vertical: false)
                    }
                }

                Text(activity.title)
                    .font(.subheadline.bold())
                    .foregroundStyle(TouristTheme.text)
                    .lineLimit(2)

                if !activity.description.isEmpty {
                    Text(activity.description)
                        .font(.caption)
                        .foregroundStyle(TouristTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                if let km = activity.distanceFromStayKm {
                    Text(String(format: "Cách nơi lưu trú · %.1f km", km))
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TouristTheme.primary)
                }

                if let serviceId = activity.serviceId {
                    Button {
                        onOpenService(serviceId)
                    } label: {
                        Text("Đặt dịch vụ")
                            .font(.caption.bold())
                    }
                    .buttonStyle(SecondaryButtonStyle())
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TouristTheme.surface, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
        }
    }
}

private extension TouristService {
    var isLodging: Bool {
        let normalized = category.folding(options: .diacriticInsensitive, locale: .current).lowercased()
        return normalized.contains("luu tru") || normalized.contains("lưu trú")
    }

    var stayLabel: String {
        if vendorName.isEmpty { return name }
        return "\(name) - \(vendorName)"
    }

    var hasVendorCoordinate: Bool {
        vendorLatitude != nil && vendorLongitude != nil
    }
}

private extension Array where Element == TouristService {
    var uniquedById: [TouristService] {
        var seen = Set<String>()
        return filter { service in
            seen.insert(service.id).inserted
        }
    }
}
