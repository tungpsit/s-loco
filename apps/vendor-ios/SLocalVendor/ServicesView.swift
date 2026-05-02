import SwiftUI

struct ServicesView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink {
                        ServiceEditorView(service: nil)
                    } label: {
                        Label("Thêm dịch vụ", systemImage: "plus.circle.fill")
                    }
                }

                if state.services.isEmpty {
                    ContentUnavailableView(
                        "Chưa có dịch vụ",
                        systemImage: "ticket",
                        description: Text("Thêm dịch vụ để khách có thể đặt mua trên S-Loco.")
                    )
                    .listRowBackground(Color.clear)
                } else {
                    Section("Danh sách") {
                        ForEach(state.services) { service in
                            NavigationLink {
                                ServiceEditorView(service: service)
                            } label: {
                                ServiceRow(
                                    service: service,
                                    category: state.serviceCategories.first { $0.id == service.categoryId }
                                )
                            }
                        }
                    }
                }
            }
            .navigationTitle("Dịch vụ")
            .refreshable {
                await state.refreshServices()
            }
            .task {
                if state.services.isEmpty {
                    await state.refreshServices()
                }
            }
            .scrollContentBackground(.hidden)
            .background(VendorTheme.surface)
        }
    }
}

private struct ServiceRow: View {
    let service: VendorService
    let category: ServiceCategory?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(service.name)
                        .font(.headline)
                        .foregroundStyle(VendorTheme.text)
                    Text(category?.name ?? "Chưa rõ danh mục")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 6) {
                    Text(service.fulfillmentType == ServiceType.reservation ? "Đặt bàn" : "Giá trước")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(VendorTheme.primary)
                    Text(service.isActive ? "Đang bán" : "Tạm ẩn")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(service.isActive ? VendorTheme.success : VendorTheme.warning)
                }
            }
            if let description = service.description, !description.isEmpty {
                Text(description)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            HStack(spacing: 10) {
                if service.fulfillmentType == ServiceType.reservation {
                    Text("Ưu đãi đặt bàn \(service.reservationDiscountPercent ?? "0")%")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(VendorTheme.warning)
                } else {
                    Text(formatVnd(service.originalPrice))
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(VendorTheme.primary)
                    if let discountPrice = service.discountPrice {
                        Text("KM \(formatVnd(discountPrice))")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(VendorTheme.warning)
                    }
                }
            }
        }
        .padding(.vertical, 6)
    }
}

private struct ServiceEditorView: View {
    @EnvironmentObject private var state: AppState
    let service: VendorService?

    @State private var name = ""
    @State private var categoryId = ""
    @State private var description = ""
    @State private var fulfillmentType = ServiceType.fixedPrice
    @State private var originalPrice = ""
    @State private var discountPrice = ""
    @State private var reservationDiscountPercent = ""
    @State private var durationMinutes = ""
    @State private var maxQuantityPerOrder = "10"
    @State private var imageUrls = ""
    @State private var isActive = true
    @State private var confirmDelete = false

    var body: some View {
        Form {
            Section("Thông tin dịch vụ") {
                TextField("Tên dịch vụ", text: $name)
                Picker("Danh mục", selection: $categoryId) {
                    ForEach(state.serviceCategories) { category in
                        Text(category.name).tag(category.id)
                    }
                }
                TextField("Mô tả", text: $description, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section("Loại sản phẩm") {
                Picker("Loại", selection: $fulfillmentType) {
                    Text("Có giá trước").tag(ServiceType.fixedPrice)
                    Text("Đặt bàn").tag(ServiceType.reservation)
                }
                .pickerStyle(.segmented)

                if fulfillmentType == ServiceType.reservation {
                    Text("Khách gửi yêu cầu đặt bàn, vendor xác nhận rồi hệ thống phát hành voucher iPos theo % ưu đãi.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Giá và vận hành") {
                TextField(fulfillmentType == ServiceType.reservation ? "Giá tham chiếu" : "Giá gốc", text: $originalPrice)
                    .keyboardType(.numberPad)
                if fulfillmentType == ServiceType.reservation {
                    TextField("Ưu đãi đặt bàn (%)", text: $reservationDiscountPercent)
                        .keyboardType(.decimalPad)
                } else {
                    TextField("Giá khuyến mãi", text: $discountPrice)
                        .keyboardType(.numberPad)
                }
                TextField("Thời lượng phút", text: $durationMinutes)
                    .keyboardType(.numberPad)
                TextField("Số lượng tối đa mỗi đơn", text: $maxQuantityPerOrder)
                    .keyboardType(.numberPad)
                Toggle("Đang bán", isOn: $isActive)
                    .disabled(service == nil)
            }

            Section("Hình ảnh") {
                Text("Nhập URL ảnh, mỗi dòng một ảnh.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                TextEditor(text: $imageUrls)
                    .frame(minHeight: 100)
            }

            Section {
                Button(service == nil ? "Thêm dịch vụ" : "Lưu thay đổi") {
                    Task {
                        await state.saveService(
                            service: service,
                            name: name,
                            categoryId: categoryId,
                            description: description,
                            fulfillmentType: fulfillmentType,
                            originalPrice: originalPrice,
                            discountPrice: discountPrice,
                            reservationDiscountPercent: reservationDiscountPercent,
                            durationMinutes: durationMinutes,
                            maxQuantityPerOrder: maxQuantityPerOrder,
                            imageUrls: imageUrls,
                            isActive: isActive
                        )
                    }
                }
                .disabled(
                    state.isLoading ||
                        name.isEmpty ||
                        categoryId.isEmpty ||
                        (fulfillmentType == ServiceType.fixedPrice && originalPrice.isEmpty) ||
                        (fulfillmentType == ServiceType.reservation && reservationDiscountPercent.isEmpty)
                )

                if let service {
                    Button(confirmDelete ? "Bấm lần nữa để xóa" : "Xóa dịch vụ", role: .destructive) {
                        if confirmDelete {
                            Task { await state.deleteService(service) }
                        } else {
                            confirmDelete = true
                        }
                    }
                    .disabled(state.isLoading)
                }
            }
        }
        .navigationTitle(service == nil ? "Thêm dịch vụ" : "Sửa dịch vụ")
        .task {
            if state.serviceCategories.isEmpty {
                await state.refreshServices()
            }
            hydrate()
        }
        .onChange(of: state.serviceCategories.count) { _, _ in
            if categoryId.isEmpty {
                categoryId = state.serviceCategories.first?.id ?? ""
            }
        }
        .scrollContentBackground(.hidden)
        .background(VendorTheme.surface)
    }

    private func hydrate() {
        guard name.isEmpty else { return }
        name = service?.name ?? ""
        categoryId = service?.categoryId.isEmpty == false
            ? service!.categoryId
            : state.serviceCategories.first?.id ?? ""
        description = service?.description ?? ""
        fulfillmentType = service?.fulfillmentType ?? ServiceType.fixedPrice
        originalPrice = service.map { String($0.originalPrice) } ?? ""
        discountPrice = service?.discountPrice.map(String.init) ?? ""
        reservationDiscountPercent = service?.reservationDiscountPercent ?? ""
        durationMinutes = service?.durationMinutes.map(String.init) ?? ""
        maxQuantityPerOrder = service?.maxQuantityPerOrder.map(String.init) ?? "10"
        imageUrls = service?.images.joined(separator: "\n") ?? ""
        isActive = service?.isActive ?? true
    }
}
