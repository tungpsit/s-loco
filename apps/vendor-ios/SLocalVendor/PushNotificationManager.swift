import FirebaseCore
import FirebaseMessaging
import UIKit
import UserNotifications

final class PushNotificationAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        PushNotificationManager.shared.configure()
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Messaging.messaging().apnsToken = deviceToken
    }
}

@MainActor
final class PushNotificationManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PushNotificationManager()

    private var didConfigure = false

    func configure() {
        guard !didConfigure else { return }
        didConfigure = true
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        UNUserNotificationCenter.current().delegate = self
    }

    func requestAuthorizationAndToken() async -> String? {
        configure()
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
            guard granted else { return nil }
            UIApplication.shared.registerForRemoteNotifications()
            return try await Messaging.messaging().token()
        } catch {
            return nil
        }
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .badge]
    }
}
