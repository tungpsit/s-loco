/**
 * seeds/01-categories.ts
 * Seed 6 service categories for S-Loco
 * Run: bun run packages/db/seeds/01-categories.ts
 */

import { createDb } from '../src/index'
import { serviceCategories } from '../src/schema'

const CATEGORIES = [
  { name: 'Ẩm thực', slug: 'am-thuc', icon: '🍜', sortOrder: 1 },
  { name: 'Lưu trú', slug: 'luu-tru', icon: '🏨', sortOrder: 2 },
  { name: 'Spa & Massage', slug: 'spa-massage', icon: '💆', sortOrder: 3 },
  { name: 'Xe điện', slug: 'xe-dien', icon: '🛺', sortOrder: 4 },
  { name: 'Giải trí', slug: 'giai-tri', icon: '🎠', sortOrder: 5 },
  { name: 'Mua sắm', slug: 'mua-sam', icon: '🛍️', sortOrder: 6 },
]

async function seed() {
  console.log('🌱 Seeding categories...')
  const db = createDb()

  await db.delete(serviceCategories)

  await db.insert(serviceCategories).values(
    CATEGORIES.map((c) => ({
      ...c,
      isActive: true,
    })),
  )

  const rows = await db.select().from(serviceCategories)
  console.log(`✅ ${rows.length} categories inserted:`)
  for (const c of rows) {
    console.log(`   ${c.icon} ${c.name} (slug: ${c.slug})`)
  }

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
