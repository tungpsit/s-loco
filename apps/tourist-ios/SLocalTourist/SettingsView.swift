import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    profileCard
                    menuRow(icon: "ticket", title: "Vé của tôi", subtitle: "Voucher và QR đã mua") {
                        state.tab = .vouchers
                    }
                    menuRow(icon: "sparkles", title: "AI Planner", subtitle: "Gợi ý lịch trình theo ngân sách") {
                        state.tab = .ai
                    }
                    menuRow(icon: "questionmark.circle", title: "Hỗ trợ", subtitle: "Chat với S-Loco support") {}

                    if state.isAuthenticated {
                        Button(role: .destructive) {
                            state.logout()
                        } label: {
                            Label("Đăng xuất", systemImage: "rectangle.portrait.and.arrow.right")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding(16)
            }
            .background(TouristTheme.surface.ignoresSafeArea())
            .navigationTitle("Tài khoản")
        }
    }

    private var profileCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                Circle()
                    .fill(TouristTheme.primarySoft)
                    .frame(width: 58, height: 58)
                    .overlay(Image(systemName: "person.fill").font(.title2).foregroundStyle(TouristTheme.primary))
                VStack(alignment: .leading, spacing: 4) {
                    Text(state.user?.fullName ?? state.user?.phone ?? "Khách du lịch")
                        .font(.headline)
                        .foregroundStyle(TouristTheme.text)
                    Text(state.isAuthenticated ? "Đã đăng nhập" : "Đăng nhập để đồng bộ voucher")
                        .font(.caption)
                        .foregroundStyle(TouristTheme.muted)
                }
                Spacer()
            }

            if !state.isAuthenticated {
                Button {
                    state.route = .login(redirect: nil)
                } label: {
                    Text("Đăng nhập bằng OTP")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PrimaryButtonStyle())
            }
        }
        .padding(16)
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(TouristTheme.border))
    }

    private func menuRow(icon: String, title: String, subtitle: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .frame(width: 34, height: 34)
                    .foregroundStyle(TouristTheme.primary)
                    .background(TouristTheme.primarySoft, in: RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TouristTheme.text)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(TouristTheme.muted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.bold())
                    .foregroundStyle(TouristTheme.muted)
            }
            .padding(14)
            .background(.white, in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(TouristTheme.border))
        }
        .buttonStyle(.plain)
    }
}
