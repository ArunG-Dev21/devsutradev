export function TrustBadges() {
  return (
    <>
      {/* Trust / About Section */}
      <section id="about" className="dark:bg-black bg-stone-50 py-20 lg:py-28">
        <div className="mx-auto container px-6 text-center scroll-reveal">
          <span className="text-[#F14514] text-xs font-medium tracking-[0.25em] uppercase">
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
              <div className="w-14 h-14 rounded-full bg-[#404141]/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#F14514]"
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
              <div className="w-14 h-14 rounded-full bg-[#404141]/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#F14514]"
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
              <div className="w-14 h-14 rounded-full bg-[#404141]/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#F14514]"
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
    </>
  );
}
