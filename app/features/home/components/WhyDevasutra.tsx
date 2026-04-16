import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import type { SocialReel } from "./SocialFeed";

export interface ReelItem {
    id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    customerName: string; // Map from influencerName
    customerAvatar?: string;
    caption?: string;
    productHandle?: string | null;
    productTitle?: string | null;
    productImage?: string | null;
    productPrice?: string | null;
    initiallyOpen?: boolean;
    isVerified?: boolean;
    // New fields
    influencerName?: string;
    creatorHandle?: string;
    products?: {
        id: string;
        handle: string;
        title: string;
        image: string;
        price: string | null;
    }[];
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
    { value: "50+", label: "Happy Customers" },
    { value: "100+", label: "Products Blessed" },
    { value: "100%", label: "Lab Certified" },
    { value: "4★", label: "Avg Rating" },
];

const CERT_SLIDES = [
    { src: "/certificate-card.jpg", label: "Lab Certificate – Rudraksha 5 Mukhi", hint: "GIA / IGI verified origin & treatment report" },
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
        <Link
            to={`/products/${productHandle}`}
            prefetch="intent"
            onClick={onClose}
            className="group/card absolute z-50 bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-44 sm:w-56 rounded-2xl overflow-hidden bg-card ring-1 ring-border/50 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer no-underline"
        >
            {/* Image area */}
            <div className="relative aspect-square bg-muted overflow-hidden m-2 rounded-xl">
                {productImage ? (
                    <img
                        src={productImage}
                        alt={productTitle}
                        width={400}
                        height={400}
                        sizes="(min-width: 640px) 224px, 176px"
                        className="w-full h-full object-cover rounded-xl transition-transform duration-500 ease-out group-hover/card:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-linear-to-br from-amber-50 via-lime-50 to-lime-100 dark:from-neutral-800 dark:via-neutral-750 dark:to-neutral-700" />
                )}
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-linear-to-t from-background/30 to-transparent pointer-events-none" />
            </div>

            {/* Info strip */}
            <div className="relative px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-medium text-foreground line-clamp-1 leading-snug">{productTitle}</p>
                    {productPrice && (
                        <p className="text-lg sm:text-xl font-medium text-foreground mt-0.5 leading-none">{productPrice}</p>
                    )}
                </div>
                <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-foreground text-background rotate-[-35deg] transition-transform duration-300 ease-out">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </div>
            </div>
        </Link>
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
    initiallyOpen = false,
}: {
    productHandle?: string | null;
    productTitle?: string | null;
    productImage?: string | null;
    productPrice?: string | null;
    top?: string;
    left?: string;
    initiallyOpen?: boolean;
}) {
    const [open, setOpen] = useState(initiallyOpen);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setOpen(initiallyOpen);
    }, [initiallyOpen]);

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
                <span className="absolute inset-1 rounded-full bg-white/60 backdrop-blur-[2px] border border-white/70" />
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
                <img src={avatar} alt={name} width={20} height={20} sizes="20px" className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20" />
            ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center" />
            )}
            <span className="text-[10px] text-white font-medium truncate">{name}</span>
        </div>
    );
}

/* ---------------------- Reel Tile ---------------------- */
function ReelTile({ reel, className = "" }: { reel: ReelItem; className?: string }) {
    return (
        <div className={`relative rounded-2xl h-full group ${className}`}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                {reel.videoUrl ? (
                    <video
                        src={reel.videoUrl}
                        crossOrigin="anonymous"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-amber-100 to-lime-200 dark:from-neutral-800 dark:to-neutral-700" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10" />

                {/* Verified Badge */}
                {reel.isVerified && (
                    <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-0.5 shadow-lg">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider">Verified</span>
                    </div>
                )}
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
                initiallyOpen={reel.initiallyOpen}
            />
        </div>
    );
}

/* ---------------------- Image Tile (Testimonial) ---------------------- */
function ImageTile({ testimonial, className = "" }: { testimonial: TestimonialItem; className?: string }) {
    return (
        <div className={`relative rounded-2xl h-full min-h-45 sm:min-h-60 group ${className}`}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={800}
                    height={800}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500 pointer-events-auto"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent z-10" />
            </div>
            <div className="absolute bottom-3 left-3 right-3 z-40 pointer-events-none">
                <CustomerTag name={testimonial.name} />
                {testimonial.text && (
                    <div className="mt-1.5 flex items-start gap-1.5">
                        {/* Quotation icon */}
                        <svg
                            className="w-3 h-3 text-amber-300/80 shrink-0 mt-0.5"
                            fill="currentColor"
                            viewBox="0 0 32 32"
                            aria-hidden="true"
                        >
                            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                        </svg>
                        <p className="text-[10px] text-white/85 italic line-clamp-2 pointer-events-auto leading-snug">
                            {testimonial.text}
                        </p>
                    </div>
                )}
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

/*
 * ── Mobile stacked cards — 3:4 aspect, 80/20 overlap ──
 *
 * How it works (pure CSS sticky):
 *  • All cards are SIBLINGS in ONE flat container — no per-card wrappers.
 *    Per-card wrappers break sticky because the containing-block exits the
 *    viewport before the next card arrives, causing each card to un-stick
 *    immediately.
 *
 *  • Each card is `position: sticky` with `top` increasing by PEEK_PX per
 *    card. PEEK_PX ≈ 20 % of the card height (3:4 card at ~94 vw ≈ 450 px
 *    tall on a 390 px wide phone → 20 % ≈ 90 px).
 *
 *  • Cards 2 + get a `marginTop` of `calc(100svh - 125vw)` which places
 *    each card's natural starting position one full viewport height below
 *    the previous card's start.  This keeps every card invisible (below
 *    the fold) until the user scrolls to it, then it glides up and sticks
 *    — revealing the 20 % peek strip of the card above.
 */
type StackItem =
    | { type: "reel"; id: string; data: ReelItem }
    | { type: "image"; id: string; data: TestimonialItem };

function MobileStackedSection({
    reels,
    testimonials,
}: {
    reels: ReelItem[];
    testimonials: TestimonialItem[];
}) {
    const items: StackItem[] = [
        ...reels.slice(0, 2).map((r) => ({ type: "reel" as const, id: r.id, data: r })),
        ...testimonials.slice(0, 3).map((t) => ({ type: "image" as const, id: t.id, data: t })),
    ];

    /*
     * PEEK_PX  — how many px of the card above remain visible once the next
     *            card stacks on top.  ~90 px ≈ 20 % of a 450 px tall card.
     *
     * HEADER_PX — offset from viewport top for card 1 (clears the mobile
     *             navbar).  Subsequent cards add PEEK_PX per layer.
     *
     * marginTop formula — `calc(100svh - 125vw)`:
     *   • 125vw  ≈  card height for a 3:4 card at full mobile width
     *              (card_width ≈ 94 vw → height ≈ 94 vw × 4/3 ≈ 125 vw)
     *   • 100svh - 125vw  = the gap needed so the card starts exactly one
     *     viewport height below the previous card, entering from off-screen.
     */
    const HEADER_PX = 64;
    const PEEK_PX   = 24;

    return (
        /* Single flat container — all sticky siblings share this as their
           containing block, so none of them un-sticks prematurely.        */
        <div>
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className="sticky w-full"
                    style={{
                        top: `${HEADER_PX + index * PEEK_PX}px`,
                        zIndex: index + 1,
                        marginTop: index === 0 ? 0 : "32px",
                    }}
                >
                    {/* 1:1 aspect-ratio shell */}
                    <div
                        className="relative w-full rounded-2xl"
                        style={{
                            aspectRatio: "1/1",
                        }}
                    >
                        <div className="absolute inset-0">
                            {item.type === "reel" ? (
                                <ReelTile
                                    reel={{ ...item.data, initiallyOpen: index === 0 }}
                                    className="rounded-2xl"
                                />
                            ) : (
                                <ImageTile
                                    testimonial={item.data}
                                    className="rounded-2xl"
                                />
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ---------------------- Social Proof Mosaic ---------------------- */
function SocialProofMosaic({
    reels = [],
    testimonials = [],
}: {
    reels: ReelItem[];
    testimonials: TestimonialItem[];
}) {
    const seeAllLink = (
        <Link
            to="/pages/about"
            prefetch="intent"
            className="group relative flex items-center justify-between rounded-2xl border px-4 sm:px-5 py-3 sm:py-4 transition-all hover:border-foreground/20 overflow-hidden"
        >
            {/* Decorative gradient */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-amber-500/5 via-transparent to-lime-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex items-center gap-2 sm:gap-3 min-w-0">
                {/* stacked avatars */}
                <div className="flex -space-x-2 shrink-0">
                    {testimonials.slice(0, 3).map((t, i) => (
                        <div
                            key={t.id}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-card overflow-hidden bg-muted"
                            style={{ zIndex: 3 - i }}
                        >
                            {t.avatar ? (
                                <img src={t.avatar} alt={t.name} width={80} height={80} sizes="(min-width: 640px) 32px, 28px" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br dark:to-neutral-600" />
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
                                <img src={r.customerAvatar} alt={r.customerName} width={80} height={80} sizes="(min-width: 640px) 32px, 28px" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-amber-100 to-lime-200 dark:from-neutral-700 dark:to-neutral-600" />
                            )}
                        </div>
                    ))}
                </div>
                <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Discover Our Story</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">Learn what makes Devasutra different</p>
                </div>
            </div>

            <span className="relative z-10 text-muted-foreground group-hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </span>
        </Link>
    );

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* ── Mobile: stacked sticky cards (< sm) ── */}
            <div className="sm:hidden flex flex-col gap-3">
                <MobileStackedSection reels={reels} testimonials={testimonials} />
                {seeAllLink}
            </div>

            {/* ── Desktop: 2-col mosaic (sm+) ── */}
            <div className="hidden sm:grid sm:grid-cols-2 sm:grid-rows-2 gap-3 flex-1">
                <div className="sm:row-span-2">
                    {reels[0] && <ReelTile reel={{ ...reels[0], initiallyOpen: true }} />}
                </div>
                <div>{testimonials[0] && <ImageTile testimonial={testimonials[0]} />}</div>
                <div>{testimonials[1] && <ImageTile testimonial={testimonials[1]} />}</div>
            </div>

            {/* See All — desktop only row */}
            <div className="hidden sm:block">{seeAllLink}</div>
        </div>
    );
}

/* ---------------------- Certificate Showcase ---------------------- */
function CertShowcase() {
    return (
        <div className="flex flex-col gap-3">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-muted border border-border">
                <img
                    src="/certificate-card3.png"
                    alt="Lab Certificate – Rudraksha 5 Mukhi"
                    width={800}
                    height={600}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="cert-kenburns-anim w-full h-full object-cover"
                />
                {/* Subtle vignette overlay */}
                <div className="absolute inset-0 pointer-events-none rounded-xl shadow-[inset_0_0_40px_rgba(0,0,0,0.15)]" />
            </div>
            <div>
                <p className="text-[11px] font-semibold text-foreground">Lab Certificate – Rudraksha 5 Mukhi</p>
                <p className="text-[10px] text-muted-foreground">GIA / IGI verified origin & treatment report</p>
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
                    <p className="text-xs tracking-[0.4em] uppercase text-gold-muted mb-3 font-medium">
                        Our Difference
                    </p>
                    <h2 className="text-2xl font-heading sm:text-3xl md:text-5xl font-medium uppercase text-foreground mb-4 leading-tight">
                        Why Devasutra Stands Apart
                    </h2>
                    <p className=" text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                        The only brand combining{" "}
                        <span className="text-foreground font-medium">lab-certified authenticity</span>,{" "}
                        <span className="text-foreground font-medium">Vedic energisation</span>, and{" "}
                        <span className="text-foreground font-medium">ethical sourcing</span> — with proof you can hold.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-6 items-start xl:grid-cols-3">
                    {/* Certificates */}
                    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                        <div className="flex flex-col gap-5">
                            <div>
                                <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-0.5">
                                        Certificates of Authenticity
                                </p>
                                <p className="text-[11px] text-muted-foreground">Swipe through our verification documents</p>
                            </div>

                            <div className="grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] xl:grid-cols-1">
                                <div className="min-w-0">
                                    <CertShowcase />
                                </div>
                                {/* CTA - Talk to Us */}
                                <div className="rounded-xl bg-muted/40 border border-border/50 p-4 flex flex-col gap-6">
                                    <div>
                                        <p className="text-sm lg:text-xl font-semibold text-foreground">Have questions about authenticity?</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">Our experts are just a call away - we will walk you through every certificate.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row md:flex-col gap-3">
                                        <a
                                            href="tel:+919876543210"
                                            className="group inline-flex flex-1 items-center justify-center gap-2.5 bg-foreground text-background rounded-full px-6 py-3.5 text-sm font-semibold shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                                        >
                                            <svg className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                            </svg>
                                            Call Us Now
                                        </a>
                                        <a
                                            href="https://wa.me/919876543210?text=Hi%2C%20I%20have%20a%20question%20about%20product%20authenticity"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group inline-flex flex-1 items-center justify-center gap-2.5 bg-[#25D366] text-white rounded-full px-6 py-3.5 text-sm font-semibold shadow-md hover:scale-[1.03] hover:bg-[#1ebe5d] active:scale-[0.98] transition-all duration-200"
                                        >
                                            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                            </svg>
                                            WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="xl:col-span-2 h-full">
                        <SocialProofMosaic reels={reels} testimonials={testimonials} />
                    </div>
                </div>

                {/* Stats */}
<div
  className="
  mt-12
  relative
  bg-black
  border border-border
  xl:rounded-2xl
  -mx-4 sm:mx-0
  px-0 sm:px-6
  py-5 sm:py-6
  overflow-hidden
"
>
  {/* Decorative blurred blobs */}
  <div className="pointer-events-none absolute -top-16 -left-10 w-40 h-40 bg-white/40 blur-3xl rounded-full" />
  <div className="pointer-events-none absolute top-10 -right-10 w-52 h-52 bg-white/40 blur-3xl rounded-full" />
  <div className="pointer-events-none absolute -bottom-12 left-1/3 w-44 h-44 bg-white/20 blur-3xl rounded-full" />

  {/* Content wrapper to counter tilt */}
  <div>
    {/* On small screens: horizontal auto-scroll with tilt; on sm+: grid as before */}
    <div className="relative">

      {/* Mobile: Animated horizontal scroll */}
      <div className="block sm:hidden -mx-4 overflow-x-hidden">

        <div
          className="flex gap-3 px-4 whitespace-nowrap stats-autoscroll"
          style={{ width: "max-content" }}
        >
          {STATS.concat(STATS).map((s, i) => (
            <div
              key={s.label + i}
              className="min-w-36 text-center py-2 relative mx-1"
            >
              <p className="text-xl font-bold text-white tabular-nums">
                {s.value}
              </p>

              <p className="text-[10px] text-white mt-0.5 tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Original grid */}
      <div className="hidden sm:grid grid-cols-4 gap-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="text-center py-0 border-r border-border last:border-0 relative"
          >
            <p className="text-2xl md:text-3xl font-bold text-white tabular-nums">
              {s.value}
            </p>

            <p className="text-[11px] text-white mt-0.5 tracking-wide">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

            </div>
        </section>
    );
}
