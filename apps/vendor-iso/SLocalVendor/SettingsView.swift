import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var state: AppState

    var body: some View {
        NavigationStack {
            List {
                Section("Cửa hàng") {
                    LabeledContent("Tên", value: state.vendor?.name ?? "Chưa tải")
                    LabeledContent("Email", value: state.user?.email ?? state.vendor?.email ?? "Không có")
                    LabeledContent("API", value: "http://localhost:3000/api/v1")
                }
                Section {
                    Button("Đăng xuất", role: .destructive) {
                        state.logout()
                    }
                }
            }
            .navigationTitle("Cài đặt")
        }
    }
}
