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

function Stars({rating, size = 'sm'}: {rating: number; size?: 'xs' | 'sm'}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const dim = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${dim} ${star <= filled ? 'text-gold' : 'text-stone-200 dark:text-stone-700'}`}
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

function InitialAvatar({name, rating}: {name: string; rating: number}) {
  const letter = (name || 'A').charAt(0).toUpperCase();
  const isHighRated = rating >= 4;
  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800`}
    >
      <span
        className="text-stone-600 dark:text-stone-300 text-lg font-bold leading-none"
        style={{fontFamily: "'Cormorant Garamond', Georgia, serif"}}
      >
        {letter}
      </span>
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
    <div className="space-y-4">
      {normalized.map((review) => {
        const isHighRated = review.rating >= 4;
        return (
          <article
            key={review.id}
            className="group relative bg-white dark:bg-card border border-stone-100 dark:border-border rounded-2xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* Left accent bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                review.rating >= 4
                  ? 'bg-gold'
                  : review.rating === 3
                  ? 'bg-gold/60'
                  : 'bg-stone-300 dark:bg-stone-600'
              }`}
            />

            {/* Decorative quote mark */}
            <div
              className="absolute top-4 right-5 text-[64px] leading-none text-stone-100 dark:text-stone-800 select-none pointer-events-none"
              style={{fontFamily: "'Cormorant Garamond', Georgia, serif"}}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            <div className="relative pl-5 pr-5 pt-5 pb-5 sm:pl-6 sm:pt-5 sm:pr-6 sm:pb-6">
              {/* Top row: avatar + name + stars | date + verified */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 ${
                      isHighRated
                        ? 'border-gold'
                        : 'border-stone-200 dark:border-border'
                    }`}
                  >
                    <InitialAvatar name={review.reviewerName} rating={review.rating} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-stone-900 dark:text-foreground tracking-widest uppercase leading-tight truncate">
                      {review.reviewerName}
                    </p>
                    <div className="mt-1.5">
                      <Stars rating={review.rating} size="xs" />
                    </div>
                    {review.dateLabel && (
                      <p className="text-[10px] text-stone-400 dark:text-muted-foreground tracking-wider uppercase mt-1">
                        {review.dateLabel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Verified badge */}
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full shrink-0">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-[9px] font-bold tracking-widest uppercase">Verified</span>
                </div>
              </div>

              {/* Review title */}
              {review.title && (
                <p className="text-[12px] font-bold tracking-widest uppercase text-stone-800 dark:text-foreground mb-2">
                  {review.title}
                </p>
              )}

              {/* Review body */}
              <p
                className="text-stone-600 dark:text-muted-foreground leading-relaxed italic"
                style={{fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.0625rem'}}
              >
                &ldquo;{review.body}&rdquo;
              </p>

              {/* Photo strip */}
              {review.pictureUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-4 pb-0.5 no-scrollbar">
                  {review.pictureUrls.slice(0, 6).map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      loading="lazy"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-stone-200 dark:border-border shadow-sm shrink-0 transition-transform duration-300 hover:scale-105"
                    />
                  ))}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
