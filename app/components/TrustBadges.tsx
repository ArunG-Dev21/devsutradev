import React from 'react';

export function TrustBadges() {
  return (
    <div className="w-full">
      {/* Trust Badges */}
      <section className="bg-black py-8 lg:py-5 border-t border-gold-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 scroll-reveal">
            {[
              {
                title: 'Secure Checkout',
                desc: 'SSL encrypted payment',
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
              },
              {
                title: 'Free Returns',
                desc: '30-day hassle-free returns',
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                ),
              },
              {
                title: 'Fast Shipping',
                desc: 'Delivered in 5-7 business days',
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
              },
              {
                title: 'Lab Certified',
                desc: 'Gemological authenticity report',
                icon: (
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                  </svg>
                ),
              },
            ].map((badge, idx) => (
              <div
                key={badge.title}
                className="group flex flex-row items-center justify-start gap-4 p-5 sm:p-5 lg:p-6 bg-transparent border border-white/20 rounded-2xl transition-colors duration-300"
              >
                <div className="group-hover:scale-105 transition-transform duration-300">
                  {badge.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-[15px] font-medium text-white/95 tracking-wide leading-tight mb-1 truncate">
                    {badge.title}
                  </p>
                  <p className="text-[11px] md:text-xs text-stone-100 leading-snug truncate">
                    {badge.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / About Section */}
      <section id="about" className="dark:bg-black bg-stone-50 py-20 lg:py-28">
        <div className="mx-auto container px-6 text-center scroll-reveal">
          <span className="text-gold-muted text-xs font-medium tracking-[0.25em] uppercase">
            Our Promise
          </span>
          <h2 className="text-3xl lg:text-5xl font-heading uppercase font-medium text-foreground mt-3 mb-6">
            Crafted with Intention
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl lg:max-w-3xl mx-auto">
            Every devotional bracelet in our collection is handcrafted by skilled
            artisans using authentic, ethically sourced materials. We honor
            centuries-old traditions to bring you pieces that carry genuine
            spiritual significance — not just beauty, but purpose.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-14">
            <div
              className="flex flex-col items-center scroll-reveal max-w-sm mx-auto"
              style={{ transitionDelay: '100ms' }}
            >
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-heading font-medium text-foreground mb-2">
                Authentic Materials
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Genuine Rudraksha, Sandalwood, Tiger Eye, and sacred gemstones.
              </p>
            </div>

            <div
              className="flex flex-col items-center scroll-reveal max-w-sm mx-auto"
              style={{ transitionDelay: '200ms' }}
            >
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-heading font-medium text-foreground mb-2">
                Blessed & Purified
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each piece undergoes traditional purification rituals before
                reaching you.
              </p>
            </div>

            <div
              className="flex flex-col items-center scroll-reveal max-w-sm mx-auto"
              style={{ transitionDelay: '300ms' }}
            >
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-heading font-medium text-foreground mb-2">
                Spiritual Energy
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Designed to enhance meditation, promote healing, and offer
                protection.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
