import { useState, useRef, useEffect, useCallback, useMemo, useId } from "react";
import { Link } from "react-router";
import { CartForm, Money } from "@shopify/hydrogen";
import type { CurrencyCode } from "@shopify/hydrogen/storefront-api-types";
import { useCartNotification } from "~/features/cart/components/CartNotification";
import { QuickViewModal } from "~/features/product/components/QuickViewModal";
import { StarRating } from "~/shared/components/StarRating";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImageNode = {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
};

type ProductVariant = {
    id: string;
    availableForSale: boolean;
    title?: string;
    price?: { amount: string; currencyCode: CurrencyCode };
};

export interface KarungaliProduct {
    id: string;
    handle: string;
    title: string;
    availableForSale?: boolean;
    featuredImage?: ImageNode | null;
    images?: { nodes: ImageNode[] };
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } } | null;
    variants?: { nodes: ProductVariant[] };
}

export interface TabData {
    id: string;
    label: string;
    image?: ImageNode | null;
    products: KarungaliProduct[];
}

interface KarungaliPromoterProps {
    tabs?: TabData[];
    introTitle?: string;
    introText?: string;
    introImages?: string[];
    viewMoreLink?: string;
    reviewSummaries?: Record<string, { averageRating: number; reviewCount: number }>;
}

const DEFAULT_TABS: TabData[] = [
    { id: "karungali-maala", label: "Maala", image: null, products: [] },
    { id: "karungali-bracelets", label: "Bracelets", image: null, products: [] },
];

/* ── Chevron arrow icon ─────────────────────────────────────────────────────── */
function ChevronIcon({ direction = "right", className = "" }: { direction?: "left" | "right"; className?: string }) {
    return (
        <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
        </svg>
    );
}

/* ── Decorative silver chain — fills the gap edge-to-edge, touching both neighbors ─── */
function ChainConnector({ className = "" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 23 88"
            fill="none"
            className={`w-[18px] md:w-[23px] text-[#9b9a9a] h-auto ${className}`}
            aria-hidden="true"
        >
            <g clipPath="url(#clip0_2001_2)">
                <path d="M16.492 12.167C15.203 9.861 13.532 9.345 11.234 9.869C11.759 10.819 12.281 11.613 12.649 12.012L12.74 12.008C13.165 12.008 13.748 12.008 14.474 13.307C14.66 13.664 15.004 15.07 14.281 20.411C15.082 20.696 15.776 21.222 16.377 21.994C16.424 21.773 16.462 21.551 16.492 21.33C16.854 18.785 17.496 13.96 16.492 12.167Z" fill="currentColor"/>
                <path d="M13.193 23.726C13.097 23.804 12.994 23.861 12.884 23.896C11.933 23.901 9.023 18.523 8.651 15.975C8.496 14.909 8.845 14.036 9.445 13.386C8.993 12.787 8.558 12.116 8.153 11.41C6.811 12.619 6.077 14.371 6.36 16.312C6.796 19.293 10.124 25.91 12.511 26.201C13.127 26.277 13.666 26.156 14.135 25.895C14.108 24.967 13.987 24.682 13.96 24.631C13.65 24.076 13.407 23.832 13.193 23.726Z" fill="currentColor"/>
                <path d="M13.193 12.673C13.096 12.751 12.994 12.809 12.884 12.842C12.14 12.847 10.196 9.553 9.208 6.9H6.767C7.822 10.168 10.5 14.904 12.512 15.148C13.128 15.223 13.667 15.103 14.136 14.842C14.109 13.909 13.988 13.628 13.961 13.578C13.649 13.021 13.407 12.779 13.193 12.673Z" fill="currentColor"/>
                <path d="M14.57 6.9C14.502 7.61 14.409 8.421 14.283 9.357C15.082 9.642 15.776 10.168 16.377 10.94C16.424 10.72 16.462 10.497 16.492 10.277C16.623 9.363 16.789 8.155 16.902 6.9H14.57Z" fill="currentColor"/>
                <path d="M12.74 23.061C13.165 23.061 13.748 23.061 14.474 24.36C14.627 24.653 14.888 25.663 14.57 29.006H16.902C17.103 26.765 17.135 24.369 16.492 23.22C15.203 20.913 13.532 20.398 11.234 20.922C11.759 21.872 12.281 22.666 12.649 23.065L12.74 23.061Z" fill="currentColor"/>
                <path d="M6.768 29.005H9.209C8.935 28.267 8.733 27.58 8.652 27.026C8.497 25.96 8.848 25.085 9.447 24.436C8.996 23.839 8.559 23.168 8.154 22.461C6.812 23.671 6.078 25.423 6.361 27.364C6.43 27.835 6.569 28.393 6.768 29.005Z" fill="currentColor"/>
                <path d="M16.492 34.273C15.203 31.967 13.532 31.451 11.234 31.975C11.759 32.925 12.281 33.719 12.649 34.118L12.74 34.114C13.165 34.114 13.748 34.114 14.474 35.413C14.66 35.77 15.004 37.175 14.281 42.516C15.082 42.802 15.776 43.327 16.377 44.1C16.424 43.879 16.462 43.656 16.492 43.435C16.854 40.89 17.496 36.065 16.492 34.273Z" fill="currentColor"/>
                <path d="M13.193 45.832C13.097 45.909 12.994 45.967 12.884 46.002C11.933 46.007 9.023 40.63 8.651 38.082C8.496 37.016 8.845 36.142 9.445 35.493C8.993 34.894 8.558 34.223 8.153 33.517C6.811 34.725 6.077 36.478 6.36 38.419C6.796 41.4 10.124 48.018 12.511 48.308C13.127 48.383 13.666 48.263 14.135 48.002C14.108 47.074 13.987 46.789 13.96 46.738C13.65 46.181 13.407 45.938 13.193 45.832Z" fill="currentColor"/>
                <path d="M13.193 34.779C13.096 34.857 12.994 34.914 12.884 34.948C12.14 34.953 10.196 31.659 9.208 29.006H6.767C7.822 32.274 10.5 37.01 12.512 37.254C13.128 37.329 13.667 37.209 14.136 36.948C14.109 36.016 13.988 35.734 13.961 35.684C13.649 35.126 13.407 34.885 13.193 34.779Z" fill="currentColor"/>
                <path d="M14.57 29.005C14.502 29.714 14.409 30.526 14.283 31.462C15.082 31.746 15.776 32.273 16.377 33.045C16.424 32.825 16.462 32.602 16.492 32.381C16.623 31.467 16.789 30.26 16.902 29.004L14.57 29.005Z" fill="currentColor"/>
                <path d="M12.74 45.166C13.165 45.166 13.748 45.166 14.474 46.465C14.627 46.758 14.888 47.768 14.57 51.11H16.902C17.103 48.869 17.135 46.474 16.492 45.325C15.203 43.018 13.532 42.503 11.234 43.027C11.759 43.977 12.281 44.771 12.649 45.17L12.74 45.166Z" fill="currentColor"/>
                <path d="M6.768 51.11H9.209C8.935 50.372 8.733 49.685 8.652 49.132C8.497 48.066 8.848 47.191 9.447 46.542C8.996 45.945 8.559 45.274 8.154 44.566C6.812 45.776 6.078 47.528 6.361 49.469C6.43 49.94 6.569 50.498 6.768 51.11Z" fill="currentColor"/>
                <path d="M16.492 56.378C15.203 54.072 13.532 53.556 11.234 54.08C11.759 55.03 12.281 55.824 12.649 56.223L12.74 56.219C13.165 56.219 13.748 56.219 14.474 57.518C14.66 57.875 15.004 59.28 14.281 64.621C15.082 64.907 15.776 65.432 16.377 66.205C16.424 65.984 16.462 65.762 16.492 65.541C16.854 62.995 17.496 58.171 16.492 56.378Z" fill="currentColor"/>
                <path d="M13.193 67.937C13.097 68.015 12.994 68.073 12.884 68.107C11.933 68.112 9.023 62.735 8.651 60.187C8.496 59.12 8.845 58.247 9.445 57.597C8.993 56.999 8.558 56.328 8.153 55.621C6.811 56.83 6.077 58.582 6.36 60.523C6.796 63.504 10.124 70.121 12.511 70.412C13.127 70.488 13.666 70.367 14.135 70.106C14.108 69.178 13.987 68.894 13.96 68.842C13.65 68.286 13.407 68.043 13.193 67.937Z" fill="currentColor"/>
                <path d="M13.193 56.884C13.096 56.961 12.994 57.019 12.884 57.052C12.14 57.057 10.196 53.763 9.208 51.11H6.767C7.822 54.378 10.5 59.114 12.512 59.359C13.128 59.433 13.667 59.314 14.136 59.053C14.109 58.121 13.988 57.839 13.961 57.789C13.649 57.231 13.407 56.99 13.193 56.884Z" fill="currentColor"/>
                <path d="M14.57 51.11C14.502 51.819 14.409 52.631 14.283 53.567C15.082 53.852 15.776 54.378 16.377 55.151C16.424 54.931 16.462 54.707 16.492 54.487C16.623 53.572 16.789 52.365 16.902 51.11H14.57Z" fill="currentColor"/>
                <path d="M12.74 67.272C13.165 67.272 13.748 67.272 14.474 68.571C14.627 68.864 14.888 69.874 14.57 73.217H16.902C17.103 70.976 17.135 68.581 16.492 67.431C15.203 65.124 13.532 64.609 11.234 65.133C11.759 66.083 12.281 66.877 12.649 67.276L12.74 67.272Z" fill="currentColor"/>
                <path d="M6.768 73.216H9.209C8.935 72.478 8.733 71.791 8.652 71.238C8.497 70.171 8.848 69.297 9.447 68.647C8.996 68.05 8.559 67.379 8.154 66.672C6.812 67.882 6.078 69.634 6.361 71.575C6.43 72.045 6.569 72.604 6.768 73.216Z" fill="currentColor"/>
                <path d="M16.492 78.483C15.203 76.177 13.532 75.661 11.234 76.185C11.759 77.135 12.281 77.929 12.649 78.328L12.74 78.324C13.165 78.324 13.748 78.324 14.474 79.623C14.66 79.98 15.004 81.385 14.281 86.726C15.082 87.012 15.776 87.537 16.377 88.31C16.424 88.089 16.462 87.867 16.492 87.646C16.854 85.101 17.496 80.276 16.492 78.483Z" fill="currentColor"/>
                <path d="M13.193 90.042C13.097 90.12 12.994 90.177 12.884 90.211C11.933 90.216 9.023 84.839 8.651 82.291C8.496 81.225 8.845 80.351 9.445 79.702C8.993 79.103 8.558 78.432 8.153 77.726C6.811 78.935 6.077 80.687 6.36 82.628C6.796 85.609 10.124 92.227 12.511 92.517C13.127 92.593 13.666 92.472 14.135 92.211C14.108 91.283 13.987 90.998 13.96 90.947C13.65 90.391 13.407 90.148 13.193 90.042Z" fill="currentColor"/>
                <path d="M13.193 78.989C13.096 79.067 12.994 79.124 12.884 79.158C12.14 79.163 10.196 75.869 9.208 73.216H6.767C7.822 76.484 10.5 81.22 12.512 81.464C13.128 81.539 13.667 81.419 14.136 81.158C14.109 80.226 13.988 79.944 13.961 79.894C13.649 79.337 13.407 79.095 13.193 78.989Z" fill="currentColor"/>
                <path d="M14.57 73.216C14.502 73.925 14.409 74.737 14.283 75.673C15.082 75.958 15.776 76.484 16.377 77.256C16.424 77.036 16.462 76.813 16.492 76.593C16.623 75.678 16.789 74.471 16.902 73.216H14.57Z" fill="currentColor"/>
                <path d="M12.74 89.377C13.165 89.377 13.748 89.377 14.474 90.676C14.627 90.969 14.888 91.979 14.57 95.321H16.902C17.103 93.08 17.135 90.685 16.492 89.536C15.203 87.229 13.532 86.714 11.234 87.238C11.759 88.188 12.281 88.981 12.649 89.381L12.74 89.377Z" fill="currentColor"/>
            </g>
            <defs>
                <clipPath id="clip0_2001_2">
                    <rect width="22.5" height="87.3" fill="white"/>
                </clipPath>
            </defs>
        </svg>
    );
}

/* ── ATC Icon Button ────────────────────────────────────────────────────────── */
function ATCIconButton({
    isAdding,
    justAdded,
    onClick,
    disabled,
    ariaLabel = "Add to cart",
}: {
    isAdding: boolean;
    justAdded?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
}) {
    return (
        <button
            type="submit"
            disabled={disabled || isAdding}
            onClick={onClick}
            className={[
                "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shrink-0",
                "bg-white border border-black dark:border-white transition-all duration-200 ease-out cursor-pointer select-none",
                "hover:bg-black group/atc",
                isAdding ? "opacity-60 scale-[0.97] cursor-not-allowed" : justAdded ? "scale-[0.97]" : "active:scale-[0.96]",
            ].join(" ")}
            aria-label={ariaLabel}
        >
            {isAdding ? (
                <svg className="animate-spin w-3.5 h-3.5 text-black group-hover/atc:text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
            ) : justAdded ? (
                <svg className="w-3.5 h-3.5 text-black group-hover/atc:text-white"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <img src="/icons/add-bag.png" alt={ariaLabel} className="w-4 h-4 sm:w-5 sm:h-5 object-contain dark:invert dark:brightness-0 group-hover/atc:invert" />
            )}
        </button>
    );
}

/* ── Size Pill ──────────────────────────────────────────────────────────────── */
function SizePillInner({
    fetcher, variant, productTitle, productImage, onAdded,
}: {
    fetcher: any;
    variant: ProductVariant;
    productTitle: string;
    productImage?: ImageNode | null;
    onAdded: () => void;
}) {
    const { showNotification } = useCartNotification();
    const prevState = useRef<string>("idle");

    useEffect(() => {
        if (prevState.current !== "idle" && fetcher.state === "idle") {
            showNotification(productTitle, productImage || undefined);
            onAdded();
        }
        prevState.current = fetcher.state;
    }, [fetcher.state, showNotification, productTitle, productImage, onAdded]);

    const isAdding = fetcher.state !== "idle";
    return (
        <button
            type="submit"
            disabled={!variant.availableForSale || isAdding}
            className={[
                "px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-medium tracking-wide uppercase border transition-all duration-150 cursor-pointer select-none",
                !variant.availableForSale
                    ? "border-border text-muted-foreground/40 line-through cursor-not-allowed"
                    : isAdding
                        ? "border-foreground bg-foreground text-background opacity-70 cursor-not-allowed"
                        : "border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background active:scale-95",
            ].join(" ")}
            aria-label={`Add size ${variant.title ?? ""} to cart`}
        >
            {isAdding ? (
                <svg className="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
            ) : (variant.title ?? "—")}
        </button>
    );
}

function SizePillForm({
    variant, productTitle, productImage, productId, onAdded,
}: {
    variant: ProductVariant;
    productTitle: string;
    productImage?: ImageNode | null;
    productId: string;
    onAdded: () => void;
}) {
    return (
        <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesAdd}
            inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1, selectedVariant: variant as any }] }}
            fetcherKey={`add-size-${productId}-${variant.id}`}
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

/* ── Add To Cart Button ─────────────────────────────────────────────────────── */
function AddToCartButton({
    product, showSizePicker, onToggleSizePicker,
}: {
    product: KarungaliProduct;
    showSizePicker: boolean;
    onToggleSizePicker: () => void;
}) {
    const variants = product.variants?.nodes ?? [];
    const firstVariant = variants[0];
    const isAvailable = firstVariant?.availableForSale ?? product.availableForSale !== false;
    const hasMultipleVariants = variants.length > 1;

    if (!firstVariant || !isAvailable) {
        return (
            <div className="mt-2.5 w-full py-2 text-center text-[9px] font-medium tracking-widest uppercase text-muted-foreground border border-border rounded-full select-none">
                Sold Out
            </div>
        );
    }

    if (hasMultipleVariants) {
        return (
            <button
                type="button"
                onClick={onToggleSizePicker}
                className={[
                    "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shrink-0",
                    "border transition-all duration-200 ease-out cursor-pointer select-none group/atc",
                    showSizePicker
                        ? "bg-foreground border-foreground text-background"
                        : "bg-white border-black dark:border-white hover:bg-black hover:text-white",
                ].join(" ")}
                aria-label={showSizePicker ? "Close size picker" : "Select size"}
            >
                {showSizePicker ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <img src="/icons/add-bag.png" alt="Select size" className="w-4 h-4 sm:w-5 sm:h-5 object-contain dark:invert dark:brightness-0 group-hover/atc:invert" />
                )}
            </button>
        );
    }

    return (
        <CartForm
            route="/cart"
            action={CartForm.ACTIONS.LinesAdd}
            inputs={{ lines: [{ merchandiseId: firstVariant.id, quantity: 1, selectedVariant: firstVariant as any }] }}
            fetcherKey={`add-to-cart-${product.id}`}
        >
            {(fetcher) => (
                <ATCInner fetcher={fetcher} productTitle={product.title} productImage={product.featuredImage} />
            )}
        </CartForm>
    );
}

function ATCInner({ fetcher, productTitle, productImage }: { fetcher: any; productTitle: string; productImage?: ImageNode | null }) {
    const [justAdded, setJustAdded] = useState(false);
    const { showNotification } = useCartNotification();
    const prevState = useRef(fetcher.state);

    useEffect(() => {
        if (prevState.current !== "idle" && fetcher.state === "idle") {
            showNotification(productTitle, productImage || undefined);
        }
        prevState.current = fetcher.state;
    }, [fetcher.state, showNotification, productTitle, productImage]);

    return (
        <ATCIconButton
            isAdding={fetcher.state !== "idle"}
            justAdded={justAdded}
            onClick={() => { setJustAdded(true); setTimeout(() => setJustAdded(false), 1800); }}
        />
    );
}

/* ── Product Card ───────────────────────────────────────────────────────────── */
function KarungaliProductCard({
    product, reviewSummary, onQuickView,
}: {
    product: KarungaliProduct;
    reviewSummary?: { averageRating: number; reviewCount: number };
    onQuickView: () => void;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [showSizePicker, setShowSizePicker] = useState(false);
    const isUnavailable = product.availableForSale === false;
    const secondaryImage = product.images?.nodes?.[1] ?? null;
    const variants = product.variants?.nodes ?? [];
    const closeSizePicker = useCallback(() => setShowSizePicker(false), []);

    return (
        <div
            className="group/card relative bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col border hover:-translate-y-0.5 transition-all duration-300 ease-out"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ── IMAGE ── */}
            <Link to={`/products/${product.handle}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-stone-100 m-1.5 sm:m-2 rounded-xl">
                    {product.featuredImage?.url && (
                        <img
                            src={product.featuredImage.url}
                            alt={product.featuredImage.altText || product.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                                opacity: isHovered && secondaryImage ? 0 : 1,
                                transform: isHovered ? "scale(1.05)" : "scale(1)",
                                transition: "opacity 0.55s ease, transform 0.65s ease",
                                willChange: "opacity, transform",
                                zIndex: 1,
                            }}
                        />
                    )}
                    {secondaryImage && (
                        <img
                            src={secondaryImage.url}
                            alt={secondaryImage.altText || product.title}
                            className="absolute inset-0 w-full h-full object-cover"
                            style={{
                                opacity: isHovered ? 1 : 0,
                                transform: isHovered ? "scale(1.02)" : "scale(1.07)",
                                transition: "opacity 0.55s ease, transform 0.65s ease",
                                willChange: "opacity, transform",
                                zIndex: 2,
                            }}
                        />
                    )}
                    <div
                        className="absolute inset-0 bg-linear-to-t from-stone-900/15 to-transparent pointer-events-none"
                        style={{ opacity: isHovered ? 1 : 0, transition: "opacity 0.4s ease", zIndex: 3 }}
                    />
                    {isUnavailable && (
                        <span
                            className="absolute top-2 left-2 text-[8px] sm:text-[9px] font-medium tracking-wider uppercase px-2 py-0.5 sm:px-3 sm:py-1 bg-card/90 text-muted-foreground border border-border rounded-full backdrop-blur-sm"
                            style={{ zIndex: 4 }}
                        >
                            Sold Out
                        </span>
                    )}
                    {reviewSummary && (
                        <StarRating
                            rating={reviewSummary.averageRating}
                            count={reviewSummary.reviewCount}
                            className="absolute top-2 right-2 z-4"
                        />
                    )}
                    {!isUnavailable && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(); }}
                            aria-label="Quick view"
                            className="absolute bottom-2 right-2 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border border-border bg-card/85 hover:bg-foreground hover:text-background backdrop-blur-sm group/eye"
                            style={{
                                opacity: isHovered ? 1 : 0,
                                transform: isHovered ? "translateY(0px)" : "translateY(8px)",
                                transition: "opacity 0.3s ease, transform 0.3s ease, background-color 0.2s ease",
                                zIndex: 4,
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                                className="stroke-stone-800 dark:stroke-stone-200 group-hover/eye:stroke-white dark:group-hover/eye:stroke-stone-900 transition-colors duration-150">
                                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </button>
                    )}
                </div>
            </Link>

            {/* ── INFO + ATC ── */}
            <div className="relative px-2 sm:px-3 pb-2 sm:pb-3 mt-1 flex items-center gap-1.5 sm:gap-2">
                <div className="min-w-0 flex-1">
                    <Link to={`/products/${product.handle}`} className="block">
                        <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-2 leading-snug">
                            {product.title}
                        </p>
                        <span className="block text-sm sm:text-base font-medium text-foreground mt-0.5 leading-none">
                            <Money className="font-montserrat" withoutTrailingZeros data={product.priceRange.minVariantPrice as any} />
                        </span>
                    </Link>
                </div>
                <div className="shrink-0 flex items-center justify-center">
                    <AddToCartButton
                        product={product}
                        showSizePicker={showSizePicker}
                        onToggleSizePicker={() => setShowSizePicker((p) => !p)}
                    />
                </div>
            </div>

            {/* ── INLINE SIZE PICKER ── */}
            {showSizePicker && variants.length > 1 && (
                <div className="px-2 sm:px-3 pb-3 sm:pb-4 border-t border-border/40 pt-2.5">
                    <p className="text-[8px] sm:text-[9px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                        Select Size
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {variants.map((variant) => (
                            <SizePillForm
                                key={variant.id}
                                variant={variant}
                                productTitle={product.title}
                                productImage={product.featuredImage}
                                productId={product.id}
                                onAdded={closeSizePicker}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════════════════════════ */
export function KarungaliPromoter({
    tabs = DEFAULT_TABS,
    introTitle = "The Power of Authentic Karungali",
    introText = "Natural Karungali (Ebony) wood from Tamil Nadu, known for absorbing negative energy and promoting peace and spiritual balance.",
    introImages = ["/karungali-bg.png"],
    viewMoreLink = "/collections/karungali",
    reviewSummaries,
}: KarungaliPromoterProps) {
    const activeTabs = tabs.length > 0 ? tabs : DEFAULT_TABS;
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [quickViewProduct, setQuickViewProduct] = useState<KarungaliProduct | null>(null);

    // Merge all tab products into a single, deduped list (Maala + Bracelets shown together).
    const allProducts = useMemo(() => {
        const seen = new Set<string>();
        const out: KarungaliProduct[] = [];
        for (const tab of activeTabs) {
            for (const p of tab.products ?? []) {
                if (p && !seen.has(p.id)) {
                    seen.add(p.id);
                    out.push(p);
                }
            }
        }
        return out;
    }, [activeTabs]);

    const nextImg = () => setActiveImageIdx((i) => (i + 1) % introImages.length);
    const prevImg = () => setActiveImageIdx((i) => (i - 1 + introImages.length) % introImages.length);

    const hasImages = introImages && introImages.length > 0;

    return (
        <section className="relative py-20 md:py-28 bg-background overflow-hidden">
            <div className="container relative mx-auto px-3 sm:px-6 lg:px-8">
                {/* ── Section Header ── */}
                <div className="flex flex-col items-center text-center mb-12 md:mb-16">
                    <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.4em] uppercase text-[#F14514] font-medium mb-5">
                        <span className="h-px w-6 bg-[#F14514]/40" />
                        Handcrafted Heritage
                        <span className="h-px w-6 bg-[#F14514]/40" />
                    </span>
                    <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight text-foreground">
                        Karungali Collection
                    </h2>
                    <p className="mt-5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                        {introText}
                    </p>
                </div>

                {/* ── Editorial Hero Strip ── */}
                <div className="relative rounded-[28px] overflow-hidden bg-neutral-900 aspect-21/9 sm:aspect-24/9 mb-10 md:mb-14 z-10 shadow-lg">
                    {hasImages && (
                        <img
                            key={activeImageIdx}
                            src={introImages[activeImageIdx]}
                            alt={`Karungali ${activeImageIdx + 1}`}
                            width={2400}
                            height={900}
                            sizes="(min-width: 1024px) 80vw, 100vw"
                            className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.6s_ease]"
                        />
                    )}

                    <div className="absolute inset-0 flex flex-col justify-end items-start p-6 sm:p-10 md:p-14 z-10">
                        <h3 className="text-white font-heading text-lg sm:text-2xl md:text-3xl xl:text-5xl font-semibold leading-tight mb-3 sm:mb-4 drop-shadow-md">
                            {introTitle}
                        </h3>
                        <div className="flex items-center gap-3">
                            <Link
                                to={viewMoreLink}
                                className="inline-flex items-center gap-2 bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-neutral-100 hover:scale-[1.02] transition-all"
                            >
                                Explore Collection
                                <ChevronIcon className="w-3.5 h-3.5" />
                            </Link>
                            {introImages.length > 1 && (
                                <div className="flex items-center gap-1.5">
                                    <button onClick={prevImg} aria-label="Previous image" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition text-white">
                                        <ChevronIcon direction="left" className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={nextImg} aria-label="Next image" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition text-white">
                                        <ChevronIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-white/60 text-[11px] ml-1.5 tabular-nums font-medium">
                                        {activeImageIdx + 1}/{introImages.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Spiritual Wood Frame: Catalogue bar + grid, suspended from the hero by gold chains ── */}
                <div className="relative z-0">
                    {/* Two decorative chains connecting hero → wood frame */}
                    <ChainConnector className="absolute bottom-[calc(100%-14px)] md:bottom-[calc(100%-16px)] left-[15%] z-0" />
                    <ChainConnector className="absolute bottom-[calc(100%-14px)] md:bottom-[calc(100%-16px)] right-[15%] z-0" />

                    <div className="relative rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 md:p-10 overflow-hidden border border-white bg-white/5 backdrop-blur-md z-10">
                        {/* Catalogue Bar */}
                        <div className="relative flex flex-col sm:flex-row items-center sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8 pb-4 border-b border-amber-200/15 text-center sm:text-left">
                            <h3 className="font-heading text-xl sm:text-2xl lg:text-3xl text-amber-50/95 leading-tight">
                                Find Your Piece
                                <span className="text-amber-200/45 font-normal ml-2 tabular-nums">
                                    ({allProducts.length})
                                </span>
                            </h3>
                            <Link
                                to={viewMoreLink}
                                className="hidden sm:inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#F14514] hover:text-[#d63d12] transition-colors duration-200 group"
                            >
                                View all
                                <ChevronIcon className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                            </Link>
                        </div>

                        {/* Product Grid (all categories merged) */}
                        <div className="relative">
                            {allProducts.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                                    {allProducts.map((product) => {
                                        const pid = String(product.id).split('/').pop();
                                        const summary = pid ? reviewSummaries?.[pid] : undefined;
                                        return (
                                            <KarungaliProductCard
                                                key={product.id}
                                                product={product}
                                                reviewSummary={summary}
                                                onQuickView={() => setQuickViewProduct(product)}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center bg-amber-950/30 border border-dashed border-amber-200/20 rounded-[28px] p-12 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-900/40 flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-amber-200/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <h4 className="text-amber-50 font-semibold mb-1 text-sm">No Products Yet</h4>
                                    <p className="text-amber-200/65 text-xs">
                                        Add products to your Karungali collections in Shopify.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Mobile CTA ── */}
                <div className="sm:hidden mt-8">
                    <Link
                        to={viewMoreLink}
                        className="group flex items-center justify-center gap-2 w-full py-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F14514] hover:text-[#d63d12] transition-colors duration-200"
                    >
                        View All Karungali
                        <ChevronIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Quick View Modal */}
            {quickViewProduct && (
                <QuickViewModal
                    product={quickViewProduct as any}
                    onClose={() => setQuickViewProduct(null)}
                    reviewSummary={(() => {
                        const pid = String(quickViewProduct.id).split('/').pop();
                        return pid ? reviewSummaries?.[pid] : undefined;
                    })()}
                />
            )}
        </section>
    );
}
