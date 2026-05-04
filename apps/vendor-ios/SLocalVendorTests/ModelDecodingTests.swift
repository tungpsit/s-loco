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

    func testVendorServiceDecodesDrizzleCamelCaseShape() throws {
        let raw = """
        {
          "id": "s1",
          "name": "Buffet hải sản",
          "categoryId": "c1",
          "originalPrice": "350000.00",
          "discountPrice": "299000.00",
          "productType": "coupon",
          "fulfillmentType": "reservation",
          "reservationDiscountPercent": "10.00",
          "applicabilityPolicy": {"weekdays": [1,2,3,4,5], "exclude_public_holidays": true, "blackout_dates": ["2026-01-01"], "conditions": "Không áp dụng ngày lễ."},
          "durationMinutes": 90,
          "maxQuantityPerOrder": 6,
          "isActive": true,
          "images": ["https://example.com/a.jpg"]
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(VendorService.self, from: raw)

        XCTAssertEqual(decoded.categoryId, "c1")
        XCTAssertEqual(decoded.originalPrice, 350_000)
        XCTAssertEqual(decoded.discountPrice, 299_000)
        XCTAssertEqual(decoded.productType, productTypeCoupon)
        XCTAssertEqual(decoded.productLabel, "Coupon")
        XCTAssertEqual(decoded.fulfillmentType, ServiceType.reservation)
        XCTAssertEqual(decoded.reservationDiscountPercent, "10.00")
        XCTAssertEqual(decoded.applicabilityPolicy?.weekdays, [1, 2, 3, 4, 5])
        XCTAssertEqual(decoded.applicabilityPolicy?.excludePublicHolidays, true)
        XCTAssertEqual(decoded.durationMinutes, 90)
        XCTAssertEqual(decoded.maxQuantityPerOrder, 6)
        XCTAssertTrue(decoded.isActive)
    }

    func testCreateServiceRequestEncodesApiShape() throws {
        let encoded = try JSONEncoder().encode(CreateServiceRequest(
            name: "Buffet hải sản",
            slug: "buffet-hai-san",
            categoryId: "c1",
            description: nil,
            originalPrice: "350000",
            discountPrice: "299000",
            productType: productTypeVoucher,
            fulfillmentType: ServiceType.fixedPrice,
            reservationDiscountPercent: nil,
            applicabilityPolicy: ApplicabilityPolicy(
                weekdays: [1, 2, 3, 4, 5],
                excludePublicHolidays: true,
                blackoutDates: ["2026-01-01"],
                conditions: "Không áp dụng ngày lễ."
            ),
            durationMinutes: 90,
            maxQuantityPerOrder: 6,
            images: ["https://example.com/a.jpg"]
        ))
        let object = try JSONSerialization.jsonObject(with: encoded) as? [String: Any]

        XCTAssertEqual(object?["category_id"] as? String, "c1")
        XCTAssertEqual(object?["original_price"] as? String, "350000")
        XCTAssertEqual(object?["discount_price"] as? String, "299000")
        XCTAssertEqual(object?["product_type"] as? String, "voucher")
        XCTAssertEqual(object?["fulfillment_type"] as? String, "fixed_price")
        let policy = object?["applicability_policy"] as? [String: Any]
        XCTAssertEqual(policy?["weekdays"] as? [Int], [1, 2, 3, 4, 5])
        XCTAssertEqual(policy?["exclude_public_holidays"] as? Bool, true)
        XCTAssertEqual(policy?["blackout_dates"] as? [String], ["2026-01-01"])
        XCTAssertEqual(policy?["conditions"] as? String, "Không áp dụng ngày lễ.")
        XCTAssertEqual(object?["duration_minutes"] as? Int, 90)
        XCTAssertEqual(object?["max_quantity_per_order"] as? Int, 6)
    }

    func testCreateReservationServiceRequestEncodesApiShape() throws {
        let encoded = try JSONEncoder().encode(CreateServiceRequest(
            name: "Đặt bàn hải sản",
            slug: "dat-ban-hai-san",
            categoryId: "c1",
            description: nil,
            originalPrice: "0",
            discountPrice: nil,
            productType: productTypeCoupon,
            fulfillmentType: ServiceType.reservation,
            reservationDiscountPercent: "10",
            applicabilityPolicy: nil,
            durationMinutes: nil,
            maxQuantityPerOrder: nil,
            images: nil
        ))
        let object = try JSONSerialization.jsonObject(with: encoded) as? [String: Any]

        XCTAssertEqual(object?["category_id"] as? String, "c1")
        XCTAssertEqual(object?["original_price"] as? String, "0")
        XCTAssertEqual(object?["product_type"] as? String, "coupon")
        XCTAssertEqual(object?["fulfillment_type"] as? String, "reservation")
        XCTAssertEqual(object?["reservation_discount_percent"] as? String, "10")
        XCTAssertNil(object?["discount_price"])
    }

    func testVoucherAndSettlementDecodeProductTaxonomy() throws {
        let voucherRaw = """
        {
          "id": "v1",
          "status": "completed",
          "final_amount": "120000.00",
          "service_name": "Vé show biển",
          "customer_name": "Mai Anh",
          "product_type": "ticket",
          "artifact_type": "ticket"
        }
        """.data(using: .utf8)!
        let settlementRaw = """
        {
          "id": "st1",
          "status": "pending",
          "net_amount": "90000.00",
          "voucher_count": 1,
          "direction": "vendor_pays_sloco"
        }
        """.data(using: .utf8)!

        let voucher = try JSONDecoder().decode(Voucher.self, from: voucherRaw)
        let settlement = try JSONDecoder().decode(Settlement.self, from: settlementRaw)

        XCTAssertEqual(voucher.productLabel, "Vé")
        XCTAssertTrue(voucher.isTicket)
        XCTAssertEqual(settlement.netAmount, 90_000)
        XCTAssertEqual(settlement.directionLabel, "Vendor trả S-Loco")
    }

    func testUpdateVendorSettingsRequestEncodesLocationFields() throws {
        let encoded = try JSONEncoder().encode(UpdateVendorSettingsRequest(
            address: "123 Hồ Xuân Hương",
            latitude: "19.7450000",
            longitude: "105.9010000"
        ))
        let object = try JSONSerialization.jsonObject(with: encoded) as? [String: Any]

        XCTAssertEqual(object?["address"] as? String, "123 Hồ Xuân Hương")
        XCTAssertEqual(object?["latitude"] as? String, "19.7450000")
        XCTAssertEqual(object?["longitude"] as? String, "105.9010000")
    }

    func testLoadingTasksExposeVietnameseMessagesForApiWork() {
        XCTAssertEqual(AppLoadingTask.login.message, "Đang đăng nhập...")
        XCTAssertEqual(AppLoadingTask.home.message, "Đang tải dữ liệu cửa hàng...")
        XCTAssertEqual(AppLoadingTask.orders.message, "Đang tải đơn hàng...")
        XCTAssertEqual(AppLoadingTask.services.message, "Đang tải dịch vụ...")
        XCTAssertEqual(AppLoadingTask.redeemQr.message, "Đang xác thực voucher...")
        XCTAssertEqual(AppLoadingTask.completeVoucher.message, "Đang hoàn thành voucher...")
    }
}
