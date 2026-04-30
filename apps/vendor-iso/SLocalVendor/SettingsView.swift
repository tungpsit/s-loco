import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var state: AppState
    @State private var iposStoreId = ""

    var body: some View {
        NavigationStack {
            List {
                Section("Cửa hàng") {
                    LabeledContent("Tên", value: state.vendor?.name ?? "Chưa tải")
                    LabeledContent("Email", value: state.user?.email ?? state.vendor?.email ?? "Không có")
                    LabeledContent("API", value: "http://localhost:3000/api/v1")
                }
                Section("iPos") {
                    TextField("Mã cửa hàng trên iPos", text: $iposStoreId)
                    Text("Backend dùng IPOS_BASE_URL, IPOS_API_KEY và IPOS_WEBHOOK_SECRET để kết nối iPos.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Button("Lưu iPos store ID") {
                        Task { await state.updateIposStoreId(iposStoreId) }
                    }
                    .disabled(state.isLoading || state.vendor == nil)
                }
                Section {
                    Button("Đăng xuất", role: .destructive) {
                        state.logout()
                    }
                }
            }
            .navigationTitle("Cài đặt")
            .task(id: state.vendor?.id) {
                iposStoreId = state.vendor?.metadata?.iposStoreId ?? ""
            }
        }
    }
}
