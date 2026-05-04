import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import {
  marketPainPoints,
  marketSignals,
  platformSides,
  policyStates,
  revenueSplit,
  revenueStreams,
  riskMitigations,
  roadmap,
  serviceCategories,
  settlementModes,
  transactionFlow,
  vendorOnboarding,
  voucherStates,
} from '@/content/pitch'

const contactHref =
  'mailto:invest@sloco.vn?subject=Li%C3%AAn%20h%E1%BB%87%20%C4%91%E1%BA%A7u%20t%C6%B0%20S-Loco'

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12h13m-5-6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m5.5 12.5 4.1 4.1 8.9-9.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
      {children}
    </p>
  )
}

function VisualPanel({
  src,
  alt,
  label,
  caption,
  className = '',
}: {
  src: string
  alt: string
  label: string
  caption: string
  className?: string
}) {
  return (
    <figure
      className={`overflow-hidden rounded-[2.35rem] border border-white/80 bg-white/72 p-3 shadow-[0_24px_70px_-48px_rgba(0,94,151,0.6)] backdrop-blur ${className}`}
    >
      <Image
        className="block w-full rounded-[1.9rem] object-cover"
        src={src}
        alt={alt}
        width={1400}
        height={920}
        loading="lazy"
      />
      <figcaption className="grid gap-2 px-3 pb-3 pt-5 md:grid-cols-[auto_1fr] md:items-baseline">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">
          {label}
        </span>
        <span className="text-sm leading-6 text-muted">{caption}</span>
      </figcaption>
    </figure>
  )
}

function QrMark() {
  const cells = [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [5, 0],
    [6, 0],
    [7, 0],
    [5, 1],
    [7, 1],
    [5, 2],
    [6, 2],
    [7, 2],
    [0, 5],
    [1, 5],
    [2, 5],
    [0, 6],
    [2, 6],
    [0, 7],
    [1, 7],
    [2, 7],
    [4, 4],
    [6, 4],
    [7, 5],
    [4, 6],
    [5, 7],
    [7, 7],
  ]

  return (
    <div className="relative grid h-24 w-24 grid-cols-8 gap-1 rounded-3xl border border-white/70 bg-white/86 p-3 shadow-[0_18px_44px_-24px_rgba(0,94,151,0.56)]">
      <div className="scan-line absolute inset-x-3 top-1/2 h-6 rounded-full bg-accent-soft/55 blur-sm" />
      {Array.from({ length: 64 }).map((_, index) => {
        const x = index % 8
        const y = Math.floor(index / 8)
        const active = cells.some(([cellX, cellY]) => cellX === x && cellY === y)
        return (
          <span
            className={
              active ? 'rounded-[0.22rem] bg-accent-dark' : 'rounded-[0.22rem] bg-slate-100'
            }
            key={`${x}-${y}`}
          />
        )
      })}
    </div>
  )
}

function HeroVisual() {
  return (
    <div className="relative min-h-[620px] overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/70 p-4 shadow-[0_28px_70px_-42px_rgba(0,94,151,0.55)] backdrop-blur-xl md:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(144,224,239,0.34),transparent_18rem),radial-gradient(circle_at_76%_24%,rgba(255,244,223,0.9),transparent_16rem)]" />
      <Image
        className="absolute right-5 top-5 h-16 w-16 rounded-[1.35rem] border border-white/80 bg-white/80 object-cover p-1 shadow-[0_18px_42px_-28px_rgba(0,94,151,0.75)]"
        src="/icon_tourist.png"
        alt="Biểu tượng ứng dụng S-Loco Sầm Sơn"
        width={64}
        height={64}
        priority
      />
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full text-accent/48"
        preserveAspectRatio="none"
        viewBox="0 0 620 620"
      >
        <path
          className="route-dash"
          d="M68 350 C 160 205, 246 485, 348 314 S 470 132, 560 252"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className="route-dash"
          d="M104 190 C 218 78, 298 182, 386 146 S 504 132, 558 68"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeOpacity="0.36"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative grid min-h-[572px] grid-cols-1 gap-4 md:grid-cols-[1.03fr_0.97fr]">
        <div className="float-slow flex flex-col justify-between rounded-[1.9rem] border border-white/80 bg-white/78 p-5 shadow-[0_20px_50px_-34px_rgba(0,0,0,0.24)]">
          <div>
            <div className="mb-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
              <span>Tourist app</span>
              <span>Sầm Sơn</span>
            </div>
            <div className="overflow-hidden rounded-[1.45rem] bg-surface-blue">
              <div className="h-40 bg-[linear-gradient(135deg,rgba(0,119,182,0.82),rgba(72,202,228,0.42)),url('/hero-beach.svg')] bg-cover bg-center" />
              <div className="space-y-4 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    AI itinerary
                  </p>
                  <h3 className="mt-1 text-balance font-display text-2xl font-semibold tracking-normal text-foreground">
                    Gia đình 4 người, 2 ngày 1 đêm
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['Ăn hải sản', 'Xe điện ven biển', 'Vé vui chơi', 'Cafe ngắm biển'].map(
                    (item) => (
                      <div
                        className="rounded-2xl border border-white/90 bg-white p-3 text-sm font-medium"
                        key={item}
                      >
                        {item}
                      </div>
                    ),
                  )}
                </div>
                <div className="rounded-2xl bg-foreground p-4 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">Tổng voucher</span>
                    <span className="font-mono text-lg font-semibold">950.000đ</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/14">
                    <div className="pulse-soft h-full w-[64%] rounded-full bg-accent-soft" />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/64">
                    Đã giảm 5% so với giá tại chỗ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="float-medium rounded-[1.9rem] border border-white/80 bg-white/82 p-5 shadow-[0_20px_48px_-36px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">
                  QR redemption
                </p>
                <h3 className="mt-2 text-balance font-display text-2xl font-semibold tracking-normal">
                  Quét hai chiều tại vendor
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Vendor quét khách hoặc khách quét QR cố định tại quầy. Voucher chuyển sang
                  REDEEMED ngay sau khi hợp lệ.
                </p>
              </div>
              <QrMark />
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-white/80 bg-white/82 p-5 shadow-[0_20px_48px_-36px_rgba(0,0,0,0.28)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">
              Money hold
            </p>
            <div className="mt-5 space-y-4">
              {[
                ['Khách trả', '950.000đ', '95%'],
                ['S-Loco giữ', '30.000đ', '3%'],
                ['Vendor nhận', '920.000đ', '92%'],
              ].map(([label, value, percent], index) => (
                <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={label}>
                  <div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="pulse-soft h-full rounded-full bg-accent"
                        style={{ animationDelay: `${index * 260}ms`, width: percent }}
                      />
                    </div>
                    <p className="text-sm text-muted">{label}</p>
                  </div>
                  <p className="font-mono text-xl font-semibold tracking-normal">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-white/80 bg-sand/86 p-5 shadow-[0_20px_48px_-36px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">
              Settlement
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-normal">
              COMPLETED → batch 3 ngày → SETTLED
            </h3>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarketSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28" id="market">
      <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-end">
        <div>
          <SectionLabel>Thị trường khởi đầu</SectionLabel>
          <h2 className="max-w-[12ch] text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-6xl md:leading-[0.96]">
            Sầm Sơn là điểm rơi tốt cho local-first commerce.
          </h2>
        </div>
        <p className="max-w-[65ch] text-base leading-8 text-muted">
          Sầm Sơn có lưu lượng du khách lớn theo mùa, nhu cầu ngắn ngày cao và mạng lưới dịch vụ địa
          phương dày nhưng phân mảnh. S-Loco bắt đầu tại đây để chuẩn hóa trải nghiệm đặt dịch vụ,
          xác thực voucher và đối soát trước khi mở rộng sang các điểm đến du lịch Việt Nam tương
          tự.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2.5rem] border border-white/80 bg-white/76 p-6 shadow-[0_20px_60px_-44px_rgba(0,94,151,0.5)] md:p-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
            Bài toán hiện tại
          </p>
          <div className="mt-7 grid gap-3">
            {marketPainPoints.map((point) => (
              <div className="flex gap-3 rounded-2xl bg-surface-blue/72 p-4" key={point}>
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-dark" />
                <p className="text-sm leading-6 text-foreground">{point}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {marketSignals.map((signal) => (
            <div
              className="rounded-[2rem] bg-white/76 p-6 shadow-[0_18px_52px_-42px_rgba(0,94,151,0.45)]"
              key={signal.value}
            >
              <p className="font-display text-3xl font-semibold tracking-normal text-accent-dark">
                {signal.value}
              </p>
              <p className="mt-4 text-sm leading-7 text-muted">{signal.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[2rem] border border-line bg-white/58 py-4">
        <div className="marquee-track flex w-max gap-3 px-4">
          {serviceCategories
            .flatMap((category) =>
              [`${category}-a`, `${category}-b`].map((id) => ({ id, category })),
            )
            .map(({ id, category }) => (
              <span
                className="rounded-full border border-line bg-white/80 px-5 py-3 text-sm font-semibold text-foreground"
                key={id}
              >
                {category}
              </span>
            ))}
        </div>
      </div>
    </section>
  )
}

function FlowSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28" id="flow">
      <div className="grid gap-10 md:grid-cols-[0.82fr_1.18fr] md:gap-14">
        <div className="md:sticky md:top-8 md:h-fit">
          <SectionLabel>Luồng vận hành</SectionLabel>
          <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] text-foreground md:text-6xl md:leading-[0.96]">
            Một luồng giao dịch dùng được cho nhiều loại dịch vụ.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-muted">
            Nhà hàng, spa, xe điện, tour hay khách sạn đều đi qua cùng một lõi: chọn dịch vụ, trả
            trước, nhận voucher, quét QR, hoàn tất và đối soát. Các nhánh cấu hình nằm trước thanh
            toán, không làm vỡ mô hình vận hành.
          </p>
        </div>

        <div className="relative space-y-5">
          <VisualPanel
            src="/visuals/operating-flow.svg"
            alt="Sơ đồ trực quan luồng vận hành S-Loco từ khám phá dịch vụ đến đối soát"
            label="Operating map"
            caption="Ảnh trực quan hóa toàn bộ hành trình: tourist app, AI itinerary, voucher QR, vendor scan và admin dashboard."
          />
          <div className="relative pl-0 md:pl-10">
            <div className="absolute left-6 top-8 hidden h-[calc(100%-4rem)] w-px bg-line md:block" />
            <div className="space-y-5">
              {transactionFlow.map((step, index) => (
                <article
                  className="reveal-up relative rounded-[2rem] border border-white/80 bg-white/78 p-5 shadow-[0_18px_52px_-42px_rgba(0,94,151,0.48)] backdrop-blur md:p-7"
                  key={step.eyebrow}
                  style={{ '--delay': `${index * 80}ms` } as CSSProperties}
                >
                  <div className="mb-5 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-dark font-mono text-sm font-semibold text-white">
                      {step.eyebrow}
                    </span>
                    <div className="h-px flex-1 bg-line" />
                  </div>
                  <h3 className="text-balance font-display text-2xl font-semibold tracking-normal md:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base leading-8 text-muted">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MoneyFlowSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28" id="money">
      <div className="rounded-[2.7rem] border border-white/80 bg-white/72 p-6 shadow-[0_28px_70px_-48px_rgba(0,94,151,0.58)] backdrop-blur md:p-10">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Dòng tiền</SectionLabel>
            <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-6xl md:leading-[0.98]">
              Voucher Pre-pay & Hold bảo vệ cả khách và vendor.
            </h2>
            <p className="mt-6 max-w-[62ch] text-base leading-8 text-muted">
              Khách thanh toán trước để giảm no-show. Tiền được giữ tạm cho đến khi dịch vụ hoàn
              tất, rồi hệ thống tính hoa hồng, vendor net và trạng thái giải ngân. Đây là lõi tài
              chính giúp S-Loco kiểm soát giao dịch mà vẫn đơn giản cho vendor địa phương.
            </p>
          </div>
          <div className="grid gap-4">
            <VisualPanel
              src="/visuals/money-flow.svg"
              alt="Sơ đồ dòng tiền Voucher Pre-pay and Hold của S-Loco"
              label="Money flow"
              caption="Khách trả trước, S-Loco giữ tạm, hoa hồng nền tảng được tách ra và vendor nhận tiền sau khi dịch vụ hoàn tất."
            />
            {revenueSplit.map((item, index) => (
              <article
                className="reveal-up grid gap-5 rounded-[2rem] bg-surface-blue/80 p-5 md:grid-cols-[auto_1fr_auto] md:items-center"
                key={item.label}
                style={{ '--delay': `${index * 90}ms` } as CSSProperties}
              >
                <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-white font-display text-2xl font-semibold text-accent-dark shadow-[0_18px_34px_-28px_rgba(0,94,151,0.7)]">
                  {item.percent}
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-normal">
                    {item.label}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                </div>
                <p className="font-mono text-2xl font-semibold tracking-normal text-foreground">
                  {item.amount}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 border-t border-line pt-8 md:grid-cols-4">
          {revenueStreams.map((stream) => (
            <div className="rounded-2xl bg-white/70 p-4" key={stream}>
              <p className="text-sm font-medium leading-6 text-foreground">{stream}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function VoucherLifecycleSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="grid gap-10 md:grid-cols-[1fr_0.92fr] md:items-start">
        <div>
          <SectionLabel>Voucher state machine</SectionLabel>
          <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-6xl md:leading-[0.98]">
            Trạng thái voucher là sổ cái vận hành của S-Loco.
          </h2>
          <p className="mt-6 max-w-[64ch] text-base leading-8 text-muted">
            Mỗi voucher cho biết tiền đang ở đâu, dịch vụ đã dùng chưa, vendor đã đủ điều kiện nhận
            tiền chưa và khách còn quyền hoàn hoặc chuyển nhượng không. Nhà đầu tư nhìn vào đây sẽ
            thấy cách nền tảng kiểm soát rủi ro vận hành.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {policyStates.map((state) => (
              <div className="rounded-2xl border border-line bg-white/70 p-4" key={state.code}>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark">
                  {state.code}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">{state.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <VisualPanel
            src="/visuals/voucher-lifecycle.svg"
            alt="Sơ đồ vòng đời voucher S-Loco từ CREATED đến SETTLED"
            label="State machine"
            caption="Voucher lifecycle cho nhà đầu tư thấy cách S-Loco kiểm soát thanh toán, sử dụng dịch vụ, hoàn tiền và giải ngân."
          />
          <div className="rounded-[2.5rem] border border-white/80 bg-white/76 p-5 shadow-[0_20px_60px_-44px_rgba(0,94,151,0.5)] md:p-7">
            <div className="space-y-3">
              {voucherStates.map((state, index) => (
                <div className="relative" key={state.code}>
                  <div className="grid grid-cols-[auto_1fr] gap-4 rounded-[1.6rem] bg-surface-blue/78 p-4">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-dark font-mono text-xs font-semibold text-white">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark">
                        {state.code}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted">{state.label}</p>
                    </div>
                  </div>
                  {index < voucherStates.length - 1 ? (
                    <div className="mx-auto h-5 w-px bg-line" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PlatformSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28" id="model">
      <div className="max-w-3xl">
        <SectionLabel>Nền tảng ba phía</SectionLabel>
        <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-6xl md:leading-[0.98]">
          S-Loco tạo giá trị cùng lúc cho khách, vendor và đội vận hành.
        </h2>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
        {platformSides.map((side, index) => (
          <article
            className={`reveal-up rounded-[2.35rem] border border-white/80 bg-white/76 p-6 shadow-[0_20px_60px_-46px_rgba(0,94,151,0.52)] backdrop-blur md:p-8 ${
              index === 2 ? 'md:col-span-2 md:grid md:grid-cols-[0.72fr_1.28fr] md:gap-12' : ''
            }`}
            key={side.name}
            style={{ '--delay': `${index * 120}ms` } as CSSProperties}
          >
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                {side.name}
              </p>
              <h3 className="mt-5 text-balance font-display text-2xl font-semibold tracking-[-0.01em] md:text-3xl">
                {side.headline}
              </h3>
            </div>
            <ul className="mt-8 grid gap-3 md:mt-0">
              {side.details.map((detail) => (
                <li
                  className="flex items-center gap-3 rounded-2xl bg-surface-blue/70 p-4 text-sm font-medium leading-6"
                  key={detail}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-dark text-white">
                    <CheckIcon />
                  </span>
                  {detail}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

function SettlementAndRolloutSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="grid gap-5 md:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2.5rem] border border-white/80 bg-white/76 p-6 shadow-[0_20px_60px_-44px_rgba(0,94,151,0.5)] md:p-8">
          <SectionLabel>Đối soát</SectionLabel>
          <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-5xl md:leading-[0.98]">
            Vendor chọn nhịp nhận tiền phù hợp vận hành.
          </h2>
          <div className="mt-8 grid gap-4">
            {settlementModes.map((mode) => (
              <article className="rounded-[1.8rem] bg-surface-blue/78 p-5" key={mode.title}>
                <h3 className="font-display text-2xl font-semibold tracking-normal">
                  {mode.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">{mode.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/80 bg-sand/74 p-6 shadow-[0_20px_60px_-44px_rgba(0,94,151,0.38)] md:p-8">
          <SectionLabel>Onboard vendor</SectionLabel>
          <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-5xl md:leading-[0.98]">
            Mạng lưới địa phương là hào lũy cạnh tranh.
          </h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {vendorOnboarding.map((step, index) => (
              <div
                className="grid grid-cols-[auto_1fr] gap-3 rounded-2xl bg-white/70 p-4"
                key={step}
              >
                <span className="font-mono text-sm font-semibold text-accent-dark">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-sm font-medium leading-6 text-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RoadmapSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="rounded-[2.7rem] border border-white/80 bg-white/72 p-6 shadow-[0_28px_70px_-48px_rgba(0,94,151,0.58)] backdrop-blur md:p-10">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>Lộ trình sản phẩm</SectionLabel>
            <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-6xl md:leading-[0.98]">
              Xây từ lõi giao dịch đến lớp AI tạo nhu cầu.
            </h2>
          </div>
          <div className="grid gap-3">
            {roadmap.map((item, index) => (
              <div
                className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-2xl bg-surface-blue/72 p-4"
                key={item}
              >
                <span className="font-mono text-sm font-semibold text-accent-dark">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-sm font-medium text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RiskSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
      <div className="grid gap-10 md:grid-cols-[0.75fr_1.25fr] md:items-start">
        <div>
          <SectionLabel>Rủi ro và kiểm soát</SectionLabel>
          <h2 className="text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-5xl md:leading-[0.98]">
            Các rủi ro chính đã được đưa vào thiết kế vận hành.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {riskMitigations.map((item) => (
            <article
              className="rounded-[2rem] bg-white/72 p-5 shadow-[0_18px_52px_-42px_rgba(0,94,151,0.42)]"
              key={item.risk}
            >
              <h3 className="font-display text-2xl font-semibold tracking-normal">{item.risk}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.mitigation}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-full focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground"
        href="#content"
      >
        Bỏ qua điều hướng
      </a>
      <div className="noise-layer" />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 md:px-8 md:py-6">
        <a className="flex items-center gap-3" href="#top">
          <Image
            className="h-11 w-11 rounded-[1.15rem] border border-white/80 bg-white object-cover p-0.5 shadow-[0_16px_35px_-22px_rgba(0,94,151,0.9)]"
            src="/icon_tourist.png"
            alt="S-Loco Sầm Sơn"
            width={44}
            height={44}
            priority
          />
          <span>
            <span className="block font-display text-sm font-semibold tracking-normal">S-Loco</span>
            <span className="hidden text-xs text-muted sm:block">Local travel commerce</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          <a className="transition hover:text-foreground" href="#market">
            Thị trường
          </a>
          <a className="transition hover:text-foreground" href="#flow">
            Luồng vận hành
          </a>
          <a className="transition hover:text-foreground" href="#money">
            Dòng tiền
          </a>
          <a className="transition hover:text-foreground" href="#model">
            Mô hình
          </a>
        </nav>
        <a
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark active:translate-y-0 sm:px-5"
          href={contactHref}
        >
          Liên hệ đầu tư
          <ArrowRightIcon />
        </a>
      </header>

      <section
        className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 md:grid-cols-[0.86fr_1.14fr] md:px-8 md:pb-24 md:pt-16"
        id="top"
      >
        <div
          className="reveal-up flex flex-col justify-center"
          id="content"
          style={{ '--delay': '80ms' } as CSSProperties}
        >
          <p className="mb-5 w-fit rounded-full border border-line bg-white/72 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark backdrop-blur">
            Sầm Sơn investor pitch
          </p>
          <h1 className="text-balance font-display text-5xl font-semibold tracking-[-0.018em] text-foreground md:text-7xl md:leading-[0.92]">
            Siêu ứng dụng du lịch bản địa tại Sầm Sơn.
          </h1>
          <p className="mt-7 max-w-[64ch] text-lg leading-9 text-muted">
            S-Loco số hóa hệ sinh thái dịch vụ địa phương bằng voucher trả trước, QR xác thực, AI
            tạo lịch trình và dashboard đối soát. Đây là lớp hạ tầng giúp du khách tin hơn, vendor
            bán tốt hơn và dòng tiền du lịch trở nên đo lường được.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-dark px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_42px_-28px_rgba(0,94,151,0.86)] transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark active:translate-y-0"
              href={contactHref}
            >
              Liên hệ đầu tư
              <ArrowRightIcon />
            </a>
            <a
              className="inline-flex items-center justify-center rounded-full border border-line bg-white/70 px-6 py-4 text-sm font-semibold text-foreground backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark active:translate-y-0"
              href="#money"
            >
              Xem dòng tiền
            </a>
          </div>
          <div className="mt-12 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
            {['95% khách trả', '3% S-Loco', '92% vendor'].map((item) => (
              <div key={item}>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  Money split
                </p>
                <p className="mt-2 font-display text-lg font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal-up" style={{ '--delay': '180ms' } as CSSProperties}>
          <HeroVisual />
        </div>
      </section>

      <MarketSection />
      <FlowSection />
      <MoneyFlowSection />
      <VoucherLifecycleSection />
      <PlatformSection />
      <SettlementAndRolloutSection />
      <RoadmapSection />
      <RiskSection />

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-16 md:px-8 md:pb-14">
        <div className="relative overflow-hidden rounded-[2.7rem] border border-white/80 bg-white/78 p-7 shadow-[0_28px_70px_-48px_rgba(0,94,151,0.58)] md:p-12">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-accent-soft/70 blur-3xl" />
          <div className="relative grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-accent-dark">
                S-Loco for investors
              </p>
              <h2 className="mt-6 max-w-3xl text-balance font-display text-4xl font-semibold tracking-[-0.015em] md:text-6xl md:leading-[0.98]">
                Cùng đưa du lịch địa phương Việt Nam lên một lớp vận hành minh bạch.
              </h2>
              <p className="mt-5 max-w-[62ch] text-base leading-8 text-muted">
                Điểm bắt đầu là Sầm Sơn. Cơ chế mở rộng là cùng một lõi voucher, QR, thanh toán, đối
                soát và AI itinerary cho các địa phương du lịch có cấu trúc dịch vụ tương tự.
              </p>
            </div>
            <a
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-dark px-6 py-4 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark active:translate-y-0"
              href={contactHref}
            >
              Liên hệ đầu tư
              <ArrowRightIcon />
            </a>
          </div>
        </div>
        <footer className="flex flex-col justify-between gap-4 px-2 py-8 text-sm text-muted md:flex-row">
          <p>S-Loco — nền tảng du lịch bản địa tại Sầm Sơn.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a className="hover:text-foreground" href={contactHref}>
              Liên hệ đầu tư
            </a>
            <span>Chính sách bảo mật</span>
            <span>Điều khoản dịch vụ</span>
          </div>
        </footer>
      </section>
    </main>
  )
}
