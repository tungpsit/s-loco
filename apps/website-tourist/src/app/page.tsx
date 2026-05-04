import Image from 'next/image'

const touristBenefits = [
  {
    title: 'Thông tin đáng tin hơn',
    detail:
      'Dịch vụ địa phương được chuẩn hóa và kiểm duyệt trước khi hiển thị, giúp bạn tránh mất thời gian hỏi nhiều nơi hoặc lo chất lượng không đồng đều.',
    icon: '/generated-icons/guide.svg',
  },
  {
    title: 'Giá rõ trước khi đi',
    detail:
      'Xem dịch vụ, ưu đãi và voucher ngay trong app. Bạn biết mình sẽ dùng gì, trả bao nhiêu và dùng ở đâu trước khi bước vào quán hoặc điểm dịch vụ.',
    icon: '/generated-icons/voucher.svg',
  },
  {
    title: 'Một app cho cả chuyến',
    detail:
      'Từ ăn uống, lưu trú, xe điện, giải trí, mua sắm tới sự kiện địa phương — S-Loco gom các nhu cầu phổ biến của chuyến đi vào một nơi.',
    icon: '/generated-icons/ai-route.svg',
  },
]

const serviceGroups = [
  {
    title: 'Nhà hàng, hải sản, quán cà phê',
    icon: '/generated-icons/food.svg',
  },
  {
    title: 'Khách sạn, homestay, lưu trú gần biển',
    icon: '/generated-icons/stay.svg',
  },
  {
    title: 'Xe điện, tuyến di chuyển, điểm đón',
    icon: '/generated-icons/transport.svg',
  },
  {
    title: 'Spa, massage, giải trí, trải nghiệm biển',
    icon: '/generated-icons/leisure.svg',
  },
  {
    title: 'Cửa hàng lưu niệm, mua sắm địa phương',
    icon: '/generated-icons/shopping.svg',
  },
  {
    title: 'Tin tức, sự kiện, thời tiết và gợi ý theo thời điểm',
    icon: '/generated-icons/event.svg',
  },
]

const discoverFlow = [
  {
    step: '01',
    title: 'Chọn nhu cầu',
    detail:
      'Bạn chọn điểm đến, món ăn, lưu trú, xe điện hoặc hoạt động muốn trải nghiệm tại Sầm Sơn.',
    icon: '/generated-icons/destination.svg',
  },
  {
    step: '02',
    title: 'Lọc theo thời gian và ngân sách',
    detail: 'App gợi ý dịch vụ phù hợp với ngày đi, số người, ngân sách và phong cách chuyến đi.',
    icon: '/generated-icons/guide.svg',
  },
  {
    step: '03',
    title: 'Lưu vào hành trình',
    detail: 'Các lựa chọn quan trọng được lưu lại để bạn mở nhanh khi đang di chuyển ngoài trời.',
    icon: '/generated-icons/ai-route.svg',
  },
]

const voucherFlow = [
  {
    step: '01',
    title: 'Thanh toán trước',
    detail:
      'Bạn trả trước trong app để nhận voucher điện tử, hạn chế cảnh hỏi giá lại tại điểm dịch vụ.',
    icon: '/generated-icons/shopping.svg',
  },
  {
    step: '02',
    title: 'Tiền được giữ tạm',
    detail:
      'Khoản thanh toán được hệ thống giữ cho đến khi dịch vụ hoàn tất, tạo thêm lớp bảo vệ cho khách.',
    icon: '/generated-icons/guide.svg',
  },
  {
    step: '03',
    title: 'Quét QR để sử dụng',
    detail: 'Đến cơ sở, bạn đưa QR cho vendor quét hoặc tự quét QR tại quầy để xác nhận voucher.',
    icon: '/generated-icons/voucher.svg',
  },
  {
    step: '04',
    title: 'Hoàn tất và đối soát',
    detail:
      'Vendor xác nhận hoàn thành, hệ thống mới giải ngân. Voucher chưa dùng có thể yêu cầu hoàn tiền.',
    icon: '/generated-icons/destination.svg',
  },
]

const itineraryInputs = [
  {
    title: 'Thời gian lưu trú',
    icon: '/generated-icons/stay.svg',
  },
  {
    title: 'Ngân sách theo người',
    icon: '/generated-icons/shopping.svg',
  },
  {
    title: 'Ngân sách từng bữa ăn',
    icon: '/generated-icons/food.svg',
  },
  {
    title: 'Đi cùng gia đình, cặp đôi hay nhóm bạn',
    icon: '/generated-icons/guide.svg',
  },
  {
    title: 'Thích yên tĩnh, sôi động, gần biển hoặc trải nghiệm mới',
    icon: '/generated-icons/leisure.svg',
  },
]

function StoreBadge({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <a
      href="#download"
      className="inline-flex min-w-40 items-center gap-3 rounded-2xl bg-[#12243f] px-4 py-3 text-left text-white shadow-[0_18px_45px_-28px_rgba(2,75,134,0.75)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0d3159] focus:outline-none focus:ring-4 focus:ring-sky/30 active:scale-[0.98]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
        <Image
          src="/generated-icons/guide.svg"
          alt=""
          width={26}
          height={26}
          className="h-6 w-6 object-contain"
        />
      </span>
      <span>
        <span className="block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/62">
          {sublabel}
        </span>
        <span className="block text-sm font-bold tracking-tight">{label}</span>
      </span>
    </a>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-black uppercase tracking-[0.22em] text-ocean">{children}</p>
}

function IconImage({
  src,
  alt,
  className = 'h-12 w-12',
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <Image src={src} alt={alt} width={96} height={96} className={`${className} object-contain`} />
  )
}

export default function TouristLandingPage() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-full focus:bg-deep-ocean focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
      >
        Bỏ qua phần điều hướng
      </a>
      <header className="border-b border-line bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8 lg:px-10">
          <a href="#top" className="flex items-center gap-3" aria-label="S-Loco Sầm Sơn">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-[0_14px_34px_-24px_rgba(2,75,134,0.8)]">
              <IconImage
                src="/icons/icon_tourist.png"
                alt="S-Loco Tourist"
                className="h-8 w-8"
              />
            </span>
            <span>
              <span className="block text-lg font-black tracking-tight text-deep-ocean">
                S-Loco
              </span>
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-ocean/70">
                Sầm Sơn
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-bold text-ink-muted md:flex">
            <a className="transition hover:text-deep-ocean" href="#benefits">
              Lợi ích
            </a>
            <a className="transition hover:text-deep-ocean" href="#flows">
              Luồng sử dụng
            </a>
            <a className="transition hover:text-deep-ocean" href="#ai-itinerary">
              Lịch trình AI
            </a>
            <a className="transition hover:text-deep-ocean" href="#download">
              Tải app
            </a>
          </nav>
          <a
            href="#download"
            className="rounded-full bg-deep-ocean px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_-26px_rgba(2,75,134,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-ocean focus:outline-none focus:ring-4 focus:ring-sky/30 active:scale-[0.98]"
          >
            Tải app
          </a>
        </div>
      </header>

      <section id="top" className="bg-[#dff5ff]">
        <Image
          src="/images/banner_touris1.png"
          alt="Banner S-Loco Sầm Sơn giới thiệu ứng dụng du lịch cho khách du lịch"
          width={1024}
          height={512}
          priority
          sizes="100vw"
          className="h-auto w-full object-contain"
        />
      </section>

      <section id="content" className="px-4 py-16 md:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <SectionLabel>Vì sao nên dùng S-Loco</SectionLabel>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-[-0.035em] text-[#112944] md:text-5xl">
              Đi Sầm Sơn ít hỏi giá hơn, ít dò tìm hơn, chủ động hơn.
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-ink-muted lg:justify-self-end">
            S-Loco được thiết kế như một siêu ứng dụng du lịch bản địa: giúp khách tìm dịch vụ đã
            được chuẩn hóa, mua voucher trước, dùng QR tại điểm dịch vụ và nhận gợi ý lịch trình
            theo nhu cầu thật của chuyến đi.
          </p>
        </div>
      </section>

      <section id="benefits" className="px-4 pb-16 md:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {touristBenefits.map((item) => (
              <article
                key={item.title}
                className="rounded-[2rem] border border-line bg-white p-6 shadow-[0_24px_64px_-48px_rgba(2,75,134,0.78)]"
              >
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-sky-soft">
                  <IconImage src={item.icon} alt={item.title} />
                </div>
                <h2 className="mt-6 text-2xl font-black tracking-tight text-deep-ocean">
                  {item.title}
                </h2>
                <p className="mt-3 text-base leading-7 text-ink-muted">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 pb-16 md:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-white/80 bg-[#0d477a] p-6 text-white shadow-[0_40px_90px_-60px_rgba(2,75,134,0.95)] md:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-sand">
                Hệ sinh thái địa phương
              </p>
              <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.035em] md:text-5xl">
                Không chỉ đặt phòng hay tìm quán ăn.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72">
                Ứng dụng tập trung vào những nhu cầu phát sinh liên tục trong chuyến đi ngắn ngày:
                ăn gì, đi đâu, di chuyển thế nào, thời tiết ra sao và ưu đãi nào đáng dùng.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {serviceGroups.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 rounded-2xl border border-white/14 bg-white/10 px-4 py-4 font-bold leading-6 text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <span className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-white/92">
                    <IconImage src={feature.icon} alt={feature.title} className="h-10 w-10" />
                  </span>
                  {feature.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="flows" className="px-4 pb-16 md:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <SectionLabel>Luồng sử dụng rõ ràng</SectionLabel>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.035em] text-[#112944] md:text-5xl">
              Từ lúc tìm dịch vụ đến lúc quét QR tại cơ sở.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="rounded-[2.5rem] border border-line bg-white p-6 shadow-[0_28px_80px_-58px_rgba(2,75,134,0.88)] md:p-8">
              <div className="flex items-center gap-3 text-deep-ocean">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-soft">
                  <IconImage
                    src="/generated-icons/destination.svg"
                    alt="Luồng khám phá"
                    className="h-10 w-10"
                  />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Luồng khám phá</h3>
              </div>
              <div className="mt-7 grid gap-4">
                {discoverFlow.map((item) => (
                  <div
                    key={item.step}
                    className="grid gap-4 rounded-2xl bg-coast p-5 sm:grid-cols-[4rem_1fr]"
                  >
                    <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-black tabular-nums text-ocean shadow-[0_16px_32px_-26px_rgba(2,75,134,0.8)]">
                      <IconImage
                        src={item.icon}
                        alt=""
                        className="absolute -right-2 -top-2 h-7 w-7"
                      />
                      {item.step}
                    </span>
                    <span>
                      <span className="block text-lg font-black text-[#112944]">{item.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-ink-muted">
                        {item.detail}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2.5rem] border border-line bg-white p-6 shadow-[0_28px_80px_-58px_rgba(2,75,134,0.88)] md:p-8 lg:mt-12">
              <div className="flex items-center gap-3 text-deep-ocean">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-sand-soft">
                  <IconImage
                    src="/generated-icons/voucher.svg"
                    alt="Luồng voucher và QR"
                    className="h-10 w-10"
                  />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Luồng voucher và QR</h3>
              </div>
              <div className="mt-7 grid gap-4">
                {voucherFlow.map((item) => (
                  <div
                    key={item.step}
                    className="grid gap-4 rounded-2xl bg-[#fff9e8] p-5 sm:grid-cols-[4rem_1fr]"
                  >
                    <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl font-black tabular-nums text-[#a66b05] shadow-[0_16px_32px_-26px_rgba(166,107,5,0.75)]">
                      <IconImage
                        src={item.icon}
                        alt=""
                        className="absolute -right-2 -top-2 h-7 w-7"
                      />
                      {item.step}
                    </span>
                    <span>
                      <span className="block text-lg font-black text-[#112944]">{item.title}</span>
                      <span className="mt-2 block text-sm leading-6 text-ink-muted">
                        {item.detail}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="ai-itinerary" className="px-4 pb-16 md:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] border border-line bg-white p-6 shadow-[0_34px_90px_-62px_rgba(2,75,134,0.95)] md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
          <div>
            <SectionLabel>Trợ lý lịch trình AI</SectionLabel>
            <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight tracking-[-0.035em] text-[#112944] md:text-5xl">
              Gợi ý hành trình theo cách bạn đi biển.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-ink-muted">
              Thay vì tự ghép lịch từ nhiều nguồn rời rạc, bạn nhập thông tin chuyến đi và S-Loco đề
              xuất lịch trình kèm dịch vụ tương ứng trên nền tảng.
            </p>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-sky-soft via-white to-sand-soft p-5 md:p-7">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-ocean">AI cần biết</p>
            <div className="mt-5 grid gap-3">
              {itineraryInputs.map((input) => (
                <div
                  key={input.title}
                  className="flex items-center gap-4 rounded-2xl bg-white/78 px-5 py-4 text-base font-bold text-[#243b57] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                >
                  <IconImage src={input.icon} alt={input.title} className="h-10 w-10 shrink-0" />
                  {input.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="px-4 pb-10 md:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[2.5rem] border border-line bg-[#f7fcff] p-6 shadow-[0_34px_90px_-62px_rgba(2,75,134,0.95)] md:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
          <div>
            <SectionLabel>Tải S-Loco</SectionLabel>
            <h2 className="mt-4 max-w-2xl text-4xl font-black leading-tight tracking-[-0.035em] text-[#112944] md:text-5xl">
              Cài app trước khi đến Sầm Sơn.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
              Dùng QR trên banner hoặc chọn App Store / Google Play để tải. Khi có QR thật của chiến
              dịch, chỉ cần thay vào banner hiện tại.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
            <StoreBadge sublabel="Tải trên" label="App Store" />
            <StoreBadge sublabel="Tải trên" label="Google Play" />
          </div>
        </div>
        <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-2 py-8 text-sm font-medium text-ink-muted md:flex-row md:items-center md:justify-between">
          <span>© 2026 S-Loco Sầm Sơn.</span>
          <span className="flex gap-4">
            <a className="transition hover:text-deep-ocean" href="#download">
              Chính sách riêng tư
            </a>
            <a className="transition hover:text-deep-ocean" href="#download">
              Điều khoản sử dụng
            </a>
          </span>
        </footer>
      </section>
    </main>
  )
}
