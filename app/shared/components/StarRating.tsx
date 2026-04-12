/**
 * Compact star-rating badge — single filled star + numeric rating.
 * Designed to sit as an absolute overlay on product card images.
 */
export function StarRating({
  rating,
  count,
  className = '',
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white rounded-full px-2 py-0.5 ${className}`}
      aria-label={`${rating.toFixed(1)} out of 5 stars${typeof count === 'number' ? `, ${count} reviews` : ''}`}
    >
      {/* Single filled star */}
      <svg
        className="w-3 h-3 text-amber-400 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>

      {/* Rating number */}
      <span className="text-[10px] sm:text-[11px] font-semibold leading-none tabular-nums">
        {rating.toFixed(1)}
      </span>

      {/* Optional review count */}
      {typeof count === 'number' && (
        <span className="text-[9px] sm:text-[10px] font-normal leading-none opacity-80 tabular-nums">
          ({count})
        </span>
      )}
    </div>
  );
}
