import { useState } from "react";
import { Link } from "react-router";

export interface KarungaliProduct {
    id: string;
    handle: string;
    title: string;
    featuredImage?: { url: string; altText?: string } | null;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
}

export interface TabData {
    id: string;
    label: string;
    image?: { url: string; altText?: string } | null;
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

/* ── Chevron arrow icon ───────────────────────────────────────────── */
function ChevronIcon({ direction = "right", className = "" }: { direction?: "left" | "right"; className?: string }) {
    return (
        <svg
            className={`w-4 h-4 ${className}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
        </svg>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
export function KarungaliPromoter({
    tabs = DEFAULT_TABS,
    introTitle = "The Power of Authentic Karungali",
    introText = "Sourced directly from the dense forests of Tamil Nadu, our Karungali (Ebony) wood is 100% natural and unpolished. Known for its ability to absorb radiation and negative energy, wearing Karungali brings peace, prosperity, and spiritual grounding.",
    introImages = ["/karungali-bg.jpg"],
    viewMoreLink = "/collections/karungali",
}: KarungaliPromoterProps) {
    const activeTabs = tabs.length > 0 ? tabs : DEFAULT_TABS;
    const [activeTabId, setActiveTabId] = useState(activeTabs[0]?.id);
    const [activeImageIdx, setActiveImageIdx] = useState(0);

    const activeTab = activeTabs.find((t) => t.id === activeTabId) || activeTabs[0];

    const nextImg = () => setActiveImageIdx((i) => (i + 1) % introImages.length);
    const prevImg = () => setActiveImageIdx((i) => (i - 1 + introImages.length) % introImages.length);

    const hasImages = introImages && introImages.length > 0;

    return (
        <section className="relative py-16 md:py-24 bg-background overflow-hidden">
            {/* ── Subtle ambient glow ────────────────────────────────── */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/[0.04] dark:bg-amber-400/[0.03] blur-3xl pointer-events-none" />

            <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
                {/* ── Section Header ────────────────────────────────── */}
                <div className="text-center mb-10 md:mb-14">
                    <p className="text-xs text-gold-muted tracking-[0.45em] uppercase mb-3 font-medium">
                        Handcrafted Heritage
                    </p>
                    <h2 className="text-3xl md:text-4xl uppercase font-medium lg:text-5xl font-heading leading-tight">
                        Karungali Collection
                    </h2>
                </div>

                {/* ── Main Grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">

                    {/* ─── Left: Hero Infographic Card ──────────────── */}
                    <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-neutral-900 min-h-[440px] lg:min-h-0 lg:aspect-[3/4]">
                        {/* Carousel images */}
                        {hasImages && (
                            <img
                                key={activeImageIdx}
                                src={introImages[activeImageIdx]}
                                alt={`Karungali ${activeImageIdx + 1}`}
                                className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.6s_ease]"
                            />
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/5 pointer-events-none" />

                        {/* Text content */}
                        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-10">
                            <h3 className="text-white font-heading text-xl md:text-2xl lg:text-4xl uppercase font-medium leading-snug mb-3 drop-shadow-lg">
                                {introTitle}
                            </h3>
                            <p className="text-white/80 text-base leading-relaxed mb-6 max-w-md drop-shadow-md">
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

                                {/* Carousel nav */}
                                {introImages.length > 1 && (
                                    <div className="flex items-center gap-1.5 ml-auto">
                                        <button
                                            onClick={prevImg}
                                            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition text-white"
                                        >
                                            <ChevronIcon direction="left" className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={nextImg}
                                            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition text-white"
                                        >
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

                    {/* ─── Right: Tabs + Products ───────────────────── */}
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

                        {/* Product Scroll Strip */}
                        <div className="relative flex-1">
                            <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar snap-x snap-mandatory">
                                {activeTab?.products && activeTab.products.length > 0 ? (
                                    activeTab.products.map((product) => {
                                        const price = product.priceRange?.minVariantPrice;
                                        const formattedPrice = price
                                            ? `${price.currencyCode === "INR" ? "₹" : price.currencyCode} ${Number(price.amount).toLocaleString("en-IN")}`
                                            : "";

                                        return (
                                            <Link
                                                key={product.id}
                                                to={`/products/${product.handle}`}
                                                className="group flex-none w-[46%] sm:w-[42%] md:w-[31%] snap-start relative rounded-2xl overflow-hidden bg-neutral-900 aspect-square shadow-sm hover:shadow-xl transition-shadow duration-500"
                                            >
                                                {/* Product Image */}
                                                {product.featuredImage?.url ? (
                                                    <img
                                                        src={product.featuredImage.url}
                                                        alt={product.featuredImage.altText || product.title}
                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                        No Image
                                                    </div>
                                                )}

                                                {/* Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                                {/* Content */}
                                                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 z-10">
                                                    <h4 className="text-white text-xs sm:text-sm font-medium leading-snug line-clamp-1 mb-1 drop-shadow-md">
                                                        {product.title}
                                                    </h4>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-white/90 text-sm font-bold drop-shadow-md">
                                                            {formattedPrice}
                                                        </p>
                                                        <span className="w-6 h-6 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300 text-white">
                                                            <ChevronIcon className="w-2.5 h-2.5" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    /* Empty state */
                                    <div className="w-full flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-border/60 rounded-2xl p-10 text-center min-h-[220px]">
                                        <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <h4 className="text-foreground font-semibold mb-1 text-sm">No Products Yet</h4>
                                        <p className="text-muted-foreground text-xs max-w-xs">
                                            Add products to <strong>{activeTab.label}</strong> in Shopify.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Scroll fade hint on right edge */}
                            {activeTab?.products && activeTab.products.length > 2 && (
                                <div className="hidden sm:block absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
                            )}
                        </div>

                        {/* Mobile CTA */}
                        <div className="lg:hidden">
                            <Link
                                to={viewMoreLink}
                                className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3.5 rounded-full text-sm font-semibold hover:opacity-90 hover:scale-[1.02] transition-all w-full shadow-md"
                            >
                                View All Karungali
                                <ChevronIcon className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fade-in keyframe for image transitions */}
            <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }` }} />
        </section>
    );
}
