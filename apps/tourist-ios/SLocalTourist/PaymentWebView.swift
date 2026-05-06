import SwiftUI
import WebKit

struct PaymentWebView: UIViewRepresentable {
    let url: URL
    let onResult: (PaymentWebViewResult) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onResult: onResult)
    }

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.navigationDelegate = context.coordinator
        webView.load(URLRequest(url: url))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        let onResult: (PaymentWebViewResult) -> Void

        init(onResult: @escaping (PaymentWebViewResult) -> Void) {
            self.onResult = onResult
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url,
                  let result = PaymentWebViewResult(url: url) else {
                decisionHandler(.allow)
                return
            }
            onResult(result)
            decisionHandler(.cancel)
        }
    }
}

enum PaymentWebViewResult: String {
    case success
    case error
    case cancel

    init?(url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let value = components.queryItems?.first(where: { $0.name == "payment" })?.value else {
            return nil
        }
        self.init(rawValue: value)
    }

    var message: String {
        switch self {
        case .success: "SePay đã trả về thành công. S-Loco đang xác nhận giao dịch."
        case .error: "Thanh toán SePay thất bại. Vui lòng thử lại."
        case .cancel: "Bạn đã hủy thanh toán SePay."
        }
    }
}
