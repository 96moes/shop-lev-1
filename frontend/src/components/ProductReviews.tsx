import { useState } from 'react'
import Button from './Button'
import Field from './Field'
import { inputClass } from '../lib/formStyles'
import { useAuth } from '../hooks/useAuth'
import { useCreateReview, useProductReviews } from '../hooks/useShop'
import { formatDate, formatNumber } from '../lib/format'
import { getErrorMessage } from '../services/apiClient'

/** Star rating display, e.g. ★★★☆☆. */
function Stars({ rating }: { rating: number }) {
  const filled = Math.round(rating)

  return (
    <span aria-label={`${formatNumber(filled)} از ۵ ستاره`} className="text-amber-500">
      {'★'.repeat(filled)}
      <span className="text-brand-200">{'★'.repeat(5 - filled)}</span>
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
    <section className="rounded-lg border border-brand-100 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-brand-800">دیدگاه‌ها</h2>
        {data && data.total > 0 && (
          <p className="text-sm text-brand-700">
            <Stars rating={data.averageRating} />{' '}
            <span className="font-medium text-brand-800">{data.averageRating}</span> از{' '}
            {formatNumber(data.total)} دیدگاه
          </p>
        )}
      </div>

      {isLoading && <p className="mt-4 text-sm text-brand-600">در حال بارگذاری دیدگاه‌ها…</p>}
      {isError && (
        <p className="mt-4 text-sm text-red-600">بارگذاری دیدگاه‌ها ممکن نشد.</p>
      )}

      {data && data.items.length === 0 && (
        <p className="mt-4 text-sm text-brand-600">
          هنوز دیدگاهی ثبت نشده است. اولین نفر باشید.
        </p>
      )}

      {data && data.items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-4">
          {data.items.map((review) => (
            <li
              key={review.id}
              className="border-t border-brand-100 pt-4 first:border-0 first:pt-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Stars rating={review.rating} />
                {review.title && (
                  <span className="font-medium text-brand-800">{review.title}</span>
                )}
                {!review.isApproved && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    در انتظار تأیید
                  </span>
                )}
              </div>
              {review.comment && (
                <p className="mt-1 text-sm text-brand-700">{review.comment}</p>
              )}
              <p className="mt-1 text-xs text-brand-500">{formatDate(review.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {isAuthenticated ? (
        alreadyReviewed ? (
          <p className="mt-6 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">
            شما پیش‌تر برای این محصول دیدگاه ثبت کرده‌اید.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col gap-3 border-t border-brand-100 pt-6"
          >
            <h3 className="text-sm font-semibold text-brand-600">ثبت دیدگاه</h3>

            <Field label="امتیاز" htmlFor="review-rating">
              <select
                id="review-rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className={inputClass}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {formatNumber(value)} ستاره
                  </option>
                ))}
              </select>
            </Field>

            <Field label="عنوان" htmlFor="review-title" hint="اختیاری.">
              <input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="متن دیدگاه" htmlFor="review-comment" hint="اختیاری.">
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
              <p
                role="status"
                className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800"
              >
                سپاس — دیدگاه شما ثبت شد.
              </p>
            )}

            <div>
              <Button type="submit" disabled={createReview.isPending}>
                {createReview.isPending ? 'در حال ثبت…' : 'ثبت دیدگاه'}
              </Button>
            </div>
          </form>
        )
      ) : (
        <p className="mt-6 text-sm text-brand-700">
          برای ثبت دیدگاه وارد حساب خود شوید.
        </p>
      )}
    </section>
  )
}
