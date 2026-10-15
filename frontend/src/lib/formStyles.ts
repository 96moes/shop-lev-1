/**
 * Shared form-control styling.
 *
 * Kept out of the components so files exporting components only export
 * components (which keeps React Fast Refresh working).
 */

/** Shared text/number input styling. */
export const inputClass =
  'rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100'

/** Shared select styling. */
export const selectClass = inputClass
