import SwiftUI
import CoreImage.CIFilterBuiltins

struct LoginView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var phone = ""
    let redirect: AppRoute?

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text("Đăng nhập")
                    .font(.largeTitle.bold())
                    .foregroundStyle(TouristTheme.text)
                Text("Nhập số điện thoại để nhận mã OTP và quản lý vé đã mua.")
                    .font(.subheadline)
                    .foregroundStyle(TouristTheme.muted)

                TextField("Số điện thoại", text: $phone)
                    .keyboardType(.phonePad)
                    .textFieldStyle(TouristTextFieldStyle())

                Button {
                    Task { await state.sendOtp(phone: phone, redirect: redirect) }
                } label: {
                    Text("Gửi mã OTP")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                Spacer()
            }
            .padding(20)
            .background(TouristTheme.surface.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Đóng") { dismiss() }
                }
            }
        }
    }
}

struct OtpView: View {
    @EnvironmentObject private var state: AppState
    @State private var code = ""
    @State private var errorMessage: String?
    @State private var statusMessage: String?
    @State private var resendRemaining = OtpResendCooldown.seconds
    let phone: String
    let redirect: AppRoute?
    private let resendTimer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Text("Nhập OTP")
                    .font(.largeTitle.bold())
                    .foregroundStyle(TouristTheme.text)
                Text("Mã xác thực đã được gửi tới \(phone).")
                    .font(.subheadline)
                    .foregroundStyle(TouristTheme.muted)

                TextField("Mã OTP", text: $code)
                    .keyboardType(.numberPad)
                    .textFieldStyle(TouristTextFieldStyle())
                    .onChange(of: code) { _, value in
                        let digits = String(value.filter(\.isNumber).prefix(4))
                        if digits != value { code = digits }
                        if !digits.isEmpty {
                            errorMessage = nil
                            statusMessage = nil
                        }
                    }

                if let errorMessage {
                    Label(errorMessage, systemImage: "exclamationmark.circle.fill")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(TouristTheme.coral)
                }

                if let statusMessage {
                    Label(statusMessage, systemImage: "checkmark.circle.fill")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(TouristTheme.primary)
                }

                Button {
                    Task { await verifyOtp() }
                } label: {
                    Text(state.isLoading ? "Đang xác thực..." : "Xác thực")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
                .disabled(state.isLoading || code.count < 4)

                Button {
                    Task { await resendOtp() }
                } label: {
                    Text(OtpResendCooldown.title(remainingSeconds: resendRemaining))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(SecondaryButtonStyle())
                .disabled(state.isLoading || resendRemaining > 0)

                Spacer()
            }
            .padding(20)
            .background(TouristTheme.surface.ignoresSafeArea())
            .onReceive(resendTimer) { _ in
                if resendRemaining > 0 { resendRemaining -= 1 }
            }
        }
    }

    private func verifyOtp() async {
        let trimmedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedCode.count == 4 else {
            errorMessage = "Vui lòng nhập đủ 4 chữ số OTP."
            return
        }

        errorMessage = nil
        statusMessage = nil
        if let error = await state.verifyOtpFromOtpScreen(phone: phone, code: trimmedCode, redirect: redirect) {
            code = ""
            errorMessage = error
        }
    }

    private func resendOtp() async {
        guard resendRemaining == 0 else { return }
        errorMessage = nil
        statusMessage = nil

        if let error = await state.resendOtpFromOtpScreen(phone: phone) {
            errorMessage = error
            return
        }

        code = ""
        statusMessage = "Mã OTP mới đã được gửi. Vui lòng kiểm tra SMS."
        resendRemaining = OtpResendCooldown.seconds
    }
}

enum OtpResendCooldown {
    static let seconds = 60

    static func title(remainingSeconds: Int) -> String {
        remainingSeconds > 0 ? "Gửi lại sau \(remainingSeconds)s" : "Gửi lại OTP"
    }
}

struct ServiceDetailView: View {
    @EnvironmentObject private var state: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var quantity = 1
    @State private var partySize = 2
    @State private var requestedTime = "2026-05-01T12:00:00.000Z"
    @State private var reservationNote = ""
    let service: TouristService

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    ServiceImage(url: service.imageURL, category: service.category, serviceName: service.name)
                        .frame(height: 240)
                        .clipShape(RoundedRectangle(cornerRadius: 18))

                    VStack(alignment: .leading, spacing: 10) {
                        Text(service.name)
                            .font(.title2.bold())
                            .foregroundStyle(TouristTheme.text)
                        HStack {
                            Label(String(format: "%.1f", service.rating), systemImage: "star.fill")
                            Label("\(max(service.durationMinutes, 30)) phút", systemImage: "clock")
                        }
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TouristTheme.muted)
                        Text(service.vendorName)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(TouristTheme.primary)
                        Text(service.description.isEmpty ? "Trải nghiệm được tuyển chọn bởi S-Loco." : service.description)
                            .font(.body)
                            .foregroundStyle(TouristTheme.text)
                    }

                    if service.isReservation {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Thông tin đặt chỗ")
                                .font(.headline)
                            Stepper("Số người: \(partySize)", value: $partySize, in: 1...100)
                            TextField("Thời gian mong muốn", text: $requestedTime)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                            TextField("Ghi chú", text: $reservationNote, axis: .vertical)
                                .lineLimit(2...4)
                            Text("Nhà hàng sẽ liên hệ xác nhận trước khi phát hành mã ưu đãi iPos.")
                                .font(.caption)
                                .foregroundStyle(TouristTheme.muted)
                        }
                        .padding(14)
                        .background(.white, in: RoundedRectangle(cornerRadius: 14))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
                    } else {
                        Stepper("Số lượng: \(quantity)", value: $quantity, in: 1...10)
                            .padding(14)
                            .background(.white, in: RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
                    }
                }
                .padding(16)
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .safeAreaInset(edge: .bottom) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(service.isReservation ? "Ưu đãi" : "Tổng")
                            .font(.caption)
                            .foregroundStyle(TouristTheme.muted)
                        Text(service.isReservation ? "Giảm \(service.reservationDiscountPercent)%" : (service.price * quantity).vnd)
                            .font(.headline)
                            .foregroundStyle(TouristTheme.primary)
                    }
                    Spacer()
                    Button {
                        Task {
                            if service.isReservation {
                                await state.createReservation(
                                    service: service,
                                    partySize: partySize,
                                    requestedTime: requestedTime,
                                    note: reservationNote
                                )
                            } else {
                                await state.createOrder(service: service, quantity: quantity)
                            }
                        }
                    } label: {
                        Label(service.isReservation ? "Đặt chỗ" : "Mua ngay", systemImage: service.isReservation ? "calendar.badge.plus" : "cart.fill")
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                .padding(16)
                .background(.regularMaterial)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Đóng") { dismiss() }
                }
            }
        }
    }
}

struct CheckoutView: View {
    @EnvironmentObject private var state: AppState
    let orderId: String

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Thanh toán")
                        .font(.largeTitle.bold())
                        .foregroundStyle(TouristTheme.text)
                    if let order = state.currentOrder {
                        OrderSummary(order: order)
                    }
                    paymentRow(icon: "creditcard.fill", title: "Thẻ nội địa / quốc tế")
                    paymentRow(icon: "wallet.pass.fill", title: "Ví điện tử")
                    paymentRow(icon: "building.columns.fill", title: "Chuyển khoản")
                    Button {
                        state.message = "Đơn hàng đã được tạo. Tích hợp cổng thanh toán sẽ xử lý bước thu tiền."
                    } label: {
                        Text("Xác nhận thanh toán")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(PrimaryButtonStyle())
                }
                .padding(16)
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .task { await state.loadOrder(orderId) }
        }
    }

    private func paymentRow(icon: String, title: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(TouristTheme.primary)
            Text(title)
                .font(.subheadline.weight(.semibold))
            Spacer()
            Image(systemName: "circle")
                .foregroundStyle(TouristTheme.border)
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
    }
}

private struct OrderSummary: View {
    let order: Order

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Mã đơn \(order.id)")
                .font(.headline)
            Text("Trạng thái: \(order.status)")
                .font(.subheadline)
                .foregroundStyle(TouristTheme.muted)
            ForEach(order.items ?? [], id: \.self) { item in
                HStack {
                    Text(item.serviceName ?? "Dịch vụ")
                    Spacer()
                    Text("x\(item.quantity)")
                }
                .font(.caption)
            }
            Divider()
            HStack {
                Text("Cần thanh toán")
                Spacer()
                Text(order.amount.vnd)
                    .foregroundStyle(TouristTheme.primary)
            }
            .font(.headline)
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
    }
}

struct VoucherDetailView: View {
    let voucher: Voucher

    var body: some View {
        NavigationStack {
            VStack(spacing: 18) {
                Text(voucher.serviceName ?? "Voucher S-Loco")
                    .font(.title2.bold())
                    .multilineTextAlignment(.center)
                    .foregroundStyle(TouristTheme.text)
                QRCodeView(value: voucher.qrToken ?? voucher.id)
                    .frame(width: 230, height: 230)
                    .padding(18)
                    .background(.white, in: RoundedRectangle(cornerRadius: 20))
                    .overlay(RoundedRectangle(cornerRadius: 20).stroke(TouristTheme.border))
                Text(voucher.vendorName ?? "Xuất trình mã này tại điểm sử dụng.")
                    .font(.subheadline)
                    .foregroundStyle(TouristTheme.muted)
                    .multilineTextAlignment(.center)
                Text(voucher.status.uppercased())
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(TouristTheme.primary, in: Capsule())
                Spacer()
            }
            .padding(20)
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("QR Voucher")
        }
    }
}

struct ReservationDetailView: View {
    let reservation: Reservation

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(reservation.serviceName ?? "Đặt chỗ")
                        .font(.title2.bold())
                    Text(reservationStatusLabel(reservation.status))
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(TouristTheme.primary, in: Capsule())
                }
                detailRow("Cửa hàng", reservation.vendorName ?? "Đối tác S-Loco")
                detailRow("Số người", "\(reservation.partySize)")
                detailRow("Thời gian", reservation.requestedTime)
                if let code = reservation.voucher?.iposVoucherCode, !code.isEmpty {
                    VStack(spacing: 8) {
                        Text(code)
                            .font(.system(size: 30, weight: .bold))
                            .foregroundStyle(TouristTheme.primary)
                        Text("Đưa mã này cho thu ngân để được giảm \(reservation.voucher?.discountPercent ?? "")% trên hóa đơn iPos.")
                            .font(.subheadline)
                            .foregroundStyle(TouristTheme.muted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(18)
                    .background(.white, in: RoundedRectangle(cornerRadius: 16))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
                } else {
                    Text("Nhà hàng sẽ liên hệ xác nhận trước khi phát hành mã ưu đãi.")
                        .font(.subheadline)
                        .foregroundStyle(TouristTheme.muted)
                        .padding(16)
                        .background(.white, in: RoundedRectangle(cornerRadius: 16))
                }
                Spacer()
            }
            .padding(20)
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("Đặt chỗ")
        }
    }

    private func detailRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title).foregroundStyle(TouristTheme.muted)
            Spacer()
            Text(value).fontWeight(.semibold)
        }
        .padding(14)
        .background(.white, in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
    }
}

private struct QRCodeView: View {
    let value: String
    private let context = CIContext()
    private let filter = CIFilter.qrCodeGenerator()

    var body: some View {
        if let image = makeImage() {
            Image(uiImage: image)
                .interpolation(.none)
                .resizable()
                .scaledToFit()
        } else {
            Image(systemName: "qrcode")
                .font(.system(size: 140))
                .foregroundStyle(TouristTheme.primary)
        }
    }

    private func makeImage() -> UIImage? {
        filter.message = Data(value.utf8)
        guard let output = filter.outputImage else { return nil }
        let scaled = output.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}

struct TouristTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(12)
            .background(.white, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(TouristTheme.border))
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 13)
            .background(configuration.isPressed ? TouristTheme.primary.opacity(0.82) : TouristTheme.primary, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(TouristTheme.primary)
            .padding(.horizontal, 16)
            .padding(.vertical, 13)
            .background(.white, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(TouristTheme.border))
            .opacity(configuration.isPressed ? 0.78 : 1)
    }
}
