import { TRUST_BADGES } from '~/lib/constants';

/**
 * Trust & Promise section — 4 trust badges in a horizontal row.
 * Dark background for contrast against the hero section.
 */
export function TrustBadges() {
    return (
        <section className="bg-[#0A0A0A] py-16 md:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p
                        className="text-xs tracking-[0.3em] uppercase mb-3"
                        style={{ color: '#C5A355' }}
                    >
                        Why Choose Us
                    </p>
                    <h2
                        className="text-3xl md:text-4xl font-light text-white"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                        Our Promise
                    </h2>
                </div>

                {/* Badges Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {TRUST_BADGES.map((badge) => (
                        <div
                            key={badge.title}
                            className="text-center p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-[#C5A355]/30 transition-all duration-500"
                        >
                            <div className="text-4xl mb-4">{badge.icon}</div>
                            <h3 className="text-white text-sm md:text-base font-semibold tracking-wide uppercase mb-2">
                                {badge.title}
                            </h3>
                            <p className="text-neutral-400 text-xs md:text-sm leading-relaxed">
                                {badge.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* License / Certifications Strip */}
                <div className="mt-12 pt-8 border-t border-neutral-800 text-center">
                    <p className="text-neutral-500 text-xs tracking-widest uppercase mb-4">
                        Certified & Licensed
                    </p>
                    <div className="flex justify-center items-center gap-6 flex-wrap">
                        {['ISO Certified', 'Gem Lab', 'BIS Hallmark', 'Made in India'].map(
                            (cert) => (
                                <span
                                    key={cert}
                                    className="px-4 py-2 text-[11px] border border-neutral-700 rounded-full text-neutral-400 uppercase tracking-wider"
                                >
                                    {cert}
                                </span>
                            ),
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
