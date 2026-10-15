import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { useOrders } from '../hooks/useShop'
import { formatDate, formatNumber, formatPriceWithUnit, formatStatus } from '../lib/format'

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders()

  if (isLoading) {
    return <p className="text-sm text-brand-600">در حال بارگذاری سفارش‌ها…</p>
  }

  if (isError) {
    return <p className="text-sm text-red-600">بارگذاری سفارش‌ها ممکن نشد.</p>
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-lg border border-brand-100 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-brand-800">هنوز سفارشی ثبت نشده است</h1>
        <p className="mt-2 text-sm text-brand-700">
          پس از ثبت اولین سفارش، اینجا نمایش داده می‌شود.
        </p>
        <div className="mt-5">
          <Link to="/products">
            <Button>مشاهده محصولات</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-brand-800">سفارش‌های شما</h1>

      <ul className="flex flex-col gap-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-brand-100 bg-white p-4"
          >
            <div className="min-w-48 flex-1">
              <Link
                to={`/orders/${order.id}`}
                className="font-medium text-brand-800 hover:underline"
              >
                {order.orderNumber}
              </Link>
              <p className="text-sm text-brand-700">
                ثبت‌شده در {formatDate(order.createdAt)}
              </p>
            </div>

            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
              {formatStatus(order.status)}
            </span>

            <div className="text-end">
              <p className="font-medium text-brand-800">
                {formatPriceWithUnit(order.total)}
              </p>
              <p className="text-xs text-brand-600">
                {formatNumber(order.items?.length ?? 0)} قلم کالا
              </p>
            </div>

            <Link to={`/orders/${order.id}`}>
              <Button variant="secondary" size="sm">
                مشاهده
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
