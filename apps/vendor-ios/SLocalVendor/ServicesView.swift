import PhotosUI
import SwiftUI
import UniformTypeIdentifiers

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
                    Text(service.productLabel)
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
                if service.isCoupon {
                    Text("Coupon giảm \(service.reservationDiscountPercent ?? "0")% trên hóa đơn")
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

private struct WeekdayPolicyButton: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack(alignment: .topTrailing) {
                Text(label)
                    .font(.caption.weight(.semibold))
                    .frame(width: 34, height: 34)
                    .foregroundStyle(isSelected ? VendorTheme.primary : .secondary)
                    .background(isSelected ? VendorTheme.primary.opacity(0.12) : Color(.systemGray6), in: Circle())
                if isSelected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundStyle(VendorTheme.primary)
                        .offset(x: 1, y: -1)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Ngày áp dụng \(label)")
        .accessibilityValue(isSelected ? "Đã chọn" : "Chưa chọn")
    }
}

private struct ServiceEditorView: View {
    @EnvironmentObject private var state: AppState
    let service: VendorService?

    @State private var name = ""
    @State private var categoryId = ""
    @State private var description = ""
    @State private var productType = productTypeVoucher
    @State private var originalPrice = ""
    @State private var discountPrice = ""
    @State private var reservationDiscountPercent = ""
    @State private var policyWeekdays: Set<Int> = Set(1...7)
    @State private var excludePublicHolidays = false
    @State private var draftBlackoutDate = Date()
    @State private var isBlackoutDatePickerPresented = false
    @State private var blackoutDates: Set<String> = []
    @State private var policyConditions = ""
    @State private var durationMinutes = ""
    @State private var maxQuantityPerOrder = "10"
    @State private var imageUrls = ""
    @State private var selectedPhotoItems: [PhotosPickerItem] = []
    @State private var isUploadingImages = false
    @State private var uploadError = ""
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
                Picker("Loại", selection: $productType) {
                    Text("Voucher").tag(productTypeVoucher)
                    Text("Vé").tag(productTypeTicket)
                    Text("Coupon").tag(productTypeCoupon)
                }
                .pickerStyle(.segmented)

                if productType == productTypeCoupon {
                    Text("Coupon: Khách không trả trước; vendor thu tại quầy và trả hoa hồng cho S-Loco sau khi dùng.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else if productType == productTypeTicket {
                    Text("Vé: Khách trả trước, QR scan xong được hoàn tất ngay để đối soát S-Loco trả vendor.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Voucher: Khách trả trước; QR scan ghi nhận đã dùng, vendor hoàn thành dịch vụ để đối soát S-Loco trả vendor.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Giá và vận hành") {
                TextField(productType == productTypeCoupon ? "Giá tham chiếu" : "Giá gốc", text: $originalPrice)
                    .keyboardType(.numberPad)
                if productType == productTypeCoupon {
                    TextField("Ưu đãi coupon (%)", text: $reservationDiscountPercent)
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

            Section("Chính sách áp dụng") {
                Text("Thông tin này hiển thị cho Khách trước khi mua/nhận voucher.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                VStack(alignment: .leading, spacing: 8) {
                    Text("Ngày áp dụng")
                        .font(.subheadline.weight(.semibold))
                    HStack(spacing: 8) {
                        ForEach(1...7, id: \.self) { day in
                            WeekdayPolicyButton(
                                label: weekdayShortLabel(day),
                                isSelected: policyWeekdays.contains(day)
                            ) {
                                if policyWeekdays.contains(day) {
                                    policyWeekdays.remove(day)
                                } else {
                                    policyWeekdays.insert(day)
                                }
                            }
                        }
                    }
                }
                Toggle("Không áp dụng ngày lễ", isOn: $excludePublicHolidays)
                VStack(alignment: .leading, spacing: 10) {
                    Text("Ngày không áp dụng")
                        .font(.subheadline.weight(.semibold))
                    Button("Chọn ngày không áp dụng") {
                        draftBlackoutDate = Date()
                        isBlackoutDatePickerPresented = true
                    }
                    .buttonStyle(.bordered)
                    if blackoutDates.isEmpty {
                        Text("Chưa chọn ngày không áp dụng.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(blackoutDates.sorted(), id: \.self) { date in
                            HStack {
                                Text(date)
                                    .font(.footnote.weight(.semibold))
                                Spacer()
                                Button("Xóa") {
                                    blackoutDates.remove(date)
                                }
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.red)
                                .buttonStyle(.plain)
                            }
                            .padding(.vertical, 6)
                            .padding(.horizontal, 10)
                            .background(Color(.systemGray6), in: Capsule())
                        }
                    }
                }
                TextField("Điều kiện khác", text: $policyConditions, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section("Hình ảnh") {
                Text("Chọn ảnh để upload lên server. Ảnh sẽ được tải lên ngay khi chọn.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                PhotosPicker(
                    isUploadingImages ? "Đang tải ảnh..." : "Chọn ảnh dịch vụ",
                    selection: $selectedPhotoItems,
                    matching: .images
                )
                .disabled(state.isLoading || isUploadingImages)

                if isUploadingImages {
                    ProgressView("Đang upload ảnh...")
                }

                if !uploadError.isEmpty {
                    Text(uploadError)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.red)
                }

                let urls = imageUrlList
                if urls.isEmpty {
                    Text("Chưa có ảnh dịch vụ.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(urls, id: \.self) { url in
                        HStack(alignment: .top) {
                            AsyncImage(url: URL(string: url)) { image in
                                image
                                    .resizable()
                                    .scaledToFill()
                            } placeholder: {
                                Color(.systemGray5)
                            }
                            .frame(width: 64, height: 64)
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                            Text(url)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(2)
                            Spacer()
                            Button("Xóa") {
                                removeImageUrl(url)
                            }
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.red)
                            .disabled(state.isLoading || isUploadingImages)
                        }
                    }
                }
            }

            Section {
                Button(service == nil ? "Thêm dịch vụ" : "Lưu thay đổi") {
                    Task {
                        await state.saveService(
                            service: service,
                            name: name,
                            categoryId: categoryId,
                            description: description,
                            productType: productType,
                            originalPrice: originalPrice,
                            discountPrice: discountPrice,
                            reservationDiscountPercent: reservationDiscountPercent,
                            policyWeekdays: policyWeekdays,
                            excludePublicHolidays: excludePublicHolidays,
                            blackoutDates: blackoutDates.sorted().joined(separator: "\n"),
                            policyConditions: policyConditions,
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
                        isUploadingImages ||
                        (productType != productTypeCoupon && originalPrice.isEmpty) ||
                        (productType == productTypeCoupon && reservationDiscountPercent.isEmpty)
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
        .onChange(of: selectedPhotoItems) { _, items in
            uploadSelectedImages(items)
        }
        .sheet(isPresented: $isBlackoutDatePickerPresented) {
            NavigationStack {
                VStack(spacing: 20) {
                    DatePicker(
                        "Chọn ngày không áp dụng",
                        selection: $draftBlackoutDate,
                        displayedComponents: .date
                    )
                    .datePickerStyle(.graphical)
                    .labelsHidden()
                    Spacer()
                }
                .padding()
                .navigationTitle("Chọn ngày")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Hủy") {
                            isBlackoutDatePickerPresented = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Thêm") {
                            blackoutDates.insert(Self.blackoutDateFormatter.string(from: draftBlackoutDate))
                            isBlackoutDatePickerPresented = false
                        }
                    }
                }
            }
            .presentationDetents([.medium, .large])
        }
        .scrollContentBackground(.hidden)
        .background(VendorTheme.surface)
    }

    private static let blackoutDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private func weekdayShortLabel(_ day: Int) -> String {
        switch day {
        case 1: return "T2"
        case 2: return "T3"
        case 3: return "T4"
        case 4: return "T5"
        case 5: return "T6"
        case 6: return "T7"
        case 7: return "CN"
        default: return "T\(day)"
        }
    }

    private var imageUrlList: [String] {
        imageUrls
            .split(whereSeparator: \.isNewline)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    private func setImageUrlList(_ urls: [String]) {
        imageUrls = urls.joined(separator: "\n")
    }

    private func removeImageUrl(_ url: String) {
        setImageUrlList(imageUrlList.filter { $0 != url })
    }

    private func uploadSelectedImages(_ items: [PhotosPickerItem]) {
        guard !items.isEmpty else { return }
        isUploadingImages = true
        uploadError = ""
        Task {
            var urls = imageUrlList
            do {
                for item in items {
                    guard let data = try await item.loadTransferable(type: Data.self) else {
                        throw ClientError.message("Không đọc được ảnh đã chọn.")
                    }
                    let mimeType = item.supportedContentTypes.first?.preferredMIMEType ?? "image/jpeg"
                    let fileExtension = item.supportedContentTypes.first?.preferredFilenameExtension ?? "jpg"
                    let url = try await state.uploadServiceImage(
                        data: data,
                        filename: "service-\(UUID().uuidString).\(fileExtension)",
                        mimeType: mimeType
                    )
                    urls.append(url)
                }
                setImageUrlList(urls)
            } catch {
                uploadError = error.localizedDescription
            }
            selectedPhotoItems = []
            isUploadingImages = false
        }
    }

    private func hydrate() {
        guard name.isEmpty else { return }
        name = service?.name ?? ""
        categoryId = service?.categoryId.isEmpty == false
            ? service!.categoryId
            : state.serviceCategories.first?.id ?? ""
        description = service?.description ?? ""
        productType = service?.productType ?? productTypeVoucher
        originalPrice = service.map { String($0.originalPrice) } ?? ""
        discountPrice = service?.discountPrice.map(String.init) ?? ""
        reservationDiscountPercent = service?.reservationDiscountPercent ?? ""
        policyWeekdays = service?.applicabilityPolicy?.weekdays.map(Set.init) ?? Set(1...7)
        excludePublicHolidays = service?.applicabilityPolicy?.excludePublicHolidays ?? false
        blackoutDates = Set(service?.applicabilityPolicy?.blackoutDates ?? [])
        policyConditions = service?.applicabilityPolicy?.conditions ?? ""
        durationMinutes = service?.durationMinutes.map(String.init) ?? ""
        maxQuantityPerOrder = service?.maxQuantityPerOrder.map(String.init) ?? "10"
        imageUrls = service?.images.joined(separator: "\n") ?? ""
        isActive = service?.isActive ?? true
    }
}
