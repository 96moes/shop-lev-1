import { Link } from 'react-router-dom'
import Button from '../components/Button'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useShop'

export default function HomePage() {
  const { data, isLoading, isError } = useProducts({ limit: 4, sort: 'newest' })

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-xl border border-slate-200 bg-white px-8 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Everything for a better workspace
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Lighting, seating and desks chosen for people who spend their day
          working. Browse the catalog, add to your cart, and check out in a
          couple of clicks.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/products">
            <Button>Browse products</Button>
          </Link>
          <Link to="/cart">
            <Button variant="secondary">View cart</Button>
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Latest arrivals</h2>
          <Link to="/products" className="text-sm text-slate-600 hover:text-slate-900">
            View all
          </Link>
        </div>

        {isLoading && <p className="text-sm text-slate-500">Loading products…</p>}
        {isError && (
          <p className="text-sm text-red-600">
            Could not load products. Is the API running?
          </p>
        )}

        {data && data.items.length === 0 && (
          <p className="text-sm text-slate-500">No products yet.</p>
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
