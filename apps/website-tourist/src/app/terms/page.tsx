import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng — S-Loco',
  description: 'Điều khoản sử dụng S-Loco cho khách du lịch và vendor.',
}

export default function TermsPage() {
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
          Điều khoản sử dụng
        </h1>
        <p className="mt-4 text-sm font-bold text-ink-muted">Cập nhật lần cuối: 04/05/2026</p>

        <section className="mt-8 space-y-4 text-base leading-8 text-ink-muted">
          <p>
            Khi sử dụng S-Loco, bạn đồng ý dùng nền tảng đúng mục đích: khám phá dịch vụ địa phương,
            đặt dịch vụ, quản lý voucher và vận hành cửa hàng theo thông tin trung thực.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Tài khoản</h2>
          <p>
            Người dùng chịu trách nhiệm bảo mật OTP, mật khẩu và thiết bị đăng nhập. Vendor cần cung
            cấp thông tin cửa hàng, dịch vụ, giá và điều kiện sử dụng voucher chính xác.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
            Voucher và thanh toán
          </h2>
          <p>
            Voucher, vé và coupon chỉ được sử dụng theo điều kiện hiển thị trong ứng dụng. Khi cổng
            thanh toán trực tuyến được kích hoạt, giao dịch sẽ được xử lý qua nhà cung cấp thanh
            toán được thông báo trong luồng thanh toán.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Nội dung bị cấm</h2>
          <p>
            Không sử dụng S-Loco để gian lận voucher, giả mạo thông tin dịch vụ, truy cập trái phép,
            gây gián đoạn hệ thống hoặc đăng nội dung vi phạm pháp luật.
          </p>
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Hỗ trợ và chấm dứt</h2>
          <p>
            S-Loco có thể tạm khóa tài khoản khi phát hiện rủi ro bảo mật, gian lận hoặc vi phạm
            điều khoản. Nếu cần hỗ trợ, vui lòng liên hệ qua{' '}
            <Link href="/support" className="font-bold text-ocean hover:text-deep-ocean">
              trang hỗ trợ
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  )
}
