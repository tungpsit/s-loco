import Foundation
import Security

final class TokenStore {
    private let service = "vn.sloco.vendor"

    var accessToken: String? {
        get { read("access_token") }
        set { write(newValue, key: "access_token") }
    }

    var refreshToken: String? {
        get { read("refresh_token") }
        set { write(newValue, key: "refresh_token") }
    }

    var accessTokenExpiresAt: Date? {
        get {
            guard let raw = read("access_token_expires_at"),
                  let timestamp = TimeInterval(raw)
            else { return nil }
            return Date(timeIntervalSince1970: timestamp)
        }
        set {
            write(newValue.map { String($0.timeIntervalSince1970) }, key: "access_token_expires_at")
        }
    }

    func clear() {
        write(nil, key: "access_token")
        write(nil, key: "refresh_token")
        write(nil, key: "access_token_expires_at")
    }

    private func read(_ key: String) -> String? {
        var query = baseQuery(key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func write(_ value: String?, key: String) {
        let query = baseQuery(key)
        SecItemDelete(query as CFDictionary)
        guard let value, let data = value.data(using: .utf8) else { return }

        var item = query
        item[kSecValueData as String] = data
        SecItemAdd(item as CFDictionary, nil)
    }

    private func baseQuery(_ key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }
}
