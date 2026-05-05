import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hỗ trợ — S-Loco',
  description:
    'Kênh hỗ trợ chính thức của S-Loco cho khách du lịch, vendor, thanh toán, voucher, QR và yêu cầu dữ liệu.',
}

const supportOptions = [
  {
    title: 'Tài khoản và đăng nhập',
    body: 'Hỗ trợ OTP, email đăng nhập vendor/admin, đổi thiết bị, phiên đăng nhập bất thường và bảo mật tài khoản.',
  },
  {
    title: 'Đơn hàng, voucher và QR',
    body: 'Hỗ trợ đặt dịch vụ, điều kiện voucher, lỗi mã QR, voucher chưa dùng, hoàn tiền và tranh chấp tại điểm dịch vụ.',
  },
  {
    title: 'Thanh toán',
    body: 'Hỗ trợ giao dịch qua cổng thanh toán, giao dịch chờ xử lý, hoàn tiền, biên nhận và kiểm tra trạng thái thanh toán.',
  },
  {
    title: 'Vendor',
    body: 'Hỗ trợ quản lý dịch vụ, vị trí cửa hàng, xác nhận voucher, quét QR, thông báo đơn hàng và đối soát doanh thu.',
  },
  {
    title: 'Quyền riêng tư',
    body: 'Hỗ trợ yêu cầu truy cập, chỉnh sửa, xuất thông tin hoặc xóa dữ liệu tài khoản S-Loco.',
  },
  {
    title: 'Góp ý sản phẩm',
    body: 'Tiếp nhận phản hồi về dịch vụ địa phương, gợi ý hành trình, nội dung Sầm Sơn và trải nghiệm sử dụng app.',
  },
]

const contactChecklist = [
  'Vai trò tài khoản: Tourist, Vendor hoặc Admin.',
  'Số điện thoại hoặc email dùng để đăng nhập.',
  'Mã đơn hàng, mã voucher, mã giao dịch hoặc tên vendor nếu vấn đề liên quan đến dịch vụ cụ thể.',
  'Ảnh chụp màn hình lỗi, thời điểm phát sinh và thiết bị đang sử dụng nếu có.',
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
          Đây là kênh hỗ trợ chính thức cho app S-Loco Tourist, S-Loco Vendor và các dịch vụ liên
          quan. Gửi yêu cầu qua email{' '}
          <a className="font-bold text-ocean hover:text-deep-ocean" href="mailto:support@sloco.vn">
            support@sloco.vn
          </a>
          . S-Loco phản hồi yêu cầu thông thường trong vòng 2 ngày làm việc; các vấn đề thanh toán,
          bảo mật hoặc không dùng được voucher sẽ được ưu tiên xử lý sớm hơn.
        </p>

        <section className="mt-8 rounded-3xl bg-sand-soft p-5 text-sm leading-7 text-ink-muted">
          <h2 className="text-xl font-black tracking-tight text-deep-ocean">Khi liên hệ hỗ trợ</h2>
          <p className="mt-3">Vui lòng gửi kèm các thông tin sau để S-Loco kiểm tra nhanh hơn:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            {contactChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {supportOptions.map((option) => (
            <section key={option.title} className="rounded-3xl border border-line bg-coast p-5">
              <h2 className="text-xl font-black tracking-tight text-deep-ocean">{option.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{option.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-line bg-white p-5 text-sm leading-7 text-ink-muted">
            <h2 className="text-xl font-black tracking-tight text-deep-ocean">
              Yêu cầu xóa tài khoản
            </h2>
            <p className="mt-3">
              Nếu bạn muốn xóa tài khoản và dữ liệu liên quan, vui lòng dùng trang{' '}
              <Link href="/delete-account" className="font-bold text-ocean hover:text-deep-ocean">
                xóa tài khoản
              </Link>{' '}
              để gửi đúng luồng xử lý.
            </p>
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 text-sm leading-7 text-ink-muted">
            <h2 className="text-xl font-black tracking-tight text-deep-ocean">Thông tin pháp lý</h2>
            <p className="mt-3">
              Bạn có thể xem thêm{' '}
              <Link href="/privacy" className="font-bold text-ocean hover:text-deep-ocean">
                chính sách riêng tư
              </Link>{' '}
              và{' '}
              <Link href="/terms" className="font-bold text-ocean hover:text-deep-ocean">
                điều khoản sử dụng
              </Link>{' '}
              của S-Loco.
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}
