import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
    return [{ title: 'About Us | Devasutra' }];
};

export default function About() {
    return (
        <div className="bg-stone-50 min-h-screen text-stone-900 overflow-hidden">

            {/* Hero Section */}
            <section className="relative py-24 sm:py-32 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-200/50 via-stone-50 to-stone-50 -z-10" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-stone-300 to-transparent" />

                <span className="text-xs font-bold tracking-[0.3em] text-stone-500 uppercase mb-6">Our Journey</span>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide text-stone-900 mb-8" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    Crafting the Divine
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-stone-600 leading-relaxed">
                    At Devasutra, we believe that spirituality is not just a practice, but a deeply personal aesthetic. We aim to create sacred artifacts and devotional ornaments that bridge the physical world with the eternal.
                </p>

                {/* Decorative Divider */}
                <div className="mt-16 sm:mt-24 flex items-center justify-center gap-4 w-full max-w-xs opacity-60">
                    <div className="h-[1px] w-full bg-stone-300"></div>
                    <svg className="w-6 h-6 text-stone-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.4 9.6H22L15.8 14.4L18.2 22L12 17.2L5.8 22L8.2 14.4L2 9.6H9.6L12 2Z" /></svg>
                    <div className="h-[1px] w-full bg-stone-300"></div>
                </div>
            </section>

            {/* Main Philosophy Section */}
            <section className="max-w-7xl mx-auto px-6 pb-24 sm:pb-32">
                <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">

                    <div className="order-2 md:order-1 flex flex-col gap-8">
                        <div>
                            <h2 className="text-3xl font-light mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>The Essence of Purity</h2>
                            <div className="w-12 h-[1px] bg-stone-900 mb-6"></div>
                            <p className="text-stone-600 leading-relaxed mb-4">
                                Born out of a profound reverence for ancient Vedic traditions, Devasutra was established to bring authentic, consecrated, and spiritually charged items to the modern seeker. Similar to the profound healing found in authentic Karungali and Rudraksha gems, our mission is to offer tools that resonate with deep cosmic energy.
                            </p>
                            <p className="text-stone-600 leading-relaxed">
                                Whether you are beginning your spiritual awakening or are well on your path, our ornaments serve as companions. Every bead, metal, and thread is curated with strict adherence to Agamic principles—ensuring that what you wear is not merely jewelry, but a shield, a blessing, and a focal point for your devotion.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div className="p-6 border border-stone-200/60 rounded-2xl bg-white shadow-sm">
                                <h3 className="text-xl font-serif text-stone-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>100% Authentic</h3>
                                <p className="text-sm text-stone-500">Ethically sourced and traditionally appraised materials.</p>
                            </div>
                            <div className="p-6 border border-stone-200/60 rounded-2xl bg-white shadow-sm">
                                <h3 className="text-xl font-serif text-stone-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Consecrated</h3>
                                <p className="text-sm text-stone-500">Energized by expert practitioners before reaching you.</p>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Image / Brand Representation */}
                    <div className="order-1 md:order-2 w-full h-[500px] bg-stone-200 rounded-3xl overflow-hidden relative border border-stone-100 shadow-md">
                        <div className="absolute inset-0 bg-gradient-to-tr from-stone-300/40 to-transparent z-10"></div>
                        {/* Placeholder for a beautiful brand image. Using a crisp monochromatic texture. */}
                        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-80 mix-blend-multiply"></div>

                        <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-white/40 shadow-xl z-20">
                            <p className="text-sm font-bold tracking-widest text-stone-900 uppercase mb-2">Our Promise</p>
                            <p className="text-stone-700 italic font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                "To bridge the sanctuary of the temple with the sanctuary of the self."
                            </p>
                        </div>
                    </div>

                </div>
            </section>

            {/* Craftsmanship Banner */}
            <section className="bg-stone-900 text-stone-50 py-24 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <svg className="w-12 h-12 text-amber-500/80 mx-auto mb-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h2 className="text-3xl sm:text-4xl font-light mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Crafted with Intention</h2>
                    <p className="text-stone-400 leading-relaxed text-lg">
                        Our artisans are generational experts who understand that working with sacred elements requires purity of mind and environment. From the exact cut of the Karungali wood to the careful stringing of the Rudraksha, every piece is born from a state of meditation.
                    </p>
                </div>
            </section>

        </div>
    );
}
