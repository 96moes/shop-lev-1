import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { useAddToCart, useWishlist, useWishlistMutations } from '../hooks/useShop'
import { formatPrice } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'

/** Customer panel: saved products, with add-to-cart and remove actions. */
export default function WishlistPage() {
  const { data: items, isLoading, isError } = useWishlist()
  const { remove } = useWishlistMutations()
  const addToCart = useAddToCart()

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading your wishlist…</p>
  }
  if (isError) {
    return <p className="text-sm text-red-600">Could not load your wishlist.</p>
  }
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-slate-600">
          Save products you are considering and they will appear here.
        </p>
        <div className="mt-5">
          <Link to="/products">
            <Button>Browse products</Button>
          </Link>
        </div>
      </div>
    )
  }

  const error = addToCart.error ?? remove.error

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        Your wishlist ({items.length})
      </h1>

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {getErrorMessage(error)}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded bg-slate-100">
              {item.product?.images?.[0]?.url ? (
                <img
                  src={item.product.images[0].url}
                  alt={item.product.name}
                  className="h-full w-full rounded object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-slate-300">
                  {item.product?.name?.slice(0, 1) ?? '?'}
                </span>
              )}
            </div>

            <div className="min-w-40 flex-1">
              <Link
                to={`/products/${item.productId}`}
                className="font-medium text-slate-900 hover:underline"
              >
                {item.product?.name ?? 'Product'}
              </Link>
              <p className="text-sm text-slate-600">
                {item.product ? formatPrice(item.product.price) : '—'}
                {item.product && item.product.stock === 0 && (
                  <span className="ml-2 text-xs font-medium text-red-600">
                    Out of stock
                  </span>
                )}
              </p>
            </div>

            <Button
              size="sm"
              disabled={!item.product || item.product.stock === 0 || addToCart.isPending}
              onClick={() => addToCart.mutate({ productId: item.productId })}
            >
              Add to cart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate(item.productId)}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
