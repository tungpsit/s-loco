import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const PURPOSES = new Set([
  'vendor_logo',
  'vendor_cover',
  'service_image',
  'content_cover',
  'user_avatar',
])

type UploadImageInput = {
  file: File
  purpose: string
  ownerId?: string
}

export type UploadedImage = {
  key: string
  url: string
  contentType: string
  size: number
}

let client: S3Client | null = null

function getClient() {
  if (client) return client
  const endpoint = process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new MediaError('STORAGE_NOT_CONFIGURED', 'Chưa cấu hình object storage.')
  }

  client = new S3Client({
    region: process.env.S3_REGION || 'us-east-1',
    endpoint: endpoint.startsWith('http') ? endpoint : `http://${endpoint}`,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    credentials: { accessKeyId, secretAccessKey },
  })
  return client
}

function getBucket() {
  const bucket = process.env.S3_BUCKET || process.env.MINIO_BUCKET
  if (!bucket) throw new MediaError('STORAGE_NOT_CONFIGURED', 'Chưa cấu hình bucket lưu ảnh.')
  return bucket
}

export function getPublicBaseUrl() {
  return (
    process.env.S3_PUBLIC_BASE_URL ||
    process.env.MINIO_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

export function isManagedImageUrl(url: string) {
  try {
    const parsed = new URL(url)
    const managedBase = new URL(getPublicBaseUrl())
    return (
      parsed.origin === managedBase.origin && parsed.pathname.split('/').filter(Boolean).length >= 3
    )
  } catch {
    return false
  }
}

export function assertManagedImageUrls(urls: string[] | undefined) {
  if (!urls) return
  const invalidUrl = urls.find((url) => !isManagedImageUrl(url))
  if (invalidUrl) {
    throw new MediaError(
      'INVALID_IMAGE_URL',
      'Vui lòng upload ảnh lên server thay vì nhập URL bên ngoài.',
    )
  }
}

function extensionFor(contentType: string) {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return extensions[contentType] || 'bin'
}

export async function uploadImage({
  file,
  purpose,
  ownerId,
}: UploadImageInput): Promise<UploadedImage> {
  if (!PURPOSES.has(purpose)) {
    throw new MediaError('INVALID_PURPOSE', 'Mục đích upload không hợp lệ.')
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new MediaError('INVALID_FILE_TYPE', 'Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc GIF.')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new MediaError('FILE_TOO_LARGE', 'Ảnh không được vượt quá 5MB.')
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const key = [
    purpose,
    ownerId || 'admin',
    `${crypto.randomUUID()}.${extensionFor(file.type)}`,
  ].join('/')

  if (process.env.NODE_ENV !== 'test' && process.env.SKIP_S3_UPLOAD !== 'true') {
    await getClient().send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: bytes,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )
  }

  return {
    key,
    url: `${getPublicBaseUrl()}/${key}`,
    contentType: file.type,
    size: file.size,
  }
}

export class MediaError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'MediaError'
  }
}
