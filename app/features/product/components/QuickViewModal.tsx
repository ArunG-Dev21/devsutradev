import { Image, Money, CartForm } from '@shopify/hydrogen';
import type { CurrencyCode } from '@shopify/hydrogen/storefront-api-types';
import { Link, useFetcher } from 'react-router';
import { useEffect, useRef } from 'react';
import { useCartNotification } from '~/features/cart/components/CartNotification';

interface QuickViewModalProps {
    product: {
        id: string;
        title: string;
        handle: string;
        featuredImage?: { url: string; altText?: string | null; width?: number | null; height?: number | null } | null;
        priceRange: {
            minVariantPrice: { amount: string; currencyCode: CurrencyCode };
        };
        compareAtPriceRange?: {
            minVariantPrice: { amount: string; currencyCode: CurrencyCode };
        } | null;
        variants?: {
            nodes: Array<{ id: string; availableForSale: boolean }>;
        };
    };
    onClose: () => void;
    reviewSummary?: { averageRating: number; reviewCount: number };
}

/**
 * Quick-view modal for product cards.
 * Shows product image, name, price, and 3 action buttons.
 *
 * Fixes applied:
 * 1. Removed onClick={onClose} from "Add to Cart" button — closing the modal
 *    before the CartForm submits was unmounting the form mid-request.
 *    Now the modal closes automatically once the cart action completes.
 * 2. Added availableForSale guard so unavailable variants don't trigger
 *    silent Shopify errors.
 * 3. "Buy Now" still closes immediately since navigation handles the redirect.
 */
export function QuickViewModal({ product, onClose, reviewSummary }: QuickViewModalProps) {
    const firstVariant = product.variants?.nodes?.[0];
    const isAvailable = firstVariant?.availableForSale ?? false;
    const normalizedFeaturedImage = product.featuredImage
        ? {
            ...product.featuredImage,
            width: product.featuredImage.width ?? undefined,
            height: product.featuredImage.height ?? undefined,
        }
        : null;

    // Use a fetcher to track when the cart mutation completes,
    // then close the modal automatically.
    const fetcher = useFetcher();
    const isAdding = fetcher.state !== 'idle';
    const { showNotification } = useCartNotification();
    const prevFetcherState = useRef(fetcher.state);

    useEffect(() => {
        // Close modal and show notification after the cart add completes
        if (prevFetcherState.current !== 'idle' && fetcher.state === 'idle' && fetcher.data) {
            showNotification(product.title, normalizedFeaturedImage || undefined);
            onClose();
        }
        prevFetcherState.current = fetcher.state;
    }, [fetcher.state, fetcher.data, onClose, showNotification, product.title, normalizedFeaturedImage]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close dialog"
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-md border-0 p-0"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative z-10 bg-card text-card-foreground sm:rounded-2xl rounded-xl w-full max-w-[850px] shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-all border border-border"
                role="dialog"
                aria-modal="true"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-card/80 hover:bg-muted backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border"
                    aria-label="Close"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Product Image */}
                <div className="w-full md:w-1/2 aspect-square md:aspect-auto md:h-[550px] bg-muted relative overflow-hidden group">
                    {normalizedFeaturedImage ? (
                        <Image
                            data={normalizedFeaturedImage}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(min-width: 768px) 50vw, 100vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                            No Image Available
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center bg-transparent">

                    <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mb-3">
                        Quick View
                    </p>

                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-light mb-3 text-foreground leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        {product.title}
                    </h3>

                    {reviewSummary && (
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        className={`w-4 h-4 ${star <= Math.round(reviewSummary.averageRating) ? 'text-[#F14514]' : 'text-stone-200 dark:text-stone-700'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        aria-hidden="true"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292Z" />
                                    </svg>
                                ))}
                            </div>
                            <span className="text-[11px] font-semibold text-stone-700 dark:text-foreground tabular-nums">
                                {reviewSummary.averageRating.toFixed(1)}
                            </span>
                            <span className="text-[11px] text-stone-400 dark:text-muted-foreground tabular-nums">
                                ({reviewSummary.reviewCount} review{reviewSummary.reviewCount !== 1 ? 's' : ''})
                            </span>
                        </div>
                    )}

                    <div className="flex items-baseline gap-2 mb-8">
                        <span className="text-lg font-normal text-foreground">
                            <Money withoutTrailingZeros data={product.priceRange.minVariantPrice} />
                        </span>
                        {product.compareAtPriceRange?.minVariantPrice &&
                            parseFloat(product.compareAtPriceRange.minVariantPrice.amount) >
                            parseFloat(product.priceRange.minVariantPrice.amount) && (
                            <s className="text-base text-muted-foreground">
                                <Money withoutTrailingZeros data={product.compareAtPriceRange.minVariantPrice} />
                            </s>
                        )}
                    </div>

                    <div className="w-8 h-px bg-border mb-8" />

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 mt-auto md:mt-0">

                        {/* Add to Cart */}
                        {firstVariant && isAvailable ? (
                            <CartForm
                                route="/cart"
                                action={CartForm.ACTIONS.LinesAdd}
                                inputs={{
                                    lines: [
                                        {
                                            merchandiseId: firstVariant.id,
                                            quantity: 1,
                                            selectedVariant: firstVariant,
                                        },
                                    ],
                                }}
                                fetcherKey={`quick-view-add-${product.id}`}
                            >
                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-medium rounded-full bg-stone-900 text-white transition-all duration-300 cursor-pointer hover:bg-stone-800 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAdding ? (
                                        <>
                                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                            </svg>
                                            Adding
                                        </>
                                    ) : (
                                        'Add to Cart'
                                    )}
                                </button>
                            </CartForm>
                        ) : (
                            <button
                                disabled
                                className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-medium rounded-full border border-border text-muted-foreground cursor-not-allowed text-center"
                            >
                                Sold Out
                            </button>
                        )}

                        {/* Buy Now & Full Details Row */}
                        <div className="grid grid-cols-2 gap-3 mt-1">
                            {firstVariant && isAvailable && (() => {
                                // Strip GID prefix: "gid://shopify/ProductVariant/12345" → "12345"
                                const numericId = firstVariant.id.split('/').pop();
                                return (
                                    <a
                                        href={`/cart/${numericId}:1`}
                                        onClick={onClose}
                                        className="w-full py-3.5 text-[10px] tracking-widest uppercase font-medium rounded-full border border-border text-foreground hover:bg-foreground hover:text-background transition-all duration-300 cursor-pointer text-center flex items-center justify-center"
                                    >
                                        Buy Now
                                    </a>
                                );
                            })()}

                            <Link
                                to={`/products/${product.handle}`}
                                onClick={onClose}
                                className={`w-full py-3.5 text-[10px] tracking-widest uppercase font-medium rounded-full transition-all duration-300 cursor-pointer text-center flex items-center justify-center ${!(firstVariant && isAvailable)
                                    ? 'col-span-2 border border-border text-foreground hover:bg-foreground hover:text-background'
                                    : 'bg-muted text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                Full Details
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
