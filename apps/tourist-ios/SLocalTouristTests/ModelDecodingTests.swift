import XCTest
@testable import SLocalTourist

final class ModelDecodingTests: XCTestCase {
    func testTouristCategoryOptionsUseApiSlugsForDisplayLabels() {
        XCTAssertEqual(TouristCategoryOption.apiValue(for: "Ẩm thực"), "am-thuc")
        XCTAssertEqual(TouristCategoryOption.apiValue(for: "Spa"), "spa-massage")
        XCTAssertEqual(TouristCategoryOption.apiValue(for: "Spa & Massage"), "spa-massage")
        XCTAssertEqual(TouristCategoryOption.apiValue(for: "Tất cả"), "")
        XCTAssertEqual(TouristCategoryOption.apiValue(for: ""), "")
        XCTAssertEqual(TouristCategoryOption.home.map(\.value), ["", "am-thuc", "luu-tru", "spa-massage", "xe-dien", "giai-tri", "mua-sam"])
    }

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
                  "createdAt": "2026-04-29T00:00:00.000Z",
                  "product_type": "ticket",
                  "artifact_type": "ticket"
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
        XCTAssertEqual(wire.voucher?.productType, "ticket")
        XCTAssertEqual(wire.voucher?.artifactType, "ticket")
        XCTAssertEqual(wire.voucher?.productLabel, "Vé")
        XCTAssertEqual(wire.service?.name, "Tour biển")
        XCTAssertEqual(wire.vendor?.name, "S-Loco Vendor")
        XCTAssertEqual(wire.orderItem?.quantity, 2)
        XCTAssertEqual(wire.orderItem?.totalPrice, 300000)
    }

    func testServiceCoreDecodesProductType() throws {
        let raw = """
        {
          "id": "service-1",
          "name": "Coupon hải sản",
          "originalPrice": "0.00",
          "fulfillmentType": "reservation",
          "productType": "coupon",
          "reservationDiscountPercent": "8.00"
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(ServiceCore.self, from: raw)

        XCTAssertEqual(decoded.productType, "coupon")
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
            groupType: "couple",
            stayLocationLabel: nil,
            stayLatitude: nil,
            stayLongitude: nil,
            preferNearStay: nil
        )

        let json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(request)) as? [String: Any]

        XCTAssertEqual(json?["days"] as? Int, 3)
        XCTAssertEqual(json?["budget"] as? Int, 3000000)
        XCTAssertEqual(json?["preferences"] as? [String], ["Ẩm thực", "Điểm tham quan"])
        XCTAssertEqual(json?["group_type"] as? String, "couple")
        XCTAssertNil(json?["group_size"])
        XCTAssertNil(json?["stay_location_label"])
        XCTAssertNil(json?["stay_latitude"])
        XCTAssertNil(json?["stay_longitude"])
        XCTAssertNil(json?["prefer_near_stay"])
    }

    func testItineraryRequestEncodesNearStayOptionsWhenProvided() throws {
        let request = ItineraryRequest(
            days: 2,
            budget: 2000000,
            preferences: ["Biển"],
            groupType: "family",
            stayLocationLabel: "FLC Sầm Sơn",
            stayLatitude: 19.742,
            stayLongitude: 105.901,
            preferNearStay: true
        )

        let json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(request)) as? [String: Any]

        XCTAssertEqual(json?["group_type"] as? String, "family")
        XCTAssertEqual(json?["stay_location_label"] as? String, "FLC Sầm Sơn")
        XCTAssertEqual(json?["stay_latitude"] as? Double, 19.742)
        XCTAssertEqual(json?["stay_longitude"] as? Double, 105.901)
        XCTAssertEqual(json?["prefer_near_stay"] as? Bool, true)
    }

    func testGeneratedItineraryDecodesDistanceFromStayKmOnActivities() throws {
        let raw = """
        {
          "title": "Test",
          "summary": "",
          "days": [
            {
              "day": 1,
              "title": "Ngày 1",
              "activities": [
                {
                  "time": "09:00",
                  "title": "Tour",
                  "description": "Desc",
                  "service_id": "svc-1",
                  "estimated_cost": 100000,
                  "distance_from_stay_km": 1.3
                }
              ]
            }
          ],
          "total_estimated_cost": 100000,
          "tips": []
        }
        """.data(using: .utf8)!

        let decoded = try JSONDecoder().decode(GeneratedItinerary.self, from: raw)
        XCTAssertEqual(decoded.days.first?.activities.first?.distanceFromStayKm, 1.3)
    }

    func testWeatherDecodesCurrentApiShape() throws {
        let raw = """
        {
          "success": true,
          "data": {
            "weather": {
              "temperature": 29,
              "apparent_temperature": 34,
              "condition": "Mưa nhẹ",
              "humidity": 78,
              "wind_speed": 18,
              "uv_index": 9.2,
              "rain_probability": 80,
              "travel_tip": "Có khả năng mưa cao",
              "beach": {
                "wave_height": 1.2,
                "sea_surface_temperature": 28.7,
                "safety_label": "Theo dõi thêm",
                "safety_tip": "Quan sát cờ cảnh báo"
              },
              "forecast": [
                {
                  "date": "2026-04-30",
                  "day": "Th 5, 30/04",
                  "high": 31,
                  "low": 27,
                  "condition": "Mưa nhẹ",
                  "rain_probability": 80,
                  "uv_index": 9.2
                }
              ]
            }
          }
        }
        """.data(using: .utf8)!

        let envelope = try JSONDecoder().decode(ApiEnvelope<WeatherEnvelope>.self, from: raw)
        let weather = try XCTUnwrap(envelope.data?.weather)

        XCTAssertEqual(weather.temperature, 29)
        XCTAssertEqual(weather.beach?.seaSurfaceTemperature, 28.7)
        XCTAssertEqual(weather.forecast?.first?.high, 31)
    }

    func testWeatherDecodesLegacyOpenMeteoShape() throws {
        let raw = """
        {
          "success": true,
          "data": {
            "latitude": 19.75,
            "longitude": 105.9,
            "timezone": "Asia/Ho_Chi_Minh",
            "daily": {
              "time": ["2026-04-30"],
              "temperature_2m_max": [31.2],
              "temperature_2m_min": [26.8],
              "precipitation_sum": [6.5],
              "weathercode": [61]
            }
          }
        }
        """.data(using: .utf8)!

        let envelope = try JSONDecoder().decode(ApiEnvelope<WeatherEnvelope>.self, from: raw)
        let weather = try XCTUnwrap(envelope.data?.weather)

        XCTAssertEqual(weather.temperature, 31)
        XCTAssertEqual(weather.condition, "Mưa nhẹ")
        XCTAssertEqual(weather.forecast?.first?.low, 27)
    }

    func testWeatherDecodesOpenMeteoCurrentAndDailyMetrics() throws {
        let raw = """
        {
          "current": {
            "time": "2026-04-30T08:00",
            "temperature_2m": 27.4,
            "relative_humidity_2m": 84,
            "apparent_temperature": 31.2,
            "weather_code": 3,
            "cloud_cover": 92,
            "wind_speed_10m": 11.5,
            "wind_gusts_10m": 21.4
          },
          "daily": {
            "time": ["2026-04-30"],
            "temperature_2m_max": [31.2],
            "temperature_2m_min": [26.8],
            "precipitation_sum": [6.5],
            "precipitation_probability_max": [70],
            "uv_index_max": [8.4],
            "weather_code": [61]
          }
        }
        """.data(using: .utf8)!

        let weather = try JSONDecoder().decode(WeatherEnvelope.self, from: raw).weather

        XCTAssertEqual(weather.humidity, 84)
        XCTAssertEqual(weather.windSpeed, 12)
        XCTAssertEqual(weather.uvIndex, 8.4)
        XCTAssertEqual(weather.rainProbability, 70)
        XCTAssertFalse(weather.lacksTravelMetrics)
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
