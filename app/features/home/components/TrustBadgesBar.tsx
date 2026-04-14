const BADGES = [
  {
    title: 'Secure Checkout',
    desc: 'SSL encrypted payment',
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'Free Returns',
    desc: '30-day hassle-free returns',
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
      </svg>
    ),
  },
  {
    title: 'Fast Shipping',
    desc: 'Delivered in 5-7 business days',
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    title: 'Lab Certified',
    desc: 'Gemological authenticity report',
    icon: (
      <svg className="w-8 h-8 md:w-10 md:h-10 text-white/90 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

function BadgeCard({ badge }: { badge: typeof BADGES[number] }) {
  return (
    <div className="group flex flex-row items-center gap-4 p-5 lg:p-6 bg-transparent border border-white/20 rounded-2xl transition-colors duration-300 shrink-0 w-64 sm:w-auto">
      <div className="group-hover:scale-105 transition-transform duration-300">
        {badge.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-[15px] font-medium text-white/95 tracking-wide leading-tight mb-1">
          {badge.title}
        </p>
        <p className="text-[11px] md:text-xs text-stone-100 leading-snug">
          {badge.desc}
        </p>
      </div>
    </div>
  );
}

export function TrustBadgesBar() {
  return (
    <section className="bg-black py-6 lg:py-5 border-t border-gold-muted/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Mobile: horizontal auto-scroll marquee */}
        <div className="lg:hidden overflow-x-auto no-scrollbar">
          <div className="flex gap-3 pb-1">
            {/* Duplicate for seamless feel */}
            {[...BADGES, ...BADGES].map((badge, i) => (
              <BadgeCard key={i} badge={badge} />
            ))}
          </div>
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-5 scroll-reveal">
          {BADGES.map((badge) => (
            <BadgeCard key={badge.title} badge={badge} />
          ))}
        </div>
      </div>
    </section>
  );
}
