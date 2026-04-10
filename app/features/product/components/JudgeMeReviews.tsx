import {useMemo} from 'react';

export type JudgeMeReview = {
  id: number | string;
  rating: number;
  title?: string;
  body: string;
  reviewerName: string;
  createdAt?: string;
  pictureUrls: string[];
};

function formatDate(iso?: string) {
  if (!iso) return null;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
}

function Stars({rating}: {rating: number}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= filled ? 'text-amber-400' : 'text-stone-200 dark:text-border'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

export function JudgeMeReviews({reviews}: {reviews: JudgeMeReview[]}) {
  const normalized = useMemo(
    () =>
      (reviews ?? []).map((r) => ({
        ...r,
        reviewerName: r.reviewerName?.trim() || 'Anonymous',
        body: r.body?.trim() || '',
        title: r.title?.trim() || undefined,
        pictureUrls: Array.isArray(r.pictureUrls) ? r.pictureUrls : [],
        dateLabel: formatDate(r.createdAt),
      })),
    [reviews],
  );

  return (
    <div className="space-y-5">
      {normalized.map((review) => (
        <article
          key={review.id}
          className="relative bg-white dark:bg-card border border-stone-200/60 dark:border-border rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] flex flex-col gap-4 overflow-hidden"
        >
          <div className="absolute top-4 right-5 text-stone-100 dark:text-border/30 text-6xl font-serif leading-none pointer-events-none select-none" aria-hidden="true">
            ”
          </div>

          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold tracking-widest text-stone-900 dark:text-foreground uppercase">
                {review.reviewerName}
              </p>
              <Stars rating={review.rating} />
              {review.dateLabel && (
                <p className="text-[10px] tracking-widest uppercase font-medium text-stone-400 dark:text-muted-foreground">
                  {review.dateLabel}
                </p>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-3 py-1.5 rounded-full shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5">Review</span>
            </div>
          </div>

          {review.title && (
            <h4 className="text-[13px] sm:text-sm font-bold tracking-wider text-stone-900 dark:text-foreground uppercase">
              {review.title}
            </h4>
          )}

          <p className="text-[15px] sm:text-base text-stone-700 dark:text-muted-foreground leading-relaxed font-medium">
            “{review.body}”
          </p>

          {review.pictureUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pt-1">
              {review.pictureUrls.slice(0, 6).map((url) => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  loading="lazy"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-stone-200/60 shadow-sm shrink-0"
                />
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

