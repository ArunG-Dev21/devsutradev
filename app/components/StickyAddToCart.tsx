import { useEffect, useState, type RefObject } from 'react';
import { Image, Money } from '@shopify/hydrogen';
import { AddToCartButton } from './AddToCartButton';
import type { ProductFragment } from 'storefrontapi.generated';

interface StickyAddToCartProps {
    selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
    product: {
        title: string;
        featuredImage?: { url: string; altText?: string | null; width?: number | null; height?: number | null } | null;
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

    useEffect(() => {
        const el = triggerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Show sticky bar when the original form is OUT of view
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

    return (
        <>
            {/* ── Mobile: bottom sticky (below xl) ── */}
            <div
                className={`xl:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xl border-t border-stone-200 dark:border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 safe-bottom">
                    {/* Product info row */}
                    <div className="flex items-center gap-3 mb-3">
                        {product.featuredImage && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 dark:border-border flex-shrink-0">
                                <Image
                                    data={product.featuredImage}
                                    className="w-full h-full object-cover"
                                    sizes="40px"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-stone-900 dark:text-foreground truncate leading-tight">
                                {product.title}
                            </p>
                            {selectedVariant.price && (
                                <div className="text-xs text-stone-600 dark:text-muted-foreground mt-0.5">
                                    <Money withoutTrailingZeros data={selectedVariant.price} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Buttons row */}
                    <div className="flex gap-2.5">
                        <div className="flex-1 [&>form]:w-full [&_button]:!py-3 [&_button]:!text-[10px]">
                            <AddToCartButton
                                disabled={!isAvailable}
                                onClick={onAddToCartClick}
                                lines={[
                                    {
                                        merchandiseId: selectedVariant.id,
                                        quantity: 1,
                                        selectedVariant,
                                    },
                                ]}
                            >
                                {isAvailable ? (
                                    <span className="flex items-center justify-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                        </svg>
                                        Add to Cart
                                    </span>
                                ) : (
                                    'Sold Out'
                                )}
                            </AddToCartButton>
                        </div>
                        {isAvailable && (
                            <a
                                href={`/cart/${numericId}:1`}
                                className="flex-1 py-3 text-[10px] tracking-[0.2em] uppercase font-medium rounded-full border border-stone-300 dark:border-border text-stone-700 dark:text-foreground hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 text-center flex items-center justify-center gap-1.5 no-underline"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                                </svg>
                                Buy Now
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Desktop: top sticky (xl and above) ── */}
            <div
                className={`hidden xl:block fixed top-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : '-translate-y-full'
                    }`}
            >
                <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xl border-b border-stone-200 dark:border-border shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                    <div className="container mx-auto px-6 lg:px-8 py-3 flex items-center justify-between gap-6">
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
                                    <div className="text-xs text-stone-500 dark:text-muted-foreground mt-0.5 flex items-center gap-2">
                                        <Money withoutTrailingZeros data={selectedVariant.price} />
                                        {selectedVariant.compareAtPrice && (
                                            <s className="text-stone-400 text-[11px]">
                                                <Money withoutTrailingZeros data={selectedVariant.compareAtPrice} />
                                            </s>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: action buttons */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="[&>form]:inline-flex [&_button]:!py-2.5 [&_button]:!px-8 [&_button]:!text-[10px]">
                                <AddToCartButton
                                    disabled={!isAvailable}
                                    onClick={onAddToCartClick}
                                    lines={[
                                        {
                                            merchandiseId: selectedVariant.id,
                                            quantity: 1,
                                            selectedVariant,
                                        },
                                    ]}
                                >
                                    {isAvailable ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                            </svg>
                                            Add to Cart
                                        </span>
                                    ) : (
                                        'Sold Out'
                                    )}
                                </AddToCartButton>
                            </div>
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
