import { useState } from 'react'
import Button from './Button'
import Field from './Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { useCreateReview, useProductReviews } from '../hooks/useShop'
import { formatDate } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'

/** Star rating display, e.g. ★★★☆☆. */
function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-amber-500">
      {'★'.repeat(Math.round(rating))}
      <span className="text-slate-300">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  )
}

/** Product reviews: public list plus a form for signed-in customers. */
export default function ProductReviews({ productId }: { productId: string }) {
  const { isAuthenticated, user } = useAuth()
  const { data, isLoading, isError } = useProductReviews(productId)
  const createReview = useCreateReview(productId)

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const alreadyReviewed = data?.items.some((r) => r.userId === user?.id) ?? false

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      await createReview.mutateAsync({
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      })
      setTitle('')
      setComment('')
      setRating(5)
      setDone(true)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
        {data && data.total > 0 && (
          <p className="text-sm text-slate-600">
            <Stars rating={data.averageRating} />{' '}
            <span className="font-medium text-slate-900">{data.averageRating}</span> from{' '}
            {data.total} {data.total === 1 ? 'review' : 'reviews'}
          </p>
        )}
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading reviews…</p>}
      {isError && (
        <p className="mt-4 text-sm text-red-600">Could not load reviews.</p>
      )}

      {data && data.items.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No reviews yet. Be the first to share your thoughts.
        </p>
      )}

      {data && data.items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-4">
          {data.items.map((review) => (
            <li key={review.id} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
              <div className="flex items-center gap-2">
                <Stars rating={review.rating} />
                {review.title && (
                  <span className="font-medium text-slate-900">{review.title}</span>
                )}
                {!review.isApproved && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    Pending approval
                  </span>
                )}
              </div>
              {review.comment && (
                <p className="mt-1 text-sm text-slate-700">{review.comment}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">{formatDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {isAuthenticated ? (
        alreadyReviewed ? (
          <p className="mt-6 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            You have already reviewed this product.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Write a review
            </h3>

            <Field label="Rating" htmlFor="review-rating">
              <select
                id="review-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={inputClass}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 1 ? 'star' : 'stars'}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Title" htmlFor="review-title" hint="Optional.">
              <input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Comment" htmlFor="review-comment" hint="Optional.">
              <textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={inputClass}
              />
            </Field>

            {error && (
              <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {done && (
              <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                Thanks — your review has been posted.
              </p>
            )}

            <div>
              <Button type="submit" disabled={createReview.isPending}>
                {createReview.isPending ? 'Posting…' : 'Post review'}
              </Button>
            </div>
          </form>
        )
      ) : (
        <p className="mt-6 text-sm text-slate-600">
          Sign in to write a review.
        </p>
      )}
    </section>
  )
}
