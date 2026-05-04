'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ImageUploadField } from '@/components/ui'
import { contentApi } from '@/lib/api'

type ContentArticleListItem = {
  id: string
  title: string
  category: string
  isPublished?: boolean
  createdAt?: string
}

type ContentListResponse = {
  data?: { items?: ContentArticleListItem[] } | ContentArticleListItem[]
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function ContentPage() {
  const [category, setCategory] = useState<string>('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-content', category],
    queryFn: () => contentApi.list({ category: category || undefined }),
  })

  const deleteMut = useMutation({
    mutationFn: contentApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-content'] }),
  })

  const contentData = data as ContentListResponse | undefined
  const articles = Array.isArray(contentData?.data)
    ? contentData.data
    : contentData?.data?.items || []
  const tabs = [
    { key: '', label: 'Tất cả' },
    { key: 'news', label: 'Tin tức' },
    { key: 'event', label: 'Sự kiện' },
    { key: 'guide', label: 'Hướng dẫn' },
  ]

  return (
    <>
      <div className="mb-6 md:mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">
            Quản lý nội dung
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Bài viết, sự kiện và tin tức địa phương
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          Tạo bài viết
        </button>
      </div>

      {/* Category Tabs — scrollable on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setCategory(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
              category === tab.key
                ? 'bg-primary text-white'
                : 'bg-surface-high text-on-surface-variant hover:bg-surface-highest'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-on-surface-variant">
          Đang tải...
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-on-surface-variant">
          <p className="text-4xl mb-2">📝</p>
          <p className="text-sm">Chưa có bài viết nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-2xl overflow-hidden group">
              <div className="h-32 sm:h-40 bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center">
                <span className="text-4xl">
                  {article.category === 'event' ? '🎪' : article.category === 'guide' ? '📖' : '📰'}
                </span>
              </div>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CategoryBadge category={article.category} />
                  {!article.isPublished && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-tertiary-fixed/50 text-tertiary font-medium">
                      Nháp
                    </span>
                  )}
                </div>
                <h3 className="font-display font-semibold text-on-surface text-sm sm:text-base mb-1 group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString('vi-VN') : ''}
                </p>
                <div className="flex gap-2 mt-3 md:mt-4">
                  <a
                    href={`/dashboard/content/${article.id}`}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-primary-fixed/20 text-primary hover:bg-primary-fixed/30 transition-colors"
                  >
                    Sửa
                  </a>
                  <button
                    type="button"
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

      {/* Create Dialog */}
      <CreateArticleDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
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

// ─── Create Article Dialog ─────────────────────────────────
function CreateArticleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMut = useMutation({
    mutationFn: contentApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-content'] })
      setTitle('')
      setSlug('')
      setCategory('')
      setContent('')
      setCoverImage('')
      setIsPublished(false)
      setErrors({})
      onClose()
    },
    onError: (err: unknown) => {
      setErrors({ form: getErrorMessage(err, 'Lỗi khi tạo bài viết') })
    },
  })

  // Auto-generate slug from title
  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slug || slug === generateSlug(v)) {
      setSlug(generateSlug(v))
    }
  }

  function generateSlug(t: string): string {
    return t
      .toLowerCase()
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim() || title.trim().length < 2) e.title = 'Tiêu đề phải có ít nhất 2 ký tự'
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug.trim()))
      e.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'
    if (!category) e.category = 'Vui lòng chọn danh mục'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    if (coverUploading) {
      setErrors({ form: 'Vui lòng chờ ảnh tải lên xong trước khi lưu.' })
      return
    }
    setErrors({})
    createMut.mutate({
      title: title.trim(),
      slug: slug.trim(),
      category,
      content: content.trim(),
      coverImage: coverImage.trim(),
      isPublished,
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Đóng hộp thoại"
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
          <h2 className="font-display font-semibold text-on-surface">Tạo bài viết mới</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-high"
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">{errors.form}</div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="create-content-title"
              className="block text-sm font-medium text-on-surface mb-1.5"
            >
              Tiêu đề <span className="text-error">*</span>
            </label>
            <input
              id="create-content-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Nhập tiêu đề bài viết"
              className="w-full h-9 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface bg-transparent placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="create-content-slug"
              className="block text-sm font-medium text-on-surface mb-1.5"
            >
              Slug <span className="text-error">*</span>
            </label>
            <input
              id="create-content-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="duong-dan-bai-viet"
              className="w-full h-9 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface bg-transparent placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.slug && <p className="text-xs text-error mt-1">{errors.slug}</p>}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="create-content-category"
              className="block text-sm font-medium text-on-surface mb-1.5"
            >
              Danh mục <span className="text-error">*</span>
            </label>
            <select
              id="create-content-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface bg-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Chọn danh mục</option>
              <option value="news">Tin tức</option>
              <option value="event">Sự kiện</option>
              <option value="guide">Hướng dẫn</option>
            </select>
            {errors.category && <p className="text-xs text-error mt-1">{errors.category}</p>}
          </div>

          {/* Content */}
          <div>
            <label
              htmlFor="create-content-body"
              className="block text-sm font-medium text-on-surface mb-1.5"
            >
              Nội dung
            </label>
            <textarea
              id="create-content-body"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung bài viết..."
              rows={4}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface bg-transparent placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>

          <ImageUploadField
            label="Ảnh bìa"
            value={coverImage}
            purpose="content_cover"
            helperText="Tải ảnh bìa bài viết lên server."
            previewClassName="h-48 w-full object-cover"
            onChange={setCoverImage}
            onUploadingChange={setCoverUploading}
          />

          {/* Is Published */}
          <div className="flex items-center gap-2">
            <input
              id="create-content-published"
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="sr-only"
            />
            <label
              htmlFor="create-content-published"
              className="flex cursor-pointer items-center gap-2 text-sm text-on-surface"
            >
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPublished ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isPublished ? 'translate-x-[18px]' : 'translate-x-1'}`}
                />
              </span>
              Xuất bản ngay
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-high transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMut.isPending || coverUploading}
              className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {coverUploading
                ? 'Đang tải ảnh…'
                : createMut.isPending
                  ? 'Đang tạo…'
                  : 'Tạo bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
