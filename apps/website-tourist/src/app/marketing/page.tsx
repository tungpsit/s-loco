import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'S-Loco Tourist — Du lịch Sầm Sơn trong một app',
  description:
    'S-Loco Tourist giúp khách du lịch khám phá Sầm Sơn, tìm dịch vụ địa phương, nhận voucher điện tử, quét QR và lập lịch trình thông minh.',
}

const features = [
  {
    title: 'Khám phá dịch vụ địa phương',
    body: 'Tìm nhà hàng, hải sản, cà phê, khách sạn, homestay, spa, xe điện, điểm vui chơi, mua sắm và sự kiện quanh Sầm Sơn.',
  },
  {
    title: 'Voucher điện tử và QR',
    body: 'Mua voucher trong app, xem điều kiện sử dụng rõ ràng và dùng mã QR tại điểm dịch vụ để hạn chế nhầm lẫn khi đi du lịch.',
  },
  {
    title: 'Giá và điều kiện minh bạch',
    body: 'Thông tin dịch vụ, giá, khung giờ áp dụng và điều kiện voucher được chuẩn hóa để khách dễ so sánh trước khi quyết định.',
  },
  {
    title: 'Gợi ý hành trình thông minh',
    body: 'Nhập thời gian lưu trú, ngân sách, số người và sở thích để nhận gợi ý lịch trình phù hợp với chuyến đi Sầm Sơn.',
  },
]

const audiences = [
  'Gia đình đi nghỉ ngắn ngày cần tìm dịch vụ đáng tin cậy.',
  'Nhóm bạn hoặc cặp đôi muốn lên lịch trình nhanh, rõ ngân sách.',
  'Khách du lịch muốn dùng ưu đãi địa phương mà vẫn có thông tin minh bạch.',
  'Vendor địa phương muốn tiếp cận khách du lịch và vận hành voucher dễ hơn.',
]

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-8 lg:px-10">
      <article className="mx-auto max-w-5xl rounded-[2rem] border border-line bg-white p-6 shadow-[0_30px_90px_-64px_rgba(2,75,134,0.9)] md:p-10">
        <Link href="/" className="text-sm font-bold text-ocean transition hover:text-deep-ocean">
          ← Về trang chủ
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-ocean">
              S-Loco Tourist
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-deep-ocean md:text-6xl">
              Du lịch Sầm Sơn dễ hơn trong một ứng dụng
            </h1>
            <p className="mt-5 text-lg leading-8 text-ink-muted">
              S-Loco là nền tảng du lịch địa phương kết nối khách du lịch với vendor tại Sầm Sơn
              thông qua khám phá dịch vụ, voucher điện tử, thanh toán, mã QR và gợi ý hành trình cá
              nhân hóa.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#download"
                className="rounded-full bg-deep-ocean px-6 py-3 text-center text-sm font-bold text-white shadow-[0_18px_40px_-26px_rgba(2,75,134,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-ocean focus:outline-none focus:ring-4 focus:ring-sky/30 active:scale-[0.98]"
              >
                Tải app S-Loco
              </a>
              <Link
                href="/support"
                className="rounded-full border border-line bg-white px-6 py-3 text-center text-sm font-bold text-deep-ocean transition hover:border-ocean hover:text-ocean"
              >
                Cần hỗ trợ?
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] bg-coast p-6">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-ocean">Phù hợp cho</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-ink-muted">
              {audiences.map((item) => (
                <li key={item} className="rounded-2xl bg-white px-4 py-3 font-bold text-[#243b57]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Tính năng nổi bật</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <section key={feature.title} className="rounded-3xl border border-line bg-white p-5">
                <h3 className="text-xl font-black tracking-tight text-deep-ocean">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-ink-muted">{feature.body}</p>
              </section>
            ))}
          </div>
        </section>

        <section id="download" className="mt-10 rounded-3xl bg-sand-soft p-6 text-ink-muted">
          <h2 className="text-2xl font-black tracking-tight text-deep-ocean">Tải app</h2>
          <p className="mt-3 text-base leading-8">
            S-Loco Tourist đang được chuẩn bị phát hành trên App Store. Khi có bản chính thức, đường
            dẫn tải app sẽ được cập nhật tại trang này và trang chủ S-Loco.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/privacy" className="text-ocean hover:text-deep-ocean">
              Chính sách riêng tư
            </Link>
            <Link href="/terms" className="text-ocean hover:text-deep-ocean">
              Điều khoản sử dụng
            </Link>
            <Link href="/delete-account" className="text-ocean hover:text-deep-ocean">
              Xóa tài khoản
            </Link>
          </div>
        </section>
      </article>
    </main>
  )
}
