import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 12) {
                        StatTile(title: "Đơn hôm nay", value: "\(state.dashboard?.today.orders ?? 0)", color: VendorTheme.primary)
                        StatTile(title: "Doanh thu", value: formatVnd(state.dashboard?.today.revenue), color: VendorTheme.primaryContainer)
                    }
                    StatTile(title: "Chờ giải ngân", value: formatVnd(state.dashboard?.settlement.pending), color: VendorTheme.warning)
                }
                Section("Voucher gần đây") {
                    ForEach(state.dashboard?.recentOrders ?? Array(state.vouchers.prefix(5))) { voucher in
                        VoucherRow(voucher: voucher)
                    }
                }
                Section("Đặt chỗ mới") {
                    ForEach(Array(state.reservations.prefix(5))) { reservation in
                        NavigationLink {
                            ReservationDetailView(item: reservation)
                        } label: {
                            ReservationRow(item: reservation)
                        }
                    }
                }
            }
            .navigationTitle(state.vendor?.name ?? "Trang chủ")
            .refreshable { await state.refreshHome() }
            .scrollContentBackground(.hidden)
            .background(VendorTheme.surface)
        }
    }
}

struct StatTile: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(.white.opacity(0.75))
            Text(value).font(.title3.weight(.bold)).foregroundStyle(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(color)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .listRowBackground(Color.clear)
    }
}

struct VoucherRow: View {
    let voucher: Voucher

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(voucher.serviceName ?? voucher.id).font(.headline)
            Text("\(voucher.customerName ?? "Khách hàng") · \(voucher.status) · \(formatVnd(voucher.finalAmount))")
                .font(.subheadline)
                .foregroundStyle(VendorTheme.secondaryText)
        }
        .padding(.vertical, 4)
    }
}

struct ReservationRow: View {
    let item: ReservationWire

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                Text(item.serviceDisplayName)
                    .font(.headline)
                    .foregroundStyle(VendorTheme.text)
                Text("\(item.customerDisplayName) · \(item.reservation.partySize) người")
                    .font(.subheadline)
                    .foregroundStyle(VendorTheme.secondaryText)
                if let code = item.voucher?.iposVoucherCode, !code.isEmpty {
                    Text("Mã iPos: \(code)")
                        .font(.caption.bold())
                        .foregroundStyle(VendorTheme.primary)
                }
            }
            Spacer(minLength: 8)
            ReservationStatusBadge(item: item)
        }
        .padding(.vertical, 6)
        .padding(.horizontal, item.needsVendorAttention ? 10 : 0)
        .background {
            if item.needsVendorAttention {
                RoundedRectangle(cornerRadius: 12)
                    .fill(statusColor(item.statusTone).opacity(0.12))
            }
        }
    }
}

struct ReservationDetailView: View {
    @EnvironmentObject private var state: AppState
    let item: ReservationWire

    private var currentItem: ReservationWire {
        state.reservations.first { $0.id == item.id } ?? item
    }

    var body: some View {
        List {
            Section("Thông tin đặt chỗ") {
                ReservationStatusBanner(item: currentItem)
                DetailRow(title: "Dịch vụ", value: currentItem.serviceDisplayName)
                DetailRow(title: "Thời gian", value: formatReservationTime(currentItem.reservation.requestedTime))
                DetailRow(title: "Số người", value: "\(currentItem.reservation.partySize)")
                if let note = currentItem.reservation.customerNote, !note.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Ghi chú")
                            .font(.caption)
                            .foregroundStyle(VendorTheme.secondaryText)
                        Text(note)
                            .foregroundStyle(VendorTheme.text)
                    }
                    .padding(.vertical, 4)
                }
            }

            Section("Liên hệ khách") {
                DetailRow(title: "Tên khách", value: currentItem.customerDisplayName)
                if let phone = currentItem.customerPhoneNumber {
                    DetailRow(title: "Số điện thoại", value: phone)
                    HStack {
                        if let callURL = contactURL(scheme: "tel", phone: phone) {
                            Link("Gọi khách", destination: callURL)
                                .buttonStyle(.borderedProminent)
                        }
                        if let smsURL = contactURL(scheme: "sms", phone: phone) {
                            Link("Nhắn tin", destination: smsURL)
                                .buttonStyle(.bordered)
                        }
                    }
                    .padding(.vertical, 4)
                } else {
                    Text("Chưa có số điện thoại.")
                        .foregroundStyle(VendorTheme.secondaryText)
                }
            }

            Section("Voucher iPos") {
                if let voucher = currentItem.voucher {
                    DetailRow(title: "Trạng thái", value: voucherStatusLabel(voucher.status))
                    if let percent = voucher.discountPercent, !percent.isEmpty {
                        DetailRow(title: "Ưu đãi", value: "\(percent)%")
                    }
                    if let code = voucher.iposVoucherCode, !code.isEmpty {
                        DetailRow(title: "Mã iPos", value: code)
                    }
                    if let error = voucher.issueError, !error.isEmpty {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                } else {
                    Text("Chưa phát hành voucher. Xác nhận đặt chỗ để tạo voucher cho tourist.")
                        .foregroundStyle(VendorTheme.secondaryText)
                }
            }

            Section {
                if currentItem.canConfirm {
                    Button {
                        Task { await state.confirmReservation(currentItem.reservation.id) }
                    } label: {
                        Label("Xác nhận & tạo voucher", systemImage: "checkmark.seal.fill")
                    }
                    .disabled(state.isLoading)
                }
                if currentItem.voucher?.status == "issue_failed", let id = currentItem.voucher?.id {
                    Button {
                        Task { await state.retryReservationVoucher(id) }
                    } label: {
                        Label("Thử tạo lại voucher iPos", systemImage: "arrow.clockwise")
                    }
                    .disabled(state.isLoading)
                }
                if currentItem.canConfirm {
                    Button(role: .destructive) {
                        Task { await state.rejectReservation(currentItem.reservation.id) }
                    } label: {
                        Label("Từ chối đặt chỗ", systemImage: "xmark.circle")
                    }
                    .disabled(state.isLoading)
                }
            }
        }
        .navigationTitle("Chi tiết đặt chỗ")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await state.refreshReservations() }
        .scrollContentBackground(.hidden)
        .background(VendorTheme.surface)
    }
}

struct ReservationStatusBadge: View {
    let item: ReservationWire

    var body: some View {
        Label(statusText(for: item), systemImage: statusSymbol(item.statusTone))
            .font(.caption.bold())
            .lineLimit(1)
            .minimumScaleFactor(0.85)
            .foregroundStyle(statusColor(item.statusTone))
            .padding(.horizontal, 9)
            .padding(.vertical, 6)
            .background(statusColor(item.statusTone).opacity(0.14))
            .clipShape(Capsule())
    }
}

struct ReservationStatusBanner: View {
    let item: ReservationWire

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: statusSymbol(item.statusTone))
                .font(.title3.weight(.bold))
            VStack(alignment: .leading, spacing: 4) {
                Text(statusText(for: item))
                    .font(.headline)
                Text(statusDescription(for: item))
                    .font(.subheadline)
                    .foregroundStyle(statusColor(item.statusTone).opacity(0.86))
            }
            Spacer(minLength: 0)
        }
        .foregroundStyle(statusColor(item.statusTone))
        .padding(14)
        .background(statusColor(item.statusTone).opacity(0.14))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .padding(.vertical, 4)
    }
}

struct DetailRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack(alignment: .top) {
            Text(title)
                .foregroundStyle(VendorTheme.secondaryText)
            Spacer(minLength: 16)
            Text(value)
                .multilineTextAlignment(.trailing)
                .foregroundStyle(VendorTheme.text)
        }
        .padding(.vertical, 4)
    }
}

func reservationStatusLabel(_ status: String) -> String {
    switch status {
    case "requested": "Chờ liên hệ"
    case "confirmed": "Đã xác nhận"
    case "voucher_issued": "Đã có mã"
    case "used": "Đã dùng"
    case "settled": "Đã đối soát"
    case "rejected": "Từ chối"
    case "cancelled": "Đã hủy"
    default: status
    }
}

func statusText(for item: ReservationWire) -> String {
    if item.voucher?.status == "issue_failed" {
        return "Lỗi tạo voucher"
    }
    return reservationStatusLabel(item.reservation.status)
}

func statusDescription(for item: ReservationWire) -> String {
    if item.voucher?.status == "issue_failed" {
        return "Cần thử tạo lại voucher iPos cho tourist."
    }
    switch item.reservation.status {
    case "requested":
        return "Cần liên hệ khách và xác nhận để tạo voucher."
    case "confirmed":
        return "Đã xác nhận, hệ thống đang xử lý voucher."
    case "voucher_issued":
        return "Voucher đã sẵn sàng cho tourist sử dụng."
    case "used":
        return "Khách đã sử dụng voucher tại quầy."
    case "settled":
        return "Đặt chỗ đã hoàn tất đối soát."
    case "rejected":
        return "Đặt chỗ đã bị từ chối."
    case "cancelled":
        return "Đặt chỗ đã bị hủy."
    default:
        return "Theo dõi trạng thái đặt chỗ."
    }
}

func statusSymbol(_ tone: ReservationStatusTone) -> String {
    switch tone {
    case .attention:
        return "exclamationmark.circle.fill"
    case .danger:
        return "xmark.octagon.fill"
    case .inProgress:
        return "clock.fill"
    case .success:
        return "checkmark.seal.fill"
    case .muted:
        return "minus.circle.fill"
    case .neutral:
        return "circle.fill"
    }
}

func statusColor(_ tone: ReservationStatusTone) -> Color {
    switch tone {
    case .attention:
        return VendorTheme.warning
    case .danger:
        return .red
    case .inProgress:
        return VendorTheme.primaryContainer
    case .success:
        return VendorTheme.success
    case .muted:
        return VendorTheme.secondaryText
    case .neutral:
        return VendorTheme.primary
    }
}

func voucherStatusLabel(_ status: String) -> String {
    switch status {
    case "issuing": "Đang tạo"
    case "active": "Đã phát hành"
    case "used": "Đã sử dụng"
    case "issue_failed": "Tạo lỗi"
    default: status
    }
}

func formatReservationTime(_ value: String) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let date = formatter.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    guard let date else { return value }

    let output = DateFormatter()
    output.locale = Locale(identifier: "vi_VN")
    output.dateStyle = .medium
    output.timeStyle = .short
    return output.string(from: date)
}

private func contactURL(scheme: String, phone: String) -> URL? {
    let allowed = CharacterSet(charactersIn: "+0123456789")
    let normalized = phone.unicodeScalars.filter { allowed.contains($0) }.map(String.init).joined()
    guard !normalized.isEmpty else { return nil }
    return URL(string: "\(scheme)://\(normalized)")
}
