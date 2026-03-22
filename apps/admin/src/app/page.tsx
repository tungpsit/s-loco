export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-surface">
      {/* ─── Top Nav ─── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-xl">
        <h1 className="text-xl font-display font-bold text-primary">
          S-Local Admin
        </h1>
        <span className="text-sm text-on-surface-variant">
          Bảng điều khiển quản trị
        </span>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full">
        {/* Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            label="Tổng Vendor"
            value="—"
            icon="🏪"
            accent="bg-primary-fixed"
          />
          <StatCard
            label="Đơn hàng hôm nay"
            value="—"
            icon="🛒"
            accent="bg-secondary-container"
          />
          <StatCard
            label="Doanh thu tháng"
            value="—"
            icon="💰"
            accent="bg-tertiary-fixed"
          />
          <StatCard
            label="Voucher đang hoạt động"
            value="—"
            icon="🎟️"
            accent="bg-primary-fixed-dim"
          />
        </section>

        {/* Quick Actions */}
        <section className="mb-10">
          <h2 className="text-lg font-display font-semibold text-on-surface mb-4">
            Thao tác nhanh
          </h2>
          <div className="flex flex-wrap gap-3">
            <ActionButton label="Duyệt Vendor mới" />
            <ActionButton label="Quản lý đơn hàng" />
            <ActionButton label="Báo cáo doanh thu" />
            <ActionButton label="Cài đặt hệ thống" variant="secondary" />
          </div>
        </section>

        {/* Placeholder */}
        <section className="rounded-2xl bg-white p-8 text-center text-on-surface-variant">
          <p className="text-base">
            Chào mừng bạn đến với bảng điều khiển S-Local. Chọn mục từ menu hoặc
            thao tác nhanh phía trên để bắt đầu.
          </p>
        </section>
      </main>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${accent}`}
      >
        {icon}
      </span>
      <div>
        <p className="text-sm text-on-surface-variant">{label}</p>
        <p className="text-2xl font-display font-bold text-on-surface">
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  variant = "primary",
}: {
  label: string;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-colors";

  const styles =
    variant === "primary"
      ? "bg-gradient-to-br from-primary to-primary-container text-white hover:opacity-90"
      : "bg-surface-high text-primary hover:bg-surface-highest";

  return <button className={`${base} ${styles}`}>{label}</button>;
}
