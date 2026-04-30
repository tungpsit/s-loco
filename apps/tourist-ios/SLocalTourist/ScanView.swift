import SwiftUI

struct ScanView: View {
    @EnvironmentObject private var state: AppState
    @State private var days = 3.0
    @State private var budget = "3000000"
    @State private var preferences = "Ẩm thực địa phương, điểm tham quan nhẹ nhàng"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("AI Planner", systemImage: "sparkles")
                            .font(.title2.bold())
                            .foregroundStyle(TouristTheme.primary)
                        Text("Tạo lịch trình nhanh theo số ngày, ngân sách và sở thích.")
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

                        Button {
                            Task {
                                await state.createItinerary(days: Int(days), budget: Int(budget) ?? 0, preferences: preferences)
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
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("AI")
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
