import XCTest
@testable import SLocalVendor

final class ModelDecodingTests: XCTestCase {
    func testLoginDataDecodesCurrentTokenShape() throws {
        let raw = """
        {
          "user": {"id":"u1","email":"vendor@example.com","role":"vendor_owner"},
          "tokens": {"access_token":"access","refresh_token":"refresh","expires_in":900}
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(LoginData.self, from: raw)

        XCTAssertEqual(decoded.resolvedAccessToken, "access")
        XCTAssertEqual(decoded.resolvedRefreshToken, "refresh")
        XCTAssertEqual(decoded.resolvedExpiresIn, 900)
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

    func testDashboardDecodesNumericStringsFromApi() throws {
        let raw = """
        {
          "success": true,
          "data": {
            "today": {"orders": 2, "revenue": "1250000.00", "vouchers": 1},
            "total": {"revenue": "5000000.00", "orders": 8, "activeVouchers": 3},
            "settlement": {"totalSettled": "3000000.00", "pendingSettlement": "750000.00"}
          }
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(ApiEnvelope<Dashboard>.self, from: raw)

        XCTAssertEqual(decoded.data?.today.orders, 2)
        XCTAssertEqual(decoded.data?.today.revenue, 1_250_000)
        XCTAssertEqual(decoded.data?.total.revenue, 5_000_000)
        XCTAssertEqual(decoded.data?.settlement.settled, 3_000_000)
        XCTAssertEqual(decoded.data?.settlement.pending, 750_000)
        XCTAssertEqual(decoded.data?.recentOrders.count, 0)
    }

    func testReservationDisplayInfoFallsBackToJoinedCustomer() throws {
        let raw = """
        {
          "reservation": {
            "id": "r1",
            "status": "requested",
            "customer_name": null,
            "customer_phone": null,
            "party_size": 4,
            "requested_time": "2026-05-01T12:00:00.000Z",
            "customer_note": "Bàn gần cửa sổ"
          },
          "service": {"name": "Đặt bàn hải sản"},
          "customer": {"full_name": "Trần Minh Anh", "phone": "0900000003"},
          "voucher": null
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(ReservationWire.self, from: raw)

        XCTAssertEqual(decoded.customerDisplayName, "Trần Minh Anh")
        XCTAssertEqual(decoded.customerPhoneNumber, "0900000003")
        XCTAssertTrue(decoded.canConfirm)
        XCTAssertTrue(decoded.needsVendorAttention)
        XCTAssertEqual(decoded.statusTone, .attention)
    }

    func testLoadingTasksExposeVietnameseMessagesForApiWork() {
        XCTAssertEqual(AppLoadingTask.login.message, "Đang đăng nhập...")
        XCTAssertEqual(AppLoadingTask.home.message, "Đang tải dữ liệu cửa hàng...")
        XCTAssertEqual(AppLoadingTask.orders.message, "Đang tải đơn hàng...")
        XCTAssertEqual(AppLoadingTask.redeemQr.message, "Đang xác thực voucher...")
        XCTAssertEqual(AppLoadingTask.completeVoucher.message, "Đang hoàn thành voucher...")
    }
}
