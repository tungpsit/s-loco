# Image Upload Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haki:subagent-driven-development (recommended) or haki:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace image URL/path entry with reusable upload-first controls across admin image forms while extending the backend upload purpose contract for current and future clients.

**Architecture:** Extend the existing media service and admin upload API in place, then extract focused admin UI upload components for single and multi-image fields. Existing forms continue saving returned URLs into existing API/database fields; no media library, DB migration, or object deletion workflow is introduced.

**Tech Stack:** Bun, Hono, TypeScript, Next.js 16 App Router, React 19, TanStack Query, Tailwind CSS, S3-compatible object storage.

**Spec:** `docs/superpowers/specs/2026-05-04-image-upload-fields-design.md`

---

## File Structure

- Modify: `apps/api/src/services/media.service.ts`
  - Extend allowed upload purposes.
  - Keep validation and response shape unchanged.
- Create: `apps/api/tests/uploads.test.ts`
  - API integration coverage for upload purpose/type behavior.
- Modify: `apps/admin/src/lib/api.ts`
  - Add typed upload purpose union values for `content_cover` and `user_avatar`.
  - Keep multipart request behavior unchanged.
- Create: `apps/admin/src/components/ui/image-upload-field.tsx`
  - Single image upload field with preview, upload/replace, remove, loading/error state, and advanced URL fallback.
- Create: `apps/admin/src/components/ui/multi-image-upload-field.tsx`
  - Multi-image upload field for service galleries with previews, add/remove, loading/error state, and advanced URL fallback.
- Modify: `apps/admin/src/components/ui/index.ts`
  - Export the new upload field components if this file is used as the UI barrel.
- Modify: `apps/admin/src/app/dashboard/vendors/page.tsx`
  - Replace inline `ImageInput` and service image textarea/file input with reusable upload fields.
  - Track upload-in-progress state and block submit while upload is running.
- Modify: `apps/admin/src/app/dashboard/content/[id]/page.tsx`
  - Replace visible `Ảnh bìa (URL)` input with `ImageUploadField` using `content_cover`.
  - Track upload-in-progress state and block submit while upload is running.

Notes:

- Admin app currently has no frontend test runner. Do not add one for this task; verify admin UI with typecheck/lint and explicit manual component/form checks.
- `apps/admin/AGENTS.md` requires checking Next.js docs before writing Next.js code. Before editing admin React files, read the relevant local docs in `apps/admin/node_modules/next/dist/docs/` if available.
- Keep the old local `ImageInput` helper only until replacement is complete; remove it after migration.
- API upload integration tests require the API server to be running at `TEST_API_BASE_URL` or `http://localhost:3000`, seeded admin credentials to be available, and `SKIP_S3_UPLOAD=true` so tests do not depend on object storage.
- Commit steps are workflow checkpoints. If the execution environment or user preference forbids commits, skip the commit step and keep changes staged/unstaged for review instead.

---

### Task 1: Backend upload purposes and integration tests

**Files:**

- Modify: `apps/api/src/services/media.service.ts:3-78`
- Create: `apps/api/tests/uploads.test.ts`

- [ ] **Step 1: Write failing API upload tests**

Create `apps/api/tests/uploads.test.ts` with tests that exercise the running API through the existing helper style. Use `adminLogin()` for authenticated upload requests. Because `helpers.request()` defaults JSON headers, build multipart requests directly with `fetch` so the browser/runtime sets the boundary.

```ts
import { describe, expect, test } from 'bun:test'
import { adminLogin } from './helpers'

const API_BASE = process.env.TEST_API_BASE_URL || 'http://localhost:3000'

async function uploadImage({
  token,
  file,
  purpose,
}: {
  token: string
  file: File
  purpose: string
}) {
  const body = new FormData()
  body.set('file', file)
  body.set('purpose', purpose)

  const res = await fetch(`${API_BASE}/api/v1/admin/uploads`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })

  const data = await res.json()
  return { status: res.status, data }
}

async function requireAdminToken() {
  const token = await adminLogin()
  expect(token).toBeTruthy()
  return token as string
}

describe('Admin uploads', () => {
  test('POST /admin/uploads accepts content_cover purpose', async () => {
    const token = await requireAdminToken()

    const file = new File(['fake image bytes'], 'cover.png', { type: 'image/png' })
    const { status, data } = await uploadImage({ token, file, purpose: 'content_cover' })

    expect(status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.key).toContain('content_cover/')
    expect(data.data.url).toContain('content_cover/')
    expect(data.data.contentType).toBe('image/png')
    expect(data.data.size).toBe(file.size)
  })

  test('POST /admin/uploads accepts user_avatar purpose', async () => {
    const token = await requireAdminToken()

    const file = new File(['fake image bytes'], 'avatar.webp', { type: 'image/webp' })
    const { status, data } = await uploadImage({ token, file, purpose: 'user_avatar' })

    expect(status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.key).toContain('user_avatar/')
    expect(data.data.contentType).toBe('image/webp')
  })

  test('POST /admin/uploads rejects unknown purpose', async () => {
    const token = await requireAdminToken()

    const file = new File(['fake image bytes'], 'generic.png', { type: 'image/png' })
    const { status, data } = await uploadImage({ token, file, purpose: 'generic' })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_PURPOSE')
  })

  test('POST /admin/uploads rejects unsupported image type', async () => {
    const token = await requireAdminToken()

    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' })
    const { status, data } = await uploadImage({ token, file, purpose: 'content_cover' })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_FILE_TYPE')
  })

  test('POST /admin/uploads rejects oversized images', async () => {
    const token = await requireAdminToken()

    const bytes = new Uint8Array(5 * 1024 * 1024 + 1)
    const file = new File([bytes], 'large.png', { type: 'image/png' })
    const { status, data } = await uploadImage({ token, file, purpose: 'content_cover' })

    expect(status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('FILE_TOO_LARGE')
  })
})
```

- [ ] **Step 2: Run upload tests and verify they fail**

Run: `SKIP_S3_UPLOAD=true bun --filter @S-Loco/api test tests/uploads.test.ts`

Expected: tests for `content_cover` and `user_avatar` fail with `INVALID_PURPOSE` while existing validation tests may pass. The oversized-file test should pass before the purpose change because that behavior already exists. If tests fail because login cannot obtain a token or the API is unreachable, start the API with seeded admin credentials before continuing.

- [ ] **Step 3: Extend upload purposes minimally**

In `apps/api/src/services/media.service.ts`, change the purpose set from:

```ts
const PURPOSES = new Set(['vendor_logo', 'vendor_cover', 'service_image'])
```

to:

```ts
const PURPOSES = new Set([
  'vendor_logo',
  'vendor_cover',
  'service_image',
  'content_cover',
  'user_avatar',
])
```

Do not add a generic purpose.

- [ ] **Step 4: Run upload tests and verify they pass**

Run: `SKIP_S3_UPLOAD=true bun --filter @S-Loco/api test tests/uploads.test.ts`

Expected: all tests in `uploads.test.ts` pass.

- [ ] **Step 5: Run API typecheck**

Run: `bun --filter @S-Loco/api check`

Expected: TypeScript passes with no new errors.

- [ ] **Step 6: Commit backend upload purpose work**

```bash
git add apps/api/src/services/media.service.ts apps/api/tests/uploads.test.ts
git commit -m "feat: extend admin image upload purposes"
```

---

### Task 2: Admin upload API typing

**Files:**

- Modify: `apps/admin/src/lib/api.ts:153-164`

- [ ] **Step 1: Update upload purpose typing**

In `apps/admin/src/lib/api.ts`, define a named upload purpose union near the upload API section:

```ts
export type UploadImagePurpose =
  | 'vendor_logo'
  | 'vendor_cover'
  | 'service_image'
  | 'content_cover'
  | 'user_avatar'
```

Then update `uploadApi.image` to accept `purpose: UploadImagePurpose`.

- [ ] **Step 2: Run admin typecheck**

Run: `bun --filter @S-Loco/admin check`

Expected: TypeScript passes with no new errors.

- [ ] **Step 3: Commit API typing work**

```bash
git add apps/admin/src/lib/api.ts
git commit -m "feat: type admin image upload purposes"
```

---

### Task 3: Reusable single image upload component

**Files:**

- Create: `apps/admin/src/components/ui/image-upload-field.tsx`
- Modify: `apps/admin/src/components/ui/index.ts`

- [ ] **Step 1: Check relevant Next.js docs**

Before writing this component, inspect local Next.js docs for image/component behavior if available:

Run or read equivalent local docs under: `apps/admin/node_modules/next/dist/docs/`

Relevant topic: `next/image` usage in client components.

- [ ] **Step 2: Implement `ImageUploadField`**

Create `apps/admin/src/components/ui/image-upload-field.tsx`:

```tsx
'use client'

import type { UploadImagePurpose } from '@/lib/api'
import { uploadApi } from '@/lib/api'
import Image from 'next/image'
import { type ChangeEvent, useId, useState } from 'react'

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
  const [showAdvanced, setShowAdvanced] = useState(false)

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
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-file`} className="block text-sm font-medium text-on-surface">
          {label} {required && <span className="text-error">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="text-xs font-medium text-primary hover:opacity-80"
        >
          {showAdvanced ? 'Ẩn URL' : 'Nhập URL'}
        </button>
      </div>

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

      {showAdvanced && (
        <input
          value={value}
          disabled={disabled || isUploading}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Dán URL ảnh đã có"
          className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      )}

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Export component from UI barrel if appropriate**

If `apps/admin/src/components/ui/index.ts` exports other UI components, add:

```ts
export * from './image-upload-field'
```

If the file is not used as a barrel, this step can be skipped.

- [ ] **Step 4: Run admin typecheck**

Run: `bun --filter @S-Loco/admin check`

Expected: TypeScript passes with no new errors.

- [ ] **Step 5: Commit single-image component**

```bash
git add apps/admin/src/components/ui/image-upload-field.tsx apps/admin/src/components/ui/index.ts
git commit -m "feat: add admin image upload field"
```

---

### Task 4: Reusable multi-image upload component

**Files:**

- Create: `apps/admin/src/components/ui/multi-image-upload-field.tsx`
- Modify: `apps/admin/src/components/ui/index.ts`

- [ ] **Step 1: Implement `MultiImageUploadField`**

Create `apps/admin/src/components/ui/multi-image-upload-field.tsx`:

```tsx
'use client'

import type { UploadImagePurpose } from '@/lib/api'
import { uploadApi } from '@/lib/api'
import Image from 'next/image'
import { type ChangeEvent, useEffect, useId, useState } from 'react'

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
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedValue, setAdvancedValue] = useState(value.join('\n'))

  useEffect(() => {
    setAdvancedValue(value.join('\n'))
  }, [value])

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
      const nextValue = [...value, ...uploadedUrls]
      onChange(nextValue)
      setAdvancedValue(nextValue.join('\n'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (index: number) => {
    const nextValue = value.filter((_, currentIndex) => currentIndex !== index)
    onChange(nextValue)
    setAdvancedValue(nextValue.join('\n'))
  }

  const applyAdvancedValue = (rawValue: string) => {
    setAdvancedValue(rawValue)
    onChange(
      rawValue
        .split('\n')
        .map((url) => url.trim())
        .filter(Boolean),
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-file`} className="block text-sm font-medium text-on-surface">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="text-xs font-medium text-primary hover:opacity-80"
        >
          {showAdvanced ? 'Ẩn URL' : 'Nhập URL'}
        </button>
      </div>

      {helperText && <p className="text-xs text-on-surface-variant">{helperText}</p>}

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="space-y-2">
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

      {showAdvanced && (
        <textarea
          value={advancedValue}
          disabled={disabled || isUploading}
          onChange={(event) => applyAdvancedValue(event.target.value)}
          placeholder="Mỗi URL một dòng"
          className="w-full min-h-[80px] rounded-xl bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
        />
      )}

      {error && <p className="text-xs font-medium text-error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Export component from UI barrel if appropriate**

If using the UI barrel, add:

```ts
export * from './multi-image-upload-field'
```

- [ ] **Step 3: Run admin typecheck**

Run: `bun --filter @S-Loco/admin check`

Expected: TypeScript passes with no new errors.

- [ ] **Step 4: Commit multi-image component**

```bash
git add apps/admin/src/components/ui/multi-image-upload-field.tsx apps/admin/src/components/ui/index.ts
git commit -m "feat: add admin multi-image upload field"
```

---

### Task 5: Migrate vendor and service forms

**Files:**

- Modify: `apps/admin/src/app/dashboard/vendors/page.tsx:1-1160`

- [ ] **Step 1: Import reusable upload fields**

Update imports in `apps/admin/src/app/dashboard/vendors/page.tsx`:

- Remove `uploadApi` from `@/lib/api` import.
- Add:

```ts
import { ImageUploadField, MultiImageUploadField } from '@/components/ui'
```

or direct component imports if the barrel is not used.

- [ ] **Step 2: Track upload state in `VendorFormModal`**

Use a small upload counter instead of a single shared boolean so concurrent logo/cover uploads cannot incorrectly re-enable submit:

```ts
const [uploadingCount, setUploadingCount] = useState(0)
const imageUploading = uploadingCount > 0
const trackImageUploading = (isUploading: boolean) => {
  setUploadingCount((current) => Math.max(0, current + (isUploading ? 1 : -1)))
}
```

In `handleSubmit`, before setting `loading`, block submit if upload is in progress:

```ts
if (imageUploading) {
  setError('Vui lòng chờ ảnh tải lên xong trước khi lưu.')
  return
}
```

- [ ] **Step 3: Remove local `uploadVendorImage` helper**

Delete the `uploadVendorImage` function because the new field component owns upload behavior.

- [ ] **Step 4: Replace vendor logo/cover fields**

Replace the two `ImageInput` usages inside the `Hình ảnh` section with:

```tsx
<ImageUploadField
  label="Logo"
  value={formData.logo_url}
  purpose="vendor_logo"
  helperText="Tải logo vendor lên server. Có thể nhập URL trong mục nâng cao nếu cần."
  onChange={(url) => setFormData({ ...formData, logo_url: url })}
  onUploadingChange={trackImageUploading}
/>
<ImageUploadField
  label="Ảnh bìa"
  value={formData.cover_image_url}
  purpose="vendor_cover"
  helperText="Ảnh bìa hiển thị trên hồ sơ vendor."
  previewClassName="h-36 w-full object-cover"
  onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
  onUploadingChange={trackImageUploading}
/>
```

- [ ] **Step 5: Disable vendor save during image upload**

Change the vendor submit button disabled expression to:

```tsx
disabled={loading || imageUploading}
```

Change the label to show upload status if needed:

```tsx
{imageUploading ? 'Đang tải ảnh...' : loading ? 'Đang lưu...' : 'Lưu thông tin'}
```

- [ ] **Step 6: Track upload state in `ServiceForm`**

Add upload state. A boolean is sufficient here because one multi-image component owns the upload sequence:

```ts
const [imageUploading, setImageUploading] = useState(false)
```

At the top of `submit`, block while uploading:

```ts
if (imageUploading) {
  setError('Vui lòng chờ ảnh tải lên xong trước khi lưu.')
  return
}
```

- [ ] **Step 7: Convert service image state to URL list updates**

Keep `formData.images` as newline text internally to minimize changes, but add a helper:

```ts
const setImageUrls = (urls: string[]) => {
  setFormData((current) => ({ ...current, images: urls.join('\n') }))
}
```

- [ ] **Step 8: Replace service file input and textarea**

Replace the `Ảnh dịch vụ` block containing file input and textarea with:

```tsx
<MultiImageUploadField
  label="Ảnh dịch vụ"
  value={imageUrls}
  purpose="service_image"
  helperText="Tải một hoặc nhiều ảnh dịch vụ lên server."
  onChange={setImageUrls}
  onUploadingChange={setImageUploading}
/>
```

- [ ] **Step 9: Remove local `uploadServiceImage` helper**

Delete the local `uploadServiceImage` function after replacement.

- [ ] **Step 10: Disable service save during image upload**

Change service submit button disabled expression to:

```tsx
disabled={loading || imageUploading}
```

Change button label:

```tsx
{imageUploading ? 'Đang tải ảnh...' : loading ? 'Đang lưu...' : 'Lưu dịch vụ'}
```

- [ ] **Step 11: Remove obsolete local `ImageInput` component**

Delete the `ImageInput` function at the bottom of the file if no references remain.

- [ ] **Step 12: Run admin typecheck**

Run: `bun --filter @S-Loco/admin check`

Expected: TypeScript passes with no new errors.

- [ ] **Step 13: Commit vendor/service form migration**

```bash
git add apps/admin/src/app/dashboard/vendors/page.tsx
git commit -m "feat: use upload fields in vendor forms"
```

---

### Task 6: Migrate content article cover image form

**Files:**

- Modify: `apps/admin/src/app/dashboard/content/page.tsx:1-309`
- Modify: `apps/admin/src/app/dashboard/content/[id]/page.tsx:1-206`

- [ ] **Step 1: Import `ImageUploadField` in both content form files**

In both `apps/admin/src/app/dashboard/content/page.tsx` and `apps/admin/src/app/dashboard/content/[id]/page.tsx`, add:

```ts
import { ImageUploadField } from '@/components/ui'
```

or direct import if the UI barrel is not used.

- [ ] **Step 2: Track cover upload state in create and edit forms**

Add state next to existing form state in `CreateArticleDialog` and `EditContentPage`:

```ts
const [coverUploading, setCoverUploading] = useState(false)
```

- [ ] **Step 3: Block submit during upload in create and edit forms**

In each `handleSubmit`, after validation and before `createMut.mutate` or `updateMut.mutate`, add:

```ts
if (coverUploading) {
  setErrors({ form: 'Vui lòng chờ ảnh tải lên xong trước khi lưu.' })
  return
}
```

- [ ] **Step 4: Save the canonical cover payload field in edit form**

The current edit page calls `api()` directly and sends `coverImage`. Update the edit submit payload to send the backend-compatible field name:

```ts
coverImageUrl: coverImage.trim(),
```

Do not send only `coverImage` from the edit form; `contentApi.create` performs that mapping for create, but the edit page bypasses it. Keep the create form routed through `contentApi.create` with `coverImage`, because `contentApi.create` already maps it to `coverImageUrl`.

- [ ] **Step 5: Replace visible cover URL input in create and edit forms**

Replace the `Ảnh bìa (URL)` input block in both content files with:

```tsx
<ImageUploadField
  label="Ảnh bìa"
  value={coverImage}
  purpose="content_cover"
  helperText="Tải ảnh bìa bài viết lên server. Có thể nhập URL trong mục nâng cao nếu cần."
  previewClassName="h-48 w-full object-cover"
  onChange={setCoverImage}
  onUploadingChange={setCoverUploading}
/>
```

- [ ] **Step 6: Disable save during upload in create and edit forms**

In the create form, change submit button disabled expression:

```tsx
disabled={createMut.isPending || coverUploading}
```

Change create label:

```tsx
{coverUploading ? 'Đang tải ảnh…' : createMut.isPending ? 'Đang tạo…' : 'Tạo bài viết'}
```

In the edit form, change submit button disabled expression:

```tsx
disabled={updateMut.isPending || coverUploading}
```

Change edit label:

```tsx
{coverUploading ? 'Đang tải ảnh…' : updateMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
```

- [ ] **Step 7: Run admin typecheck**

Run: `bun --filter @S-Loco/admin check`

Expected: TypeScript passes with no new errors.

- [ ] **Step 8: Commit content form migration**

```bash
git add apps/admin/src/app/dashboard/content/page.tsx apps/admin/src/app/dashboard/content/[id]/page.tsx
git commit -m "feat: upload content cover images"
```

---

### Task 7: Final verification and cleanup

**Files:**

- Review modified files from Tasks 1-6.

- [ ] **Step 1: Run backend upload tests**

Run: `SKIP_S3_UPLOAD=true bun --filter @S-Loco/api test tests/uploads.test.ts`

Expected: all upload tests pass.

- [ ] **Step 2: Run API typecheck**

Run: `bun --filter @S-Loco/api check`

Expected: no TypeScript errors.

- [ ] **Step 3: Run admin typecheck**

Run: `bun --filter @S-Loco/admin check`

Expected: no TypeScript errors.

- [ ] **Step 4: Run admin lint**

Run: `bun --filter @S-Loco/admin lint`

Expected: no Biome errors in edited admin files.

- [ ] **Step 5: Run API lint**

Run: `bun --filter @S-Loco/api lint`

Expected: no Biome errors in edited API files.

- [ ] **Step 6: Manual admin verification**

With API and admin app running, verify:

- Vendor logo upload updates preview and saves returned URL.
- Vendor cover upload updates preview and saves returned URL.
- Service image upload appends preview and saves returned URL list.
- Content cover upload updates preview and saves returned URL when creating an article.
- Content cover upload updates preview and saves returned URL when editing an article.
- `ImageUploadField` preserves the previous URL after an upload failure.
- `ImageUploadField` remove action clears optional image values.
- `MultiImageUploadField` appends successful uploads and removes selected URLs.
- Advanced URL fallback remains collapsed by default and updates form state when opened.
- Advanced URL fallback reflects parent value changes when the field value changes outside the textarea.
- Save is disabled or blocked while upload is in progress.

- [ ] **Step 7: Commit verification fixes if needed**

If verification required fixes, commit them:

```bash
git add <fixed-files>
git commit -m "fix: polish admin image upload fields"
```

If no fixes were needed, do not create an empty commit.

---

## Rollback

If this implementation causes problems, revert the implementation commits after the plan commit. The design spec commit can remain because it documents the intended direction.
