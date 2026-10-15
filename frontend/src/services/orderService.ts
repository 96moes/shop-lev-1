import { apiClient } from './apiClient'
import type { Order, ShippingAddressInput } from '../types/api'

export interface CreateOrderInput {
  shippingAddress: ShippingAddressInput
  couponCode?: string
  notes?: string
}

export const orderService = {
  async create(input: CreateOrderInput): Promise<Order> {
    const { data } = await apiClient.post<Order>('/orders', input)
    return data
  },

  async list(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>('/orders')
    return data
  },

  async getById(id: string): Promise<Order> {
    const { data } = await apiClient.get<Order>(`/orders/${id}`)
    return data
  },
}
