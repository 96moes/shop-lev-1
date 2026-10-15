import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Button from '../components/Button'
import { inputClass, selectClass } from '../lib/formStyles'
import { useCategories, useProducts } from '../hooks/useShop'
import { formatNumber } from '../lib/format'

const SORT_OPTIONS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'name_asc', label: 'نام: الف تا ی' },
  { value: 'name_desc', label: 'نام: ی تا الف' },
] as const

/**
 * Product listing with search, category and price filtering.
 *
 * Filters live in the URL so a filtered view can be linked or reloaded.
 */
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')

  const page = Number(searchParams.get('page') ?? 1)
  const query = {
    search: searchParams.get('search') ?? undefined,
    categoryId: searchParams.get('categoryId') ?? undefined,
    minPrice: searchParams.get('minPrice')
      ? Number(searchParams.get('minPrice'))
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : undefined,
    sort: (searchParams.get('sort') ?? 'newest') as
      | 'newest'
      | 'price_asc'
      | 'price_desc'
      | 'name_asc'
      | 'name_desc',
    page,
    limit: 9,
  }

  const { data, isLoading, isError } = useProducts(query)
  const { data: categories } = useCategories()

  /** Merges a change into the URL, resetting to page 1 unless paging. */
  function updateParams(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault()
    updateParams({ search: searchInput.trim() || undefined })
  }

  function clearFilters() {
    setSearchInput('')
    setSearchParams(new URLSearchParams())
  }

  const hasFilters = ['search', 'categoryId', 'minPrice', 'maxPrice'].some((key) =>
    searchParams.has(key),
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-800">محصولات</h1>
        {data && (
          <p className="mt-1 text-sm text-brand-700">
            {formatNumber(data.total)} محصول یافت شد
          </p>
        )}
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="grid gap-3 rounded-lg border border-brand-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="flex flex-col gap-1 lg:col-span-2">
          <label htmlFor="search" className="text-xs font-medium text-brand-700">
            جست‌وجو
          </label>
          <input
            id="search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="نام یا توضیح محصول"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="categoryId" className="text-xs font-medium text-brand-700">
            دسته‌بندی
          </label>
          <select
            id="categoryId"
            value={searchParams.get('categoryId') ?? ''}
            onChange={(event) =>
              updateParams({ categoryId: event.target.value || undefined })
            }
            className={selectClass}
          >
            <option value="">همه دسته‌ها</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="minPrice" className="text-xs font-medium text-brand-700">
            کمترین قیمت (ریال)
          </label>
          <input
            id="minPrice"
            type="number"
            min="0"
            step="1"
            placeholder="۰"
            defaultValue={searchParams.get('minPrice') ?? ''}
            onChange={(event) =>
              updateParams({ minPrice: event.target.value || undefined })
            }
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="maxPrice" className="text-xs font-medium text-brand-700">
            بیشترین قیمت (ریال)
          </label>
          <input
            id="maxPrice"
            type="number"
            min="0"
            step="1"
            placeholder="۰"
            defaultValue={searchParams.get('maxPrice') ?? ''}
            onChange={(event) =>
              updateParams({ maxPrice: event.target.value || undefined })
            }
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="sort" className="text-xs font-medium text-brand-700">
            ترتیب نمایش
          </label>
          <select
            id="sort"
            value={query.sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className={selectClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit">جست‌وجو</Button>
          {hasFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              حذف فیلترها
            </Button>
          )}
        </div>
      </form>

      {isLoading && <p className="text-sm text-brand-600">در حال بارگذاری محصولات…</p>}
      {isError && <p className="text-sm text-red-600">بارگذاری محصولات ممکن نشد.</p>}

      {data && data.items.length === 0 && (
        <div className="rounded-lg border border-brand-100 bg-white p-10 text-center">
          <p className="text-brand-700">محصولی با این فیلترها یافت نشد.</p>
          {hasFilters && (
            <div className="mt-4">
              <Button variant="secondary" onClick={clearFilters}>
                حذف فیلترها
              </Button>
            </div>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <nav
              aria-label="صفحه‌بندی"
              className="flex flex-wrap items-center justify-center gap-2"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                قبلی
              </Button>
              <span className="text-sm text-brand-700">
                صفحه {formatNumber(data.page)} از {formatNumber(data.totalPages)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                بعدی
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
