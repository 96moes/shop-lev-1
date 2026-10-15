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
import { formatDate, formatPrice, formatStatus } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'
import type { OrderStatus } from '../types/api'

type Tab = 'overview' | 'products' | 'orders' | 'coupons' | 'customers'

/** Compact bar chart of daily revenue; avoids pulling in a chart dependency. */
function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div className="flex h-40 items-end gap-1" role="img" aria-label="Revenue by day">
      {data.map((day) => (
        <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-slate-800"
            style={{ height: `${Math.max(2, (day.revenue / max) * 100)}%` }}
            title={`${day.date}: ${formatPrice(day.revenue)}`}
          />
          <span className="text-[10px] text-slate-400">{day.date.slice(8)}</span>
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
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'coupons', label: 'Coupons' },
    { id: 'customers', label: 'Customers' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Store performance, catalog and promotions.
        </p>
      </div>

      <nav className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {notice && (
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
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
          {stats.isLoading && <p className="text-sm text-slate-500">Loading stats…</p>}
          {stats.isError && (
            <p className="text-sm text-red-600">Could not load dashboard figures.</p>
          )}

          {stats.data && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Revenue', value: formatPrice(stats.data.totalRevenue) },
                  { label: 'Orders', value: String(stats.data.totalOrders) },
                  { label: 'Avg order', value: formatPrice(stats.data.averageOrderValue) },
                  { label: 'Customers', value: String(stats.data.totalCustomers) },
                  { label: 'Products', value: String(stats.data.totalProducts) },
                  { label: 'Pending orders', value: String(stats.data.pendingOrders) },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-lg border border-slate-200 bg-white p-6 lg:col-span-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Revenue, last 14 days
                  </h2>
                  <div className="mt-4">
                    <RevenueChart data={stats.data.salesByDay} />
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Orders by status
                  </h2>
                  <ul className="mt-4 flex flex-col gap-2 text-sm">
                    {Object.entries(stats.data.ordersByStatus).map(([status, count]) => (
                      <li key={status} className="flex justify-between">
                        <span className="capitalize text-slate-600">{status}</span>
                        <span className="font-medium text-slate-900">{count}</span>
                      </li>
                    ))}
                    {Object.keys(stats.data.ordersByStatus).length === 0 && (
                      <li className="text-slate-500">No orders yet.</li>
                    )}
                  </ul>
                </section>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-lg border border-slate-200 bg-white p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Top products
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3 text-sm">
                    {stats.data.topProducts.map((p) => (
                      <li key={p.productId} className="flex justify-between gap-4">
                        <Link
                          to={`/products/${p.productId}`}
                          className="text-slate-800 hover:underline"
                        >
                          {p.name}
                        </Link>
                        <span className="whitespace-nowrap text-slate-600">
                          {p.unitsSold} sold · {formatPrice(p.revenue)}
                        </span>
                      </li>
                    ))}
                    {stats.data.topProducts.length === 0 && (
                      <li className="text-slate-500">
                        No paid orders yet, so nothing to rank.
                      </li>
                    )}
                  </ul>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Low stock
                  </h2>
                  <ul className="mt-4 flex flex-col gap-3 text-sm">
                    {stats.data.lowStock.map((p) => (
                      <li key={p.id} className="flex justify-between gap-4">
                        <span className="text-slate-800">{p.name}</span>
                        <span
                          className={`font-medium ${
                            p.stock === 0 ? 'text-red-600' : 'text-amber-600'
                          }`}
                        >
                          {p.stock} left
                        </span>
                      </li>
                    ))}
                    {stats.data.lowStock.length === 0 && (
                      <li className="text-slate-500">All products are well stocked.</li>
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
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Add a product
            </h2>
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
                  `Created "${name}".`,
                )
                setNewProduct({ name: '', price: '', stock: '', categoryId: '', description: '' })
              }}
            >
              <Field label="Name" htmlFor="p-name">
                <input
                  id="p-name"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Price" htmlFor="p-price">
                <input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Stock" htmlFor="p-stock">
                <input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Category" htmlFor="p-category">
                <select
                  id="p-category"
                  value={newProduct.categoryId}
                  onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Uncategorised</option>
                  {categories.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" htmlFor="p-desc">
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
                  {productMutations.create.isPending ? 'Creating…' : 'Create product'}
                </Button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.data?.items.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100">
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
                        step="0.01"
                        defaultValue={product.price}
                        aria-label={`Price for ${product.name}`}
                        onBlur={(e) => {
                          const rawPrice = e.target.value.trim()
                          const price = Number(rawPrice)
                          if (
                            rawPrice === '' ||
                            !Number.isFinite(price) ||
                            price < 0
                          ) {
                            e.target.value = product.price
                          } else if (price !== Number(product.price)) {
                            report(
                              () =>
                                productMutations.update.mutateAsync({
                                  id: product.id,
                                  price,
                                }),
                              `Updated price for ${product.name}.`,
                            )
                          }
                        }}
                        className="w-24 rounded border border-slate-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        defaultValue={product.stock}
                        aria-label={`Stock for ${product.name}`}
                        onBlur={(e) => {
                          const stock = Number(e.target.value)
                          if (stock !== product.stock) {
                            report(
                              () =>
                                productMutations.update.mutateAsync({
                                  id: product.id,
                                  stock,
                                }),
                              `Updated stock for ${product.name}.`,
                            )
                          }
                        }}
                        className="w-20 rounded border border-slate-300 px-2 py-1"
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
                            `${product.isActive ? 'Deactivated' : 'Activated'} ${product.name}.`,
                          )
                        }
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          report(
                            () => productMutations.remove.mutateAsync(product.id),
                            `Deleted ${product.name}.`,
                          )
                        }
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {products.data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No products yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {products.data && products.data.totalPages > 1 && (
              <nav
                aria-label="Product catalog pages"
                className="flex items-center justify-center gap-3 border-t border-slate-100 p-4"
              >
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={productPage <= 1}
                  onClick={() => setProductPage((page) => page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {products.data.page} of {products.data.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={productPage >= products.data.totalPages}
                  onClick={() => setProductPage((page) => page + 1)}
                >
                  Next
                </Button>
              </nav>
            )}
          </section>
        </>
      )}

      {tab === 'coupons' && (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Create a coupon
            </h2>
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
                  `Created coupon ${code.toUpperCase()}.`,
                )
                setNewCoupon({
                  code: '',
                  discountType: 'percentage',
                  discountValue: '',
                  minOrderAmount: '',
                })
              }}
            >
              <Field label="Code" htmlFor="c-code">
                <input
                  id="c-code"
                  required
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Type" htmlFor="c-type">
                <select
                  id="c-type"
                  value={newCoupon.discountType}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discountType: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </Field>
              <Field label="Value" htmlFor="c-value">
                <input
                  id="c-value"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={newCoupon.discountValue}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discountValue: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Min order" htmlFor="c-min">
                <input
                  id="c-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCoupon.minOrderAmount}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <div className="flex items-end">
                <Button type="submit" disabled={couponMutations.create.isPending}>
                  {couponMutations.create.isPending ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Min order</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {coupons.data?.map((coupon) => (
                  <tr key={coupon.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{coupon.code}</td>
                    <td className="px-4 py-3">
                      {coupon.discountType === 'percentage'
                        ? `${Number(coupon.discountValue)}%`
                        : formatPrice(coupon.discountValue)}
                    </td>
                    <td className="px-4 py-3">{formatPrice(coupon.minOrderAmount)}</td>
                    <td className="px-4 py-3">
                      {coupon.usedCount}
                      {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
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
                            `${coupon.isActive ? 'Deactivated' : 'Activated'} ${coupon.code}.`,
                          )
                        }
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          report(
                            () => couponMutations.remove.mutateAsync(coupon.id),
                            `Deleted ${coupon.code}.`,
                          )
                        }
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {coupons.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No coupons yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === 'orders' && (
        <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          {orders.isLoading && (
            <p className="p-6 text-sm text-slate-500">Loading orders…</p>
          )}
          {orders.isError && (
            <p role="alert" className="p-6 text-sm text-red-600">
              Could not load orders.
            </p>
          )}
          {orders.data && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Placed</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Update status</th>
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
                    <tr key={order.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        {order.items.reduce((total, item) => total + item.quantity, 0)}
                      </td>
                      <td className="px-4 py-3">{formatPrice(order.total)}</td>
                      <td className="px-4 py-3">{formatStatus(order.status)}</td>
                      <td className="px-4 py-3">
                        {nextStatuses.length > 0 ? (
                          <select
                            aria-label={`Update status for ${order.orderNumber}`}
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
                                `Updated ${order.orderNumber} to ${formatStatus(status)}.`,
                              )
                            }}
                            className={selectClass}
                          >
                            <option value="" disabled>
                              Choose…
                            </option>
                            {nextStatuses.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-400">No action available</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {orders.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      )}

      {tab === 'customers' && (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.data?.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {customer.firstName} {customer.lastName}
                  </td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-3">
                    {customer.isActive ? 'Active' : 'Disabled'}
                  </td>
                </tr>
              ))}
              {customers.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No customers yet.
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
