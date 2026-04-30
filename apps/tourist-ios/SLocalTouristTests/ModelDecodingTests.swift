import XCTest
@testable import SLocalTourist

final class ModelDecodingTests: XCTestCase {
    func testLoginDataDecodesCurrentTokenShape() throws {
        let raw = """
        {
          "user": {"id":"u1","phone":"0900000000","role":"customer"},
          "tokens": {"access_token":"access","refresh_token":"refresh"}
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(LoginData.self, from: raw)

        XCTAssertEqual(decoded.resolvedAccessToken, "access")
        XCTAssertEqual(decoded.resolvedRefreshToken, "refresh")
    }

    func testPaginatedUsesItemsBeforeLegacyData() throws {
        let raw = """
        {
          "items": [{"id":"v1","status":"paid"}],
          "data": [{"id":"v2","status":"redeemed"}]
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(Paginated<Voucher>.self, from: raw)

        XCTAssertEqual(decoded.values.first?.id, "v1")
    }

    func testVoucherListDecodesCurrentApiShape() throws {
        let raw = """
        {
          "success": true,
          "data": {
            "items": [
              {
                "voucher": {
                  "id": "voucher-1",
                  "status": "paid",
                  "qrToken": "qr-token",
                  "createdAt": "2026-04-29T00:00:00.000Z"
                },
                "service": {
                  "id": "service-1",
                  "name": "Tour biển",
                  "images": []
                },
                "vendor": {
                  "name": "S-Loco Vendor"
                },
                "orderItem": {
                  "quantity": 2,
                  "totalPrice": "300000"
                }
              }
            ],
            "total": 1,
            "page": 1,
            "limit": 50
          }
        }
        """.data(using: .utf8)!

        let envelope = try JSONDecoder().decode(ApiEnvelope<Paginated<VoucherWire>>.self, from: raw)
        let wire = try XCTUnwrap(envelope.data?.values.first)

        XCTAssertEqual(wire.voucher?.id, "voucher-1")
        XCTAssertEqual(wire.voucher?.qrToken, "qr-token")
        XCTAssertEqual(wire.service?.name, "Tour biển")
        XCTAssertEqual(wire.vendor?.name, "S-Loco Vendor")
        XCTAssertEqual(wire.orderItem?.quantity, 2)
        XCTAssertEqual(wire.orderItem?.totalPrice, 300000)
    }

    func testLoadingTasksExposeVietnameseMessagesForApiWork() {
        XCTAssertEqual(AppLoadingTask.login.message, "Đang đăng nhập...")
        XCTAssertEqual(AppLoadingTask.home.message, "Đang tải dữ liệu...")
        XCTAssertEqual(AppLoadingTask.checkout.message, "Đang xử lý đơn hàng...")
        XCTAssertEqual(AppLoadingTask.vouchers.message, "Đang tải voucher...")
        XCTAssertEqual(AppLoadingTask.ai.message, "Đang tạo lịch trình...")
    }

    func testOtpResendCooldownUsesSixtySecondsAndShowsCountdown() {
        XCTAssertEqual(OtpResendCooldown.seconds, 60)
        XCTAssertEqual(OtpResendCooldown.title(remainingSeconds: 60), "Gửi lại sau 60s")
        XCTAssertEqual(OtpResendCooldown.title(remainingSeconds: 1), "Gửi lại sau 1s")
        XCTAssertEqual(OtpResendCooldown.title(remainingSeconds: 0), "Gửi lại OTP")
    }

    func testItineraryRequestEncodesGenerateEndpointShape() throws {
        let request = ItineraryRequest(
            days: 3,
            budget: 3000000,
            preferences: ["Ẩm thực", "Điểm tham quan"],
            groupType: "couple"
        )

        let json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(request)) as? [String: Any]

        XCTAssertEqual(json?["days"] as? Int, 3)
        XCTAssertEqual(json?["budget"] as? Int, 3000000)
        XCTAssertEqual(json?["preferences"] as? [String], ["Ẩm thực", "Điểm tham quan"])
        XCTAssertEqual(json?["group_type"] as? String, "couple")
        XCTAssertNil(json?["group_size"])
    }

    func testGeneratedItineraryDecodesAndFormatsForDisplay() throws {
        let raw = """
        {
          "title": "Lịch trình 1 ngày",
          "summary": "Khám phá Sầm Sơn",
          "days": [
            {
              "day": 1,
              "title": "Biển và ẩm thực",
              "activities": [
                {
                  "time": "08:00",
                  "title": "Tắm biển",
                  "description": "Bắt đầu ngày mới tại bãi biển.",
                  "estimated_cost": 100000
                }
              ]
            }
          ],
          "total_estimated_cost": 100000,
          "tips": ["Mang kem chống nắng"]
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(GeneratedItinerary.self, from: raw)

        XCTAssertTrue(decoded.description.contains("Lịch trình 1 ngày"))
        XCTAssertTrue(decoded.description.contains("08:00 - Tắm biển - 100.000₫"))
        XCTAssertTrue(decoded.description.contains("- Mang kem chống nắng"))
    }
}
