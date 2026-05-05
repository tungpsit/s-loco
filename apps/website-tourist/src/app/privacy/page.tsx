import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chính sách riêng tư — S-Loco',
  description:
    'Chính sách riêng tư S-Loco về tài khoản, voucher du lịch, thanh toán, QR, vendor, thông báo và dữ liệu hỗ trợ.',
}

const dataGroups = [
  {
    title: 'Dữ liệu tài khoản',
    items: [
      'Khách du lịch: số điện thoại dùng để đăng nhập OTP, tên hiển thị và thông tin liên hệ bạn chủ động cung cấp.',
      'Vendor và admin: họ tên, email, số điện thoại, mật khẩu đã được mã hóa, vai trò tài khoản và trạng thái quyền truy cập.',
      'Thông tin xác thực như mã OTP, token phiên đăng nhập, refresh token và thời điểm đăng nhập để bảo vệ tài khoản.',
    ],
  },
  {
    title: 'Dữ liệu dịch vụ, đặt chỗ và voucher',
    items: [
      'Dịch vụ bạn xem, lưu, đặt mua hoặc đánh giá trong các nhóm như ăn uống, lưu trú, spa, xe điện, giải trí, mua sắm và sự kiện địa phương.',
      'Thông tin đơn hàng, voucher điện tử, mã QR, trạng thái sử dụng voucher, yêu cầu hoàn tiền và lịch sử hỗ trợ liên quan.',
      'Thông tin vendor cung cấp như tên cơ sở, địa chỉ, tọa độ, hình ảnh, giá, điều kiện sử dụng voucher, tài khoản nhận đối soát và dữ liệu vận hành cửa hàng.',
    ],
  },
  {
    title: 'Dữ liệu thanh toán và đối soát',
    items: [
      'Mã giao dịch, số tiền, trạng thái thanh toán, phương thức thanh toán, thời điểm ghi nhận giao dịch và kết quả webhook từ cổng thanh toán.',
      'Dữ liệu đối soát, hoa hồng nền tảng, khoản giải ngân cho vendor, lịch sử rút tiền và chứng từ cần thiết cho kế toán hoặc xử lý tranh chấp.',
      'S-Loco không lưu đầy đủ thông tin thẻ ngân hàng. Dữ liệu nhạy cảm của giao dịch được xử lý bởi nhà cung cấp thanh toán được tích hợp.',
    ],
  },
  {
    title: 'Dữ liệu thiết bị, vị trí và sử dụng ứng dụng',
    items: [
      'Token thiết bị để gửi thông báo về OTP, đơn hàng, voucher, hoàn tiền, đối soát và cập nhật quan trọng của dịch vụ.',
      'Thông tin kỹ thuật như loại thiết bị, hệ điều hành, phiên bản ứng dụng, log lỗi, địa chỉ IP gần đúng và dữ liệu chẩn đoán để đảm bảo an toàn hệ thống.',
      'Vị trí gần đúng hoặc tọa độ bạn cho phép dùng để gợi ý dịch vụ quanh Sầm Sơn, sắp xếp khoảng cách và hỗ trợ quét QR tại điểm dịch vụ.',
    ],
  },
]

const purposeItems = [
  'Tạo và bảo vệ tài khoản, xác thực OTP, phân quyền tourist, vendor và admin.',
  'Hiển thị dịch vụ địa phương phù hợp với nhu cầu, ngân sách, thời gian lưu trú và khu vực bạn quan tâm.',
  'Xử lý đơn hàng, phát hành voucher điện tử, tạo mã QR, xác nhận sử dụng dịch vụ và hỗ trợ hoàn tiền khi đủ điều kiện.',
  'Kết nối giao dịch với cổng thanh toán, ghi nhận webhook, đối soát doanh thu và giải ngân cho vendor.',
  'Gửi thông báo liên quan trực tiếp đến tài khoản, đơn hàng, voucher, bảo mật, hỗ trợ và thay đổi quan trọng của dịch vụ.',
  'Cá nhân hóa gợi ý hành trình, combo và nội dung địa phương khi bạn sử dụng các tính năng khám phá hoặc AI itinerary.',
  'Phát hiện gian lận voucher, truy cập trái phép, lạm dụng khuyến mãi, lỗi hệ thống và các hành vi gây rủi ro cho khách hoặc vendor.',
]

const sharingItems = [
  'Nhà cung cấp thanh toán như VNPay, MoMo, SePay hoặc đơn vị tương đương để xử lý giao dịch, hoàn tiền và xác minh trạng thái thanh toán.',
  'Dịch vụ hạ tầng, lưu trữ, gửi thông báo, phân tích lỗi và bảo mật như Firebase hoặc nhà cung cấp tương đương khi cần vận hành ứng dụng.',
  'Vendor có liên quan đến đơn hàng để xác nhận voucher, chuẩn bị dịch vụ, hỗ trợ khách và xử lý khiếu nại sau sử dụng.',
  'Cơ quan nhà nước, tòa án hoặc bên có thẩm quyền khi S-Loco có nghĩa vụ pháp lý phải cung cấp thông tin.',
]

const userRights = [
  'Yêu cầu truy cập, chỉnh sửa hoặc cập nhật thông tin tài khoản chưa chính xác.',
  'Rút quyền truy cập vị trí, thông báo hoặc quyền thiết bị trong phần cài đặt hệ điều hành nếu tính năng không còn cần thiết với bạn.',
  'Yêu cầu xóa tài khoản và dữ liệu liên quan, ngoại trừ dữ liệu cần lưu theo nghĩa vụ kế toán, pháp lý, chống gian lận hoặc giải quyết tranh chấp.',
  'Liên hệ S-Loco để hỏi về cách dữ liệu được xử lý hoặc phản ánh nếu bạn cho rằng dữ liệu đang được sử dụng chưa phù hợp.',
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8 lg:px-10">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-line bg-white p-6 shadow-[0_30px_90px_-64px_rgba(2,75,134,0.9)] md:p-10">
        <Link href="/" className="text-sm font-bold text-ocean transition hover:text-deep-ocean">
          ← Về trang chủ
        </Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-ocean">
          S-Loco Legal
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-deep-ocean md:text-5xl">
          Chính sách riêng tư
        </h1>
        <p className="mt-4 text-sm font-bold text-ink-muted">Cập nhật lần cuối: 05/05/2026</p>

        <section className="mt-8 space-y-6 text-base leading-8 text-ink-muted">
          <p>
            Chính sách này mô tả cách S-Loco thu thập, sử dụng, chia sẻ, lưu giữ và xóa dữ liệu khi
            bạn sử dụng website, ứng dụng S-Loco Tourist, ứng dụng S-Loco Vendor, hệ thống quản trị
            và các dịch vụ liên quan đến nền tảng du lịch địa phương Sầm Sơn.
          </p>
          <p>
            S-Loco kết nối khách du lịch với nhà hàng, khách sạn, homestay, spa, xe điện, điểm giải
            trí, cửa hàng địa phương và các đối tác dịch vụ thông qua đặt dịch vụ, voucher điện tử,
            mã QR, thanh toán trực tuyến, đối soát vendor, nội dung địa phương và gợi ý hành trình.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              1. Dữ liệu chúng tôi xử lý
            </h2>
            <p>
              Tùy vai trò của bạn là khách du lịch, vendor hay admin, S-Loco có thể xử lý các nhóm
              dữ liệu sau:
            </p>
            <div className="space-y-5">
              {dataGroups.map((group) => (
                <section key={group.title} className="rounded-3xl border border-line bg-coast p-5">
                  <h3 className="text-lg font-black tracking-tight text-deep-ocean">
                    {group.title}
                  </h3>
                  <ul className="mt-3 list-disc space-y-2 pl-6">
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              2. Mục đích sử dụng dữ liệu
            </h2>
            <p>S-Loco sử dụng dữ liệu để vận hành nền tảng một cách an toàn và hữu ích:</p>
            <ul className="list-disc space-y-2 pl-6">
              {purposeItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              3. Thanh toán, voucher và mã QR
            </h2>
            <p>
              Khi bạn mua voucher hoặc đặt dịch vụ, S-Loco ghi nhận thông tin cần thiết để phát hành
              voucher, xác minh thanh toán, hiển thị mã QR và ngăn việc sử dụng trùng voucher.
              Vendor chỉ nhận các thông tin cần thiết để cung cấp dịch vụ, xác nhận QR, xử lý hỗ trợ
              và hoàn tất đối soát.
            </p>
            <p>
              Với các giao dịch đã thanh toán hoặc đã phát sinh nghĩa vụ tài chính, một số dữ liệu
              có thể được lưu lại ngay cả khi tài khoản bị xóa để đáp ứng yêu cầu kế toán, thuế,
              chống gian lận, hoàn tiền hoặc giải quyết tranh chấp.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              4. AI itinerary, cá nhân hóa và nội dung địa phương
            </h2>
            <p>
              Nếu bạn sử dụng tính năng gợi ý lịch trình hoặc cá nhân hóa, S-Loco có thể dùng các
              lựa chọn bạn nhập như thời gian lưu trú, ngân sách, số người, sở thích, khu vực quan
              tâm và dịch vụ đã xem để đề xuất hành trình, combo, bài viết, sự kiện hoặc vendor phù
              hợp hơn.
            </p>
            <p>
              Các gợi ý này nhằm hỗ trợ bạn lập kế hoạch chuyến đi. Bạn vẫn nên kiểm tra giá, điều
              kiện voucher, giờ hoạt động và thông tin do vendor công bố trước khi quyết định sử
              dụng dịch vụ.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              5. Chia sẻ dữ liệu với bên thứ ba
            </h2>
            <p>
              S-Loco không bán dữ liệu cá nhân của bạn. Chúng tôi chỉ chia sẻ dữ liệu khi cần thiết
              để cung cấp dịch vụ, xử lý giao dịch, bảo vệ hệ thống hoặc tuân thủ pháp luật:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              {sharingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              6. Lưu giữ và xóa dữ liệu
            </h2>
            <p>
              Dữ liệu tài khoản được lưu trong thời gian tài khoản còn hoạt động hoặc trong thời hạn
              cần thiết để cung cấp dịch vụ. Dữ liệu giao dịch, voucher, đối soát, hoàn tiền và hỗ
              trợ có thể được lưu lâu hơn nếu cần cho kế toán, pháp lý, chống gian lận, kiểm toán
              nội bộ hoặc xử lý tranh chấp.
            </p>
            <p>
              Bạn có thể yêu cầu xóa tài khoản và dữ liệu liên quan tại{' '}
              <Link href="/delete-account" className="font-bold text-ocean hover:text-deep-ocean">
                trang xóa tài khoản
              </Link>
              . Sau khi tiếp nhận, S-Loco sẽ xác minh yêu cầu, vô hiệu hóa tài khoản nếu phù hợp và
              xóa hoặc ẩn danh dữ liệu không còn cần thiết cho các mục đích nêu trên.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              7. Bảo mật dữ liệu
            </h2>
            <p>
              S-Loco áp dụng các biện pháp kỹ thuật và tổ chức phù hợp như mã hóa mật khẩu, kiểm
              soát quyền truy cập theo vai trò, token phiên đăng nhập, ghi nhận log bảo mật, giới
              hạn quyền nội bộ và giám sát bất thường để giảm rủi ro truy cập trái phép, mất mát
              hoặc lạm dụng dữ liệu.
            </p>
            <p>
              Không hệ thống nào an toàn tuyệt đối. Nếu bạn nghi ngờ tài khoản, OTP, mật khẩu hoặc
              thiết bị đăng nhập bị lộ, hãy liên hệ S-Loco sớm để được hỗ trợ khóa phiên và bảo vệ
              tài khoản.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              8. Quyền của người dùng
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              {userRights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              9. Thay đổi chính sách
            </h2>
            <p>
              S-Loco có thể cập nhật chính sách này khi sản phẩm, yêu cầu pháp lý hoặc cách vận hành
              thay đổi. Phiên bản mới sẽ được đăng tại trang này và ngày cập nhật sẽ được điều chỉnh
              tương ứng. Với thay đổi quan trọng, S-Loco có thể thông báo trong ứng dụng, qua
              website hoặc qua kênh liên hệ phù hợp.
            </p>
          </section>

          <section className="rounded-3xl bg-sand-soft p-5 text-sm leading-7">
            <h2 className="text-xl font-black tracking-tight text-deep-ocean">Liên hệ</h2>
            <p className="mt-3">
              Nếu có câu hỏi về quyền riêng tư hoặc muốn gửi yêu cầu liên quan đến dữ liệu cá nhân,
              vui lòng liên hệ qua{' '}
              <Link href="/support" className="font-bold text-ocean hover:text-deep-ocean">
                trang hỗ trợ S-Loco
              </Link>{' '}
              hoặc email{' '}
              <a
                className="font-bold text-ocean hover:text-deep-ocean"
                href="mailto:support@sloco.vn"
              >
                support@sloco.vn
              </a>
              .
            </p>
          </section>
        </section>
      </article>
    </main>
  )
}
