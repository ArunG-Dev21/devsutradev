import { Link } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { CartForm, Image, Money } from '@shopify/hydrogen';
import { StarRating } from '~/shared/components/StarRating';
import { WishlistHeart } from '~/shared/components/WishlistHeart';
import { useCartNotification } from '~/features/cart/components/CartNotification';

export type ReviewSummary = { averageRating: number; reviewCount: number };
export type ReviewSummariesMap = Record<string, ReviewSummary | undefined>;

export function ProductCard({
  product,
  index = 0,
  reviewSummaries,
}: {
  product: any;
  index?: number;
  reviewSummaries?: ReviewSummariesMap;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const secondaryImage = product.images?.nodes?.[1] ?? null;

  return (
    <div
      className="group bg-muted rounded-[24px] p-2 sm:p-2.5 flex flex-col transition-all h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl mb-2 sm:mb-3 bg-transparent shrink-0">
        {product.tags && product.tags.includes('New') && (
          <span className="absolute top-2.5 left-2.5 bg-green-200/90 text-green-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded shadow-inner z-10 transition-opacity">
            New
          </span>
        )}

        <Link to={`/products/${product.handle}`} prefetch="intent" className="absolute inset-0 block">
          {product.featuredImage && (
            <Image
              data={product.featuredImage}
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading={index < 8 ? 'eager' : 'lazy'}
              style={{
                opacity: isHovered && secondaryImage ? 0 : 1,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'opacity 0.55s ease, transform 0.65s ease',
                willChange: 'opacity, transform',
                zIndex: 1,
              }}
            />
          )}
          {secondaryImage && (
            <Image
              data={secondaryImage}
              className="absolute inset-0 w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              loading="lazy"
              style={{
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1.02)' : 'scale(1.07)',
                transition: 'opacity 0.55s ease, transform 0.65s ease',
                willChange: 'opacity, transform',
                zIndex: 2,
              }}
            />
          )}
          {!product.featuredImage && (
            <div className="w-full h-full flex items-center justify-center bg-transparent">
              <span className="text-5xl opacity-20 text-gray-400">✦</span>
            </div>
          )}
        </Link>

        {(() => {
          const pid = String(product.id).split('/').pop();
          const summary = pid ? reviewSummaries?.[pid] : null;
          return summary ? (
            <StarRating
              rating={summary.averageRating}
              count={summary.reviewCount}
              className="absolute top-2 right-2 z-10"
            />
          ) : null;
        })()}

        <div className="absolute bottom-2 left-2 z-10">
          <WishlistHeart
            productId={product.id}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm hover:bg-white"
            size={18}
          />
        </div>
      </div>

      <div className="bg-card rounded-3xl p-3 sm:p-4 flex flex-col flex-1 gap-2 border border-border/40 relative z-10">
        <Link to={`/products/${product.handle}`} prefetch="intent" className="block">
          <h3 className="text-sm sm:text-lg leading-tight line-clamp-1 text-foreground">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2">
          <Money
            data={product.priceRange.minVariantPrice}
            withoutTrailingZeros
            className="text-[16px] sm:text-[22px] border-none shadow-none font-medium text-foreground leading-none font-montserrat"
          />
          {product.variants?.nodes?.[0]?.compareAtPrice && (
            <s className="text-[12px] sm:text-[16px] text-gray-400 font-medium whitespace-nowrap">
              <Money className="font-montserrat" withoutTrailingZeros data={product.variants.nodes[0].compareAtPrice} />
            </s>
          )}
          {product.variants?.nodes?.[0]?.compareAtPrice && (
            <span className="absolute top-0 right-0 ml-auto px-2 py-1 sm:py-2 text-[10px] sm:text-sm font-medium rounded-tr-2xl rounded-bl-2xl bg-linear-to-br from-[#f14514] to-[#d4370d] text-white">
              −
              {Math.round(
                ((parseFloat(product.variants.nodes[0].compareAtPrice.amount) -
                  parseFloat(product.priceRange.minVariantPrice.amount)) /
                  parseFloat(product.variants.nodes[0].compareAtPrice.amount)) *
                100,
              )}
              %
            </span>
          )}
          {!product.variants?.nodes?.[0]?.compareAtPrice &&
            product.priceRange.maxVariantPrice.amount !==
              product.priceRange.minVariantPrice.amount && (
              <span className="text-[10px] text-gray-400 block -ml-1">onwards</span>
            )}
        </div>

        <div className="mt-auto pt-2">
          <ProductCardATC product={product} />
        </div>
      </div>
    </div>
  );
}

function ProductCardAddButton({
  fetcher,
  availableForSale,
  productTitle,
  productImage,
}: {
  fetcher: any;
  availableForSale?: boolean;
  productTitle: string;
  productImage?: { url: string; altText?: string | null };
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage);
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage]);

  return (
    <button
      type="submit"
      disabled={!availableForSale || fetcher.state !== 'idle'}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground text-xs sm:text-base rounded-full group-hover:bg-foreground group-hover:text-background disabled:cursor-not-allowed cursor-pointer group transition-all duration-300 ease-in-out"
      aria-label="Add to bag"
    >
      <img src="/icons/add-bag.png" alt="" className="w-4 h-4 md:w-6 md:h-6 shrink-0 dark:invert group-hover:invert dark:group-hover:invert-0 group-hover:brightness-0 dark:group-hover:brightness-100 transition-all" />
      {availableForSale ? 'Add to Bag' : 'Sold Out'}
    </button>
  );
}

function ProductCardSizePillInner({
  fetcher,
  variant,
  productTitle,
  productImage,
  onAdded,
}: {
  fetcher: any;
  variant: { id: string; availableForSale: boolean; title?: string };
  productTitle: string;
  productImage?: { url: string; altText?: string | null };
  onAdded: () => void;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef<string>('idle');

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage);
      onAdded();
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage, onAdded]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={!variant.availableForSale || isAdding}
      className={[
        'px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium tracking-wide uppercase border transition-all duration-150 cursor-pointer select-none',
        !variant.availableForSale
          ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
          : isAdding
            ? 'border-gray-900 bg-gray-900 text-white opacity-70 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:border-gray-900 hover:bg-gray-900 hover:text-white active:scale-95',
      ].join(' ')}
      aria-label={`Add size ${variant.title ?? ''}`}
    >
      {isAdding ? (
        <svg className="animate-spin inline-block w-3 h-3" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : (
        variant.title ?? '—'
      )}
    </button>
  );
}

function ProductCardSizePill({
  variant,
  productTitle,
  productImage,
  productId,
  onAdded,
}: {
  variant: { id: string; availableForSale: boolean; title?: string };
  productTitle: string;
  productImage?: { url: string; altText?: string | null };
  productId: string;
  onAdded: () => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1, selectedVariant: variant as any }] }}
      fetcherKey={`pc-size-${productId}-${variant.id}`}
    >
      {(fetcher) => (
        <ProductCardSizePillInner
          fetcher={fetcher}
          variant={variant}
          productTitle={productTitle}
          productImage={productImage}
          onAdded={onAdded}
        />
      )}
    </CartForm>
  );
}

function ProductCardATC({ product }: { product: any }) {
  const [showSizes, setShowSizes] = useState(false);
  const variants: Array<{ id: string; availableForSale: boolean; title?: string }> = product.variants?.nodes ?? [];
  const firstVariant = variants[0];
  const isAvailable = firstVariant?.availableForSale ?? false;
  const hasMultiple = variants.length > 1;

  if (!isAvailable) {
    return (
      <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-400 text-xs sm:text-base rounded-full cursor-not-allowed">
        Sold Out
      </button>
    );
  }

  if (!hasMultiple) {
    return (
      <CartForm
        route="/cart"
        inputs={{ lines: [{ merchandiseId: firstVariant.id, quantity: 1, selectedVariant: firstVariant }] }}
        action={CartForm.ACTIONS.LinesAdd}
      >
        {(fetcher) => (
          <ProductCardAddButton
            fetcher={fetcher}
            availableForSale={isAvailable}
            productTitle={product.title}
            productImage={product.featuredImage ?? undefined}
          />
        )}
      </CartForm>
    );
  }

  return (
    <div>
      {showSizes && (
        <div className="mb-2">
          <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1.5">Select Size</p>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => (
              <ProductCardSizePill
                key={v.id}
                variant={v}
                productTitle={product.title}
                productImage={product.featuredImage ?? undefined}
                productId={product.id}
                onAdded={() => setShowSizes(false)}
              />
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowSizes((s) => !s)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border text-xs sm:text-base rounded-full transition-all duration-200 cursor-pointer group ${
          showSizes
            ? 'bg-foreground border-foreground text-background'
            : 'bg-card border-border text-foreground hover:bg-foreground hover:text-background'
        }`}
        aria-label="Select size"
      >
        <img
          src="/icons/add-bag.png"
          alt=""
          className={`w-4 h-4 md:w-6 md:h-6 shrink-0 transition-all dark:invert ${showSizes ? 'invert brightness-0 dark:brightness-100' : 'group-hover:invert group-hover:brightness-0 dark:group-hover:brightness-100'}`}
        />
        {showSizes ? 'Close' : 'Select Size'}
      </button>
    </div>
  );
}
