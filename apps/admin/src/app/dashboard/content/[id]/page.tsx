'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ImageUploadField } from '@/components/ui'
import { api } from '@/lib/api'

type ContentArticleDetail = {
  title?: string
  slug?: string
  category?: string
  content?: string
  coverImage?: string
  cover_image?: string
  isPublished?: boolean
  is_published?: boolean
}

type ContentDetailResponse = {
  data?: ContentArticleDetail
}

type UpdateContentPayload = {
  title: string
  slug: string
  category: string
  content: string
  coverImageUrl: string
  isPublished: boolean
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const articleId = params?.id
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery<ContentDetailResponse>({
    queryKey: ['admin-content-detail', articleId],
    queryFn: () => api(`/content/articles/${articleId}`),
    enabled: !!articleId,
  })

  // Populate form when data arrives
  useEffect(() => {
    if (data?.data) {
      const d = data.data
      setTitle(d.title ?? '')
      setSlug(d.slug ?? '')
      setCategory(d.category ?? '')
      setContent(d.content ?? '')
      setCoverImage(d.coverImage ?? d.cover_image ?? '')
      setIsPublished(!!(d.isPublished ?? d.is_published))
    }
  }, [data])

  const updateMut = useMutation({
    mutationFn: (payload: UpdateContentPayload) =>
      api(`/content/articles/${articleId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => router.push('/dashboard/content'),
    onError: (err: unknown) => {
      setErrors({ form: getErrorMessage(err, 'Lỗi khi cập nhật bài viết') })
    },
  })

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
    updateMut.mutate({
      title: title.trim(),
      slug: slug.trim(),
      category,
      content: content.trim(),
      coverImageUrl: coverImage.trim(),
      isPublished,
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-1">
          <a
            href="/dashboard/content"
            aria-label="Quay lại danh sách nội dung"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-high"
          >
            <span className="sr-only">Quay lại danh sách nội dung</span>
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </a>
          <h1 className="text-xl md:text-2xl font-display font-bold text-on-surface">
            Sửa bài viết
          </h1>
        </div>
        <p className="text-sm text-on-surface-variant ml-11">Cập nhật nội dung bài viết</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-on-surface-variant">
          Đang tải...
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errors.form && (
              <div className="text-sm text-error bg-error/10 rounded-lg px-3 py-2">
                {errors.form}
              </div>
            )}

            {/* Title */}
            <div>
              <label
                htmlFor="edit-content-title"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                Tiêu đề <span className="text-error">*</span>
              </label>
              <input
                id="edit-content-title"
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
                htmlFor="edit-content-slug"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                Slug <span className="text-error">*</span>
              </label>
              <input
                id="edit-content-slug"
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
                htmlFor="edit-content-category"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                Danh mục <span className="text-error">*</span>
              </label>
              <select
                id="edit-content-category"
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
                htmlFor="edit-content-body"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                Nội dung
              </label>
              <textarea
                id="edit-content-body"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung bài viết..."
                rows={6}
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
                id="edit-content-published"
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="sr-only"
              />
              <label
                htmlFor="edit-content-published"
                className="flex cursor-pointer items-center gap-2 text-sm text-on-surface"
              >
                <span
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPublished ? 'bg-primary' : 'bg-outline-variant'}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isPublished ? 'translate-x-[18px]' : 'translate-x-1'}`}
                  />
                </span>
                Xuất bản
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <a
                href="/dashboard/content"
                className="h-9 px-4 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-high transition-colors inline-flex items-center"
              >
                Hủy
              </a>
              <button
                type="submit"
                disabled={updateMut.isPending || coverUploading}
                className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {coverUploading
                  ? 'Đang tải ảnh…'
                  : updateMut.isPending
                    ? 'Đang lưu…'
                    : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
