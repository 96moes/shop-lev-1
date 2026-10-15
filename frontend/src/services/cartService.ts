import { apiClient } from './apiClient'
import type { Cart } from '../types/api'

export const cartService = {
  async get(): Promise<Cart> {
    const { data } = await apiClient.get<Cart>('/cart')
    return data
  },

  async addItem(productId: string, quantity = 1): Promise<Cart> {
    const { data } = await apiClient.post<Cart>('/cart/items', {
      productId,
      quantity,
    })
    return data
  },

  async updateItem(itemId: string, quantity: number): Promise<Cart> {
    const { data } = await apiClient.patch<Cart>(`/cart/items/${itemId}`, {
      quantity,
    })
    return data
  },

  async removeItem(itemId: string): Promise<Cart> {
    const { data } = await apiClient.delete<Cart>(`/cart/items/${itemId}`)
    return data
  },

  async clear(): Promise<Cart> {
    const { data } = await apiClient.delete<Cart>('/cart')
    return data
  },
}
