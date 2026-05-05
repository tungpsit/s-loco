import SwiftUI

enum TouristTheme {
    static let primary = Color(red: 0.0, green: 0.427, blue: 0.8)
    static let primary2 = Color(red: 0.043, green: 0.561, blue: 0.937)
    static let primarySoft = Color(red: 0.878, green: 0.949, blue: 0.996)
    static let surface = Color(red: 0.961, green: 0.98, blue: 1.0)
    static let border = Color(red: 0.851, green: 0.906, blue: 0.949)
    static let text = Color(red: 0.063, green: 0.125, blue: 0.2)
    static let muted = Color(red: 0.365, green: 0.42, blue: 0.478)
    static let coral = Color(red: 1.0, green: 0.42, blue: 0.208)
}

enum TouristLayout {
    static let contentMaxWidth: CGFloat = 980
    static let formMaxWidth: CGFloat = 520
    static let detailMaxWidth: CGFloat = 860
    static let cardGridColumns = [GridItem(.adaptive(minimum: 160), spacing: 12)]
}

extension View {
    func touristReadableContent(maxWidth: CGFloat = TouristLayout.contentMaxWidth, alignment: Alignment = .center) -> some View {
        frame(maxWidth: maxWidth, alignment: alignment)
            .frame(maxWidth: .infinity, alignment: alignment)
    }
}

extension Int {
    var vnd: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.groupingSeparator = "."
        return "\(formatter.string(from: NSNumber(value: self)) ?? "\(self)")₫"
    }
}
