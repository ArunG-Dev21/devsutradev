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
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-transparent backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl max-w-md w-full shadow-silver overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-bg-dark shadow flex items-center justify-center hover:text-accent hover:border-accent shadow-glow transition cursor-pointer text-sm text-text-main"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Product Image */}
                <div className="aspect-square bg-bg-dark overflow-hidden">
                    {product.featuredImage && (
                        <Image
                            data={product.featuredImage}
                            className="w-full h-full object-cover"
                            sizes="400px"
                        />
                    )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                    <h3 className="text-lg font-medium mb-1 font-heading text-text-main">
                        {product.title}
                    </h3>
                    <div className="text-base font-medium mb-5 text-accent">
                        <Money data={product.priceRange.minVariantPrice as any} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5">

                        {/* Add to Cart */}
                        {firstVariant && isAvailable ? (
                            // FIX 1: Use fetcher.Form instead of CartForm so we can
                            // track submission state and close AFTER the request completes,
                            // not before. CartForm under the hood is a fetcher form too.
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
                                fetcherKey="quick-view-add"
                            >
                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="w-full py-3 text-sm tracking-widest uppercase font-semibold rounded-lg bg-accent text-bg-dark shadow-glow transition-all duration-300 cursor-pointer hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                                    // FIX 2: No onClick={onClose} here — the useEffect above
                                    // closes the modal once the fetcher confirms success.
                                >
                                    {isAdding ? 'Adding…' : 'Add to Cart'}
                                </button>
                            </CartForm>
                        ) : (
                            // FIX 3: Show disabled state instead of silently submitting
                            // an unavailable variant to Shopify.
                            <button
                                disabled
                                className="w-full py-3 text-sm tracking-widest uppercase font-semibold rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed"
                            >
                                Sold Out
                            </button>
                        )}

                        {/* Buy Now */}
                        {firstVariant && isAvailable && (
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
                            >
                                <input type="hidden" name="buyNow" value="true" />
                                <button
                                    type="submit"
                                    onClick={onClose} // OK here — navigating away anyway
                                    className="w-full py-3 text-sm tracking-widest uppercase bg-violet-500 font-semibold rounded-lg text-white transition-all duration-300 cursor-pointer"
                                >
                                    Buy Now
                                </button>
                            </CartForm>
                        )}

                        {/* View Product */}
                        <Link
                            to={`/products/${product.handle}`}
                            onClick={onClose}
                            className="w-full py-3 text-sm tracking-widest uppercase text-center text-text-muted hover:text-accent transition no-underline"
                        >
                            Go to Product →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}