import { useNavigate } from 'react-router';
import { useWishlist } from '~/shared/hooks/useWishlist';

export function WishlistHeart({
  productId,
  className = '',
  size = 18,
  showLoggedOutPrompt = true,
}: {
  productId: string;
  className?: string;
  size?: number;
  showLoggedOutPrompt?: boolean;
}) {
  const navigate = useNavigate();
  const { isInWishlist, isLoggedIn, isLoaded, toggle } = useWishlist();
  const active = isLoaded && isLoggedIn && isInWishlist(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) {
          if (showLoggedOutPrompt) navigate('/account/login');
          return;
        }
        toggle(productId);
      }}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={
          active
            ? 'text-[#F14514]'
            : 'text-stone-500 hover:text-[#F14514]'
        }
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
