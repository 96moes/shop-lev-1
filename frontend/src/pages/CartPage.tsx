import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../hooks/useShop'
import { formatNumber, formatPriceWithUnit } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  const mutationError = updateItem.error ?? removeItem.error

  if (isLoading) {
    return <p className="text-sm text-brand-600">در حال بارگذاری سبد خرید…</p>
  }

  if (isError || !cart) {
    return (
      <p className="text-sm text-red-600">
        بارگذاری سبد خرید ممکن نشد. لطفاً دوباره تلاش کنید.
      </p>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-lg border border-brand-100 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-brand-800">سبد خرید شما خالی است</h1>
        <p className="mt-2 text-sm text-brand-700">
          نگاهی به محصولات بیندازید و آنچه را دوست دارید اضافه کنید.
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
      <h1 className="text-2xl font-semibold text-brand-800">
        سبد خرید شما ({formatNumber(cart.itemCount)} کالا)
      </h1>

      {mutationError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {getErrorMessage(mutationError)}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <ul className="flex flex-col gap-4 lg:col-span-2">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-brand-100 bg-white p-4"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded bg-brand-50">
                {item.product.images?.[0]?.url ? (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.name}
                    className="h-full w-full rounded object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-brand-200">
                    {item.product.name.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-40 flex-1">
                <Link
                  to={`/products/${item.productId}`}
                  className="font-medium text-brand-800 hover:underline"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-brand-700">
                  {formatPriceWithUnit(item.unitPrice ?? item.product.price)} برای هر عدد
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor={`qty-${item.id}`}
                  className="text-xs font-medium text-brand-700"
                >
                  تعداد
                </label>
                <input
                  id={`qty-${item.id}`}
                  type="number"
                  min={1}
                  max={item.product.stock}
                  value={item.quantity}
                  onChange={(event) => {
                    const quantity = Math.max(
                      1,
                      Math.min(item.product.stock, Number(event.target.value) || 1),
                    )
                    updateItem.mutate({ itemId: item.id, quantity })
                  }}
                  className="w-20 rounded-md border border-brand-200 px-2 py-1 text-sm"
                />
              </div>

              <div className="w-32 text-end font-medium text-brand-800">
                {formatPriceWithUnit(
                  Number(item.unitPrice ?? item.product.price) * item.quantity,
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem.mutate({ itemId: item.id })}
              >
                حذف
              </Button>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-lg border border-brand-100 bg-white p-6">
          <h2 className="text-sm font-semibold text-brand-600">خلاصه سفارش</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-brand-700">جمع کالاها</span>
            <span className="font-medium text-brand-800">
              {formatPriceWithUnit(cart.subtotal)}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-brand-700">هزینه ارسال</span>
            <span className="text-brand-800">در مرحله پرداخت محاسبه می‌شود</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-brand-100 pt-4 text-base font-semibold">
            <span className="text-brand-800">مبلغ قابل پرداخت</span>
            <span className="text-brand-800">{formatPriceWithUnit(cart.subtotal)}</span>
          </div>

          <div className="mt-5">
            <Link to="/checkout">
              <Button fullWidth>تکمیل خرید</Button>
            </Link>
          </div>
          <div className="mt-2">
            <Link to="/products">
              <Button variant="secondary" fullWidth>
                ادامه خرید
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
