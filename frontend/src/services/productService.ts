import { apiClient } from './apiClient'
import type { Category, Paginated, Product, ProductQuery } from '../types/api'

export const productService = {
  async list(query: ProductQuery = {}): Promise<Paginated<Product>> {
    const { data } = await apiClient.get<Paginated<Product>>('/products', {
      // Drop empty values so they are not sent as blank filters.
      params: Object.fromEntries(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== ''),
      ),
    })
    return data
  },

  async getById(id: string): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${id}`)
    return data
  },
}

export const categoryService = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>('/categories')
    return data
  },
}
