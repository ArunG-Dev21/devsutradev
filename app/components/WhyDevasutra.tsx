
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
    initiallyOpen?: boolean;
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
            className="group/card absolute z-50 bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-44 sm:w-56 rounded-2xl overflow-hidden bg-card ring-1 ring-border/50 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_-8px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer no-underline"
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
                    <div className="w-full h-full bg-linear-to-br from-amber-50 via-orange-50 to-orange-100 dark:from-neutral-800 dark:via-neutral-750 dark:to-neutral-700" />
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

    // Sync state if initiallyOpen changes (e.g., from parent)
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

function ReelTile({ reel }: { reel: ReelItem }) {
    return (
        <div className="relative rounded-2xl h-full min-h-50 sm:min-h-65 shadow-lg group">
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
                    <div className="absolute inset-0 bg-linear-to-br from-amber-100 to-orange-200 dark:from-neutral-800 dark:to-neutral-700" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10" />
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

/* ---------------------- Testimonial Tile ---------------------- */
function ImageTile({ testimonial }: { testimonial: TestimonialItem }) {
    return (
        <div className="relative rounded-2xl h-full min-h-45 sm:min-h-60 shadow-lg group">
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
            <div className="absolute bottom-2 left-2 z-40 pointer-events-none">
                <CustomerTag name={testimonial.name} />
                <p className="text-[10px] text-white/70 italic mt-1 line-clamp-1 pointer-events-auto">{testimonial.text}</p>
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
                    {reels[0] && <ReelTile reel={{ ...reels[0], initiallyOpen: true }} />}
                </div>
                <div>{testimonials[0] && <ImageTile testimonial={testimonials[0]} />}</div>
                <div>{testimonials[1] && <ImageTile testimonial={testimonials[1]} />}</div>
            </div>

            {/* See All Reviews link card */}
            <Link
                to="/pages/about"
                prefetch="intent"
                className="group relative flex items-center justify-between rounded-2xl border px-4 sm:px-5 py-3 sm:py-4 shadow-sm transition-all hover:shadow-md hover:border-foreground/20 overflow-hidden"
            >
                {/* Decorative gradient */}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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
                                    <div className="w-full h-full bg-linear-to-br from-amber-100 to-orange-200 dark:from-neutral-700 dark:to-neutral-600" />
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
        </div>
    );
}

/* ---------------------- Certificate Showcase ---------------------- */
function CertShowcase() {
    return (
        <div className="flex flex-col gap-3">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-muted border border-border">
                <style>{`
                    @keyframes cert-kenburns {
                        0% {
                            transform: scale(1.4) translateX(15%);
                        }
                        50% {
                            transform: scale(1.4) translateX(-15%);
                        }
                        100% {
                            transform: scale(1.4) translateX(15%);
                        }
                    }
                    .cert-kenburns-anim {
                        animation: cert-kenburns 8s linear infinite;
                        will-change: transform;
                        transform-origin: center center;
                    }
                `}</style>
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
                    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
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
                                            className="group inline-flex flex-1 items-center justify-center gap-2.5 bg-foreground text-background rounded-full px-6 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
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
                                            className="group inline-flex flex-1 items-center justify-center gap-2.5 bg-[#25D366] text-white rounded-full px-6 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.03] hover:bg-[#1ebe5d] active:scale-[0.98] transition-all duration-200"
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
  shadow-sm
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

        <style>{`
          @keyframes stats-autoscroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .stats-autoscroll {
            animation: stats-autoscroll 16s linear infinite;
            will-change: transform;
          }
        `}</style>

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

