import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hỗ trợ — S-Loco',
  description: 'Kênh hỗ trợ S-Loco cho khách du lịch, vendor và yêu cầu bảo mật dữ liệu.',
}

const supportOptions = [
  {
    title: 'Khách du lịch',
    body: 'Hỗ trợ đăng nhập OTP, voucher, đặt dịch vụ, hoàn tiền và lỗi khi dùng QR tại điểm dịch vụ.',
  },
  {
    title: 'Vendor',
    body: 'Hỗ trợ đăng nhập, quản lý dịch vụ, vị trí cửa hàng, quét QR, đối soát và thông báo đơn hàng.',
  },
  {
    title: 'Quyền riêng tư',
    body: 'Hỗ trợ yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu tài khoản S-Loco.',
  },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8 lg:px-10">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-line bg-white p-6 shadow-[0_30px_90px_-64px_rgba(2,75,134,0.9)] md:p-10">
        <Link href="/" className="text-sm font-bold text-ocean transition hover:text-deep-ocean">
          ← Về trang chủ
        </Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-ocean">
          S-Loco Support
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-deep-ocean md:text-5xl">
          Hỗ trợ người dùng
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">
          Gửi yêu cầu hỗ trợ qua email{' '}
          <a className="font-bold text-ocean hover:text-deep-ocean" href="mailto:support@sloco.vn">
            support@sloco.vn
          </a>
          . Khi liên hệ, vui lòng mô tả vấn đề, vai trò tài khoản và mã đơn/voucher nếu có.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {supportOptions.map((option) => (
            <section key={option.title} className="rounded-3xl border border-line bg-coast p-5">
              <h2 className="text-xl font-black tracking-tight text-deep-ocean">{option.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{option.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 rounded-3xl bg-sand-soft p-5 text-sm leading-7 text-ink-muted">
          <p className="font-black text-deep-ocean">Yêu cầu xóa tài khoản</p>
          <p>
            Nếu bạn muốn xóa tài khoản và dữ liệu liên quan, vui lòng dùng trang{' '}
            <Link href="/delete-account" className="font-bold text-ocean hover:text-deep-ocean">
              xóa tài khoản
            </Link>{' '}
            để gửi đúng luồng xử lý.
          </p>
        </div>
      </article>
    </main>
  )
}
