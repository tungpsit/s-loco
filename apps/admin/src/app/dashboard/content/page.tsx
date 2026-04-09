'use client'

import { contentApi } from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export default function ContentPage() {
  const [category, setCategory] = useState<string>('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-content', category],
    queryFn: () => contentApi.list({ category: category || undefined }),
  })

  const deleteMut = useMutation({
    mutationFn: contentApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-content'] }),
  })

  const articles: any[] = data?.data?.items || data?.data || []
  const tabs = [
    { key: '', label: 'Tất cả' },
    { key: 'news', label: 'Tin tức' },
    { key: 'event', label: 'Sự kiện' },
    { key: 'guide', label: 'Hướng dẫn' },
  ]

  return (
    <>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">Quản lý nội dung</h1>
        <p className="text-sm text-on-surface-variant mt-1">Bài viết, sự kiện và tin tức địa phương</p>
      </div>

      {/* Category Tabs — scrollable on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
              category === tab.key ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-variant hover:bg-surface-highest'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-on-surface-variant">Đang tải...</div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-on-surface-variant">
          <p className="text-4xl mb-2">📝</p>
          <p className="text-sm">Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {articles.map((article: any) => (
            <div key={article.id} className="bg-white rounded-2xl overflow-hidden group">
              <div className="h-32 sm:h-40 bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center">
                <span className="text-4xl">{article.category === 'event' ? '🎪' : article.category === 'guide' ? '📖' : '📰'}</span>
              </div>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CategoryBadge category={article.category} />
                  {!article.isPublished && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary-fixed/50 text-tertiary font-medium">Nháp</span>
                  )}
                </div>
                <h3 className="font-display font-semibold text-on-surface text-sm sm:text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString('vi-VN') : ''}
                </p>
                <div className="flex gap-2 mt-3 md:mt-4">
                  <button
                    onClick={() => deleteMut.mutate(article.id)}
                    disabled={deleteMut.isPending}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
