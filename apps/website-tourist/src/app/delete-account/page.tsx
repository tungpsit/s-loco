import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Xóa tài khoản — S-Loco',
  description: 'Yêu cầu xóa tài khoản và dữ liệu S-Loco.',
}

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
          Người dùng Tourist và Vendor có thể khởi tạo yêu cầu xóa tài khoản từ trong app hoặc tại
          trang này. S-Loco sẽ xác minh chủ tài khoản trước khi xóa dữ liệu.
        </p>

        <section className="mt-8 space-y-5 text-base leading-8 text-ink-muted">
          <div className="rounded-3xl border border-line bg-coast p-5">
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
              Vendor và số điện thoại/email đăng nhập.
            </p>
          </div>
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">
              Dữ liệu sẽ được xóa
            </h2>
            <p className="mt-3">
              S-Loco sẽ xóa hoặc ẩn danh thông tin tài khoản, token thiết bị, hồ sơ cá nhân và dữ
              liệu không còn cần thiết cho vận hành dịch vụ. Hồ sơ giao dịch, voucher, đối soát hoặc
              dữ liệu chống gian lận có thể được lưu giữ khi pháp luật hoặc nghĩa vụ kế toán yêu
              cầu.
            </p>
          </div>
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Thời gian xử lý</h2>
            <p className="mt-3">
              Chúng tôi phản hồi yêu cầu trong vòng 7 ngày làm việc và hoàn tất xóa dữ liệu đủ điều
              kiện trong thời hạn phù hợp với quy định áp dụng.
            </p>
          </div>
        </section>
      </article>
    </main>
  )
}
