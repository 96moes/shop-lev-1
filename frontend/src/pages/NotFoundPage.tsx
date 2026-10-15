import { Link } from 'react-router-dom'

/** Fallback page for any URL the router does not recognise. */
function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-4xl font-bold text-brand-700">۴۰۴</p>
      <h1 className="mt-3 text-xl font-semibold text-brand-800">صفحه یافت نشد</h1>
      <p className="mt-2 text-sm text-brand-700">
        نشانی وارد‌شده وجود ندارد یا حذف شده است.
      </p>
      <Link
        to="/"
        className="mt-5 inline-block text-sm font-medium text-brand-700 hover:underline"
      >
        بازگشت به صفحه اصلی
      </Link>
    </div>
  )
}

export default NotFoundPage
