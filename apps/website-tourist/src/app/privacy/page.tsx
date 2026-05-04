import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Chính sách riêng tư — S-Loco',
  description: 'Chính sách riêng tư của S-Loco cho khách du lịch và đối tác vendor.',
}

const dataItems = [
  'Thông tin tài khoản như số điện thoại, email, tên hiển thị và vai trò người dùng.',
  'Thông tin đặt dịch vụ, đơn hàng, voucher, giao dịch đối soát và lịch sử hỗ trợ.',
  'Tọa độ cửa hàng do vendor chủ động lưu để hiển thị vị trí dịch vụ.',
  'Token thiết bị và thông tin kỹ thuật cần thiết để gửi thông báo, bảo mật phiên đăng nhập và vận hành ứng dụng.',
  'Dữ liệu sử dụng tổng hợp từ Firebase hoặc công cụ tương đương để cải thiện độ ổn định, nếu được bật trong bản phát hành.',
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
        <p className="mt-4 text-sm font-bold text-ink-muted">Cập nhật lần cuối: 04/05/2026</p>

        <section className="mt-8 space-y-4 text-base leading-8 text-ink-muted">
          <p>
            Chính sách này mô tả cách S-Loco thu thập, sử dụng, chia sẻ, lưu giữ và xóa dữ liệu khi
            bạn sử dụng ứng dụng S-Loco Tourist, S-Loco Vendor và các trang web liên quan.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
            Dữ liệu chúng tôi xử lý
          </h2>
          <ul className="list-disc space-y-2 pl-6">
            {dataItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Mục đích sử dụng</h2>
          <p>
            Dữ liệu được dùng để xác thực tài khoản, hiển thị dịch vụ địa phương, phát hành và đổi
            voucher, chăm sóc khách hàng, gửi thông báo liên quan đến đơn hàng, bảo vệ hệ thống và
            cải thiện chất lượng sản phẩm.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
            Chia sẻ với bên thứ ba
          </h2>
          <p>
            S-Loco chỉ chia sẻ dữ liệu với nhà cung cấp hạ tầng cần thiết cho vận hành, ví dụ
            Firebase cho thông báo/độ ổn định ứng dụng, nhà cung cấp thanh toán khi giao dịch được
            kích hoạt, và dịch vụ lưu trữ/phân tích bảo mật. Các bên này phải bảo vệ dữ liệu theo
            tiêu chuẩn phù hợp với chính sách này.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
            Lưu giữ và xóa dữ liệu
          </h2>
          <p>
            Dữ liệu tài khoản được lưu trong thời gian tài khoản còn hoạt động hoặc khi pháp luật
            yêu cầu lưu giữ hồ sơ giao dịch. Bạn có thể yêu cầu xóa tài khoản và dữ liệu liên quan
            tại{' '}
            <Link href="/delete-account" className="font-bold text-ocean hover:text-deep-ocean">
              trang xóa tài khoản
            </Link>
            . Một số dữ liệu giao dịch có thể được lưu lại để đáp ứng nghĩa vụ kế toán, chống gian
            lận hoặc giải quyết tranh chấp.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Liên hệ</h2>
          <p>
            Nếu có câu hỏi về quyền riêng tư, vui lòng liên hệ qua{' '}
            <Link href="/support" className="font-bold text-ocean hover:text-deep-ocean">
              trang hỗ trợ S-Loco
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
