import { relations } from 'drizzle-orm'
import { articles } from './schema/content'
import { comboItems, combos, serviceCategories, services, vendorQrSecrets, vendors } from './schema/vendors'
import { notifications } from './schema/notifications'
import { orderItems, orders, paymentEvents, payments, refunds, voucherAuditLog, vouchers } from './schema/orders'
import { reviews } from './schema/reviews'
import { settlementItems, settlements } from './schema/settlements'
import { userSessions, users } from './schema/users'

// ─── User Relations ────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  vendors: many(vendors),
  sessions: many(userSessions),
  orders: many(orders),
  vouchers: many(vouchers),
  reviews: many(reviews),
  notifications: many(notifications),
  articles: many(articles),
}))

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}))

// ─── Vendor Relations ──────────────────────────────────
export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  owner: one(users, { fields: [vendors.ownerId], references: [users.id] }),
  services: many(services),
  combos: many(combos),
  vouchers: many(vouchers),
  settlements: many(settlements),
  reviews: many(reviews),
  qrSecrets: many(vendorQrSecrets),
}))

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}))

export const servicesRelations = relations(services, ({ one, many }) => ({
  vendor: one(vendors, { fields: [services.vendorId], references: [vendors.id] }),
  category: one(serviceCategories, { fields: [services.categoryId], references: [serviceCategories.id] }),
  orderItems: many(orderItems),
  comboItems: many(comboItems),
  vouchers: many(vouchers),
}))

export const combosRelations = relations(combos, ({ one, many }) => ({
  vendor: one(vendors, { fields: [combos.vendorId], references: [vendors.id] }),
  items: many(comboItems),
}))

export const comboItemsRelations = relations(comboItems, ({ one }) => ({
  combo: one(combos, { fields: [comboItems.comboId], references: [combos.id] }),
  service: one(services, { fields: [comboItems.serviceId], references: [services.id] }),
}))

export const vendorQrSecretsRelations = relations(vendorQrSecrets, ({ one }) => ({
  vendor: one(vendors, { fields: [vendorQrSecrets.vendorId], references: [vendors.id] }),
}))

// ─── Order Relations ───────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  payments: many(payments),
}))

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  service: one(services, { fields: [orderItems.serviceId], references: [services.id] }),
  vendor: one(vendors, { fields: [orderItems.vendorId], references: [vendors.id] }),
  combo: one(combos, { fields: [orderItems.comboId], references: [combos.id] }),
  vouchers: many(vouchers),
}))

export const vouchersRelations = relations(vouchers, ({ one, many }) => ({
  orderItem: one(orderItems, { fields: [vouchers.orderItemId], references: [orderItems.id] }),
  user: one(users, { fields: [vouchers.userId], references: [users.id] }),
  vendor: one(vendors, { fields: [vouchers.vendorId], references: [vendors.id] }),
  service: one(services, { fields: [vouchers.serviceId], references: [services.id] }),
  refunds: many(refunds),
  auditLog: many(voucherAuditLog),
}))

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  refunds: many(refunds),
}))

export const refundsRelations = relations(refunds, ({ one }) => ({
  voucher: one(vouchers, { fields: [refunds.voucherId], references: [vouchers.id] }),
  payment: one(payments, { fields: [refunds.paymentId], references: [payments.id] }),
  initiator: one(users, { fields: [refunds.initiatedBy], references: [users.id] }),
}))

export const voucherAuditLogRelations = relations(voucherAuditLog, ({ one }) => ({
  voucher: one(vouchers, { fields: [voucherAuditLog.voucherId], references: [vouchers.id] }),
  actor: one(users, { fields: [voucherAuditLog.actorId], references: [users.id] }),
}))

export const paymentEventsRelations = relations(paymentEvents, ({ one }) => ({
  order: one(orders, { fields: [paymentEvents.orderId], references: [orders.id] }),
}))

// ─── Settlement Relations ──────────────────────────────
export const settlementsRelations = relations(settlements, ({ one, many }) => ({
  vendor: one(vendors, { fields: [settlements.vendorId], references: [vendors.id] }),
  approver: one(users, { fields: [settlements.approvedBy], references: [users.id] }),
  items: many(settlementItems),
}))

export const settlementItemsRelations = relations(settlementItems, ({ one }) => ({
  settlement: one(settlements, { fields: [settlementItems.settlementId], references: [settlements.id] }),
  voucher: one(vouchers, { fields: [settlementItems.voucherId], references: [vouchers.id] }),
}))

// ─── Review Relations ──────────────────────────────────
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  vendor: one(vendors, { fields: [reviews.vendorId], references: [vendors.id] }),
  service: one(services, { fields: [reviews.serviceId], references: [services.id] }),
  voucher: one(vouchers, { fields: [reviews.voucherId], references: [vouchers.id] }),
}))

// ─── Content Relations ─────────────────────────────────
export const articlesRelations = relations(articles, ({ one }) => ({
  author: one(users, { fields: [articles.authorId], references: [users.id] }),
}))

// ─── Notification Relations ────────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}))
