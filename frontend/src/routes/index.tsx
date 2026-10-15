import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminPage from '../pages/AdminPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import OrderDetailPage from '../pages/OrderDetailPage'
import OrdersPage from '../pages/OrdersPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import ProductsPage from '../pages/ProductsPage'
import ProfilePage from '../pages/ProfilePage'
import RegisterPage from '../pages/RegisterPage'
import WishlistPage from '../pages/WishlistPage'

/**
 * Route table.
 *
 * Public routes sit directly under the layout; anything requiring a session is
 * nested inside `ProtectedRoute` so the guard runs before the page renders.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'wishlist', element: <WishlistPage /> },
        ],
      },

      {
        element: <ProtectedRoute adminOnly />,
        children: [{ path: 'admin', element: <AdminPage /> }],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
