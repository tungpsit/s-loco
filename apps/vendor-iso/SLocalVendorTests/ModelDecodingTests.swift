import XCTest
@testable import SLocalVendor

final class ModelDecodingTests: XCTestCase {
    func testLoginDataDecodesCurrentTokenShape() throws {
        let raw = """
        {
          "user": {"id":"u1","email":"vendor@example.com","role":"vendor_owner"},
          "tokens": {"access_token":"access","refresh_token":"refresh"}
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(LoginData.self, from: raw)

        XCTAssertEqual(decoded.resolvedAccessToken, "access")
        XCTAssertEqual(decoded.resolvedRefreshToken, "refresh")
    }

    func testPaginatedResultUsesItemsBeforeLegacyData() throws {
        let raw = """
        {
          "items": [{"id":"v1","status":"paid"}],
          "data": [{"id":"v2","status":"redeemed"}]
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(PaginatedResult<Voucher>.self, from: raw)

        XCTAssertEqual(decoded.values.first?.id, "v1")
    }

    func testLoadingTasksExposeVietnameseMessagesForApiWork() {
        XCTAssertEqual(AppLoadingTask.login.message, "Đang đăng nhập...")
        XCTAssertEqual(AppLoadingTask.home.message, "Đang tải dữ liệu cửa hàng...")
        XCTAssertEqual(AppLoadingTask.orders.message, "Đang tải đơn hàng...")
        XCTAssertEqual(AppLoadingTask.redeemQr.message, "Đang xác thực voucher...")
        XCTAssertEqual(AppLoadingTask.completeVoucher.message, "Đang hoàn thành voucher...")
    }
}
