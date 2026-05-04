import AVFoundation
import SwiftUI
#if os(iOS)
import UIKit
#endif

struct ScanView: View {
    @EnvironmentObject private var state: AppState
    @State private var token = ""
    @State private var scannerPresented = false

    var body: some View {
        NavigationStack {
            Form {
                Section("QR token") {
                    TextField("eyJhbGciOiJI...", text: $token, axis: .vertical)
                        .modifier(TokenFieldModifier())
                        .lineLimit(3...6)
                    Button("Xác thực và đổi voucher/vé") {
                        Task { await state.redeemQr(token) }
                    }
                    .disabled(token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || state.isLoading)
                    Button("Mở camera quét QR") {
                        scannerPresented = true
                    }
                }

                if let preview = state.qrPreview {
                    Section("Kết quả kiểm tra") {
                        LabeledContent("Mã", value: preview.code)
                        LabeledContent("Loại", value: preview.productLabel)
                        LabeledContent("Trạng thái", value: preview.status)
                        LabeledContent("Có thể đổi", value: preview.canRedeem ? "Có" : "Không")
                    }
                }

                if let voucher = state.redeemedVoucher {
                    Section("Đã đổi voucher/vé") {
                        VoucherRow(voucher: voucher)
                        Button(voucher.isTicket ? "Vé đã hoàn tất" : "Hoàn thành dịch vụ") {
                            Task { await state.completeRedeemedVoucher() }
                        }
                        .disabled(state.isLoading || voucher.isTicket)
                    }
                }
            }
            .navigationTitle("Quét QR")
            .sheet(isPresented: $scannerPresented) {
                QRScannerView { value in
                    token = value
                    scannerPresented = false
                    Task { await state.redeemQr(value) }
                }
                .ignoresSafeArea()
            }
        }
    }
}

private struct TokenFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        #if os(iOS)
        content.textInputAutocapitalization(.never)
        #else
        content
        #endif
    }
}

#if os(iOS)
struct QRScannerView: UIViewControllerRepresentable {
    let onCode: (String) -> Void

    func makeUIViewController(context: Context) -> ScannerController {
        let controller = ScannerController()
        controller.onCode = onCode
        return controller
    }

    func updateUIViewController(_ uiViewController: ScannerController, context: Context) {}
}

final class ScannerController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCode: ((String) -> Void)?
    private let session = AVCaptureSession()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        configure()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        if !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async { self.session.startRunning() }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if session.isRunning {
            session.stopRunning()
        }
    }

    private func configure() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input)
        else { return }

        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else { return }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.qr]

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = view.bounds
        view.layer.addSublayer(preview)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        view.layer.sublayers?.first?.frame = view.bounds
    }

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let value = object.stringValue
        else { return }
        session.stopRunning()
        onCode?(value)
    }
}
#else
struct QRScannerView: View {
    let onCode: (String) -> Void

    var body: some View {
        Text("QR camera chỉ chạy trên iOS.")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
            .foregroundStyle(.white)
    }
}
#endif
