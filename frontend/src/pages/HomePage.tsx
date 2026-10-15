import { Link } from 'react-router-dom'
import Button from '../components/Button'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useShop'
import { SITE_NAME } from '../lib/site'

export default function HomePage() {
  const { data, isLoading, isError } = useProducts({ limit: 4, sort: 'newest' })

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl border border-brand-100 bg-white px-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-brand-800 sm:text-4xl">
          هر آنچه برای یک محیط کار بهتر لازم دارید
        </h1>
        <p className="mt-3 max-w-2xl text-brand-700">
          روشنایی، صندلی و میزکار، انتخاب‌شده برای کسانی که تمام روز کار می‌کنند.
          نگاهی به محصولات {SITE_NAME} بیندازید، به سبد خرید اضافه کنید و در چند
          کلیک سفارش را نهایی کنید.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/products">
            <Button>مشاهده محصولات</Button>
          </Link>
          <Link to="/cart">
            <Button variant="secondary">مشاهده سبد خرید</Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-brand-800">جدیدترین‌ها</h2>
          <Link to="/products" className="text-sm text-brand-600 hover:text-brand-800">
            مشاهده همه
          </Link>
        </div>

        {isLoading && <p className="text-sm text-brand-600">در حال بارگذاری محصولات…</p>}
        {isError && (
          <p className="text-sm text-red-600">
            بارگذاری محصولات ممکن نشد. آیا سرور در دسترس است؟
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="text-sm text-brand-600">هنوز محصولی ثبت نشده است.</p>
        )}

        {data && data.items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
