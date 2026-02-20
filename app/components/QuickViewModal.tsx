import { Image, Money, CartForm } from '@shopify/hydrogen';
import { Link } from 'react-router';

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
 */
export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
    const firstVariant = product.variants?.nodes?.[0];

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-neutral-100 transition cursor-pointer text-sm"
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Product Image */}
                <div className="aspect-square bg-neutral-50 overflow-hidden">
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
                    <h3
                        className="text-lg font-semibold mb-1"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        {product.title}
                    </h3>
                    <div className="text-base font-medium mb-5" style={{ color: '#C5A355' }}>
                        <Money data={product.priceRange.minVariantPrice} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2.5">
                        {/* Add to Cart */}
                        {firstVariant && (
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
                                <button
                                    type="submit"
                                    className="w-full py-3 text-sm tracking-wider uppercase font-semibold rounded-lg transition-all duration-300 cursor-pointer hover:opacity-90"
                                    style={{ backgroundColor: '#0A0A0A', color: '#fff' }}
                                    onClick={onClose}
                                >
                                    Add to Cart
                                </button>
                            </CartForm>
                        )}

                        {/* Buy Now */}
                        {firstVariant && (
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
                                    className="w-full py-3 text-sm tracking-wider uppercase font-semibold rounded-lg border-2 transition-all duration-300 cursor-pointer"
                                    style={{ borderColor: '#C5A355', color: '#C5A355' }}
                                >
                                    Buy Now
                                </button>
                            </CartForm>
                        )}

                        {/* View Product */}
                        <Link
                            to={`/products/${product.handle}`}
                            onClick={onClose}
                            className="w-full py-3 text-sm tracking-wider uppercase text-center text-neutral-500 hover:text-black transition no-underline"
                        >
                            View Product →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
