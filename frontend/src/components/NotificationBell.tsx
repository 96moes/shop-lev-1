import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationMutations, useNotifications } from '../hooks/useShop'
import { formatDate } from '../lib/format'

/**
 * Header notification bell with an unread badge and a dismissible panel.
 *
 * Reads from the same TanStack Query cache as the rest of the app, so marking
 * something read updates the badge immediately.
 */
export default function NotificationBell() {
  const { data, isLoading } = useNotifications()
  const { markRead, markAllRead } = useNotificationMutations()
  const [open, setOpen] = useState(false)

  const unread = data?.unreadCount ?? 0

  function toggle() {
    // Opening the panel is a good moment to refresh what is shown.
    setOpen((prev) => !prev)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        Notifications
        {unread > 0 && (
          <span
            data-testid="notification-count"
            className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white"
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-slate-600 hover:text-slate-900"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-80 overflow-y-auto">
            {isLoading && (
              <li className="px-4 py-3 text-sm text-slate-500">Loading…</li>
            )}
            {data?.items.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-500">Nothing yet.</li>
            )}
            {data?.items.map((note) => (
              <li
                key={note.id}
                className={`border-b border-slate-50 px-4 py-3 text-sm last:border-0 ${
                  note.isRead ? 'bg-white' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-slate-900">{note.title}</span>
                  {!note.isRead && (
                    <button
                      type="button"
                      onClick={() => markRead.mutate(note.id)}
                      className="whitespace-nowrap text-xs text-slate-500 hover:text-slate-900"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="mt-1 text-slate-600">{note.message}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>{formatDate(note.createdAt)}</span>
                  {note.link && (
                    <Link
                      to={note.link}
                      onClick={() => setOpen(false)}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      View
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
