import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Field from '../components/Field'
import { inputClass, selectClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import {
  useAdminCouponMutations,
  useAdminCoupons,
  useAdminCustomers,
  useAdminOrders,
  useAdminOrderMutations,
  useAdminProducts,
  useAdminProductMutations,
  useAdminStats,
  useCategories,
} from '../hooks/useShop'
import {
  formatDate,
  formatNumber,
  formatPriceWithUnit,
  formatStatus,
} from '../lib/format'
import { getErrorMessage } from '../services/apiClient'
import type { OrderStatus } from '../types/api'

type Tab = 'overview' | 'products' | 'orders' | 'coupons' | 'customers'

/** Compact bar chart of daily revenue; avoids pulling in a chart dependency. */
function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div className="flex h-40 items-end gap-1" role="img" aria-label="درآمد روزانه">
      {data.map((day) => (
        <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-brand-600"
            style={{ height: `${Math.max(2, (day.revenue / max) * 100)}%` }}
            title={`${day.date}: ${formatPriceWithUnit(day.revenue)}`}
          />
          <span className="text-[10px] text-brand-500">
            {formatNumber(day.date.slice(8))}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AdminPage() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState<Tab>('overview')
  const [productPage, setProductPage] = useState(1)

  const stats = useAdminStats(isAdmin)
  const customers = useAdminCustomers(isAdmin && tab === 'customers')
  const orders = useAdminOrders(isAdmin && tab === 'orders')
  const coupons = useAdminCoupons(isAdmin && tab === 'coupons')
  const products = useAdminProducts(
    { limit: 50, page: productPage, sort: 'newest' },
    isAdmin && tab === 'products',
  )
  const categories = useCategories()

  const productMutations = useAdminProductMutations()
  const orderMutations = useAdminOrderMutations()
  const couponMutations = useAdminCouponMutations()

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    categoryId: '',
    description: '',
  })
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
  })
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function report(action: () => Promise<unknown>, success: string) {
    setNotice(null)
    setError(null)
    void action()
      .then(() => setNotice(success))
      .catch((e: unknown) => setError(getErrorMessage(e)))
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'نمای کلی' },
    { id: 'products', label: 'محصولات' },
    { id: 'orders', label: 'سفارش‌ها' },
    { id: 'coupons', label: 'کدهای تخفیف' },
    { id: 'customers', label: 'مشتریان' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-800">داشبورد مدیریت</h1>
        <p className="mt-1 text-sm text-brand-700">
          عملکرد فروشگاه، محصولات و تخفیف‌ها.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-brand-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-brand-700 text-brand-800'
                : 'border-transparent text-brand-600 hover:text-brand-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {notice && (
        <p
          role="status"
          className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800"
        >
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {tab === 'overview' && (
        <>
          {stats.isLoading && (
            <p className="text-sm text-brand-600">در حال بارگذاری آمار…</p>
          )}
          {stats.isError && (
            <p className="text-sm text-red-600">بارگذاری آمار داشبورد ممکن نشد.</p>
          )}

          {stats.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    label: 'درآمد کل',
                    value: formatPriceWithUnit(stats.data.totalRevenue),
                  },
                  { label: 'تعداد سفارش‌ها', value: formatNumber(stats.data.totalOrders) },
                  {
                    label: 'میانگین سفارش',
                    value: formatPriceWithUnit(stats.data.averageOrderValue),
                  },
                  { label: 'مشتریان', value: formatNumber(stats.data.totalCustomers) },
                  { label: 'محصولات', value: formatNumber(stats.data.totalProducts) },
                  {
                    label: 'سفارش‌های در انتظار',
                    value: formatNumber(stats.data.pendingOrders),
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border border-brand-100 bg-white p-4"
                  >
                    <p className="text-xs text-brand-600">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-brand-800">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-lg border border-brand-100 bg-white p-6 lg:col-span-2">
                  <h2 className="text-sm font-semibold text-brand-600">
                    درآمد ۱۴ روز گذشته
                  </h2>
                  <div className="mt-4">
                    <RevenueChart data={stats.data.salesByDay} />
                  </div>
                </section>

                <section className="rounded-lg border border-brand-100 bg-white p-6">
                  <h2 className="text-sm font-semibold text-brand-600">
                    سفارش‌ها بر پایه وضعیت
                  </h2>
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    {Object.entries(stats.data.ordersByStatus).map(([status, count]) => (
                      <li key={status} className="flex justify-between">
                        <span className="text-brand-700">{formatStatus(status)}</span>
                        <span className="font-medium text-brand-800">
                          {formatNumber(count)}
                        </span>
                      </li>
                    ))}
                    {Object.keys(stats.data.ordersByStatus).length === 0 && (
                      <li className="text-brand-600">هنوز سفارشی ثبت نشده است.</li>
                    )}
                  </ul>
                </section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-lg border border-brand-100 bg-white p-6">
                  <h2 className="text-sm font-semibold text-brand-600">
                    پرفروش‌ترین محصولات
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3 text-sm">
                    {stats.data.topProducts.map((p) => (
                      <li key={p.productId} className="flex justify-between gap-4">
                        <Link
                          to={`/products/${p.productId}`}
                          className="text-brand-700 hover:underline"
                        >
                          {p.name}
                        </Link>
                        <span className="whitespace-nowrap text-brand-600">
                          {formatNumber(p.unitsSold)} فروش ·{' '}
                          {formatPriceWithUnit(p.revenue)}
                        </span>
                      </li>
                    ))}
                    {stats.data.topProducts.length === 0 && (
                      <li className="text-brand-600">
                        هنوز سفارش پرداخت‌شده‌ای ثبت نشده است.
                      </li>
                    )}
                  </ul>
                </section>

                <section className="rounded-lg border border-brand-100 bg-white p-6">
                  <h2 className="text-sm font-semibold text-brand-600">موجودی کم</h2>
                  <ul className="mt-4 flex flex-col gap-3 text-sm">
                    {stats.data.lowStock.map((p) => (
                      <li key={p.id} className="flex justify-between gap-4">
                        <span className="text-brand-700">{p.name}</span>
                        <span
                          className={`font-medium ${
                            p.stock === 0 ? 'text-red-600' : 'text-amber-600'
                          }`}
                        >
                          {formatNumber(p.stock)} باقی‌مانده
                        </span>
                      </li>
                    ))}
                    {stats.data.lowStock.length === 0 && (
                      <li className="text-brand-600">موجودی همه محصولات مناسب است.</li>
                    )}
                  </ul>
                </section>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'products' && (
        <>
          <section className="rounded-lg border border-brand-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-brand-600">افزودن محصول</h2>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault()
                const name = newProduct.name
                report(
                  () =>
                    productMutations.create.mutateAsync({
                      name,
                      description: newProduct.description || undefined,
                      price: Number(newProduct.price),
                      stock: newProduct.stock ? Number(newProduct.stock) : undefined,
                      categoryId: newProduct.categoryId || undefined,
                    }),
                  `محصول «${name}» ساخته شد.`,
                )
                setNewProduct({
                  name: '',
                  price: '',
                  stock: '',
                  categoryId: '',
                  description: '',
                })
              }}
            >
              <Field label="نام محصول" htmlFor="p-name">
                <input
                  id="p-name"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="قیمت (ریال)" htmlFor="p-price">
                <input
                  id="p-price"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="موجودی" htmlFor="p-stock">
                <input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="دسته‌بندی" htmlFor="p-category">
                <select
                  id="p-category"
                  value={newProduct.categoryId}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, categoryId: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="">بدون دسته‌بندی</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="توضیحات" htmlFor="p-desc">
                  <textarea
                    id="p-desc"
                    rows={2}
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={productMutations.create.isPending}>
                  {productMutations.create.isPending ? 'در حال ساخت…' : 'ساخت محصول'}
                </Button>
              </div>
            </form>
          </section>

          <section className="overflow-x-auto rounded-lg border border-brand-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-right text-xs text-brand-600">
                <tr>
                  <th className="px-4 py-3 font-medium">محصول</th>
                  <th className="px-4 py-3 font-medium">قیمت (ریال)</th>
                  <th className="px-4 py-3 font-medium">موجودی</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.data?.items.map((product) => (
                  <tr key={product.id} className="border-t border-brand-100">
                    <td className="px-4 py-3">
                      {product.isActive ? (
                        <Link to={`/products/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      ) : (
                        product.name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={product.price}
                        aria-label={`قیمت ${product.name}`}
                        onBlur={(e) => {
                          const rawPrice = e.target.value.trim()
                          const price = Number(rawPrice)
                          if (rawPrice === '' || !Number.isFinite(price) || price < 0) {
                            e.target.value = product.price
                          } else if (price !== Number(product.price)) {
                            report(
                              () =>
                                productMutations.update.mutateAsync({
                                  id: product.id,
                                  price,
                                }),
                              `قیمت «${product.name}» به‌روزرسانی شد.`,
                            )
                          }
                        }}
                        className="w-28 rounded border border-brand-200 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        defaultValue={product.stock}
                        aria-label={`موجودی ${product.name}`}
                        onBlur={(e) => {
                          const stock = Number(e.target.value)
                          if (stock !== product.stock) {
                            report(
                              () =>
                                productMutations.update.mutateAsync({
                                  id: product.id,
                                  stock,
                                }),
                              `موجودی «${product.name}» به‌روزرسانی شد.`,
                            )
                          }
                        }}
                        className="w-24 rounded border border-brand-200 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          report(
                            () =>
                              productMutations.update.mutateAsync({
                                id: product.id,
                                isActive: !product.isActive,
                              }),
                            `${product.isActive ? 'غیرفعال شد' : 'فعال شد'}: ${product.name}`,
                          )
                        }
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-brand-100 text-brand-600'
                        }`}
                      >
                        {product.isActive ? 'فعال' : 'پنهان'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          report(
                            () => productMutations.remove.mutateAsync(product.id),
                            `محصول «${product.name}» حذف شد.`,
                          )
                        }
                      >
                        حذف
                      </Button>
                    </td>
                  </tr>
                ))}
                {products.data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-brand-600">
                      هنوز محصولی ثبت نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {products.data && products.data.totalPages > 1 && (
              <nav
                aria-label="صفحه‌بندی محصولات"
                className="flex flex-wrap items-center justify-center gap-3 border-t border-brand-100 p-4"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={productPage <= 1}
                  onClick={() => setProductPage((page) => page - 1)}
                >
                  قبلی
                </Button>
                <span className="text-sm text-brand-700">
                  صفحه {formatNumber(products.data.page)} از{' '}
                  {formatNumber(products.data.totalPages)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={productPage >= products.data.totalPages}
                  onClick={() => setProductPage((page) => page + 1)}
                >
                  بعدی
                </Button>
              </nav>
            )}
          </section>
        </>
      )}

      {tab === 'coupons' && (
        <>
          <section className="rounded-lg border border-brand-100 bg-white p-6">
            <h2 className="text-sm font-semibold text-brand-600">ساخت کد تخفیف</h2>
            <form
              className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
              onSubmit={(event) => {
                event.preventDefault()
                const code = newCoupon.code
                report(
                  () =>
                    couponMutations.create.mutateAsync({
                      code,
                      discountType: newCoupon.discountType as 'percentage' | 'fixed',
                      discountValue: Number(newCoupon.discountValue),
                      minOrderAmount: newCoupon.minOrderAmount
                        ? Number(newCoupon.minOrderAmount)
                        : undefined,
                    }),
                  `کد تخفیف ${code.toUpperCase()} ساخته شد.`,
                )
                setNewCoupon({
                  code: '',
                  discountType: 'percentage',
                  discountValue: '',
                  minOrderAmount: '',
                })
              }}
            >
              <Field label="کد" htmlFor="c-code">
                <input
                  id="c-code"
                  required
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="نوع" htmlFor="c-type">
                <select
                  id="c-type"
                  value={newCoupon.discountType}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discountType: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="percentage">درصدی</option>
                  <option value="fixed">مبلغ ثابت (ریال)</option>
                </select>
              </Field>
              <Field label="مقدار" htmlFor="c-value">
                <input
                  id="c-value"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={newCoupon.discountValue}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discountValue: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="حداقل سفارش (ریال)" htmlFor="c-min">
                <input
                  id="c-min"
                  type="number"
                  min="0"
                  step="1"
                  value={newCoupon.minOrderAmount}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" disabled={couponMutations.create.isPending}>
                  {couponMutations.create.isPending ? 'در حال ساخت…' : 'ساخت'}
                </Button>
              </div>
            </form>
          </section>

          <section className="overflow-x-auto rounded-lg border border-brand-100 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-right text-xs text-brand-600">
                <tr>
                  <th className="px-4 py-3 font-medium">کد</th>
                  <th className="px-4 py-3 font-medium">تخفیف</th>
                  <th className="px-4 py-3 font-medium">حداقل سفارش</th>
                  <th className="px-4 py-3 font-medium">استفاده‌شده</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {coupons.data?.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-brand-100">
                    <td className="px-4 py-3 font-medium">{coupon.code}</td>
                    <td className="px-4 py-3">
                      {coupon.discountType === 'percentage'
                        ? `${formatNumber(coupon.discountValue)}٪`
                        : formatPriceWithUnit(coupon.discountValue)}
                    </td>
                    <td className="px-4 py-3">
                      {formatPriceWithUnit(coupon.minOrderAmount)}
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(coupon.usedCount)}
                      {coupon.usageLimit !== null &&
                        ` / ${formatNumber(coupon.usageLimit)}`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          report(
                            () =>
                              couponMutations.update.mutateAsync({
                                id: coupon.id,
                                isActive: !coupon.isActive,
                              }),
                            `${coupon.isActive ? 'غیرفعال شد' : 'فعال شد'}: ${coupon.code}`,
                          )
                        }
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-brand-100 text-brand-600'
                        }`}
                      >
                        {coupon.isActive ? 'فعال' : 'غیرفعال'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          report(
                            () => couponMutations.remove.mutateAsync(coupon.id),
                            `کد تخفیف ${coupon.code} حذف شد.`,
                          )
                        }
                      >
                        حذف
                      </Button>
                    </td>
                  </tr>
                ))}
                {coupons.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-brand-600">
                      هنوز کد تخفیفی ساخته نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === 'orders' && (
        <section className="overflow-x-auto rounded-lg border border-brand-100 bg-white">
          {orders.isLoading && (
            <p className="p-6 text-sm text-brand-600">در حال بارگذاری سفارش‌ها…</p>
          )}
          {orders.isError && (
            <p role="alert" className="p-6 text-sm text-red-600">
              بارگذاری سفارش‌ها ممکن نشد.
            </p>
          )}
          {orders.data && (
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-right text-xs text-brand-600">
                <tr>
                  <th className="px-4 py-3 font-medium">سفارش</th>
                  <th className="px-4 py-3 font-medium">تاریخ ثبت</th>
                  <th className="px-4 py-3 font-medium">تعداد اقلام</th>
                  <th className="px-4 py-3 font-medium">مبلغ کل</th>
                  <th className="px-4 py-3 font-medium">وضعیت</th>
                  <th className="px-4 py-3 font-medium">تغییر وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((order) => {
                  const nextStatuses: Extract<
                    OrderStatus,
                    'processing' | 'shipped' | 'delivered' | 'cancelled'
                  >[] =
                    order.status === 'pending'
                      ? ['cancelled']
                      : order.status === 'paid'
                        ? ['processing']
                        : order.status === 'processing'
                          ? ['shipped']
                          : order.status === 'shipped'
                            ? ['delivered']
                            : []
                  return (
                    <tr key={order.id} className="border-t border-brand-100">
                      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        {formatNumber(
                          order.items.reduce((total, item) => total + item.quantity, 0),
                        )}
                      </td>
                      <td className="px-4 py-3">{formatPriceWithUnit(order.total)}</td>
                      <td className="px-4 py-3">{formatStatus(order.status)}</td>
                      <td className="px-4 py-3">
                        {nextStatuses.length > 0 ? (
                          <select
                            aria-label={`تغییر وضعیت سفارش ${order.orderNumber}`}
                            value=""
                            disabled={orderMutations.updateStatus.isPending}
                            onChange={(event) => {
                              const status = nextStatuses.find(
                                (candidate) => candidate === event.target.value,
                              )
                              if (!status) return
                              report(
                                () =>
                                  orderMutations.updateStatus.mutateAsync({
                                    id: order.id,
                                    status,
                                  }),
                                `وضعیت ${order.orderNumber} به ${formatStatus(status)} تغییر کرد.`,
                              )
                            }}
                            className={selectClass}
                          >
                            <option value="" disabled>
                              انتخاب کنید…
                            </option>
                            {nextStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-brand-500">اقدامی موجود نیست</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {orders.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-brand-600">
                      هنوز سفارشی ثبت نشده است.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'customers' && (
        <section className="overflow-x-auto rounded-lg border border-brand-100 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-right text-xs text-brand-600">
              <tr>
                <th className="px-4 py-3 font-medium">نام</th>
                <th className="px-4 py-3 font-medium">ایمیل</th>
                <th className="px-4 py-3 font-medium">تاریخ عضویت</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {customers.data?.map((customer) => (
                <tr key={customer.id} className="border-t border-brand-100">
                  <td className="px-4 py-3">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-3">
                    {customer.isActive ? 'فعال' : 'غیرفعال'}
                  </td>
                </tr>
              ))}
              {customers.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-brand-600">
                    هنوز مشتری‌ای ثبت نشده است.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
