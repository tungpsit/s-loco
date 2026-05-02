import SwiftUI

@main
struct SLocalVendorApp: App {
    @UIApplicationDelegateAdaptor(PushNotificationAppDelegate.self) private var appDelegate
    @StateObject private var state = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(state)
                .task {
                    await state.bootstrap()
                }
        }
    }
}
