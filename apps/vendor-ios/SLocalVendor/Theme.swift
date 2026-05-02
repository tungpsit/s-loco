import SwiftUI

enum VendorTheme {
    static let primary = Color(red: 0.0, green: 0.37, blue: 0.59)
    static let primaryContainer = Color(red: 0.0, green: 0.47, blue: 0.71)
    static let surface = Color(red: 0.96, green: 0.97, blue: 0.98)
    static let text = Color(red: 0.09, green: 0.11, blue: 0.18)
    static let secondaryText = Color(red: 0.23, green: 0.27, blue: 0.38)
    static let success = Color(red: 0.18, green: 0.49, blue: 0.20)
    static let warning = Color(red: 0.90, green: 0.32, blue: 0.0)
}

func formatVnd(_ value: Int?) -> String {
    let formatter = NumberFormatter()
    formatter.locale = Locale(identifier: "vi_VN")
    formatter.numberStyle = .decimal
    return "\(formatter.string(from: NSNumber(value: value ?? 0)) ?? "0")₫"
}
