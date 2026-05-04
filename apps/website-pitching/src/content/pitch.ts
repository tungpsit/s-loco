export const serviceCategories = [
  'Lưu trú',
  'Ẩm thực',
  'Xe điện',
  'Cafe',
  'Spa',
  'Giải trí biển',
  'Sự kiện',
  'Lưu niệm',
]

export const marketPainPoints = [
  'Thông tin dịch vụ phân tán, khó kiểm chứng chất lượng và giá',
  'Du khách khó đặt nhiều dịch vụ trong cùng một hành trình',
  'Vendor địa phương thiếu công cụ số để bán hàng và quản lý đơn',
  'Đối soát, hoàn hủy và khiếu nại còn phụ thuộc nhiều vào thủ công',
]

export const marketSignals = [
  {
    value: 'Sầm Sơn',
    label:
      'Thị trường khởi đầu có mật độ dịch vụ du lịch cao, nhu cầu ngắn ngày rõ rệt và tính mùa vụ mạnh.',
  },
  {
    value: '20–30',
    label:
      'Vendor tối thiểu cho giai đoạn vận hành đầu: đủ dịch vụ để tạo combo và hành trình đáng đặt.',
  },
  {
    value: '8%–10%',
    label:
      'Biên chiết khấu mục tiêu từ vendor, đủ để chia ưu đãi cho khách và giữ doanh thu nền tảng.',
  },
  {
    value: 'QR-first',
    label:
      'Cơ chế xác thực đơn giản cho nhà hàng, spa, xe điện, tour và dịch vụ địa phương không có POS phức tạp.',
  },
]

export const transactionFlow = [
  {
    eyebrow: '01',
    title: 'Khám phá và chọn dịch vụ',
    description:
      'Du khách tìm nhà hàng, khách sạn, xe điện, spa, tour hoặc combo theo vị trí, ngân sách và thời gian ở Sầm Sơn.',
  },
  {
    eyebrow: '02',
    title: 'Cấu hình nhu cầu',
    description:
      'Mỗi nhóm dịch vụ có nhánh riêng: nhà hàng chọn bàn, spa chọn slot giờ, xe điện chọn tuyến, tour chọn ngày và số người.',
  },
  {
    eyebrow: '03',
    title: 'Trả trước để nhận voucher',
    description:
      'Khách thanh toán trước qua SePay, VNPay, Momo hoặc phương thức mở rộng. Voucher điện tử được tạo ngay sau khi thanh toán thành công.',
  },
  {
    eyebrow: '04',
    title: 'Vendor nhận đơn và phục vụ',
    description:
      'Vendor nhận thông báo đơn, chuẩn bị dịch vụ và xác thực voucher khi khách đến điểm sử dụng.',
  },
  {
    eyebrow: '05',
    title: 'Quét QR hai chiều',
    description:
      'Vendor có thể quét QR của khách, hoặc khách quét QR cố định tại quầy. Cả hai cách đều đưa voucher sang trạng thái đã sử dụng.',
  },
  {
    eyebrow: '06',
    title: 'Hoàn tất và đối soát',
    description:
      'Vendor xác nhận hoàn thành, hoặc hệ thống tự động xác nhận sau 24 giờ nếu không có khiếu nại. Doanh thu được đưa vào kỳ giải ngân.',
  },
]

export const revenueSplit = [
  {
    label: 'Khách thanh toán',
    percent: '95%',
    amount: '950.000đ',
    description:
      'Khách được giảm 5% so với giá gốc 1.000.000đ và nhận voucher có thể sử dụng tại cơ sở.',
  },
  {
    label: 'S-Loco giữ lại',
    percent: '3%',
    amount: '30.000đ',
    description:
      'Doanh thu nền tảng từ mỗi giao dịch đã thanh toán và đi qua lớp xác thực voucher.',
  },
  {
    label: 'Vendor nhận',
    percent: '92%',
    amount: '920.000đ',
    description:
      'Vendor nhận phần còn lại sau chiết khấu, khi dịch vụ hoàn tất và đủ điều kiện đối soát.',
  },
]

export const revenueStreams = [
  'Hoa hồng theo giao dịch từ vendor',
  'Phí quảng cáo và đề xuất nổi bật cho vendor',
  'Gói thành viên hoặc ưu đãi nâng cao cho khách hàng thân thiết',
  'Giải pháp B2B cho tour đoàn, sự kiện và báo cáo xu hướng du lịch địa phương',
]

export const voucherStates = [
  {
    code: 'CREATED',
    label: 'Đơn tạo, chờ thanh toán',
  },
  {
    code: 'PAID',
    label: 'Voucher active sau khi thanh toán',
  },
  {
    code: 'REDEEMED',
    label: 'Đã quét QR tại cơ sở',
  },
  {
    code: 'COMPLETED',
    label: 'Dịch vụ hoàn tất hoặc tự xác nhận sau 24 giờ',
  },
  {
    code: 'SETTLED',
    label: 'Đã giải ngân cho vendor',
  },
]

export const policyStates = [
  {
    code: 'TRANSFERRED',
    label: 'Khách có thể tặng hoặc chuyển voucher cho người khác qua app.',
  },
  {
    code: 'REFUND_REQUESTED',
    label: 'Yêu cầu hoàn tiền nếu voucher chưa sử dụng.',
  },
  {
    code: 'REFUNDED',
    label: 'Hoàn 100% cho voucher chưa sử dụng, trừ phí xử lý nhỏ nếu có.',
  },
]

export const platformSides = [
  {
    name: 'Du khách',
    headline: 'Một hành trình Sầm Sơn có thể khám phá, đặt, thanh toán và sử dụng trong một app.',
    details: [
      'Tìm dịch vụ bản địa đã kiểm duyệt',
      'AI tạo lịch trình theo thời gian, ngân sách và sở thích',
      'Ví voucher QR, chuyển nhượng và hoàn tiền khi chưa sử dụng',
    ],
  },
  {
    name: 'Vendor địa phương',
    headline: 'Một kênh bán hàng số cho nhà hàng, khách sạn, xe điện, spa và dịch vụ ven biển.',
    details: [
      'Quản lý dịch vụ, giá, tồn suất và đơn hàng',
      'Quét QR để xác thực khách đã trả trước',
      'Theo dõi doanh thu, rút ngay hoặc nhận tiền theo chu kỳ 3 ngày',
    ],
  },
  {
    name: 'Admin S-Loco',
    headline: 'Một lớp vận hành để kiểm duyệt vendor, quản lý thanh toán, hoàn hủy và đối soát.',
    details: [
      'Kiểm soát chất lượng vendor trước khi mở bán',
      'Giám sát voucher, khiếu nại và dòng tiền hold',
      'Theo dõi dữ liệu nhu cầu để tạo combo và gói đề xuất nổi bật',
    ],
  },
]

export const settlementModes = [
  {
    title: 'Rút ngay',
    description:
      'Vendor có thể nhận tiền ngay sau khi voucher chuyển sang COMPLETED. Giai đoạn đầu miễn phí để giảm rào cản tham gia.',
  },
  {
    title: 'Theo chu kỳ 3 ngày',
    description:
      'Mặc định gom giao dịch đã hoàn tất thành batch đối soát, giảm thao tác kế toán và tạo nhịp vận hành ổn định.',
  },
]

export const vendorOnboarding = [
  'Tiếp cận và giới thiệu mô hình hợp tác',
  'Khảo sát chất lượng thực tế tại cơ sở',
  'Ký hợp đồng và chuẩn hóa chính sách ưu đãi',
  'Chuẩn bị media, menu, giá và tồn suất',
  'Đào tạo sử dụng app vendor và quy trình QR',
  'Mở bán, theo dõi dữ liệu và tối ưu combo',
]

export const roadmap = [
  'Nền tảng, tài khoản và xác thực',
  'Vendor, dịch vụ và khám phá địa phương',
  'Đơn hàng, voucher và QR redemption',
  'Thanh toán qua VNPay, Momo, SePay',
  'Đối soát, thông báo và dashboard',
  'AI itinerary, combo, nội dung và đánh giá',
]

export const riskMitigations = [
  {
    risk: 'Niềm tin của du khách',
    mitigation:
      'Kiểm duyệt vendor, hiển thị giá rõ ràng, ưu đãi thật và hỗ trợ hoàn tiền cho voucher chưa sử dụng.',
  },
  {
    risk: 'Năng lực vận hành vendor',
    mitigation: 'Đào tạo 1:1, quy trình QR đơn giản, dashboard doanh thu và hỗ trợ giai đoạn đầu.',
  },
  {
    risk: 'Sai lệch đối soát',
    mitigation:
      'Voucher state machine, tiền giữ tạm, kỳ giải ngân rõ ràng và xác minh thủ công khi cần.',
  },
  {
    risk: 'Nền tảng lớn tham gia',
    mitigation:
      'Tập trung local-first, tốc độ onboard nhanh và mạng lưới vendor sâu tại từng điểm đến.',
  },
]
