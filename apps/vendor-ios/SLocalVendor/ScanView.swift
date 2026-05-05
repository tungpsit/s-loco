import AVFoundation
import SwiftUI
#if os(iOS)
import UIKit
#endif

struct ScanView: View {
    @EnvironmentObject private var state: AppState
    @State private var token = ""
    @State private var scannerSessionId = UUID()
    @State private var isScannerPaused = false

    private var trimmedToken: String {
        token.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                VendorTheme.surface.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 18) {
                        scannerCard

                        if let preview = state.qrPreview {
                            resultCard(preview)
                        }

                        if let voucher = state.redeemedVoucher {
                            redeemedCard(voucher)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 18)
                    .vendorReadableContent(maxWidth: VendorLayout.formMaxWidth)
                }
            }
            .navigationTitle("Quét QR")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var scannerCard: some View {
        VStack(spacing: 16) {
            ZStack {
                QRScannerView(sessionId: scannerSessionId, isPaused: isScannerPaused) { value in
                    handleScannedCode(value)
                }
                .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
                .overlay(scannerOverlay)
                .overlay(alignment: .bottom) {
                    scannerStatusBar
                }
            }
            .aspectRatio(0.72, contentMode: .fit)
            .frame(maxHeight: 560)
            .background(scannerBackdrop)
            .clipShape(RoundedRectangle(cornerRadius: 32, style: .continuous))
            .shadow(color: Color.black.opacity(0.22), radius: 24, x: 0, y: 14)

            HStack(spacing: 12) {
                Button {
                    resumeScanning(clearToken: true)
                } label: {
                    Label("Quét mã khác", systemImage: "qrcode.viewfinder")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(VendorTheme.primary)

                Button {
                    isScannerPaused.toggle()
                } label: {
                    Label(isScannerPaused ? "Tiếp tục" : "Tạm dừng", systemImage: isScannerPaused ? "play.fill" : "pause.fill")
                        .labelStyle(.iconOnly)
                        .frame(width: 46, height: 36)
                }
                .buttonStyle(.bordered)
                .tint(VendorTheme.primary)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 34, style: .continuous)
                .fill(.white)
                .shadow(color: Color.black.opacity(0.08), radius: 18, x: 0, y: 10)
        )
    }

    private var scannerBackdrop: some View {
        LinearGradient(
            colors: [
                VendorTheme.primary.opacity(0.92),
                Color(red: 0.02, green: 0.12, blue: 0.18),
                Color.black,
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    private var scannerOverlay: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width * 0.72, proxy.size.height * 0.52)
            ZStack {
                LinearGradient(
                    colors: [Color.black.opacity(0.05), Color.black.opacity(0.54)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.white.opacity(0.18), lineWidth: 1)
                    .padding(1)

                VStack(spacing: 18) {
                    Text("Đưa mã QR vào khung")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 9)
                        .background(.black.opacity(0.32), in: Capsule())

                    ZStack {
                        RoundedRectangle(cornerRadius: 26, style: .continuous)
                            .fill(Color.black.opacity(0.18))
                            .overlay(
                                RoundedRectangle(cornerRadius: 26, style: .continuous)
                                    .strokeBorder(Color.white.opacity(0.22), style: StrokeStyle(lineWidth: 1, dash: [8, 8]))
                            )
                        ScannerCornerBrackets()
                            .stroke(Color.white, style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round))
                            .shadow(color: VendorTheme.primary.opacity(0.65), radius: 8)
                            .padding(5)
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(VendorTheme.primary.opacity(isScannerPaused ? 0.32 : 0.85), lineWidth: 2)
                            .padding(18)
                    }
                    .frame(width: side, height: side)

                    Text(isScannerPaused ? "Scanner đang tạm dừng" : "Camera tự lấy nét và phóng gần khi phát hiện QR")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.white.opacity(0.88))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    private var scannerStatusBar: some View {
        HStack(spacing: 10) {
            Image(systemName: isScannerPaused ? "pause.circle.fill" : "viewfinder.circle.fill")
                .foregroundStyle(isScannerPaused ? VendorTheme.warning : VendorTheme.success)
            Text(isScannerPaused ? "Nhấn Tiếp tục để quét" : "Đang quét tự động")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.black.opacity(0.42))
    }

    private func resultCard(_ preview: VoucherPreview) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Kết quả kiểm tra", systemImage: "checkmark.seal.fill")
                .font(.headline.weight(.bold))
                .foregroundStyle(VendorTheme.primary)
            VStack(spacing: 8) {
                LabeledContent("Mã", value: preview.code)
                LabeledContent("Loại", value: preview.productLabel)
                LabeledContent("Trạng thái", value: preview.status)
                LabeledContent("Có thể đổi", value: preview.canRedeem ? "Có" : "Không")
            }
            .font(.subheadline)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: Color.black.opacity(0.06), radius: 12, x: 0, y: 6)
    }

    private func redeemedCard(_ voucher: Voucher) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("Đã đổi voucher/vé", systemImage: "ticket.fill")
                .font(.headline.weight(.bold))
                .foregroundStyle(VendorTheme.success)
            VoucherRow(voucher: voucher)
            Button(voucher.isTicket ? "Vé đã hoàn tất" : "Hoàn thành dịch vụ") {
                Task { await state.completeRedeemedVoucher() }
            }
            .buttonStyle(.borderedProminent)
            .tint(VendorTheme.success)
            .disabled(state.isLoading || voucher.isTicket)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.white, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .shadow(color: Color.black.opacity(0.06), radius: 12, x: 0, y: 6)
    }

    private func handleScannedCode(_ value: String) {
        let scannedValue = value.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !scannedValue.isEmpty, scannedValue != trimmedToken else { return }
        token = scannedValue
        isScannerPaused = true
        Task { await state.redeemQr(scannedValue) }
    }

    private func resumeScanning(clearToken: Bool) {
        if clearToken {
            token = ""
        }
        isScannerPaused = false
        scannerSessionId = UUID()
    }
}

private struct ScannerCornerBrackets: Shape {
    func path(in rect: CGRect) -> Path {
        let length = min(rect.width, rect.height) * 0.22
        var path = Path()

        path.move(to: CGPoint(x: rect.minX, y: rect.minY + length))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.minX + length, y: rect.minY))

        path.move(to: CGPoint(x: rect.maxX - length, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + length))

        path.move(to: CGPoint(x: rect.maxX, y: rect.maxY - length))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.maxX - length, y: rect.maxY))

        path.move(to: CGPoint(x: rect.minX + length, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - length))

        return path
    }
}

#if os(iOS)
struct QRScannerView: UIViewControllerRepresentable {
    let sessionId: UUID
    let isPaused: Bool
    let onCode: (String) -> Void

    func makeUIViewController(context: Context) -> ScannerController {
        let controller = ScannerController()
        controller.onCode = onCode
        return controller
    }

    func updateUIViewController(_ uiViewController: ScannerController, context: Context) {
        uiViewController.onCode = onCode
        uiViewController.setPaused(isPaused)
        uiViewController.resetIfNeeded(sessionId: sessionId)
    }
}

final class ScannerController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCode: ((String) -> Void)?
    private let session = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "vn.sloco.vendor.qr-scanner", qos: .userInitiated)
    private let previewLayer: AVCaptureVideoPreviewLayer
    private var videoDevice: AVCaptureDevice?
    private var metadataOutput: AVCaptureMetadataOutput?
    private var lastSessionId: UUID?
    private var isConfigured = false
    private var hasDeliveredCode = false
    private var isPaused = false
    private var lastFocusUpdate = Date.distantPast

    init() {
        previewLayer = AVCaptureVideoPreviewLayer(session: session)
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        previewLayer = AVCaptureVideoPreviewLayer(session: session)
        super.init(coder: coder)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        configure()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        startSessionIfNeeded()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        stopSessionIfNeeded()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer.frame = view.bounds
        updateScanArea()
    }

    func setPaused(_ paused: Bool) {
        isPaused = paused
        if paused {
            stopSessionIfNeeded()
        } else {
            hasDeliveredCode = false
            startSessionIfNeeded()
        }
    }

    func resetIfNeeded(sessionId: UUID) {
        guard lastSessionId != sessionId else { return }
        lastSessionId = sessionId
        hasDeliveredCode = false
        resetCameraZoom()
        if !isPaused {
            startSessionIfNeeded()
        }
    }

    private func configure() {
        guard !isConfigured else { return }
        session.beginConfiguration()
        session.sessionPreset = .high

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) ?? AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device),
              session.canAddInput(input)
        else {
            session.commitConfiguration()
            return
        }

        session.addInput(input)
        videoDevice = device

        let output = AVCaptureMetadataOutput()
        guard session.canAddOutput(output) else {
            session.commitConfiguration()
            return
        }
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.qr]
        metadataOutput = output

        session.commitConfiguration()
        isConfigured = true
        updateScanArea()
    }

    private func updateScanArea() {
        guard let metadataOutput, view.bounds.width > 0, view.bounds.height > 0 else { return }
        let side = min(view.bounds.width * 0.72, view.bounds.height * 0.52)
        let scanRect = CGRect(
            x: (view.bounds.width - side) / 2,
            y: (view.bounds.height - side) / 2,
            width: side,
            height: side
        )
        metadataOutput.rectOfInterest = previewLayer.metadataOutputRectConverted(fromLayerRect: scanRect)
    }

    private func startSessionIfNeeded() {
        guard isConfigured, !isPaused else { return }
        sessionQueue.async { [session] in
            if !session.isRunning {
                session.startRunning()
            }
        }
    }

    private func stopSessionIfNeeded() {
        sessionQueue.async { [session] in
            if session.isRunning {
                session.stopRunning()
            }
        }
    }

    private func resetCameraZoom() {
        guard let videoDevice else { return }
        sessionQueue.async {
            do {
                try videoDevice.lockForConfiguration()
                videoDevice.videoZoomFactor = 1.0
                videoDevice.unlockForConfiguration()
            } catch {
                videoDevice.unlockForConfiguration()
            }
        }
    }

    private func focusAndZoom(toward object: AVMetadataMachineReadableCodeObject) {
        guard Date().timeIntervalSince(lastFocusUpdate) > 0.35,
              let transformedObject = previewLayer.transformedMetadataObject(for: object) as? AVMetadataMachineReadableCodeObject,
              transformedObject.bounds.isFinite,
              let videoDevice
        else { return }

        lastFocusUpdate = Date()
        let focusPoint = previewLayer.captureDevicePointConverted(fromLayerPoint: CGPoint(x: transformedObject.bounds.midX, y: transformedObject.bounds.midY))
        let qrWidthRatio = max(0.08, min(1.0, transformedObject.bounds.width / max(view.bounds.width, 1)))
        let desiredZoom = min(videoDevice.activeFormat.videoMaxZoomFactor, max(1.4, min(2.4, 0.34 / qrWidthRatio)))

        sessionQueue.async {
            do {
                try videoDevice.lockForConfiguration()
                if videoDevice.isFocusPointOfInterestSupported {
                    videoDevice.focusPointOfInterest = focusPoint
                    videoDevice.focusMode = .continuousAutoFocus
                }
                if videoDevice.isExposurePointOfInterestSupported {
                    videoDevice.exposurePointOfInterest = focusPoint
                    videoDevice.exposureMode = .continuousAutoExposure
                }
                if abs(videoDevice.videoZoomFactor - desiredZoom) > 0.08 {
                    videoDevice.ramp(toVideoZoomFactor: desiredZoom, withRate: 5.0)
                }
                videoDevice.unlockForConfiguration()
            } catch {
                videoDevice.unlockForConfiguration()
            }
        }
    }

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard !isPaused,
              !hasDeliveredCode,
              let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let value = object.stringValue?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty
        else { return }

        focusAndZoom(toward: object)
        hasDeliveredCode = true
        isPaused = true
        stopSessionIfNeeded()
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        onCode?(value)
    }
}

private extension CGRect {
    var isFinite: Bool {
        origin.x.isFinite && origin.y.isFinite && size.width.isFinite && size.height.isFinite
    }
}
#else
struct QRScannerView: View {
    let sessionId: UUID
    let isPaused: Bool
    let onCode: (String) -> Void

    var body: some View {
        Text("QR camera chỉ chạy trên iOS.")
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.black)
            .foregroundStyle(.white)
    }
}
#endif
