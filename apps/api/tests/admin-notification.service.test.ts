import { describe, expect, test } from 'bun:test'
import {
  buildAdminNotification,
  buildNotificationFilters,
  normalizeNotificationCategory,
  normalizeNotificationSeverity,
} from '../src/services/admin-notification.service'

describe('admin notification service', () => {
  test('builds structured admin notification payload with category, severity and action url', () => {
    const notification = buildAdminNotification({
      type: 'admin_vendor_pending',
      category: 'vendor',
      severity: 'warning',
      title: 'Vendor mới chờ duyệt',
      body: 'Nhà hàng Biển Xanh vừa đăng ký và cần admin duyệt.',
      actionUrl: '/dashboard/vendors?vendorId=vendor-1',
      data: { vendorId: 'vendor-1' },
    })

    expect(notification).toEqual({
      type: 'admin_vendor_pending',
      category: 'vendor',
      severity: 'warning',
      title: 'Vendor mới chờ duyệt',
      body: 'Nhà hàng Biển Xanh vừa đăng ký và cần admin duyệt.',
      data: {
        vendorId: 'vendor-1',
        actionUrl: '/dashboard/vendors?vendorId=vendor-1',
        category: 'vendor',
        severity: 'warning',
      },
    })
  })

  test('normalizes invalid category and severity to safe defaults', () => {
    expect(normalizeNotificationCategory('unknown')).toBe('system')
    expect(normalizeNotificationSeverity('unknown')).toBe('info')
  })

  test('builds notification filters from valid query values only', () => {
    const filters = buildNotificationFilters({
      unreadOnly: true,
      category: 'payment',
      severity: 'critical',
      page: 2,
      limit: 200,
    })

    expect(filters).toEqual({
      unread_only: true,
      category: 'payment',
      severity: 'critical',
      page: 2,
      limit: 100,
    })
  })
})
