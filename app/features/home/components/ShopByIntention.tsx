import { Link } from 'react-router';
import type { IntentionItem } from '~/lib/intentions';

interface ShopByIntentionProps {
  intentions: IntentionItem[];
  /**
   * Hide a specific intent card. Used on collection PLPs so customers
   * already viewing /collections/wealth don't see the Wealth tile again.
   */
  excludeHandle?: string;
  /** Override copy per surface — useful when reusing on a collection page. */
  eyebrow?: string;
  heading?: string;
  description?: string;
}

export function ShopByIntention({
  intentions,
  excludeHandle,
  eyebrow = 'Shop By Intention',
  heading = 'What Are You Seeking?',
  description = 'Each piece is crafted with a purpose. Choose the energy you wish to invite into your life.',
}: ShopByIntentionProps) {
  const items = intentions.filter(
    (i) => i.collectionHandle && i.collectionHandle !== excludeHandle,
  );

  if (items.length === 0) return null;

  return (
    <section className="bg-white py-14 lg:py-20">
      <div className="container mx-auto px-5 lg:px-8">
        <div className="text-center scroll-reveal mb-10 lg:mb-14">
          <span className="text-[#F14514] text-[11px] font-medium tracking-[0.25em] uppercase">
            {eyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-heading uppercase font-medium text-foreground mt-3">
            {heading}
          </h2>
          <p className="text-sm lg:text-base text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Mobile: horizontal scroll. Tablet: 3 cols. Desktop: 5 cols. */}
        <div
          className="
            flex gap-3 overflow-x-auto px-1 -mx-1 pb-2
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
            sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:mx-0 sm:pb-0
            lg:grid-cols-5
          "
        >
          {items.map((item, idx) => (
            <IntentionCard key={item.id} item={item} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function IntentionCard({ item, index }: { item: IntentionItem; index: number }) {
  return (
    <Link
      to={`/collections/${item.collectionHandle}`}
      prefetch="intent"
      className="
        group relative flex flex-col items-center text-center
        shrink-0 w-[44vw] sm:w-auto
        bg-card border border-border rounded-2xl
        px-5 py-6 lg:py-8
        transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)]
        scroll-reveal
      "
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      {/* Icon disc — universal warm cream tint; the icon does the differentiation */}
      <div
        className="
          w-20 h-20 lg:w-24 lg:h-24 rounded-full
          flex items-center justify-center mb-4
          transition-transform duration-300 group-hover:scale-105
        "
        style={{
          background:
            'radial-gradient(circle at 30% 25%, #FAF6F0 0%, #F1ECE3 100%)',
          boxShadow:
            'inset 0 0 0 1px rgb(0 0 0 / 0.04), inset 0 1px 2px rgb(0 0 0 / 0.03)',
        }}
      >
        {item.iconUrl ? (
          <img
            src={item.iconUrl}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
          />
        ) : (
          <span className="text-3xl lg:text-4xl leading-none" aria-hidden>
            {item.emoji}
          </span>
        )}
      </div>

      <h3 className="text-base lg:text-lg font-heading font-medium text-foreground transition-colors duration-200 group-hover:text-[#F14514]">
        {item.name}
      </h3>

      {item.focus && (
        <p className="mt-1.5 text-[11px] lg:text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {item.focus}
        </p>
      )}

      <span
        className="
          mt-4 inline-flex items-center gap-1 text-[10px] tracking-[0.18em] uppercase
          text-muted-foreground group-hover:text-foreground transition-colors
        "
      >
        Explore
        <svg
          className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  );
}
