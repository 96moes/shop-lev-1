import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { cartService } from '../services/cartService'
import { orderService, type CreateOrderInput } from '../services/orderService'
import { categoryService, productService } from '../services/productService'
import {
  adminService,
  couponService,
  notificationService,
  paymentService,
  reviewService,
  wishlistService,
} from '../services/shopService'
import type { Cart, PaymentMethod, ProductQuery } from '../types/api'

export const queryKeys = {
  products: (query: ProductQuery) => ['products', query] as const,
  product: (id: string) => ['product', id] as const,
  categories: ['categories'] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
  reviews: (productId: string) => ['reviews', productId] as const,
  wishlist: ['wishlist'] as const,
  notifications: ['notifications'] as const,
  adminStats: ['admin', 'stats'] as const,
  adminCustomers: ['admin', 'customers'] as const,
  adminCoupons: ['admin', 'coupons'] as const,
}

export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: queryKeys.products(query),
    queryFn: () => productService.list(query),
    // Keep the previous page visible while the next one loads.
    placeholderData: (previous) => previous,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(id ?? ''),
    queryFn: () => productService.getById(id as string),
    enabled: Boolean(id),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoryService.list(),
    // Categories change rarely.
    staleTime: 5 * 60_000,
  })
}

export function useCart() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => cartService.get(),
    enabled: isAuthenticated,
  })
}

export function useOrders() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => orderService.list(),
    enabled: isAuthenticated,
  })
}

export function useOrder(id: string | undefined) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.order(id ?? ''),
    queryFn: () => orderService.getById(id as string),
    enabled: Boolean(id) && isAuthenticated,
  })
}

/**
 * Cart mutations write the returned cart straight into the cache. The API
 * responds with the whole cart, so a refetch would be wasted work.
 */
function useCartMutation<TArgs>(mutationFn: (args: TArgs) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      if (isAuthenticated) {
        queryClient.setQueryData(queryKeys.cart, cart)
      }
    },
  })
}

export function useAddToCart() {
  return useCartMutation(({ productId, quantity }: { productId: string; quantity?: number }) =>
    cartService.addItem(productId, quantity ?? 1),
  )
}

export function useUpdateCartItem() {
  return useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    cartService.updateItem(itemId, quantity),
  )
}

export function useRemoveCartItem() {
  return useCartMutation(({ itemId }: { itemId: string }) => cartService.removeItem(itemId))
}

export function useClearCart() {
  return useCartMutation(() => cartService.clear())
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => orderService.create(input),
    onSuccess: () => {
      // The cart is consumed and a new order exists.
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart })
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      void queryClient.invalidateQueries({ queryKey: ['products'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

/* ------------------------------------------------------------------ Part 3 */

/** Reviews for one product. */
export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews(productId ?? ''),
    queryFn: () => reviewService.listForProduct(productId as string),
    enabled: Boolean(productId),
  })
}

/** Creates a review and refreshes the product's review list. */
export function useCreateReview(productId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { rating: number; title?: string; comment?: string }) =>
      reviewService.create(productId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews(productId) })
    },
  })
}

export function useWishlist() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: () => wishlistService.list(),
    enabled: isAuthenticated,
  })
}

/** Add/remove a saved product, keeping the wishlist cache in step. */
export function useWishlistMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.wishlist })

  const add = useMutation({
    mutationFn: (productId: string) => wishlistService.add(productId),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (productId: string) => wishlistService.removeByProduct(productId),
    onSuccess: invalidate,
  })

  return { add, remove }
}

export function useNotifications(enabled = true) {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationService.list(),
    enabled: enabled && isAuthenticated,
    // Poll so the badge stays fresh without a socket.
    refetchInterval: 60_000,
  })
}

export function useNotificationMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications })

  const markRead = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: invalidate,
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: invalidate,
  })

  return { markRead, markAllRead }
}

/** Verifies a payment and refreshes the order so its status updates. */
export function useVerifyPayment(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (method: PaymentMethod) =>
      paymentService.verify({ orderId, method }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
    },
  })
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      couponService.validate(code, subtotal),
  })
}

/* ------------------------------------------------------------- admin only */

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: () => adminService.stats(),
    enabled,
  })
}

export function useAdminCustomers(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminCustomers,
    queryFn: () => adminService.customers(),
    enabled,
  })
}

export function useAdminCoupons(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.adminCoupons,
    queryFn: () => couponService.list(),
    enabled,
  })
}

/** Admin catalog mutations; all invalidate the product lists and stats. */
export function useAdminProductMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['products'] })
    void queryClient.invalidateQueries({ queryKey: ['product'] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminStats })
  }

  const create = useMutation({ mutationFn: adminService.createProduct, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Parameters<typeof adminService.updateProduct>[1]) =>
      adminService.updateProduct(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: adminService.deleteProduct, onSuccess: invalidate })

  return { create, update, remove }
}

export function useAdminCouponMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons })

  const create = useMutation({ mutationFn: couponService.create, onSuccess: invalidate })
  const remove = useMutation({ mutationFn: couponService.remove, onSuccess: invalidate })

  return { create, remove }
}
