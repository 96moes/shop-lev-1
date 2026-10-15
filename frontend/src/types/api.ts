/** Shared API types, mirroring the backend response shapes. */

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  /** Prices arrive as decimal strings to avoid float rounding. */
  price: string;
  compareAtPrice: string | null;
  sku: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category?: Category | null;
  images?: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  unitPrice: string | null;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  shippingFee: string;
  tax: string;
  total: string;
  notes: string | null;
  placedAt: string | null;
  shippingFullName: string;
  shippingPhone: string | null;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddressInput {
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
}

/* ------------------------------------------------------------------ Part 3 */

export type PaymentMethod = 'stripe' | 'paypal' | 'cod';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  currency: string;
  transactionId: string | null;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PaymentResult extends Payment {
  /** Human-readable outcome shown to the customer. */
  message: string;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

export interface CouponValidation {
  valid: boolean;
  reason: string | null;
  discount: number;
  code: string;
  description: string | null;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviews {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export type NotificationType =
  | 'order'
  | 'payment'
  | 'promotion'
  | 'account'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface DailySales {
  date: string;
  orders: number;
  revenue: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  topProducts: TopProduct[];
  salesByDay: DailySales[];
  lowStock: { id: string; name: string; stock: number }[];
  ordersByStatus: Record<string, number>;
}
