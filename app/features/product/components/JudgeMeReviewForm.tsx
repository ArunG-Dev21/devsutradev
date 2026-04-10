import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {useFetcher} from 'react-router';

function FieldLabel({children}: {children: ReactNode}) {
  return (
    <span className="text-[10px] tracking-[0.25em] uppercase text-stone-500 dark:text-muted-foreground font-semibold">
      {children}
    </span>
  );
}

export function JudgeMeReviewForm({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const fetcher = useFetcher<{ok: boolean; error?: string}>();
  const [rating, setRating] = useState(5);

  const isSubmitting = fetcher.state !== 'idle';
  const error = fetcher.data?.ok === false ? fetcher.data.error : null;
  const ok = fetcher.data?.ok === true;

  useEffect(() => {
    if (ok) {
      const t = setTimeout(() => onClose(), 900);
      return () => clearTimeout(t);
    }
    return;
  }, [ok, onClose]);

  const ratingLabel = useMemo(() => `${rating} / 5`, [rating]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 border-0 p-0 bg-transparent"
        onClick={() => (isSubmitting ? null : onClose())}
      />

      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-card border border-stone-200/60 dark:border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-1.5">
              Share your experience
            </p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-foreground uppercase tracking-widest">
              Write a Review
            </h3>
          </div>

          <button
            type="button"
            onClick={() => (isSubmitting ? null : onClose())}
            className="w-10 h-10 rounded-full border border-stone-200/60 dark:border-border bg-white dark:bg-card hover:bg-stone-50 dark:hover:bg-muted transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <fetcher.Form method="post" action="/api/judgeme/reviews" className="p-5 sm:p-6 space-y-4">
          <input type="hidden" name="productId" value={productId} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <FieldLabel>Name</FieldLabel>
              <input
                name="name"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-xl border border-stone-200/70 dark:border-border bg-white dark:bg-card text-sm"
              />
            </label>

            <label className="flex flex-col gap-1">
              <FieldLabel>Email</FieldLabel>
              <input
                name="email"
                type="email"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-xl border border-stone-200/70 dark:border-border bg-white dark:bg-card text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <FieldLabel>Rating</FieldLabel>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  disabled={isSubmitting}
                  className="w-full"
                />
                <span className="text-xs font-semibold text-stone-700 dark:text-foreground tabular-nums w-12 text-right">
                  {ratingLabel}
                </span>
              </div>
              <input type="hidden" name="rating" value={rating} />
            </label>

            <label className="flex flex-col gap-1">
              <FieldLabel>Title (optional)</FieldLabel>
              <input
                name="title"
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-xl border border-stone-200/70 dark:border-border bg-white dark:bg-card text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <FieldLabel>Review</FieldLabel>
            <textarea
              name="body"
              required
              rows={5}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-xl border border-stone-200/70 dark:border-border bg-white dark:bg-card text-sm"
              placeholder="What did you like? How was the quality, delivery, etc.?"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {ok && (
            <p className="text-sm text-emerald-700">Thanks! Your review was submitted.</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onClose()}
              className="px-4 py-2 rounded-full border border-stone-200/70 dark:border-border text-xs font-bold tracking-widest uppercase text-stone-700 dark:text-foreground hover:bg-stone-50 dark:hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </div>
  );
}
