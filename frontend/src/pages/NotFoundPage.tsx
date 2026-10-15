import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <>
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Go to home</Link>
    </>
  )
}

export default NotFoundPage
