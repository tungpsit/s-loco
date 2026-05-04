'use client'

import Image from 'next/image'
import { type ChangeEvent, useId, useState } from 'react'
import type { UploadImagePurpose } from '@/lib/api'
import { uploadApi } from '@/lib/api'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export type MultiImageUploadFieldProps = {
  label: string
  value: string[]
  purpose: UploadImagePurpose
  disabled?: boolean
  helperText?: string
  onChange: (urls: string[]) => void
  onUploadingChange?: (isUploading: boolean) => void
}

export function MultiImageUploadField({
  label,
  value,
  purpose,
  disabled,
  helperText,
  onChange,
  onUploadingChange,
}: MultiImageUploadFieldProps) {
  const id = useId()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const setUploading = (next: boolean) => {
    setIsUploading(next)
    onUploadingChange?.(next)
  }

  const uploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return

    const invalidType = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type))
    if (invalidType) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc GIF.')
      return
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_BYTES)
    if (oversized) {
      setError('Ảnh không được vượt quá 5MB.')
      return
    }

    setUploading(true)
    setError('')
    try {
      const uploadedUrls: string[] = []
      for (const file of files) {
        const result = await uploadApi.image(file, purpose)
        uploadedUrls.push(result.data.url)
      }
      onChange([...value, ...uploadedUrls])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index))
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`${id}-file`} className="block text-sm font-medium text-on-surface">
        {label}
      </label>

      {helperText && <p className="text-xs text-on-surface-variant">{helperText}</p>}

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {value.map((url, index) => (
            <div key={url} className="space-y-2">
              <div className="overflow-hidden rounded-xl bg-white">
                <Image
                  src={url}
                  alt=""
                  width={320}
                  height={180}
                  unoptimized
                  className="h-24 w-full object-cover"
                />
              </div>
              <button
                type="button"
                disabled={disabled || isUploading}
                onClick={() => removeAt(index)}
                className="w-full rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-error disabled:opacity-50"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-xl bg-white text-sm text-on-surface-variant">
          Chưa có ảnh dịch vụ
        </div>
      )}

      <label
        htmlFor={`${id}-file`}
        className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
        aria-disabled={disabled || isUploading}
      >
        {isUploading ? 'Đang tải...' : 'Tải thêm ảnh'}
      </label>

      <input
        id={`${id}-file`}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled || isUploading}
        className="sr-only"
        onChange={uploadFiles}
      />

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  )
}
