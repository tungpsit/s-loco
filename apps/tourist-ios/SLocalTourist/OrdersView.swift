import SwiftUI

struct OrdersView: View {
    @EnvironmentObject private var state: AppState
    @State private var query = ""
    @State private var category = ""

    private let categories = TouristCategoryOption.home

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                searchField
                categoryPicker
                List {
                    Section("Dịch vụ") {
                        ForEach(state.searchServices) { service in
                            ServiceListRow(service: service) {
                                state.route = .service(service)
                            }
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                        }
                    }

                    if !state.vendors.isEmpty {
                        Section("Nhà cung cấp") {
                            ForEach(state.vendors) { vendor in
                                Button {
                                    state.route = .vendor(vendor)
                                } label: {
                                    HStack {
                                        Image(systemName: "storefront")
                                            .foregroundStyle(TouristTheme.primary)
                                        VStack(alignment: .leading) {
                                            Text(vendor.name)
                                                .font(.subheadline.weight(.semibold))
                                                .foregroundStyle(TouristTheme.text)
                                            Text(vendor.address ?? vendor.slug ?? "Đối tác S-Loco")
                                                .font(.caption)
                                                .foregroundStyle(TouristTheme.muted)
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .font(.caption.bold())
                                            .foregroundStyle(TouristTheme.muted)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
            .touristReadableContent()
            .padding(.horizontal, 16)
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("Tìm kiếm")
            .onChange(of: query) { _, _ in runSearch() }
            .onChange(of: category) { _, _ in runSearch() }
        }
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(TouristTheme.primary)
            TextField("Tìm tour, vé, địa điểm", text: $query)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(12)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
    }

    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(categories, id: \.value) { option in
                    Button {
                        category = option.value
                    } label: {
                        Text(option.label)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(category == option.value ? .white : TouristTheme.primary)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(category == option.value ? TouristTheme.primary : .white, in: Capsule())
                            .overlay(Capsule().stroke(TouristTheme.border))
                    }
                }
            }
            .padding(.vertical, 2)
        }
    }

    private func runSearch() {
        Task { await state.search(query: query, category: category) }
    }
}

private struct ServiceListRow: View {
    let service: TouristService
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                ServiceImage(url: service.imageURL, category: service.category, serviceName: service.name)
                    .frame(width: 92, height: 82)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                VStack(alignment: .leading, spacing: 6) {
                    Text(service.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TouristTheme.text)
                        .lineLimit(2)
                    Text(service.vendorName.isEmpty ? service.category : service.vendorName)
                        .font(.caption)
                        .foregroundStyle(TouristTheme.muted)
                        .lineLimit(1)
                    HStack {
                        Label(String(format: "%.1f", service.rating), systemImage: "star.fill")
                            .foregroundStyle(TouristTheme.coral)
                        Spacer()
                        Text(service.isCoupon ? "Coupon" : service.price.vnd)
                            .foregroundStyle(TouristTheme.primary)
                    }
                    .font(.caption.weight(.semibold))
                }
            }
            .padding(10)
            .background(.white, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
        }
        .buttonStyle(.plain)
    }
}
