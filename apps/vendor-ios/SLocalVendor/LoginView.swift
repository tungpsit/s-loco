import SwiftUI
import UIKit

struct LoginView: View {
    @EnvironmentObject private var state: AppState
    @State private var email = ""
    @State private var password = ""
    @FocusState private var focusedField: LoginField?

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !password.isEmpty && !state.isLoading
    }

    var body: some View {
        GeometryReader { geometry in
            let backgroundHeight = geometry.size.height + geometry.safeAreaInsets.top + geometry.safeAreaInsets.bottom

            ZStack {
                Image(uiImage: LoginBackground.image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: geometry.size.width, height: backgroundHeight, alignment: .trailing)
                    .clipped()
                    .ignoresSafeArea()

                LinearGradient(
                    colors: [
                        .black.opacity(0.10),
                        .black.opacity(0.26),
                        .black.opacity(0.64),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(width: geometry.size.width, height: backgroundHeight)
                .ignoresSafeArea()

                VStack(alignment: .leading, spacing: 16) {
                    Spacer()

                    Text("Vendor Portal")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.92))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(.black.opacity(0.20), in: Capsule())

                    Text("S-Loco Vendor")
                        .font(.system(size: 40, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.78)
                    Text("Quản lý du lịch biển, đặt chỗ và voucher")
                        .font(.callout.weight(.medium))
                        .foregroundStyle(.white.opacity(0.86))

                    VStack(alignment: .leading, spacing: 16) {
                        Text("Đăng nhập")
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(VendorTheme.text)

                        LoginFieldRow(title: "Email", systemImage: "envelope", isFocused: focusedField == .email) {
                            TextField("vendor@samson.vn", text: $email)
                                .textContentType(.emailAddress)
                                .modifier(EmailFieldModifier())
                                .focused($focusedField, equals: .email)
                                .submitLabel(.next)
                                .onSubmit { focusedField = .password }
                        }

                        LoginFieldRow(title: "Mật khẩu", systemImage: "lock", isFocused: focusedField == .password) {
                            SecureField("Nhập mật khẩu", text: $password)
                                .textContentType(.password)
                                .focused($focusedField, equals: .password)
                                .submitLabel(.go)
                                .onSubmit { submitLogin() }
                        }

                        Button {
                            submitLogin()
                        } label: {
                            HStack(spacing: 10) {
                                if state.loadingTask == .login {
                                    ProgressView()
                                        .tint(.white)
                                }
                                Text(state.loadingTask == .login ? "Đang đăng nhập..." : "Đăng nhập")
                                    .font(.headline.weight(.semibold))
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                        }
                        .foregroundStyle(.white)
                        .background(canSubmit ? VendorTheme.primary : Color.gray.opacity(0.42), in: RoundedRectangle(cornerRadius: 14))
                        .disabled(!canSubmit)
                    }
                    .padding(20)
                    .frame(maxWidth: VendorLayout.formMaxWidth)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 22))
                    .shadow(color: .black.opacity(0.18), radius: 18, y: 10)

                    Spacer()
                        .frame(maxHeight: 72)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 28)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .ignoresSafeArea()
        }
        .ignoresSafeArea()
    }

    private func submitLogin() {
        guard canSubmit else { return }
        focusedField = nil
        Task { await state.login(email: email, password: password) }
    }
}

private enum LoginField {
    case email
    case password
}

private struct LoginFieldRow<Content: View>: View {
    let title: String
    let systemImage: String
    let isFocused: Bool
    @ViewBuilder let content: Content

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(isFocused ? VendorTheme.primary : VendorTheme.secondaryText)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(VendorTheme.secondaryText)
                content
                    .font(.body)
                    .foregroundStyle(VendorTheme.text)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .background(.white.opacity(0.94), in: RoundedRectangle(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(isFocused ? VendorTheme.primary.opacity(0.72) : Color.black.opacity(0.08), lineWidth: 1)
        }
    }
}

private struct EmailFieldModifier: ViewModifier {
    func body(content: Content) -> some View {
        #if os(iOS)
        content
            .keyboardType(.emailAddress)
            .textInputAutocapitalization(.never)
        #else
        content
        #endif
    }
}

private enum LoginBackground {
    static let image: UIImage = {
        guard let url = Bundle.main.url(forResource: "LoginBackground", withExtension: "png"),
              let image = UIImage(contentsOfFile: url.path) else {
            return UIImage()
        }
        return image
    }()
}
