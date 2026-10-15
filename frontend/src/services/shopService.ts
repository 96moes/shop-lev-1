import { apiClient } from './apiClient'
import type {
  Coupon,
  CouponValidation,
  DashboardStats,
  Order,
  OrderStatus,
  Paginated,
  Payment,
  PaymentMethod,
  PaymentResult,
  ProductReviews,
  Product,
  ProductQuery,
  Review,
  User,
  WishlistItem,
} from '../types/api'

export const paymentService = {
  /** Asks the server to verify a payment with the provider and record it. */
  async verify(input: {
    orderId: string
    method: PaymentMethod
    transactionId?: string
  }): Promise<PaymentResult> {
    const { data } = await apiClient.post<PaymentResult>('/payments/verify', input)
    return data
  },

  async listForOrder(orderId: string): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(`/payments/order/${orderId}`)
    return data
  },
}

export const couponService = {
  /** Public eligibility check used by the cart and checkout screens. */
  async validate(code: string, subtotal: number): Promise<CouponValidation> {
    const { data } = await apiClient.post<CouponValidation>('/coupons/validate', {
      code,
      subtotal,
    })
    return data
  },

  async list(): Promise<Coupon[]> {
    const { data } = await apiClient.get<Coupon[]>('/coupons')
    return data
  },

  async create(input: {
    code: string
    description?: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    minOrderAmount?: number
    maxDiscountAmount?: number
    usageLimit?: number
    isActive?: boolean
  }): Promise<Coupon> {
    const { data } = await apiClient.post<Coupon>('/coupons', input)
    return data
  },

  async update(id: string, input: Partial<Coupon>): Promise<Coupon> {
    const { data } = await apiClient.put<Coupon>(`/coupons/${id}`, input)
    return data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/coupons/${id}`)
  },
}

export const reviewService = {
  async listForProduct(
    productId: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<ProductReviews> {
    const { data } = await apiClient.get<ProductReviews>(
      `/products/${productId}/reviews`,
      { params },
    )
    return data
  },

  async create(
    productId: string,
    input: { rating: number; title?: string; comment?: string },
  ): Promise<Review> {
    const { data } = await apiClient.post<Review>(
      `/products/${productId}/reviews`,
      input,
    )
    return data
  },

  async update(
    id: string,
    input: { rating?: number; title?: string; comment?: string },
  ): Promise<Review> {
    const { data } = await apiClient.patch<Review>(`/reviews/${id}`, input)
    return data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`)
  },

  async listMine(): Promise<Review[]> {
    const { data } = await apiClient.get<Review[]>('/reviews/mine')
    return data
  },
}

export const wishlistService = {
  async list(): Promise<WishlistItem[]> {
    const { data } = await apiClient.get<WishlistItem[]>('/wishlist')
    return data
  },

  async add(productId: string): Promise<WishlistItem> {
    const { data } = await apiClient.post<WishlistItem>('/wishlist', { productId })
    return data
  },

  async removeByProduct(productId: string): Promise<void> {
    await apiClient.delete(`/wishlist/product/${productId}`)
  },
}

export const notificationService = {
  async list(unreadOnly = false) {
    const { data } = await apiClient.get<{
      items: import('../types/api').AppNotification[]
      unreadCount: number
    }>('/notifications', { params: unreadOnly ? { unreadOnly: true } : {} })
    return data
  },

  async markRead(id: string) {
    const { data } = await apiClient.patch(`/notifications/${id}/read`)
    return data
  },

  async markAllRead(): Promise<{ updated: number }> {
    const { data } = await apiClient.post<{ updated: number }>(
      '/notifications/read-all',
    )
    return data
  },
}

export const adminService = {
  async stats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>('/admin/stats')
    return data
  },

  async customers(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/admin/customers')
    return data
  },

  async orders(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>('/admin/orders')
    return data
  },

  async products(query: ProductQuery = {}): Promise<Paginated<Product>> {
    const { data } = await apiClient.get<Paginated<Product>>('/admin/products', {
      params: query,
    })
    return data
  },

  async updateOrderStatus(
    id: string,
    status: Extract<OrderStatus, 'processing' | 'shipped' | 'delivered' | 'cancelled'>,
  ): Promise<Order> {
    const { data } = await apiClient.patch<Order>(`/admin/orders/${id}/status`, {
      status,
    })
    return data
  },

  async createProduct(input: {
    name: string
    description?: string
    price: number
    stock?: number
    categoryId?: string
    isFeatured?: boolean
  }) {
    const { data } = await apiClient.post('/products', input)
    return data
  },

  async updateProduct(
    id: string,
    input: {
      name?: string
      description?: string
      price?: number
      stock?: number
      isActive?: boolean
      isFeatured?: boolean
      categoryId?: string | null
    },
  ) {
    const { data } = await apiClient.put(`/products/${id}`, input)
    return data
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`)
  },
}
