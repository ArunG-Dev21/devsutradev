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
  return new Intl.DateTimeFormat('en-IN', {year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC'}).format(dt);
}

function Stars({rating, size = 'sm'}: {rating: number; size?: 'xs' | 'sm'}) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const dim = size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5" aria-label={`${filled} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${dim} ${star <= filled ? 'text-[#F14514]' : 'text-stone-200 dark:text-stone-700'}`}
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
        style={{fontFamily: "'Cormorant Variable', Georgia, serif"}}
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
    <div className="grid grid-cols-1 gap-5 sm:gap-6">
      {normalized.map((review) => {
        const isHighRated = review.rating >= 4;
        return (
          <article
            key={review.id}
            className="relative bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 rounded-[28px] p-6 sm:p-8 overflow-hidden dark:shadow-none transition-all duration-500 hover:border-[#F14514]/30 h-full flex flex-col"
          >
            {/* Giant quote watermark */}
            <div
              className="absolute -top-6 -left-2 text-[140px] font-heading leading-none select-none pointer-events-none z-10 transition-colors duration-700 text-[#F14514]/30"
              aria-hidden="true"
            >
              &ldquo;
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full flex-1">
              
              {/* Header: Stars & Date */}
              <div className="flex items-center justify-between mb-5">
                <Stars rating={review.rating} size="sm" />
                {review.dateLabel && (
                  <span className="text-[9px] sm:text-[10px] tracking-[0.25em] font-medium uppercase text-black dark:text-stone-500 dark:bg-stone-800/50 px-2 py-1 rounded-full">
                    {review.dateLabel}
                  </span>
                )}
              </div>

              {/* Body: Title & Text */}
              <div className="flex-1 mb-6">
                {review.title && (
                  <h4 className="text-sm font-bold tracking-widest uppercase text-stone-900 dark:text-stone-100 mb-3">
                    {review.title}
                  </h4>
                )}
                <p
                  className="text-stone-700 dark:text-stone-300 leading-[1.8] text-sm sm:text-base xl:text-2xl italic font-heading"
                >
                  &ldquo;{review.body}&rdquo;
                </p>
              </div>

              {/* Photos (if any) */}
              {review.pictureUrls.length > 0 && (
                <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar">
                  {review.pictureUrls.slice(0, 6).map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      loading="lazy"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-stone-200/50 dark:border-stone-800 shrink-0 transition-transform duration-300 hover:scale-110 shadow-sm"
                    />
                  ))}
                </div>
              )}

              {/* Footer: User profile & Verified */}
              <div className="pt-5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between flex-wrap gap-4 mt-auto">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 shadow-md border-[2.5px] transition-colors duration-500 ${
                      isHighRated
                        ? 'border-[#F14514] group-hover:border-[#F14514]/80'
                        : 'border-white dark:border-stone-800 group-hover:border-stone-200'
                    }`}
                  >
                    <InitialAvatar name={review.reviewerName} rating={review.rating} />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-stone-900 dark:text-white tracking-[0.15em] uppercase leading-tight">
                      {review.reviewerName}
                    </p>
                    {isHighRated && (
                      <p className="text-[9px] text-[#F14514] font-semibold tracking-widest uppercase mt-0.5 opacity-90">
                        Valued Client
                      </p>
                    )}
                  </div>
                </div>

                {/* Verified badge */}
                <div className="relative flex items-center shrink-0 group/badge">
                  <img
                    src="/icons/verified.svg"
                    alt="Verified"
                    className="relative w-10 sm:w-12 md:w-14 h-auto shrink-0 transition-transform duration-500 drop-shadow-md z-10"
                  />
                </div>
              </div>

            </div>
          </article>
        );
      })}
    </div>
  );
}
