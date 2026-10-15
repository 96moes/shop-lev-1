/**
 * Column projections that are safe to return to clients.
 *
 * `User.password` is a bcrypt hash and must never leave the API, so any query
 * feeding an HTTP response selects these columns explicitly rather than relying
 * on callers to strip fields afterwards.
 */

/** User columns safe for any authenticated reader (self, admin, ...). */
export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
