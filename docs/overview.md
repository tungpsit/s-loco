# TÀI LIỆU TỔNG QUAN DỰ ÁN

## S-Loco – Siêu ứng dụng du lịch bản địa tại Sầm Sơn

## 1. Giới thiệu dự án

**S-Loco** là nền tảng công nghệ tích hợp dưới dạng **native mobile app và web admin**, được xây dựng với mục tiêu **số hóa hệ sinh thái dịch vụ du lịch tại Sầm Sơn**. Dự án kết nối khách du lịch với các nhà cung cấp dịch vụ địa phương như nhà hàng, khách sạn, xe điện, quán cà phê, địa điểm giải trí, spa, cửa hàng lưu niệm, đơn vị bán vé và các hoạt động trải nghiệm biển.

S-Loco không chỉ là một ứng dụng tìm kiếm hoặc đặt dịch vụ. Nền tảng được định vị như một **“siêu ứng dụng du lịch bản địa”**: nơi khách du lịch có thể khám phá dịch vụ, nhận ưu đãi, mua voucher/vé, thanh toán, sử dụng mã QR và được gợi ý lịch trình phù hợp với nhu cầu cá nhân.

Ở góc độ vận hành, S-Loco đóng vai trò là **lớp thương mại và đối soát** giữa khách du lịch và vendor. Tùy từng loại sản phẩm, dòng tiền có thể đi về vendor trước hoặc về S-Loco trước, sau đó được đối soát theo kỳ để đảm bảo minh bạch cho cả hai bên.

---

## 2. Bối cảnh và bài toán thị trường

Thị trường du lịch địa phương tại Sầm Sơn vẫn tồn tại nhiều bất cập:

* Thông tin dịch vụ phân tán, thiếu đồng bộ và khó kiểm chứng
* Khách du lịch khó tiếp cận các nhà cung cấp uy tín
* Tình trạng giá cả thiếu minh bạch, chặt chém hoặc chất lượng không đồng đều
* Nhiều nhà cung cấp địa phương chưa có công cụ số để bán hàng và quản lý đơn hàng
* Khách hàng chưa có một nền tảng thống nhất để đặt nhiều dịch vụ trong cùng một hành trình
* Mỗi nhóm dịch vụ có mức độ chắc chắn về giá khác nhau, nên không thể dùng một luồng giao dịch duy nhất cho mọi sản phẩm

Ví dụ, một bữa ăn tại nhà hàng thường chưa biết tổng bill trước khi khách dùng dịch vụ; trong khi một vé cano, vé khu vui chơi hoặc gói trải nghiệm lại có giá cố định và có thể bán trước. Vì vậy, S-Loco cần mô hình sản phẩm đủ linh hoạt để xử lý cả **ưu đãi theo bill thực tế**, **voucher trả trước** và **vé dịch vụ cố định**.

S-Loco ra đời để giải quyết các vấn đề trên bằng cách tạo ra một hệ sinh thái số minh bạch, có kiểm duyệt, có thanh toán, có đối soát và có khả năng mở rộng sang nhiều địa phương du lịch khác.

---

## 3. Tầm nhìn, sứ mệnh và định vị

### 3.1. Tầm nhìn

Trở thành **nền tảng du lịch bản địa số 1 tại Sầm Sơn**, sau đó mở rộng mô hình sang các địa phương du lịch khác có hệ sinh thái dịch vụ tương tự.

### 3.2. Sứ mệnh

Mang đến cho khách du lịch một trải nghiệm **thuận tiện – minh bạch – đáng tin cậy**, đồng thời giúp các vendor địa phương gia tăng doanh thu nhờ chuyển đổi số, mở thêm kênh bán hàng và có công cụ đối soát rõ ràng.

### 3.3. Định vị

S-Loco được định vị là:

* **Siêu ứng dụng du lịch bản địa**
* **Nền tảng ưu đãi, voucher và vé dịch vụ địa phương**
* **Lớp thương mại và đối soát giữa khách du lịch và vendor**
* **Trợ lý du lịch thông minh có AI**
* **Kênh phân phối và quảng bá số cho vendor tại Sầm Sơn**

---

## 4. Giá trị cốt lõi và lợi thế cạnh tranh

### 4.1. Chiến lược “Local-first”

Dự án tập trung khai thác hiểu biết sâu về thị trường địa phương, hành vi khách du lịch tại Sầm Sơn và đặc điểm vận hành của các vendor bản địa. Đây là lợi thế mà các nền tảng toàn quốc khó có được khi triển khai ở cấp địa phương.

### 4.2. Kiểm duyệt và xác thực nhà cung cấp

Các vendor được khảo sát, kiểm tra chất lượng và chuẩn hóa trước khi xuất hiện trên nền tảng. Cơ chế này giúp tăng niềm tin với khách hàng và nâng chất lượng toàn hệ sinh thái.

### 4.3. Hệ sinh thái dịch vụ đa dạng

S-Loco không chỉ tập trung vào đặt phòng hay ăn uống, mà tích hợp nhiều nhóm dịch vụ trong cùng một ứng dụng: lưu trú, ẩm thực, di chuyển, giải trí, trải nghiệm biển, sự kiện, tin tức địa phương, thời tiết và lịch trình cá nhân hóa.

### 4.4. Mô hình sản phẩm linh hoạt theo dòng tiền

S-Loco hỗ trợ ba loại sản phẩm có bản chất khác nhau:

* **Coupon:** giảm giá theo tổng bill thực tế, tiền về vendor trước
* **Voucher:** khách mua trước trên S-Loco, dùng để giảm trực tiếp số tiền phải trả tại vendor
* **Vé:** khách mua vé dịch vụ trên S-Loco, dùng QR để xác nhận quyền sử dụng dịch vụ

Cách phân loại này giúp S-Loco phục vụ được cả dịch vụ có giá chưa biết trước và dịch vụ có giá cố định.

### 4.5. Khả năng tạo combo và đề xuất thông minh

Nền tảng có thể gợi ý sản phẩm tương tự mô hình Klook, đồng thời xây dựng combo “càng mua nhiều càng giảm”, tăng giá trị đơn hàng và trải nghiệm người dùng. Combo có thể kết hợp nhiều loại sản phẩm, ví dụ: vé vui chơi, voucher ăn uống và coupon giảm giá tại quán cà phê.

---

## 5. Khách hàng mục tiêu

### 5.1. Khách hàng B2C

* Khách du lịch đến Sầm Sơn theo nhóm gia đình, cặp đôi, bạn bè
* Khách đi ngắn ngày hoặc cuối tuần
* Người dân địa phương có nhu cầu sử dụng dịch vụ ăn uống, giải trí, di chuyển
* Khách muốn mua trước vé hoặc voucher để chủ động ngân sách
* Khách muốn có ưu đãi tại các điểm dịch vụ nhưng chưa biết trước tổng chi tiêu

### 5.2. Khách hàng B2B

* Nhà hàng, khách sạn, homestay, xe điện, quán cà phê, spa, khu vui chơi
* Đơn vị bán tour, đoàn khách, tổ chức sự kiện
* Đơn vị cung cấp vé dịch vụ, vé trải nghiệm, vé vận chuyển, vé hoạt động biển
* Các đối tác có nhu cầu quảng bá, bán coupon, voucher hoặc vé trên nền tảng

---

## 6. Mô hình sản phẩm và dịch vụ

Sản phẩm trên S-Loco gồm ba loại chính: **Coupon**, **Voucher** và **Vé**. Ba loại này có thể cùng xuất hiện trong một danh mục dịch vụ, nhưng khác nhau ở cách khách thanh toán, cách vendor xác nhận sử dụng và hướng đối soát dòng tiền.

### 6.1. Coupon – Mã giảm giá theo tổng bill thực tế

**Coupon** là mã giảm giá hoặc ưu đãi được áp dụng trên tổng bill phát sinh tại hệ thống của vendor hoặc POS của vendor. Khách không thanh toán giá trị coupon cho S-Loco trước. Khách sử dụng coupon khi thanh toán tại vendor, sau đó vendor và S-Loco đối soát hoa hồng dựa trên bill thực tế.

Coupon phù hợp với các dịch vụ chưa biết rõ số tiền khách cần thanh toán trước khi sử dụng, ví dụ:

* Nhà hàng, quán ăn, quán cà phê
* Spa hoặc dịch vụ có thể phát sinh thêm gói tại điểm bán
* Dịch vụ giải trí tính theo mức sử dụng thực tế
* Các dịch vụ cần POS/vendor xác nhận tổng bill cuối cùng

Đặc điểm chính:

* Tiền khách thanh toán đi **trực tiếp về vendor trước**
* S-Loco ghi nhận coupon đã dùng và tính hoa hồng sau
* Vendor trả hoa hồng cho S-Loco theo kỳ đối soát
* Cần dữ liệu bill thực tế từ vendor/POS hoặc xác nhận thủ công bởi admin

### 6.2. Voucher – Trả trước trên S-Loco, giảm trực tiếp vào bill

**Voucher** là sản phẩm trả trước được khách mua trên S-Loco. Khi đến nơi sử dụng dịch vụ, voucher được dùng để giảm trực tiếp một số tiền hoặc giá trị đã cam kết trên tổng bill. Nếu bill thực tế lớn hơn giá trị voucher, khách chỉ thanh toán phần còn lại cho vendor.

Voucher phù hợp với các trường hợp S-Loco có thể bán trước một giá trị ưu đãi, nhưng khách vẫn có thể phát sinh thêm chi tiêu tại điểm bán, ví dụ:

* Voucher ăn uống trị giá 200.000đ tại nhà hàng
* Voucher spa/massage trị giá cố định
* Voucher trải nghiệm hoặc giải trí có giá trị quy đổi
* Gói ưu đãi có thể dùng như một phần thanh toán tại vendor

Đặc điểm chính:

* Tiền mua voucher đi **về S-Loco trước**
* Khách dùng voucher để giảm số tiền phải thanh toán tại vendor
* Vendor xác nhận voucher đã dùng bằng QR, mã code hoặc POS
* S-Loco trả tiền cho vendor theo kỳ đối soát sau khi voucher được xác nhận sử dụng

### 6.3. Vé – Quyền sử dụng dịch vụ được bán trước

**Vé** là sản phẩm thể hiện quyền sử dụng một dịch vụ cụ thể của vendor. Khách mua vé trên S-Loco, nhận mã QR, sau đó mang QR đến nơi cung cấp dịch vụ để vendor quét và xác nhận. Sau khi xác nhận, vendor cung cấp dịch vụ hoặc xuất vé/vào cổng cho khách.

Vé phù hợp với các dịch vụ có giá, số lượng hoặc quyền sử dụng rõ ràng trước khi mua, ví dụ:

* Vé cano, tàu lượn, hoạt động biển
* Vé khu vui chơi, điểm tham quan, sự kiện
* Vé xe điện hoặc tuyến di chuyển cố định
* Vé tour, vé trải nghiệm, vé show hoặc hoạt động theo khung giờ

Đặc điểm chính:

* Tiền mua vé đi **về S-Loco trước**
* QR đại diện cho quyền sử dụng dịch vụ
* Vendor quét QR để xác nhận và cung cấp dịch vụ
* S-Loco trả tiền cho vendor theo kỳ đối soát sau khi vé được xác nhận sử dụng

### 6.4. Combo sản phẩm

Khách hàng có thể mua hoặc nhận gợi ý combo gồm nhiều dịch vụ trong cùng một chuyến đi. Combo có thể kết hợp nhiều loại sản phẩm, ví dụ:

* Vé cano + voucher ăn uống + coupon cà phê
* Vé khu vui chơi + voucher spa
* Coupon nhà hàng + vé xe điện + ưu đãi cửa hàng lưu niệm

Cơ chế combo giúp tăng tỷ lệ chuyển đổi, tăng giá trị giao dịch và hỗ trợ AI tạo lịch trình đề xuất các dịch vụ phù hợp theo ngân sách.

### 6.5. Tin tức và thông tin địa phương

Nền tảng cung cấp thêm chuyên mục:

* Tin tức, sự kiện, lễ hội địa phương
* Thông tin du lịch mới nhất
* Thời tiết, cảnh báo mưa bão
* Gợi ý địa điểm phù hợp theo thời điểm

### 6.6. AI tạo lịch trình

S-Loco tích hợp tính năng AI hỗ trợ cá nhân hóa hành trình dựa trên các thông tin đầu vào như:

* Thời gian lưu trú (check-in, check-out)
* Ngân sách tổng hoặc ngân sách theo người
* Ngân sách cho từng bữa ăn
* Loại hình trải nghiệm mong muốn
* Sở thích cá nhân như yên tĩnh, sôi động, gần biển, đi cùng gia đình hay nhóm bạn

AI sẽ đề xuất lịch trình phù hợp và gợi ý các coupon, voucher hoặc vé tương ứng trên nền tảng.

---

## 7. Mô hình doanh thu

S-Loco có mô hình doanh thu đa nguồn, trong đó doanh thu cốt lõi đến từ hoa hồng và phí nền tảng theo từng loại sản phẩm.

### 7.1. Hoa hồng từ Coupon

Với Coupon, vendor thu tiền từ khách trước. S-Loco ghi nhận doanh thu dưới dạng **hoa hồng phải thu từ vendor** sau khi coupon được sử dụng và bill thực tế được xác nhận.

Mô hình này phù hợp với vendor có hệ thống POS hoặc quy trình đối soát bill rõ ràng, đặc biệt là nhà hàng và dịch vụ có giá trị thanh toán biến động.

### 7.2. Hoa hồng từ Voucher

Với Voucher, khách thanh toán trước cho S-Loco. S-Loco ghi nhận doanh thu bằng phần hoa hồng hoặc phí nền tảng được khấu trừ trước khi trả tiền cho vendor.

Mô hình này phù hợp với các gói ưu đãi có giá trị quy đổi rõ ràng, giúp S-Loco chủ động dòng tiền và giúp khách kiểm soát ngân sách.

### 7.3. Hoa hồng từ Vé

Với Vé, khách thanh toán trước cho S-Loco để mua quyền sử dụng dịch vụ. S-Loco ghi nhận doanh thu bằng hoa hồng theo giá vé, theo số lượng vé bán ra hoặc theo thỏa thuận thương mại với vendor.

Mô hình này phù hợp với dịch vụ có giá cố định, tồn suất hoặc quyền sử dụng cụ thể.

### 7.4. Doanh thu quảng cáo và đề xuất nổi bật

Vendor có thể trả phí để được ưu tiên hiển thị, quảng bá hoặc đề xuất trên nền tảng. Cơ chế này có thể áp dụng cho cả coupon, voucher và vé.

### 7.5. Bán gói thành viên hoặc ưu đãi nâng cao

Trong tương lai có thể phát triển các gói thành viên dành cho khách hàng thân thiết hoặc người dùng có tần suất cao, ví dụ ưu đãi độc quyền, tích điểm, hoàn tiền hoặc gói du lịch theo mùa.

### 7.6. Giải pháp B2B

S-Loco có thể mở rộng sang dịch vụ bán gói cho tour đoàn, doanh nghiệp, đơn vị tổ chức sự kiện hoặc cung cấp dữ liệu, báo cáo xu hướng du lịch địa phương.

---

## 8. Luồng vận hành và dòng tiền

### 8.1. Nguyên tắc phân loại dòng tiền

Ba loại sản phẩm có hai hướng dòng tiền chính:

| Loại sản phẩm | Ai thu tiền từ khách trước? | Ai phải trả tiền sau đối soát? | Bản chất đối soát |
|---|---|---|---|
| **Coupon** | Vendor | Vendor trả hoa hồng cho S-Loco | Khoản phải thu từ vendor |
| **Voucher** | S-Loco | S-Loco trả tiền cho vendor | Khoản phải trả cho vendor |
| **Vé** | S-Loco | S-Loco trả tiền cho vendor | Khoản phải trả cho vendor |

Điểm quan trọng: **Coupon không phải sản phẩm trả trước trên S-Loco**, nên không nên bị ép vào cùng một luồng trạng thái với Voucher hoặc Vé.

### 8.2. Luồng Coupon

Coupon dùng cho dịch vụ chưa biết rõ tổng bill trước khi khách sử dụng.

```text
1. Khách tìm coupon trên S-Loco
2. Khách nhận hoặc đặt giữ coupon
3. Khách đến vendor và sử dụng dịch vụ
4. Vendor/POS áp dụng mã giảm giá trên bill thực tế
5. Khách thanh toán số tiền còn lại trực tiếp cho vendor
6. Vendor/POS gửi dữ liệu sử dụng và bill về S-Loco
7. S-Loco tính hoa hồng dựa trên bill thực tế hoặc cấu hình hợp đồng
8. Vendor thanh toán hoa hồng cho S-Loco theo kỳ đối soát
```

Công thức tham chiếu:

```text
gross_bill = tổng bill trước giảm giá
customer_discount = số tiền giảm cho khách
customer_paid_to_vendor = gross_bill - customer_discount
sloco_commission = gross_bill * commission_rate
vendor_net_after_commission = customer_paid_to_vendor - sloco_commission
```

Ví dụ minh họa:

* Tổng bill trước giảm: **1.000.000đ**
* Coupon giảm cho khách: **5% = 50.000đ**
* Khách trả trực tiếp cho vendor: **950.000đ**
* Hoa hồng S-Loco: **3% tổng bill = 30.000đ**
* Vendor còn lại sau hoa hồng: **920.000đ**
* Dòng tiền: **Khách → Vendor trước**, sau đó **Vendor → S-Loco** phần hoa hồng

### 8.3. Luồng Voucher

Voucher dùng cho sản phẩm trả trước trên S-Loco, sau đó giảm trực tiếp số tiền phải thanh toán tại vendor.

```text
1. Khách mua voucher trên S-Loco
2. S-Loco nhận tiền từ khách và phát hành voucher
3. Khách đến vendor sử dụng dịch vụ
4. Voucher được áp dụng để giảm trực tiếp vào bill
5. Khách thanh toán phần còn lại cho vendor nếu bill lớn hơn giá trị voucher
6. Vendor xác nhận voucher đã dùng bằng QR, mã code hoặc POS
7. S-Loco đưa voucher đã dùng vào kỳ đối soát
8. S-Loco trả tiền cho vendor sau khi khấu trừ hoa hồng/phí nền tảng
```

Công thức tham chiếu:

```text
voucher_face_value = giá trị voucher dùng để giảm bill
voucher_sell_price = số tiền khách thanh toán cho S-Loco
gross_bill = tổng bill thực tế tại vendor
remaining_customer_paid_to_vendor = max(gross_bill - voucher_face_value, 0)
sloco_commission = voucher_face_value * commission_rate
vendor_payout_from_sloco = voucher_sell_price - sloco_commission
```

Ví dụ minh họa:

* Khách mua voucher trên S-Loco: **200.000đ**
* Bill thực tế tại vendor: **650.000đ**
* Voucher giảm trực tiếp: **200.000đ**
* Khách trả thêm cho vendor: **450.000đ**
* Hoa hồng S-Loco: **3% giá trị voucher = 6.000đ**
* S-Loco trả vendor: **194.000đ**
* Dòng tiền: **Khách → S-Loco trước**, sau đó **S-Loco → Vendor** theo kỳ đối soát

### 8.4. Luồng Vé

Vé dùng cho quyền sử dụng dịch vụ cụ thể, có giá và số lượng rõ ràng trước khi mua.

```text
1. Vendor niêm yết vé dịch vụ trên S-Loco
2. Khách mua vé và thanh toán trên S-Loco
3. S-Loco phát hành vé điện tử kèm mã QR
4. Khách mang QR đến nơi sử dụng dịch vụ
5. Vendor quét QR để xác nhận vé hợp lệ
6. Vendor cung cấp dịch vụ hoặc xuất vé/vào cổng cho khách
7. Vé đã dùng được đưa vào kỳ đối soát
8. S-Loco trả tiền cho vendor sau khi khấu trừ hoa hồng/phí nền tảng
```

Công thức tham chiếu:

```text
ticket_price = giá một vé
quantity = số lượng vé
gross_ticket_sales = ticket_price * quantity
sloco_commission = gross_ticket_sales * commission_rate
vendor_payout = gross_ticket_sales - sloco_commission
```

Ví dụ minh họa:

* Khách mua **2 vé**, giá **150.000đ/vé**
* Khách thanh toán cho S-Loco: **300.000đ**
* Hoa hồng S-Loco: **10% = 30.000đ**
* S-Loco trả vendor: **270.000đ**
* Dòng tiền: **Khách → S-Loco trước**, sau đó **S-Loco → Vendor** theo kỳ đối soát

### 8.5. Chu kỳ đối soát và thanh toán

Chu kỳ đối soát mặc định có thể là **3 ngày/lần**, hoặc cấu hình theo hợp đồng từng vendor. Hệ thống cần phân biệt rõ hai loại nghĩa vụ tài chính:

| Loại nghĩa vụ | Áp dụng cho | Mô tả |
|---|---|---|
| **Vendor phải trả S-Loco** | Coupon | Vendor đã thu tiền từ khách và cần trả hoa hồng cho S-Loco |
| **S-Loco phải trả vendor** | Voucher, Vé | S-Loco đã thu tiền từ khách và cần thanh toán phần vendor được hưởng |

Trạng thái đối soát nên thể hiện được:

* Chờ dữ liệu sử dụng hoặc bill thực tế
* Chờ admin/vendor xác nhận
* Đã đối soát và chờ thanh toán
* Đã thanh toán/đã thu hoa hồng
* Có tranh chấp hoặc ngoại lệ cần xử lý thủ công

### 8.6. Cơ chế thanh toán

S-Loco hỗ trợ nhiều phương thức thanh toán cho các sản phẩm trả trước như Voucher và Vé:

* QR cá nhân, ví dụ SePay
* Cổng thanh toán như VNPay, Momo
* Các phương thức thanh toán điện tử phổ biến khác có thể mở rộng sau

Với Coupon, thanh toán của khách thường diễn ra tại vendor. S-Loco chỉ cần ghi nhận coupon đã sử dụng, bill thực tế và khoản hoa hồng phải thu từ vendor.

### 8.7. Hoàn tiền và tranh chấp

Chính sách hoàn tiền cần bám theo bản chất từng loại sản phẩm:

* **Coupon:** S-Loco không hoàn tiền trực tiếp vì khách không thanh toán cho S-Loco. Tranh chấp được xử lý qua vendor/customer support và có thể điều chỉnh hoa hồng trong kỳ đối soát.
* **Voucher:** Có thể hoàn tiền nếu chưa sử dụng, tùy chính sách cổng thanh toán và điều khoản thương mại. Voucher đã dùng cần qua quy trình hỗ trợ/admin nếu phát sinh khiếu nại.
* **Vé:** Có thể hoàn tiền trước khi vé được quét/xác nhận sử dụng, tùy chính sách vendor, thời gian diễn ra dịch vụ và điều kiện sự kiện. Vé đã xác nhận sử dụng không hoàn tự động.

---

## 9. Hướng dẫn triển khai nghiệp vụ cho hệ thống

Phần này là định hướng để các bước thiết kế API, dữ liệu và mobile app sau này không nhầm lẫn giữa ba loại sản phẩm.

### 9.1. Product type đề xuất

| Product type | Tên hiển thị | Bản chất |
|---|---|---|
| `COUPON` | Coupon / Mã giảm giá | Giảm trên bill thực tế, không trả trước trên S-Loco |
| `VOUCHER` | Voucher | Giá trị trả trước dùng để giảm bill |
| `TICKET` | Vé | Quyền sử dụng dịch vụ cụ thể, xác nhận bằng QR |

### 9.2. Vòng đời Coupon

Coupon nên dùng vòng đời không trả trước:

```text
DRAFT -> ACTIVE -> RESERVED/ISSUED -> USED -> RECONCILED -> SETTLED
ACTIVE -> DISABLED
RESERVED/ISSUED -> CANCELLED
```

Ý nghĩa chính:

* **ACTIVE:** coupon đang mở cho khách nhận hoặc đặt giữ
* **RESERVED/ISSUED:** khách đã nhận mã hoặc có quyền sử dụng coupon
* **USED:** vendor/POS xác nhận coupon đã áp dụng trên bill thật
* **RECONCILED:** bill và hoa hồng đã được kiểm tra
* **SETTLED:** vendor đã thanh toán hoa hồng cho S-Loco

### 9.3. Vòng đời Voucher

Voucher nên dùng vòng đời trả trước theo giá trị sử dụng:

```text
CREATED -> PAID -> ACTIVE -> USED -> COMPLETED -> SETTLED
PAID/ACTIVE -> REFUNDED
```

Ý nghĩa chính:

* **CREATED:** đơn/voucher được tạo, chờ thanh toán
* **PAID/ACTIVE:** khách đã thanh toán cho S-Loco và có thể sử dụng voucher
* **USED:** voucher đã được áp dụng tại vendor
* **COMPLETED:** giao dịch đủ điều kiện đưa vào đối soát
* **SETTLED:** S-Loco đã thanh toán phần vendor được hưởng

### 9.4. Vòng đời Vé

Vé nên dùng vòng đời trả trước theo quyền sử dụng dịch vụ:

```text
CREATED -> PAID -> ISSUED -> VALIDATED -> USED -> SETTLED
PAID/ISSUED -> REFUNDED
```

Ý nghĩa chính:

* **PAID:** khách đã thanh toán vé cho S-Loco
* **ISSUED:** vé điện tử/QR đã được phát hành
* **VALIDATED:** vendor quét QR và xác nhận vé hợp lệ
* **USED:** khách đã được cung cấp dịch vụ hoặc xuất vé/vào cổng
* **SETTLED:** S-Loco đã thanh toán phần vendor được hưởng

Trong MVP đơn giản, **VALIDATED** và **USED** có thể gộp lại nếu hành động quét QR đồng nghĩa với việc vé được tiêu thụ ngay.

### 9.5. Nguyên tắc tách luồng

Không nên ép `COUPON`, `VOUCHER` và `TICKET` dùng chung một state machine vì khác nhau ở ba điểm cốt lõi:

* **Ai thu tiền trước:** vendor hoặc S-Loco
* **Sản phẩm đại diện cho gì:** mã giảm giá, giá trị trả trước hoặc quyền sử dụng dịch vụ
* **Đối soát theo chiều nào:** vendor trả S-Loco hoặc S-Loco trả vendor

Các luồng có thể dùng chung những năng lực nền tảng như tài khoản vendor, danh mục dịch vụ, hiển thị sản phẩm, thông báo, QR/mã code, báo cáo và admin reconciliation. Tuy nhiên, logic thanh toán và đối soát cần tách rõ theo product type.

---

## 10. Hệ thống chức năng chính

### 10.1. Dành cho người dùng

* Tìm kiếm và khám phá dịch vụ địa phương
* Nhận hoặc đặt giữ coupon giảm giá
* Mua voucher trả trước và sử dụng tại vendor
* Mua vé dịch vụ và xác nhận bằng QR
* Thanh toán online cho voucher và vé
* Xem lịch sử coupon/voucher/vé đã sử dụng
* Xem tin tức, thời tiết, sự kiện
* Nhận gợi ý lịch trình từ AI
* Trải nghiệm cá nhân hóa theo sở thích và ngân sách

### 10.2. Dành cho vendor

* Quản lý thông tin dịch vụ và sản phẩm bán trên S-Loco
* Cấu hình coupon, voucher hoặc vé theo từng loại dịch vụ
* Nhận thông báo khi khách mua voucher/vé hoặc đặt giữ coupon
* Quét QR/mã code để xác nhận voucher hoặc vé
* Ghi nhận coupon đã sử dụng và bill thực tế
* Theo dõi doanh thu, khoản phải thu/phải trả và các kỳ đối soát
* Mua gói quảng cáo hoặc đề xuất ưu tiên

### 10.3. Dành cho admin

* Quản lý vendor và trạng thái kiểm duyệt
* Quản lý sản phẩm theo loại `COUPON`, `VOUCHER`, `TICKET`
* Quản lý đơn hàng, thanh toán, hoàn hủy cho sản phẩm trả trước
* Quản lý dữ liệu sử dụng coupon, voucher và vé
* Quản lý đối soát hai chiều: vendor trả S-Loco và S-Loco trả vendor
* Xử lý ngoại lệ, tranh chấp, hoàn tiền và dữ liệu POS/QR thiếu khớp
* Quản lý nội dung, tin tức, sự kiện
* Giám sát chất lượng dịch vụ và phản hồi khách hàng

---

## 11. Quy trình onboard vendor

Quy trình đưa đối tác lên nền tảng gồm các bước chính:

1. Tiếp cận và giới thiệu dự án
2. Khảo sát chất lượng thực tế
3. Phân loại dịch vụ phù hợp với Coupon, Voucher hoặc Vé
4. Thống nhất chính sách giá, ưu đãi, hoa hồng và chu kỳ đối soát
5. Ký hợp đồng hợp tác
6. Chuẩn bị media: hình ảnh, menu, thông tin dịch vụ, giá vé hoặc điều kiện ưu đãi
7. Tích hợp hoặc thống nhất quy trình xác nhận sử dụng: POS, QR, mã code hoặc admin nhập liệu
8. Đào tạo sử dụng hệ thống quản lý/vendor app
9. Chính thức hiển thị trên app và theo dõi giai đoạn đầu

Quy trình này giúp đảm bảo chất lượng dịch vụ đồng đều, đồng thời giảm rủi ro sai lệch khi đối soát dòng tiền.

---

## 12. Kiến trúc triển khai

Dự án dự kiến phát triển trên các nền tảng:

* **Mobile App:** iOS và Android cho khách du lịch
* **Vendor App:** iOS/Android hoặc giao diện tương đương cho vendor xác nhận sử dụng và theo dõi đối soát
* **Web App/Admin:** dành cho quản trị, vận hành nội bộ và đối soát

Các thành phần tích hợp chính gồm:

* Hệ thống thanh toán điện tử cho Voucher và Vé
* Hệ thống QR/mã code để xác nhận sử dụng
* Kết nối POS hoặc webhook vendor cho Coupon khi có thể
* AI chatbot/gợi ý lịch trình
* Hệ thống quản lý vendor và sản phẩm
* Hệ thống đối soát hai chiều
* Kênh quản lý tin tức và thông tin địa phương

---

## 13. Điều kiện tối thiểu để vận hành giai đoạn đầu

Để nền tảng có thể đi vào hoạt động hiệu quả, cần đảm bảo tối thiểu:

* Onboard được khoảng **20–30 vendor** để đủ đa dạng dịch vụ
* Có tập sản phẩm đủ hấp dẫn ở cả ba nhóm: Coupon, Voucher và Vé
* Có hệ thống đối soát chính xác, minh bạch và đáng tin cậy
* Có quy trình xác nhận sử dụng rõ ràng cho từng product type
* Có chính sách hoa hồng và thanh toán theo kỳ được thống nhất với vendor
* Có đội ngũ vận hành hỗ trợ vendor trong giai đoạn đầu
* Có chính sách chăm sóc khách hàng, hoàn tiền và xử lý khiếu nại rõ ràng

---

## 14. Rủi ro chính và hướng xử lý

### 14.1. Rủi ro người dùng

Khách hàng chưa quen nhận coupon, mua voucher/vé qua app hoặc chưa tin chất lượng dịch vụ.

**Hướng xử lý:** xác thực vendor, đưa ra ưu đãi rõ ràng, hiển thị điều kiện sử dụng minh bạch, hỗ trợ đặt nhanh qua QR tại điểm bán.

### 14.2. Rủi ro vendor

Vendor thiếu kỹ năng công nghệ, nhập liệu không đầy đủ hoặc chưa quen quy trình xác nhận coupon/voucher/vé.

**Hướng xử lý:** đào tạo 1:1, theo sát giai đoạn đầu, cung cấp vendor app đơn giản, có quy trình hỗ trợ khi QR/POS gặp lỗi.

### 14.3. Rủi ro dòng tiền và đối soát

Sai lệch giữa dữ liệu thanh toán, bill thực tế, coupon đã dùng, voucher/vé đã quét và khoản phải trả/phải thu.

**Hướng xử lý:** tách rõ product type, tách rõ chiều đối soát, lưu lịch sử sử dụng, có trạng thái ngoại lệ và quy trình admin xác minh thủ công trước khi tự động hóa sâu.

### 14.4. Rủi ro hoàn hủy và tranh chấp

Khách có thể yêu cầu hoàn tiền sau khi mua voucher/vé, hoặc tranh chấp chất lượng dịch vụ sau khi đã sử dụng.

**Hướng xử lý:** công bố điều kiện hoàn tiền theo từng loại sản phẩm, khóa hoàn tiền tự động sau khi đã dùng/xác nhận, cho phép admin xử lý các trường hợp đặc biệt.

### 14.5. Rủi ro cạnh tranh

Các nền tảng lớn có thể tham gia thị trường hoặc vendor tự triển khai kênh bán riêng.

**Hướng xử lý:** tập trung lợi thế bản địa, tốc độ triển khai nhanh, mạng lưới vendor sâu, dữ liệu địa phương tốt và mô hình sản phẩm phù hợp với thực tế vận hành tại Sầm Sơn.

---

## 15. Kết luận

S-Loco là một dự án có tiềm năng xây dựng thành **nền tảng số trung tâm cho du lịch Sầm Sơn**, giải quyết đồng thời ba bài toán lớn: **trải nghiệm khách du lịch, doanh thu cho vendor và minh bạch thị trường địa phương**.

Việc phân tách sản phẩm thành **Coupon**, **Voucher** và **Vé** giúp S-Loco phản ánh đúng thực tế vận hành của từng loại dịch vụ:

* **Coupon:** phù hợp với dịch vụ chưa biết trước tổng bill, tiền về vendor trước rồi vendor trả hoa hồng cho S-Loco.
* **Voucher:** phù hợp với ưu đãi trả trước, tiền về S-Loco trước rồi S-Loco đối soát trả vendor.
* **Vé:** phù hợp với quyền sử dụng dịch vụ có giá cố định, khách mua trên S-Loco và vendor quét QR để xác nhận.

Với định hướng “local-first”, mô hình sản phẩm linh hoạt, tích hợp thanh toán, QR, đối soát và AI cá nhân hóa lịch trình, S-Loco có khả năng trở thành một sản phẩm khác biệt, dễ mở rộng và phù hợp với xu hướng số hóa dịch vụ du lịch địa phương.

---
