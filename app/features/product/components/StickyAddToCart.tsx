import { useEffect, useState, type RefObject, useRef } from 'react';
import { Image, CartForm } from '@shopify/hydrogen';
import type { ProductFragment } from 'storefrontapi.generated';
import { ProductPrice } from '~/features/product/components/ProductPrice';
import { useCartNotification } from '~/features/cart/components/CartNotification';

function ATCIconButton({
  isAdding,
  justAdded,
  onClick,
  disabled,
  ariaLabel = 'Add to cart',
  size = 'md',
  buttonType = 'submit',
}: {
  isAdding: boolean;
  justAdded?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  buttonType?: 'submit' | 'button';
}) {
  const sizeClasses = size === 'sm'
    ? 'w-8 h-8 sm:w-9 sm:h-9'
    : 'w-8 h-8 sm:w-12 sm:h-12';
  const iconSize = size === 'sm'
    ? 'w-4 h-4 sm:w-5 sm:h-5'
    : 'w-5 h-5 sm:w-7 sm:h-7';

  return (
    <button
      type={buttonType}
      disabled={disabled || isAdding}
      onClick={onClick}
      className={[
        sizeClasses,
        'flex items-center justify-center rounded-full shrink-0',
        'bg-white border border-black transition-all duration-200 ease-out cursor-pointer select-none',
        'hover:bg-black group/atc',
        isAdding
          ? 'opacity-60 scale-[0.97] cursor-not-allowed'
          : justAdded
            ? 'scale-[0.97]'
            : 'active:scale-[0.96]',
      ].join(' ')}
      aria-label={ariaLabel}
    >
      {isAdding ? (
        <svg
          className={`animate-spin ${size === 'sm' ? 'w-3 h-3 sm:w-3.5 h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-black group-hover/atc:text-white`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : justAdded ? (
        <svg
          className={`${size === 'sm' ? 'w-3 h-3 sm:w-3.5 h-3.5' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} text-black group-hover/atc:text-white`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <img
          src="/icons/add-bag.png"
          alt={ariaLabel}
          className={`${iconSize} object-contain group-hover/atc:invert`}
        />
      )}
    </button>
  );
}

function SizePillInner({
  fetcher,
  variant,
  productTitle,
  productImage,
  onAdded,
}: {
  fetcher: any;
  variant: any;
  productTitle: string;
  productImage?: any;
  onAdded: () => void;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef<string>('idle');

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage || undefined);
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
        'px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-medium tracking-wide uppercase border transition-all duration-150 cursor-pointer select-none',
        !variant.availableForSale
          ? 'border-border text-muted-foreground/40 line-through cursor-not-allowed'
          : isAdding
            ? 'border-foreground bg-foreground text-background opacity-70 cursor-not-allowed'
            : 'border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background active:scale-95',
      ].join(' ')}
      aria-label={`Add size ${variant.title ?? ''} to cart`}
    >
      {isAdding ? (
        <svg className="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
        </svg>
      ) : (
        variant.title ?? '—'
      )}
    </button>
  );
}

function SizePillForm({
  variant,
  productTitle,
  productImage,
  productId,
  onAdded,
}: {
  variant: any;
  productTitle: string;
  productImage?: any;
  productId: string;
  onAdded: () => void;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1 }] }}
      fetcherKey={`add-size-sticky-${productId}-${variant.id}`}
    >
      {(fetcher) => (
        <SizePillInner
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

function AddToCartCircle({
  product,
  showSizePicker,
  onToggleSizePicker,
  onCartOpen
}: {
  product: { id: string; title: string; featuredImage?: any; variants?: any[] };
  showSizePicker: boolean;
  onToggleSizePicker: () => void;
  onCartOpen: () => void;
}) {
  const variants = product.variants ?? [];
  const firstVariant = variants[0];
  const hasMultipleVariants = variants.length > 1;

  if (hasMultipleVariants) {
    return (
      <button
        type="button"
        onClick={onToggleSizePicker}
        className={[
          'w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shrink-0',
          'border transition-all duration-200 ease-out cursor-pointer select-none group/atc',
          showSizePicker
            ? 'bg-foreground border-foreground text-background'
            : 'bg-white border-black hover:bg-black hover:text-white',
        ].join(' ')}
        aria-label={showSizePicker ? 'Close size picker' : 'Select size'}
      >
        {showSizePicker ? (
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img
            src="/icons/add-bag.png"
            alt="Select size"
            className="w-5 h-5 sm:w-7 sm:h-7 object-contain group-hover/atc:invert"
          />
        )}
      </button>
    );
  }

  // Single variant case
  if (!firstVariant || !firstVariant.availableForSale) {
    return (
      <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shrink-0 bg-stone-100 border border-stone-200 text-[10px] sm:text-xs">
        Sold
      </div>
    );
  }

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{
        lines: [{ merchandiseId: firstVariant.id, quantity: 1, selectedVariant: firstVariant }],
      }}
      fetcherKey={`add-to-cart-sticky-${product.id}`}
    >
      {(fetcher) => (
        <AddToCartInner fetcher={fetcher} productTitle={product.title} productImage={product.featuredImage} onCartOpen={onCartOpen} />
      )}
    </CartForm>
  );
}

function AddToCartLongInner({
  fetcher,
  productTitle,
  productImage,
  onCartOpen,
}: {
  fetcher: any;
  productTitle: string;
  productImage?: any;
  onCartOpen: () => void;
}) {
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage || undefined);
      onCartOpen();
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage, onCartOpen]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <button
      type="submit"
      disabled={isAdding}
      className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-full bg-black text-white text-[10px] tracking-[0.2em] uppercase font-medium border border-black hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-all duration-300 group"
    >
      {isAdding ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      ) : (
        <img src="/icons/add-bag.png" alt="" className="w-4 h-4 object-contain invert" />
      )}
      {isAdding ? 'Adding…' : 'Add to Bag'}
    </button>
  );
}

function AddToCartLongButton({
  product,
  showSizePicker,
  onToggleSizePicker,
  onCartOpen,
}: {
  product: { id: string; title: string; featuredImage?: any; variants?: any[] };
  showSizePicker: boolean;
  onToggleSizePicker: () => void;
  onCartOpen: () => void;
}) {
  const variants = product.variants ?? [];
  const firstVariant = variants[0];
  const hasMultipleVariants = variants.length > 1;

  if (hasMultipleVariants) {
    return (
      <button
        type="button"
        onClick={onToggleSizePicker}
        className={[
          'flex items-center justify-center gap-2 px-8 py-2.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-medium border transition-all duration-200 cursor-pointer select-none',
          showSizePicker
            ? 'bg-stone-900 border-stone-900 text-white'
            : 'bg-black border-black text-white hover:bg-stone-800',
        ].join(' ')}
        aria-label={showSizePicker ? 'Close size picker' : 'Select size'}
      >
        {showSizePicker ? (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </>
        ) : (
          <>
            <img src="/icons/add-bag.png" alt="" className="w-4 h-4 object-contain invert" />
            Select Size
          </>
        )}
      </button>
    );
  }

  if (!firstVariant || !firstVariant.availableForSale) {
    return (
      <div className="flex items-center justify-center px-8 py-2.5 rounded-full bg-stone-100 border border-stone-200 text-[10px] tracking-[0.2em] uppercase font-medium text-stone-400 cursor-not-allowed">
        Sold Out
      </div>
    );
  }

  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesAdd}
      inputs={{ lines: [{ merchandiseId: firstVariant.id, quantity: 1, selectedVariant: firstVariant }] }}
      fetcherKey={`add-to-cart-sticky-long-${product.id}`}
    >
      {(fetcher) => (
        <AddToCartLongInner fetcher={fetcher} productTitle={product.title} productImage={product.featuredImage} onCartOpen={onCartOpen} />
      )}
    </CartForm>
  );
}

function AddToCartInner({
  fetcher,
  productTitle,
  productImage,
  onCartOpen
}: {
  fetcher: any;
  productTitle: string;
  productImage?: any;
  onCartOpen: () => void;
}) {
  const [justAdded, setJustAdded] = useState(false);
  const { showNotification } = useCartNotification();
  const prevState = useRef(fetcher.state);

  useEffect(() => {
    if (prevState.current !== 'idle' && fetcher.state === 'idle') {
      showNotification(productTitle, productImage || undefined);
      onCartOpen();
    }
    prevState.current = fetcher.state;
  }, [fetcher.state, showNotification, productTitle, productImage, onCartOpen]);

  const isAdding = fetcher.state !== 'idle';

  return (
    <ATCIconButton
      isAdding={isAdding}
      justAdded={justAdded}
      onClick={() => {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1800);
      }}
    />
  );
}

interface StickyAddToCartProps {
    selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
    product: {
        id: string;
        title: string;
        featuredImage?: { url: string; altText?: string | null; width?: number | null; height?: number | null } | null;
        variants?: any[];
    };
    triggerRef: RefObject<HTMLDivElement | null>;
    onAddToCartClick: () => void;
}

export function StickyAddToCart({
    selectedVariant,
    product,
    triggerRef,
    onAddToCartClick,
}: StickyAddToCartProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showSizePicker, setShowSizePicker] = useState(false);

    useEffect(() => {
        const el = triggerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(!entry.isIntersecting);
            },
            { threshold: 0 },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [triggerRef]);

    if (!selectedVariant) return null;

    const numericId = selectedVariant.id.split('/').pop();
    const isAvailable = selectedVariant.availableForSale;
    const variants = product.variants ?? [];

    return (
        <>
            {/* ── Mobile: bottom sticky (below xl) ── */}
            <div
                className={`xl:hidden fixed left-2 right-2 z-50 transition-transform duration-300 ease-out ${
                    isVisible ? "translate-y-0" : "translate-y-full"
                }`}
                style={{ bottom: "calc(4.375rem + env(safe-area-inset-bottom) + 6px)" }}
            >
                <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-stone-200 dark:border-border shadow-[0_4px_24px_rgba(0,0,0,0.12)] rounded-xl overflow-hidden">
                    
                    {/* Inline Size Picker (slides up inside the sticky bar container) */}
                    {showSizePicker && variants.length > 1 && (
                        <div className="px-4 py-3 border-b border-border/40 bg-white/95 text-foreground flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-[9px] font-semibold tracking-[0.2em] uppercase mb-1.5 opacity-70">Select Size</p>
                                <div className="flex flex-wrap gap-2">
                                    {variants.map((v) => (
                                        <SizePillForm
                                            key={v.id}
                                            variant={v}
                                            productTitle={product.title}
                                            productImage={product.featuredImage}
                                            productId={product.id}
                                            onAdded={() => {
                                                setShowSizePicker(false);
                                                onAddToCartClick();
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="px-2 py-2.5 flex items-center gap-3">
                        {/* Product image */}
                        {product.featuredImage && (
                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 dark:border-border flex-shrink-0">
                                <Image
                                    data={product.featuredImage}
                                    className="w-full h-full object-cover"
                                    sizes="36px"
                                />
                            </div>
                        )}

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-stone-900 dark:text-foreground truncate leading-tight">
                                {product.title}
                            </p>
                            {selectedVariant.price && (
                                <div className="mt-1 flex items-center gap-2 [&_.product-price_span]:!text-sm [&_.product-price_span]:lg:!text-sm [&_.product-price_s]:!text-xs [&_.product-price_s]:sm:!text-xs">
                                    <ProductPrice
                                        price={selectedVariant.price}
                                        compareAtPrice={selectedVariant.compareAtPrice}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Add to cart / Size toggle */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <AddToCartCircle 
                                product={product} 
                                showSizePicker={showSizePicker} 
                                onToggleSizePicker={() => setShowSizePicker((p) => !p)} 
                                onCartOpen={onAddToCartClick}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Desktop: bottom sticky (xl and above) ── */}
            <div
                className={`hidden xl:flex xl:justify-center fixed bottom-0 left-0 right-0 z-40 pointer-events-none transition-transform duration-300 ease-out ${
                    isVisible ? 'translate-y-0' : 'translate-y-full'
                }`}
            >
                <div className="w-full max-w-2xl pointer-events-auto bg-white/95 dark:bg-card/95 backdrop-blur-xl border border-b-0 border-stone-200 dark:border-border shadow-[0_-4px_24px_rgba(0,0,0,0.10)] relative text-foreground rounded-t-xl overflow-hidden">

                    {/* Inline Size Picker */}
                    {showSizePicker && variants.length > 1 && (
                        <div className="absolute bottom-full left-0 right-0 bg-white/95 dark:bg-card/95 px-6 py-3 border border-b-0 border-stone-200 dark:border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] text-foreground rounded-t-xl">
                            <div className="flex items-center gap-4">
                                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-70">
                                    Select Size:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {variants.map((v) => (
                                        <SizePillForm
                                            key={v.id}
                                            variant={v}
                                            productTitle={product.title}
                                            productImage={product.featuredImage}
                                            productId={product.id}
                                            onAdded={() => {
                                                setShowSizePicker(false);
                                                onAddToCartClick();
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="px-6 py-3 flex items-center justify-between gap-6">
                        {/* Left: product info */}
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            {product.featuredImage && (
                                <div className="w-11 h-11 rounded-lg overflow-hidden border border-stone-200 dark:border-border flex-shrink-0">
                                    <Image
                                        data={product.featuredImage}
                                        className="w-full h-full object-cover"
                                        sizes="44px"
                                    />
                                </div>
                            )}
                            <div className="min-w-0">
                                <p
                                    className="text-sm font-light text-stone-900 dark:text-foreground truncate"
                                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                >
                                    {product.title}
                                </p>
                                {selectedVariant.price && (
                                    <div className="mt-0.5 flex items-center gap-2 [&_.product-price_span]:!text-sm [&_.product-price_span]:lg:!text-sm [&_.product-price_s]:!text-xs [&_.product-price_s]:sm:!text-xs">
                                        <ProductPrice
                                            price={selectedVariant.price}
                                            compareAtPrice={selectedVariant.compareAtPrice}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: action buttons */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <AddToCartLongButton
                                product={product}
                                showSizePicker={showSizePicker}
                                onToggleSizePicker={() => setShowSizePicker((p) => !p)}
                                onCartOpen={onAddToCartClick}
                            />
                            
                            {isAvailable && (
                                <a
                                    href={`/cart/${numericId}:1`}
                                    className="py-2.5 px-8 text-[10px] tracking-[0.2em] uppercase font-medium rounded-full border border-stone-300 dark:border-border text-stone-700 dark:text-foreground hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 text-center flex items-center justify-center gap-2 no-underline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                                    </svg>
                                    Buy Now
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
