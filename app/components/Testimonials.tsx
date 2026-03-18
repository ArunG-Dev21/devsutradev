import { useState } from 'react';
import { TESTIMONIALS } from '~/lib/constants';

export interface TestimonialItem {
    name: string;
    location: string;
    rating: number;
    text: string;
    avatar?: string;
}

interface TestimonialsProps {
    items?: TestimonialItem[];
}

/**
 * Testimonial carousel — monochrome black / white / silver aesthetic.
 */
export function Testimonials({ items }: TestimonialsProps) {
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(false);

    const testimonials: TestimonialItem[] =
        items && items.length > 0 ? items : TESTIMONIALS;

    function navigate(dir: 'next' | 'prev') {
        if (animating) return;
        setAnimating(true);
        setTimeout(() => {
            setCurrent((c) =>
                dir === 'next'
                    ? (c + 1) % testimonials.length
                    : (c - 1 + testimonials.length) % testimonials.length
            );
            setAnimating(false);
        }, 250);
    }

    if (testimonials.length === 0) return null;

    const t = testimonials[current];

    return (
        <div className="relative flex flex-col min-h-[420px] bg-black text-white p-10 rounded-2xl border border-neutral-800 overflow-hidden">

            {/* Soft silver glow */}
            <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_70%)]" />

            {/* Decorative oversized quote mark */}
            <span className="pointer-events-none select-none absolute top-14 left-8 font-serif text-[9rem] leading-none text-white/10 italic">
                &ldquo;
            </span>

            {/* Eyebrow */}
            <div className="relative z-10 flex items-center gap-3 mb-8">
                <div className="h-px w-8 bg-neutral-600" />
                <span className="text-[0.65rem] tracking-[0.35em] uppercase text-neutral-400 font-medium">
                    What our clients say
                </span>
            </div>

            {/* Body */}
            <div className="relative z-10 flex-1 flex flex-col">

                {/* Stars */}
                <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <span
                            key={i}
                            className={`text-sm ${i < t.rating ? 'text-white' : 'text-neutral-700'}`}
                        >
                            ★
                        </span>
                    ))}
                </div>

                {/* Quote text */}
                <div
                    className={`flex-1 transition-all duration-[250ms] ease-in-out ${
                        animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
                    }`}
                >
                    <p className="font-serif text-lg md:text-xl italic leading-relaxed text-neutral-300 mb-6">
                        &ldquo;{t.text}&rdquo;
                    </p>
                </div>

                {/* Divider */}
                <div className="w-10 h-px bg-neutral-800 mb-5" />

                {/* Author */}
                <div
                    className={`flex items-center gap-3 transition-opacity duration-[250ms] ${
                        animating ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                    {t.avatar ? (
                        <img
                            src={t.avatar}
                            alt={t.name}
                            width={44}
                            height={44}
                            sizes="44px"
                            className="w-11 h-11 rounded-full object-cover border border-neutral-700 flex-shrink-0"
                        />
                    ) : (
                        <div className="w-11 h-11 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                            {t.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-medium tracking-wide text-white">
                            {t.name}
                        </p>
                        {t.location && (
                            <p className="text-xs text-neutral-500 mt-0.5 tracking-wide">
                                {t.location}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between mt-8 pt-5 border-t border-neutral-800">

                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                    {testimonials.map((_, i) => (
                        <div
                            key={i}
                            className={`h-0.5 rounded-full transition-all duration-300 ${
                                i === current
                                    ? 'w-7 bg-white'
                                    : 'w-4 bg-neutral-700'
                            }`}
                        />
                    ))}
                </div>

                {/* Counter + Nav buttons */}
                <div className="flex items-center gap-4">
                    <span className="text-xs tabular-nums text-neutral-500 tracking-widest">
                        <span className="text-white">
                            {String(current + 1).padStart(2, '0')}
                        </span>
                        {' / '}
                        {String(testimonials.length).padStart(2, '0')}
                    </span>

                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('prev')}
                            disabled={animating}
                            aria-label="Previous testimonial"
                            className="w-9 h-9 rounded-full border border-neutral-700 bg-transparent flex items-center justify-center text-neutral-400 transition-all duration-200 hover:border-white hover:bg-neutral-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>

                        <button
                            onClick={() => navigate('next')}
                            disabled={animating}
                            aria-label="Next testimonial"
                            className="w-9 h-9 rounded-full border border-neutral-700 bg-transparent flex items-center justify-center text-neutral-400 transition-all duration-200 hover:border-white hover:bg-neutral-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
