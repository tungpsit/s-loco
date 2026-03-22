export default function ContentPage() {
  const articles = [
    { id: '1', title: 'Lễ hội Sầm Sơn 2026', slug: 'le-hoi-sam-son-2026', category: 'event', published: true, date: '22/03/2026' },
    { id: '2', title: 'Top 10 món ăn phải thử', slug: 'top-10-mon-an', category: 'guide', published: true, date: '21/03/2026' },
    { id: '3', title: 'Bãi biển mới mở cửa', slug: 'bai-bien-moi', category: 'news', published: false, date: '20/03/2026' },
  ]

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-on-surface">Quản lý nội dung</h1>
          <p className="text-sm text-on-surface-variant mt-1">Bài viết, sự kiện và tin tức địa phương</p>
        </div>
        <button className="px-5 py-2.5 text-sm font-medium rounded-full bg-gradient-to-br from-primary to-primary-container text-white hover:opacity-90 transition-opacity">
          + Tạo bài viết mới
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {['Tất cả', 'Tin tức', 'Sự kiện', 'Hướng dẫn'].map((tab, i) => (
          <button
            key={tab}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              i === 0 ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-variant hover:bg-surface-highest'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map(article => (
          <div key={article.id} className="bg-white rounded-2xl overflow-hidden group">
            {/* Cover placeholder */}
            <div className="h-40 bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center">
              <span className="text-4xl">{article.category === 'event' ? '🎪' : article.category === 'guide' ? '📖' : '📰'}</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <CategoryBadge category={article.category} />
                {!article.published && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary-fixed/50 text-tertiary font-medium">Nháp</span>
                )}
              </div>
              <h3 className="font-display font-semibold text-on-surface text-base mb-1 group-hover:text-primary transition-colors">
                {article.title}
              </h3>
              <p className="text-xs text-on-surface-variant">{article.date}</p>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-surface-high text-on-surface-variant hover:bg-surface-highest transition-colors">
                  Chỉnh sửa
                </button>
                <button className="px-3 py-2 text-xs font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors">
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Card */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center min-h-[280px] hover:border-primary/30 transition-colors cursor-pointer group">
          <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">✍️</span>
          <p className="text-sm font-medium text-on-surface-variant group-hover:text-primary">Tạo bài viết mới</p>
        </div>
      </div>
    </>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    news: { label: 'Tin tức', cls: 'bg-primary-fixed/30 text-primary' },
    event: { label: 'Sự kiện', cls: 'bg-tertiary-fixed/50 text-tertiary' },
    guide: { label: 'Hướng dẫn', cls: 'bg-secondary-container/50 text-secondary' },
  }
  const c = map[category] || { label: category, cls: '' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.cls}`}>{c.label}</span>
}
