import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Xóa tài khoản — S-Loco',
  description:
    'Hướng dẫn yêu cầu xóa tài khoản S-Loco Tourist hoặc S-Loco Vendor và dữ liệu liên quan.',
}

const requestSteps = [
  {
    title: '1. Gửi yêu cầu',
    body: 'Gửi email từ địa chỉ hoặc số điện thoại liên kết với tài khoản nếu có thể. Nếu bạn không còn truy cập được tài khoản, hãy mô tả rõ tình huống để S-Loco xác minh thủ công.',
  },
  {
    title: '2. Xác minh chủ tài khoản',
    body: 'S-Loco có thể yêu cầu xác nhận OTP, email, mã đơn hàng gần nhất hoặc thông tin vendor để đảm bảo yêu cầu đến từ đúng chủ tài khoản.',
  },
  {
    title: '3. Xử lý dữ liệu',
    body: 'Sau khi xác minh, S-Loco sẽ vô hiệu hóa tài khoản và xóa hoặc ẩn danh dữ liệu đủ điều kiện theo chính sách riêng tư.',
  },
]

const deletedData = [
  'Thông tin hồ sơ tài khoản như tên hiển thị, thông tin liên hệ phụ và cài đặt cá nhân không còn cần thiết.',
  'Token thiết bị, phiên đăng nhập, tùy chọn thông báo và dữ liệu chẩn đoán không cần giữ lại.',
  'Dữ liệu sử dụng hoặc gợi ý cá nhân hóa có thể được xóa hoặc ẩn danh khỏi hồ sơ người dùng.',
  'Nội dung hỗ trợ không liên quan đến giao dịch, gian lận, bảo mật hoặc nghĩa vụ pháp lý đang mở.',
]

const retainedData = [
  'Hồ sơ giao dịch, thanh toán, hoàn tiền, voucher, QR redemption và đối soát cần lưu cho kế toán, thuế, kiểm toán hoặc xử lý tranh chấp.',
  'Dữ liệu chống gian lận, log bảo mật hoặc bằng chứng liên quan đến truy cập trái phép, lạm dụng voucher hoặc vi phạm điều khoản.',
  'Thông tin vendor cần giữ để đáp ứng nghĩa vụ hợp đồng, thanh toán, đối soát hoặc yêu cầu pháp luật áp dụng.',
]

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8 lg:px-10">
      <article className="mx-auto max-w-4xl rounded-[2rem] border border-line bg-white p-6 shadow-[0_30px_90px_-64px_rgba(2,75,134,0.9)] md:p-10">
        <Link href="/" className="text-sm font-bold text-ocean transition hover:text-deep-ocean">
          ← Về trang chủ
        </Link>
        <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-ocean">
          Account Deletion
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.035em] text-deep-ocean md:text-5xl">
          Xóa tài khoản S-Loco
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">
          Người dùng S-Loco Tourist và S-Loco Vendor có thể yêu cầu xóa tài khoản từ trong app hoặc
          qua trang này. S-Loco sẽ xác minh chủ tài khoản trước khi vô hiệu hóa tài khoản và xử lý
          dữ liệu liên quan.
        </p>

        <section className="mt-8 rounded-3xl border border-line bg-coast p-5 text-base leading-8 text-ink-muted">
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Cách gửi yêu cầu</h2>
          <p className="mt-3">
            Gửi email tới{' '}
            <a
              className="font-bold text-ocean hover:text-deep-ocean"
              href="mailto:privacy@sloco.vn?subject=Yeu%20cau%20xoa%20tai%20khoan%20S-Loco"
            >
              privacy@sloco.vn
            </a>{' '}
            với tiêu đề “Yêu cầu xóa tài khoản S-Loco”. Vui lòng ghi rõ bạn dùng app Tourist hay
            Vendor, số điện thoại/email đăng nhập và lý do cần hỗ trợ nếu có.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {requestSteps.map((step) => (
            <section key={step.title} className="rounded-3xl border border-line bg-white p-5">
              <h2 className="text-xl font-black tracking-tight text-deep-ocean">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink-muted">{step.body}</p>
            </section>
          ))}
        </section>

        <section className="mt-8 space-y-5 text-base leading-8 text-ink-muted">
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              Dữ liệu sẽ được xóa hoặc ẩn danh
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {deletedData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              Dữ liệu có thể cần lưu giữ
            </h2>
            <p className="mt-3">
              Một số dữ liệu không thể xóa ngay nếu S-Loco cần lưu để hoàn tất giao dịch, tuân thủ
              pháp luật hoặc bảo vệ quyền lợi của khách du lịch, vendor và nền tảng:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              {retainedData.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-sand-soft p-5">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Thời gian xử lý</h2>
            <p className="mt-3">
              S-Loco phản hồi yêu cầu trong vòng 7 ngày làm việc. Việc xóa hoặc ẩn danh dữ liệu đủ
              điều kiện sẽ được hoàn tất trong thời hạn phù hợp với quy định áp dụng và trạng thái
              giao dịch của tài khoản.
            </p>
            <p className="mt-3">
              Nếu cần hỗ trợ thêm, vui lòng xem{' '}
              <Link href="/privacy" className="font-bold text-ocean hover:text-deep-ocean">
                chính sách riêng tư
              </Link>{' '}
              hoặc liên hệ qua{' '}
              <Link href="/support" className="font-bold text-ocean hover:text-deep-ocean">
                trang hỗ trợ
              </Link>
              .
            </p>
          </div>
        </section>
      </article>
    </main>
  )
}
