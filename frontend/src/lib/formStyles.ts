/**
 * Shared form-control styling.
 *
 * Kept out of the components so files exporting components only export
 * components (which keeps React Fast Refresh working).
 */

/**
 * Shared text/number input styling.
 *
 * Uses logical padding (`ps-`/`pe-`) rather than `pl-`/`pr-` so the control
 * mirrors correctly under the document's right-to-left direction.
 */
export const inputClass =
  'w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-400 outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-200 disabled:bg-brand-50'

/** Shared select styling. */
export const selectClass = inputClass
