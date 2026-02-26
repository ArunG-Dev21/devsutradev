import { Image, Money, CartForm } from '@shopify/hydrogen';
import { Link } from 'react-router';
import { useFetcher } from 'react-router';
import { useEffect } from 'react';

interface QuickViewModalProps {
    product: {
        id: string;
        title: string;
        handle: string;
        featuredImage?: { url: string; altText?: string | null; width?: number; height?: number } | null;
        priceRange: {
            minVariantPrice: { amount: string; currencyCode: string };
        };
        variants?: {
            nodes: Array<{ id: string; availableForSale: boolean }>;
        };
    };
    onClose: () => void;
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
export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
    const firstVariant = product.variants?.nodes?.[0];
    const isAvailable = firstVariant?.availableForSale ?? false;

    // Use a fetcher to track when the cart mutation completes,
    // then close the modal automatically.
    const fetcher = useFetcher();
    const isAdding = fetcher.state !== 'idle';

    useEffect(() => {
        // Close modal after the cart add completes (fetcher goes idle after submitting)
        if (fetcher.state === 'idle' && fetcher.data) {
            onClose();
        }
    }, [fetcher.state, fetcher.data, onClose]);

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md" />

            {/* Modal */}
            <div
                className="relative bg-white sm:rounded-2xl rounded-xl w-full max-w-[850px] shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-stone-100 backdrop-blur-sm flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors cursor-pointer border border-stone-200"
                    aria-label="Close"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Product Image */}
                <div className="w-full md:w-1/2 aspect-square md:aspect-auto md:h-[550px] bg-stone-50 relative overflow-hidden group">
                    {product.featuredImage ? (
                        <Image
                            data={product.featuredImage}
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
                <div className="w-full md:w-1/2 p-6 md:p-10 lg:p-12 flex flex-col justify-center bg-white">

                    <p className="text-[10px] font-medium tracking-widest uppercase text-stone-400 mb-3">
                        Quick View
                    </p>

                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 text-stone-900 leading-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        {product.title}
                    </h3>

                    <div className="text-lg font-normal mb-8 text-stone-600">
                        <Money data={product.priceRange.minVariantPrice as any} />
                    </div>

                    <div className="w-8 h-px bg-stone-200 mb-8" />

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
                                className="w-full py-4 text-[11px] tracking-[0.2em] uppercase font-medium rounded-full border border-stone-200 text-stone-400 cursor-not-allowed text-center"
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
                                        className="w-full py-3.5 text-[10px] tracking-widest uppercase font-medium rounded-full border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 cursor-pointer text-center flex items-center justify-center"
                                    >
                                        Buy Now
                                    </a>
                                );
                            })()}

                            <Link
                                to={`/products/${product.handle}`}
                                onClick={onClose}
                                className={`w-full py-3.5 text-[10px] tracking-widest uppercase font-medium rounded-full transition-all duration-300 cursor-pointer text-center flex items-center justify-center ${!(firstVariant && isAvailable)
                                    ? 'col-span-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
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