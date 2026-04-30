import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var state: AppState
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                Spacer()
                Text("S-Loco Vendor")
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(VendorTheme.primary)
                Text("Quản lý cửa hàng của bạn")
                    .foregroundStyle(VendorTheme.secondaryText)

                VStack(spacing: 12) {
                    TextField("vendor@samson.vn", text: $email)
                        .textContentType(.emailAddress)
                        .modifier(EmailFieldModifier())
                        .textFieldStyle(.roundedBorder)
                    SecureField("Mật khẩu", text: $password)
                        .textContentType(.password)
                        .textFieldStyle(.roundedBorder)
                    Button {
                        Task { await state.login(email: email, password: password) }
                    } label: {
                        Text(state.loadingTask == .login ? "Đang đăng nhập..." : "Đăng nhập")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(email.isEmpty || password.isEmpty || state.isLoading)
                }
                .padding(18)
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16))

                Spacer()
            }
            .padding(20)
            .background(VendorTheme.surface)
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
