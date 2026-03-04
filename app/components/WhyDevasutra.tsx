
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";

export interface ReelItem {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    customerName: string;
    customerAvatar?: string;
    caption?: string;
    productHandle?: string | null;
    productTitle?: string | null;
    productImage?: string | null;
    productPrice?: string | null;
}

export interface TestimonialItem {
    id: string;
    name: string;
    location?: string;
    rating: number;
    text: string;
    avatar: string;
    productHandle?: string | null;
    productTitle?: string | null;
    productImage?: string | null;
    productPrice?: string | null;
}

interface WhyDevasutraProps {
    reels?: ReelItem[];
    testimonials?: TestimonialItem[];
}

/* -------------------------- Constants -------------------------- */
const STATS = [
    { value: "10,000+", label: "Happy Customers" },
    { value: "500+", label: "Products Blessed" },
    { value: "100%", label: "Lab Certified" },
    { value: "4★", label: "Avg Rating" },
];

const CERT_SLIDES = [
    { src: "", label: "Lab Certificate – Rudraksha 5 Mukhi", hint: "GIA / IGI verified origin & treatment report" },
    { src: "", label: "Certificate – Karungali Bracelet", hint: "Tamil Nadu sourced · zero chemical treatment" },
    { src: "", label: "Vedic Energisation Record", hint: "Pandit-signed ritual completion certificate" },
    { src: "", label: "Gemstone Authenticity Report", hint: "UV fluorescence & refractive index verified" },
];

const CERT_BADGES = [
    { label: "Material Origin", sub: "Nepal / Java / Tamil Nadu" },
    { label: "Treatment Status", sub: "Zero chemical treatments" },
    { label: "Bead Count & Grade", sub: "Mukhi count authenticated" },
    { label: "Vedic Energisation", sub: "Pandit-signed record" },
];

/* ---------------------- Product Popover ---------------------- */
function ProductSpotlight({
    productHandle,
    productTitle,
    productImage,
    productPrice,
    onClose,
}: {
    productHandle: string;
    productTitle: string;
    productImage?: string | null;
    productPrice?: string | null;
    onClose: () => void;
}) {
    return (
        <div className="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-36 sm:w-48 md:w-56 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-card">
            <div className="aspect-[3/2] sm:aspect-[4/3] bg-muted overflow-hidden">
                {productImage ? (
                    <img src={productImage} alt={productTitle} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-neutral-800 dark:to-neutral-700" />
                )}
            </div>
            <div className="p-2 sm:p-3 flex items-end justify-between gap-1">
                <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold line-clamp-1 text-left">{productTitle}</p>
                    {productPrice && <p className="text-sm sm:text-base font-bold text-foreground mt-0.5 text-left">{productPrice}</p>}
                </div>
                <Link
                    to={`/products/${productHandle}`}
                    prefetch="intent"
                    onClick={onClose}
                    className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-foreground text-background rounded-full hover:opacity-80 transition"
                >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}

/* ------------------------ Hotspot ------------------------ */
function Hotspot({
    productHandle,
    productTitle,
    productImage,
    productPrice,
    top = "40%",
    left = "55%",
}: {
    productHandle?: string | null;
    productTitle?: string | null;
    productImage?: string | null;
    productPrice?: string | null;
    top?: string;
    left?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent | TouchEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        document.addEventListener("touchstart", close);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("touchstart", close);
        };
    }, [open]);

    if (!productHandle || !productTitle) return null;

    return (
        <div ref={ref} className="absolute z-40" style={{ top, left, transform: "translate(-50%,-50%)" }}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative w-8 h-8 flex items-center justify-center focus:outline-none"
            >
                <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                <span className="absolute inset-[4px] rounded-full bg-white/60 backdrop-blur-[2px] border border-white/70" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-white" />
            </button>
            {open && (
                <div className="mt-2" onMouseLeave={() => setOpen(false)}>
                    <ProductSpotlight
                        productHandle={productHandle}
                        productTitle={productTitle}
                        productImage={productImage}
                        productPrice={productPrice}
                        onClose={() => setOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}

/* ---------------------- Customer Tag ---------------------- */
function CustomerTag({ name, avatar }: { name: string; avatar?: string }) {
    return (
        <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full pl-0.5 pr-2.5 py-0.5">
            {avatar ? (
                <img src={avatar} alt={name} className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20" />
            ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center" />
            )}
            <span className="text-[10px] text-white font-medium truncate">{name}</span>
        </div>
    );
}

function ReelTile({ reel }: { reel: ReelItem }) {
    return (
        <div className="relative rounded-2xl h-full min-h-[200px] sm:min-h-[260px] shadow-lg group">
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                {reel.videoUrl ? (
                    <video
                        src={reel.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-200 dark:from-neutral-800 dark:to-neutral-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            </div>
            <div className="absolute bottom-2 left-2 z-40 pointer-events-none">
                <CustomerTag name={reel.customerName} avatar={reel.customerAvatar} />
                {reel.caption && <p className="text-[10px] text-white/70 italic mt-1 pointer-events-auto">{reel.caption}</p>}
            </div>
            <Hotspot
                productHandle={reel.productHandle}
                productTitle={reel.productTitle}
                productImage={reel.productImage}
                productPrice={reel.productPrice}
            />
        </div>
    );
}

/* ---------------------- Testimonial Tile ---------------------- */
function ImageTile({ testimonial }: { testimonial: TestimonialItem }) {
    return (
        <div className="relative rounded-2xl h-full min-h-[180px] sm:min-h-[120px] shadow-lg group">
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 pointer-events-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
            </div>
            <div className="absolute bottom-2 left-2 z-40 pointer-events-none">
                <CustomerTag name={testimonial.name} />
                <p className="text-[10px] text-white/70 italic mt-1 line-clamp-1 pointer-events-auto">"{testimonial.text}"</p>
            </div>
            <Hotspot
                productHandle={testimonial.productHandle}
                productTitle={testimonial.productTitle}
                productImage={testimonial.productImage}
                productPrice={testimonial.productPrice}
            />
        </div>
    );
}

/* ---------------------- Social Proof Grid ---------------------- */
function SocialProofMosaic({
    reels = [],
    testimonials = [],
}: {
    reels: ReelItem[];
    testimonials: TestimonialItem[];
}) {
    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Mobile: stack vertically; sm+: 2-col mosaic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-2 gap-3 flex-1">
                <div className="sm:row-span-2">
                    {reels[0] && <ReelTile reel={reels[0]} />}
                </div>
                <div>{testimonials[0] && <ImageTile testimonial={testimonials[0]} />}</div>
                <div>{testimonials[1] && <ImageTile testimonial={testimonials[1]} />}</div>
            </div>

            {/* See All Reviews link card */}
            <Link
                to="/pages/about"
                prefetch="intent"
                className="group relative flex items-center justify-between rounded-2xl border border-border bg-card px-4 sm:px-5 py-3 sm:py-4 shadow-sm transition-all hover:shadow-md hover:border-foreground/20 overflow-hidden"
            >
                {/* Decorative gradient */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* stacked avatars */}
                    <div className="flex -space-x-2 flex-shrink-0">
                        {testimonials.slice(0, 3).map((t, i) => (
                            <div
                                key={t.id}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-card overflow-hidden bg-muted"
                                style={{ zIndex: 3 - i }}
                            >
                                {t.avatar ? (
                                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 dark:from-neutral-700 dark:to-neutral-600" />
                                )}
                            </div>
                        ))}
                        {reels.slice(0, 1).map((r) => (
                            <div
                                key={r.id}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-card overflow-hidden bg-muted"
                                style={{ zIndex: 0 }}
                            >
                                {r.customerAvatar ? (
                                    <img src={r.customerAvatar} alt={r.customerName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 dark:from-neutral-700 dark:to-neutral-600" />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Discover Our Story</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Learn what makes Devasutra different</p>
                    </div>
                </div>

                <span className="relative z-10 text-muted-foreground group-hover:text-foreground transition-colors text-lg">
                    →
                </span>
            </Link>
        </div>
    );
}

/* ---------------------- Certificate Carousel ---------------------- */
function CertCarousel() {
    const [active, setActive] = useState(0);
    const next = () => setActive((a) => (a + 1) % CERT_SLIDES.length);
    const prev = () => setActive((a) => (a - 1 + CERT_SLIDES.length) % CERT_SLIDES.length);
    const slide = CERT_SLIDES[active];

    return (
        <div className="flex flex-col gap-3">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center">
                {slide.src ? (
                    <img src={slide.src} alt={slide.label} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center text-muted-foreground/60 text-xs">{slide.label}</div>
                )}
                <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-background/80 border border-border rounded-full flex items-center justify-center hover:bg-background"
                >
                    ←
                </button>
                <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-background/80 border border-border rounded-full flex items-center justify-center hover:bg-background"
                >
                    →
                </button>
                <div className="absolute bottom-2 right-2 bg-background/80 border border-border rounded-full px-2 py-0.5 text-[10px] text-muted-foreground">
                    {active + 1}/{CERT_SLIDES.length}
                </div>
            </div>
            <div>
                <p className="text-[11px] font-semibold text-foreground">{slide.label}</p>
                <p className="text-[10px] text-muted-foreground">{slide.hint}</p>
            </div>
        </div>
    );
}

/* ---------------------- Main Section ---------------------- */
export function WhyDevasutra({ reels = [], testimonials = [] }: WhyDevasutraProps) {
    return (
        <section className="bg-muted/30 dark:bg-muted/10 py-12 sm:py-20 lg:py-28">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-3 font-medium">
                        Our Difference
                    </p>
                    <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                        Why Devasutra Stands Apart
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        The only brand combining{" "}
                        <span className="text-foreground font-medium">lab-certified authenticity</span>,{" "}
                        <span className="text-foreground font-medium">Vedic energisation</span>, and{" "}
                        <span className="text-foreground font-medium">ethical sourcing</span> — with proof you can hold.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    {/* Certificates */}
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-5">
                        <div>
                            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-0.5">
                                Certificates of Authenticity
                            </p>
                            <p className="text-[11px] text-muted-foreground">Swipe through our verification documents</p>
                        </div>
                        <CertCarousel />
                        <div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-2">
                                What's Verified
                            </p>
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                                {CERT_BADGES.map((b) => (
                                    <div
                                        key={b.label}
                                        className="flex items-start gap-2 bg-muted/40 rounded-lg px-2.5 sm:px-3 py-2 border border-border/50"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <svg
                                                className="w-2.5 h-2.5 text-foreground"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={3}
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold text-foreground leading-tight">{b.label}</p>
                                            <p className="text-[10px] text-muted-foreground leading-tight">{b.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="md:col-span-2 h-full">
                        <SocialProofMosaic reels={reels} testimonials={testimonials} />
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-12 bg-card border border-border rounded-2xl px-4 sm:px-6 py-5 sm:py-6 shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {STATS.map((s) => (
                            <div key={s.label} className="text-center py-2 sm:py-0 sm:border-r border-border sm:last:border-0 relative">
                                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
                                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 tracking-wide">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

