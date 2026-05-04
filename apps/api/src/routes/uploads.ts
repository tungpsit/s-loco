import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import { MediaError, uploadImage } from '../services/media.service'

const uploadRoutes = new Hono<{ Variables: { userId: string | null; userRole: string | null } }>()

uploadRoutes.post('/images', authMiddleware(), requireRole('admin', 'vendor_owner'), async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file')
    const purpose = String(formData.get('purpose') || '')
    const role = c.get('userRole')

    if (!(file instanceof File)) {
      return c.json(
        { success: false, error: { code: 'MISSING_FILE', message: 'Vui lòng chọn ảnh.' } },
        400,
      )
    }

    if (role === 'vendor_owner' && purpose !== 'service_image') {
      return c.json(
        {
          success: false,
          error: { code: 'INVALID_PURPOSE', message: 'Vendor chỉ được upload ảnh dịch vụ.' },
        },
        400,
      )
    }

    const uploaded = await uploadImage({
      file,
      purpose,
      ownerId: c.get('userId') || undefined,
    })

    return c.json({ success: true, data: uploaded }, 201)
  } catch (err) {
    if (err instanceof MediaError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

export default uploadRoutes
