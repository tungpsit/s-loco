'use client'

import { api } from '@/lib/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EditContentPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const articleId = params?.id
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
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
    mutationFn: (payload: any) => api(`/content/articles/${articleId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => router.push('/dashboard/content'),
    onError: (err: any) => {
      setErrors({ form: err.message || 'Lỗi khi cập nhật bài viết' })
    },
  })

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slug || slug === generateSlug(v)) {
      setSlug(generateSlug(v))
    }
  }

  function generateSlug(t: string): string {
    return t.toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!title.trim() || title.trim().length < 2) e.title = 'Tiêu đề phải có ít nhất 2 ký tự'
    if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug.trim())) e.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'
    if (!category) e.category = 'Vui lòng chọn danh mục'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    updateMut.mutate({
      title: title.trim(),
      slug: slug.trim(),
      category,
      content: content.trim(),
      coverImage: coverImage.trim(),
      isPublished,
    })
  }

  return (
    <div>
      {/* Header */}
      <div className='mb-6 md:mb-8'>
        <div className='flex items-center gap-3 mb-1'>
          <a
            href='/dashboard/content'
            className='flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-high'
          >
            <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='m15 18-6-6 6-6'/></svg>
          </a>
          <h1 className='text-xl md:text-2xl font-display font-bold text-on-surface'>Sửa bài viết</h1>
        </div>
        <p className='text-sm text-on-surface-variant ml-11'>Cập nhật nội dung bài viết</p>
      </div>

      {isLoading ? (
        <div className='bg-white rounded-2xl p-12 text-center text-on-surface-variant'>Đang tải...</div>
      ) : (
        <div className='bg-white rounded-2xl overflow-hidden'>
          <form onSubmit={handleSubmit} className='p-6 space-y-4'>
            {errors.form && (
              <div className='text-sm text-error bg-error/10 rounded-lg px-3 py-2'>{errors.form}</div>
            )}

            {/* Title */}
            <div>
              <label className='block text-sm font-medium text-on-surface mb-1.5'>Tiêu đề <span className='text-error'>*</span></label>
              <input
                type='text'
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder='Nhập tiêu đề bài viết'
                className='w-full h-9 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface bg-transparent placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              />
              {errors.title && <p className='text-xs text-error mt-1'>{errors.title}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className='block text-sm font-medium text-on-surface mb-1.5'>Slug <span className='text-error'>*</span></label>
              <input
                type='text'
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder='duong-dan-bai-viet'
                className='w-full h-9 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface bg-transparent placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              />
              {errors.slug && <p className='text-xs text-error mt-1'>{errors.slug}</p>}
            </div>

            {/* Category */}
            <div>
              <label className='block text-sm font-medium text-on-surface mb-1.5'>Danh mục <span className='text-error'>*</span></label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className='w-full h-9 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface bg-transparent focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              >
                <option value=''>Chọn danh mục</option>
                <option value='news'>Tin tức</option>
                <option value='event'>Sự kiện</option>
                <option value='guide'>Hướng dẫn</option>
              </select>
              {errors.category && <p className='text-xs text-error mt-1'>{errors.category}</p>}
            </div>

            {/* Content */}
            <div>
              <label className='block text-sm font-medium text-on-surface mb-1.5'>Nội dung</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder='Nội dung bài viết...'
                rows={6}
                className='w-full rounded-lg border border-outline-variant px-3 py-2 text-sm text-on-surface bg-transparent placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y'
              />
            </div>

            {/* Cover Image URL */}
            <div>
              <label className='block text-sm font-medium text-on-surface mb-1.5'>Ảnh bìa (URL)</label>
              <input
                type='text'
                value={coverImage}
                onChange={e => setCoverImage(e.target.value)}
                placeholder='https://example.com/image.jpg'
                className='w-full h-9 rounded-lg border border-outline-variant px-3 py-1.5 text-sm text-on-surface bg-transparent placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
              />
            </div>

            {/* Is Published */}
            <div className='flex items-center gap-2'>
              <button
                type='button'
                role='checkbox'
                aria-checked={isPublished}
                onClick={() => setIsPublished(!isPublished)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPublished ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${isPublished ? 'translate-x-[18px]' : 'translate-x-1'}`} />
              </button>
              <label className='text-sm text-on-surface cursor-pointer' onClick={() => setIsPublished(!isPublished)}>Xuất bản</label>
            </div>

            {/* Actions */}
            <div className='flex justify-end gap-3 pt-2'>
              <a
                href='/dashboard/content'
                className='h-9 px-4 rounded-lg border border-outline-variant text-sm font-medium text-on-surface hover:bg-surface-high transition-colors inline-flex items-center'
              >
                Hủy
              </a>
              <button
                type='submit'
                disabled={updateMut.isPending}
                className='h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50'
              >
                {updateMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
