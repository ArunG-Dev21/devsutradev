import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { CartForm, Money } from "@shopify/hydrogen";
import type { CurrencyCode } from "@shopify/hydrogen/storefront-api-types";
import { useCartNotification } from "~/features/cart/components/CartNotification";
import { QuickViewModal } from "~/features/product/components/QuickViewModal";

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
                "bg-white border border-black transition-all duration-200 ease-out cursor-pointer select-none",
                "hover:bg-black group/atc",
                isAdding ? "opacity-60 scale-[0.97] cursor-not-allowed" : justAdded ? "scale-[0.97]" : "active:scale-[0.96]",
            ].join(" ")}
            aria-label={ariaLabel}
        >
            {isAdding ? (
                <svg className="animate-spin w-3.5 h-3.5 text-black group-hover/atc:text-white"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
            ) : justAdded ? (
                <svg className="w-3.5 h-3.5 text-black group-hover/atc:text-white"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <img src="/icons/add-bag.png" alt={ariaLabel} className="w-4 h-4 sm:w-5 sm:h-5 object-contain group-hover/atc:invert" />
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
                <svg className="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
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
            inputs={{ lines: [{ merchandiseId: variant.id, quantity: 1 }] }}
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
                        : "bg-white border-black hover:bg-black hover:text-white",
                ].join(" ")}
                aria-label={showSizePicker ? "Close size picker" : "Select size"}
            >
                {showSizePicker ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <img src="/icons/add-bag.png" alt="Select size" className="w-4 h-4 sm:w-5 sm:h-5 object-contain group-hover/atc:invert" />
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
    product, onQuickView,
}: {
    product: KarungaliProduct;
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
                            <Money withoutTrailingZeros data={product.priceRange.minVariantPrice as any} />
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
    introImages = ["/karungali-bg.jpg"],
    viewMoreLink = "/collections/karungali",
}: KarungaliPromoterProps) {
    const activeTabs = tabs.length > 0 ? tabs : DEFAULT_TABS;
    const [activeTabId, setActiveTabId] = useState(activeTabs[0]?.id);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [quickViewProduct, setQuickViewProduct] = useState<KarungaliProduct | null>(null);

    const activeTab = activeTabs.find((t) => t.id === activeTabId) || activeTabs[0];

    const nextImg = () => setActiveImageIdx((i) => (i + 1) % introImages.length);
    const prevImg = () => setActiveImageIdx((i) => (i - 1 + introImages.length) % introImages.length);

    const hasImages = introImages && introImages.length > 0;

    return (
        <section className="relative py-16 md:py-24 bg-background overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 rounded-full bg-amber-500/4 dark:bg-amber-400/3 blur-3xl pointer-events-none" />

            <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
                {/* ── Section Header ── */}
                <div className="text-center mb-10 md:mb-14">
                    <p className="text-xs text-gold-muted tracking-[0.45em] uppercase mb-3 font-medium">
                        Handcrafted Heritage
                    </p>
                    <h2 className="text-3xl md:text-4xl uppercase font-medium lg:text-5xl font-heading leading-tight">
                        Karungali Collection
                    </h2>
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">

                    {/* ─── Left: Hero Infographic Card ── */}
                    <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-neutral-900 min-h-[440px] lg:min-h-0 lg:aspect-[3/4]">
                        {hasImages && (
                            <img
                                key={activeImageIdx}
                                src={introImages[activeImageIdx]}
                                alt={`Karungali ${activeImageIdx + 1}`}
                                width={1000}
                                height={1000}
                                sizes="(min-width: 1024px) 40vw, 100vw"
                                className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.6s_ease]"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5 pointer-events-none" />
                        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-10">
                            <h3 className="text-white font-heading text-xl md:text-2xl lg:text-4xl uppercase font-bold leading-snug mb-3 drop-shadow-lg">
                                {introTitle}
                            </h3>
                            <p className="text-white/80 text-xs leading-relaxed mb-6 max-w-md drop-shadow-md">
                                {introText}
                            </p>
                            <div className="flex items-center gap-3">
                                <Link
                                    to={viewMoreLink}
                                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-semibold hover:bg-neutral-100 hover:scale-[1.03] transition-all shadow-lg"
                                >
                                    Explore Collection
                                    <ChevronIcon className="w-3.5 h-3.5" />
                                </Link>
                                {introImages.length > 1 && (
                                    <div className="flex items-center gap-1.5 ml-auto">
                                        <button onClick={prevImg} className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition text-white">
                                            <ChevronIcon direction="left" className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={nextImg} className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition text-white">
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

                    {/* ─── Right: Tabs + Product Grid ── */}
                    <div className="lg:col-span-3 flex flex-col gap-5">

                        {/* Tab Pills */}
                        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/60">
                            {activeTabs.map((tab) => {
                                const isActive = activeTabId === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTabId(tab.id)}
                                        className={`relative flex-1 text-sm font-semibold py-3 px-4 rounded-xl transition-all duration-300 whitespace-nowrap ${isActive
                                            ? "bg-foreground text-background shadow-md"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Product Grid */}
                        {activeTab?.products && activeTab.products.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                                {activeTab.products.map((product) => (
                                    <KarungaliProductCard
                                        key={product.id}
                                        product={product}
                                        onQuickView={() => setQuickViewProduct(product)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-border/60 rounded-2xl p-10 text-center min-h-[220px]">
                                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h4 className="text-foreground font-semibold mb-1 text-sm">No Products Yet</h4>
                                <p className="text-muted-foreground text-xs max-w-xs">
                                    Add products to <strong>{activeTab?.label}</strong> in Shopify.
                                </p>
                            </div>
                        )}

                        {/* Mobile CTA */}
                        <div className="lg:hidden">
                            <Link
                                to={viewMoreLink}
                                className="group flex items-center justify-center gap-2.5 w-full rounded-full border border-foreground/12 bg-background/85 px-5 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/85 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.55)] transition-all duration-200 hover:border-foreground/20 hover:bg-muted/55 hover:text-foreground"
                            >
                                View All Karungali
                                <ChevronIcon className="w-3.5 h-3.5 text-foreground/55 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            {quickViewProduct && (
                <QuickViewModal
                    product={quickViewProduct as any}
                    onClose={() => setQuickViewProduct(null)}
                />
            )}

            <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }` }} />
        </section>
    );
}
