import { useState } from 'react';
import { TESTIMONIALS } from '~/lib/constants';

/**
 * Testimonial carousel with manual navigation.
 */
export function Testimonials() {
    const [current, setCurrent] = useState(0);

    function next() {
        setCurrent((c) => (c + 1) % TESTIMONIALS.length);
    }
    function prev() {
        setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
    }

    const t = TESTIMONIALS[current];

    return (
        <div className="flex flex-col h-full">
            <p
                className="text-xs tracking-[0.3em] uppercase mb-3"
                style={{ color: '#C5A355' }}
            >
                Testimonials
            </p>
            <h2
                className="text-2xl md:text-3xl font-light mb-8"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
                What Our Customers Say
            </h2>

            <div className="flex-1 flex flex-col justify-center">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <span
                            key={i}
                            className={`text-lg ${i < t.rating ? 'text-amber-400' : 'text-neutral-300'}`}
                        >
                            ★
                        </span>
                    ))}
                </div>

                {/* Review Text */}
                <p className="text-neutral-600 leading-relaxed mb-6 italic text-sm md:text-base">
                    &ldquo;{t.text}&rdquo;
                </p>

                {/* Reviewer */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-500">
                        {t.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-neutral-400">{t.location}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-6">
                <button
                    onClick={prev}
                    className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center hover:border-[#C5A355] hover:text-[#C5A355] transition cursor-pointer text-sm"
                    aria-label="Previous testimonial"
                >
                    ←
                </button>
                <span className="text-xs text-neutral-400">
                    {current + 1} / {TESTIMONIALS.length}
                </span>
                <button
                    onClick={next}
                    className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center hover:border-[#C5A355] hover:text-[#C5A355] transition cursor-pointer text-sm"
                    aria-label="Next testimonial"
                >
                    →
                </button>
            </div>
        </div>
    );
}
