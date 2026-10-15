import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button'
import ProductReviews from '../components/ProductReviews'
import { getErrorMessage } from '../services/apiClient'
import { formatNumber, formatPriceWithUnit } from '../lib/format'
import {
  useAddToCart,
  useProduct,
  useWishlist,
  useWishlistMutations,
} from '../hooks/useShop'
import { useAuth } from '../hooks/useAuth'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data: product, isLoading, isError } = useProduct(id)
  const addToCart = useAddToCart()
  const wishlist = useWishlist()
  const wishlistMutations = useWishlistMutations()
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<string | null>(null)

  if (isLoading) {
    return <p className="text-sm text-brand-600">در حال بارگذاری محصول…</p>
  }

  if (isError || !product) {
    return (
      <div className="rounded-lg border border-brand-100 bg-white p-10 text-center">
        <h1 className="text-lg font-semibold text-brand-800">محصول یافت نشد</h1>
        <p className="mt-2 text-sm text-brand-700">
          این محصول حذف شده یا دیگر در دسترس نیست.
        </p>
        <div className="mt-4">
          <Link to="/products">
            <Button variant="secondary">بازگشت به محصولات</Button>
          </Link>
        </div>
      </div>
    )
  }

  const onSale =
    product.compareAtPrice !== null &&
    Number(product.compareAtPrice) > Number(product.price)
  const inStock = product.stock > 0

  const isSaved = wishlist.data?.some((item) => item.productId === product.id) ?? false

  async function toggleWishlist() {
    setMessage(null)
    try {
      if (isSaved) {
        await wishlistMutations.remove.mutateAsync(product!.id)
        setMessage('از فهرست علاقه‌مندی‌ها حذف شد.')
      } else {
        await wishlistMutations.add.mutateAsync(product!.id)
        setMessage('به فهرست علاقه‌مندی‌ها اضافه شد.')
      }
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  async function handleAddToCart() {
    setMessage(null)

    if (!isAuthenticated) {
      // Send them to sign in, then straight back here.
      navigate('/login', { state: { from: `/products/${product!.id}` } })
      return
    }

    try {
      await addToCart.mutateAsync({ productId: product!.id, quantity })
      setMessage(
        `${formatNumber(quantity)} عدد «${product!.name}» به سبد خرید اضافه شد.`,
      )
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/products" className="text-sm text-brand-600 hover:text-brand-800">
        بازگشت به محصولات
      </Link>

      <div className="grid gap-8 rounded-lg border border-brand-100 bg-white p-6 lg:grid-cols-2">
        <div className="flex h-80 items-center justify-center rounded-lg bg-brand-50">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].altText ?? product.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            <span className="text-5xl font-semibold text-brand-200">
              {product.name.slice(0, 1)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {product.category && (
            <Link
              to={`/products?categoryId=${product.category.id}`}
              className="text-xs tracking-wide text-brand-600 hover:text-brand-800"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="text-2xl font-semibold text-brand-800">{product.name}</h1>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-bold text-brand-800">
              {formatPriceWithUnit(product.price)}
            </span>
            {onSale && (
              <span className="text-brand-400 line-through">
                {formatPriceWithUnit(product.compareAtPrice as string)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-brand-700">{product.description}</p>
          )}

          <p
            className={`text-sm font-medium ${
              inStock ? 'text-brand-700' : 'text-red-600'
            }`}
          >
            {inStock
              ? `${formatNumber(product.stock)} عدد در انبار موجود است`
              : 'ناموجود'}
          </p>

          {product.sku && (
            <p className="text-xs text-brand-600">کد کالا: {product.sku}</p>
          )}

          {inStock && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="quantity"
                  className="text-xs font-medium text-brand-700"
                >
                  تعداد
                </label>
                <input
                  id="quantity"
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.max(1, Math.min(product.stock, Number(event.target.value) || 1)),
                    )
                  }
                  className="w-24 rounded-md border border-brand-200 px-3 py-2 text-sm"
                />
              </div>

              <Button onClick={handleAddToCart} disabled={addToCart.isPending}>
                {addToCart.isPending ? 'در حال افزودن…' : 'افزودن به سبد خرید'}
              </Button>

              {isAuthenticated && (
                <Button
                  variant="secondary"
                  onClick={() => toggleWishlist()}
                  disabled={
                    wishlistMutations.add.isPending || wishlistMutations.remove.isPending
                  }
                >
                  {isSaved ? 'ذخیره شد ♥' : 'افزودن به علاقه‌مندی‌ها'}
                </Button>
              )}
            </div>
          )}

          {message && (
            <p role="status" className="text-sm text-brand-700">
              {message}
            </p>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} />
    </div>
  )
}
