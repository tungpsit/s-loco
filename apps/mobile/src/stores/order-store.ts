/**
 * S-Loco — Order/Cart Store (Zustand)
 */
import { create } from 'zustand'
import type { ServiceItem } from '../lib/api'

export interface CartItem {
  service: ServiceItem
  quantity: number
}

interface OrderState {
  items: CartItem[]
  addItem: (service: ServiceItem, quantity?: number) => void
  removeItem: (serviceId: string) => void
  updateQuantity: (serviceId: string, quantity: number) => void
  clear: () => void
  total: () => number
}

export const useOrderStore = create<OrderState>((set, get) => ({
  items: [],

  addItem: (service, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.service.id === service.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.service.id === service.id ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        }
      }
      return { items: [...state.items, { service, quantity }] }
    })
  },

  removeItem: (serviceId) => {
    set((state) => ({
      items: state.items.filter((i) => i.service.id !== serviceId),
    }))
  },

  updateQuantity: (serviceId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(serviceId)
      return
    }
    set((state) => ({
      items: state.items.map((i) => (i.service.id === serviceId ? { ...i, quantity } : i)),
    }))
  },

  clear: () => set({ items: [] }),

  total: () => {
    const { items } = get()
    return items.reduce((sum, { service, quantity }) => {
      const price = service.discount_price ?? service.original_price ?? 0
      return sum + price * quantity
    }, 0)
  },
}))
