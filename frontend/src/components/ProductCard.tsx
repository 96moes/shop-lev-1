import { Link } from 'react-router-dom'
import { formatNumber, formatPriceWithUnit } from '../lib/format'
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
      className="group flex flex-col overflow-hidden rounded-lg border border-brand-100 bg-white transition-shadow hover:shadow-md"
    >
      <div className="flex h-44 items-center justify-center bg-brand-50">
        {image ? (
          <img
            src={image}
            alt={product.images?.[0]?.altText ?? product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl font-semibold text-brand-200">
            {product.name.slice(0, 1)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category && (
          <span className="text-xs tracking-wide text-brand-600">
            {product.category.name}
          </span>
        )}
        <h3 className="font-medium text-brand-800 group-hover:underline">
          {product.name}
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-bold text-brand-800">
            {formatPriceWithUnit(product.price)}
          </span>
          {onSale && (
            <span className="text-sm text-brand-400 line-through">
              {formatPriceWithUnit(product.compareAtPrice as string)}
            </span>
          )}
        </div>

        {product.stock === 0 ? (
          <span className="text-xs font-medium text-red-600">ناموجود</span>
        ) : (
          <span className="text-xs text-brand-600">
            {formatNumber(product.stock)} عدد در انبار
          </span>
        )}
      </div>
    </Link>
  )
}
