'use client'

import Image from 'next/image'
import { type ChangeEvent, useId, useState } from 'react'
import type { UploadImagePurpose } from '@/lib/api'
import { uploadApi } from '@/lib/api'

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export type ImageUploadFieldProps = {
  label: string
  value: string
  purpose: UploadImagePurpose
  required?: boolean
  disabled?: boolean
  helperText?: string
  previewClassName?: string
  onChange: (url: string) => void
  onUploadingChange?: (isUploading: boolean) => void
}

export function ImageUploadField({
  label,
  value,
  purpose,
  required,
  disabled,
  helperText,
  previewClassName,
  onChange,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const id = useId()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const setUploading = (next: boolean) => {
    setIsUploading(next)
    onUploadingChange?.(next)
  }

  const uploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError('Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc GIF.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Ảnh không được vượt quá 5MB.')
      return
    }

    setUploading(true)
    setError('')
    try {
      const result = await uploadApi.image(file, purpose)
      onChange(result.data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`${id}-file`} className="block text-sm font-medium text-on-surface">
        {label} {required && <span className="text-error">*</span>}
      </label>

      {helperText && <p className="text-xs text-on-surface-variant">{helperText}</p>}

      {value ? (
        <div className="relative overflow-hidden rounded-xl bg-surface">
          <Image
            src={value}
            alt=""
            width={640}
            height={240}
            unoptimized
            className={previewClassName || 'h-32 w-full object-cover'}
          />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl bg-surface text-sm text-on-surface-variant">
          Chưa có ảnh
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={`${id}-file`}
          className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          aria-disabled={disabled || isUploading}
        >
          {isUploading ? 'Đang tải...' : value ? 'Thay ảnh' : 'Tải ảnh lên'}
        </label>
        {value && !required && (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => onChange('')}
            className="rounded-xl bg-surface-high px-4 py-2 text-sm font-medium text-on-surface disabled:opacity-50"
          >
            Xóa ảnh
          </button>
        )}
      </div>

      <input
        id={`${id}-file`}
        type="file"
        accept="image/*"
        disabled={disabled || isUploading}
        className="sr-only"
        onChange={uploadFile}
      />

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  )
}
