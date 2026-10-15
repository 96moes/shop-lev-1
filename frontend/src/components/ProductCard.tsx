import { Link } from 'react-router-dom'
import { formatPrice } from '../lib/format'
import type { Product } from '../types/api'

/** Product card used by the catalog and home page grids. */
export default function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0]?.url
  const onSale =
    product.compareAtPrice !== null &&
    Number(product.compareAtPrice) > Number(product.price)

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="flex h-44 items-center justify-center bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={product.images?.[0]?.altText ?? product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl font-semibold text-slate-300">
            {product.name.slice(0, 1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category && (
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {product.category.name}
          </span>
        )}
        <h3 className="font-medium text-slate-900 group-hover:underline">
          {product.name}
        </h3>

        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-semibold text-slate-900">
            {formatPrice(product.price)}
          </span>
          {onSale && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.compareAtPrice as string)}
            </span>
          )}
        </div>

        {product.stock === 0 ? (
          <span className="text-xs font-medium text-red-600">Out of stock</span>
        ) : (
          <span className="text-xs text-slate-500">{product.stock} in stock</span>
        )}
      </div>
    </Link>
  )
}
