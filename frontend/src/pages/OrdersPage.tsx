import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { useOrders } from '../hooks/useShop'
import { formatDate, formatPrice, formatStatus } from '../lib/format'

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useOrders()

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading your orders…</p>
  }

  if (isError) {
    return <p className="text-sm text-red-600">Could not load your orders.</p>
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">No orders yet</h1>
        <p className="mt-2 text-sm text-slate-600">
          Once you place an order it will show up here.
        </p>
        <div className="mt-5">
          <Link to="/products">
            <Button>Browse products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Your orders</h1>

      <ul className="flex flex-col gap-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="min-w-48 flex-1">
              <Link
                to={`/orders/${order.id}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {order.orderNumber}
              </Link>
              <p className="text-sm text-slate-600">Placed {formatDate(order.createdAt)}</p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {formatStatus(order.status)}
            </span>

            <div className="text-right">
              <p className="font-medium text-slate-900">{formatPrice(order.total)}</p>
              <p className="text-xs text-slate-500">
                {order.items?.length ?? 0}{' '}
                {(order.items?.length ?? 0) === 1 ? 'line item' : 'line items'}
              </p>
            </div>

            <Link to={`/orders/${order.id}`}>
              <Button variant="secondary" size="sm">
                View
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
