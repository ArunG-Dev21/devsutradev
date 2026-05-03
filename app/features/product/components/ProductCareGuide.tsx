import { useMemo } from 'react';

type CareGuide = {
  label: string;
  intro: string;
  wear: string[];
  care: string[];
};

const CARE_GUIDES = {
  'stone-bracelet': {
    label: 'Gemstone Bracelet',
    intro: 'Wear with intention. Care with reverence.',
    wear: [
      'Wear on the left wrist to receive calming, healing energy.',
      'Wear on the right wrist to express confidence, strength, and action.',
      'Pairs effortlessly with daily and traditional attire.',
      'Most powerful when worn with a clear, positive mindset.',
    ],
    care: [
      'Avoid contact with perfume, lotion, harsh soaps, and chemicals.',
      'Remove before swimming, bathing, or workouts.',
      'Store separately in a soft pouch or jewellery box.',
      'Wipe gently with a soft, dry cloth after each wear.',
      'Recharge under moonlight or near burning incense from time to time.',
    ],
  },
  'karungali-bracelet': {
    label: 'Karungali Bracelet',
    intro: 'A grounding companion — kept dry, kept sacred.',
    wear: [
      'Wear on either wrist — whichever feels most natural.',
      'Traditionally worn daily for grounding and protection.',
      'Ideal during travel, work, prayer, and meditation.',
      'Stacks beautifully with a watch or simple accessories.',
    ],
    care: [
      'Keep away from excess water and moisture.',
      'Avoid soaking or wearing while bathing.',
      'Store in a dry, well-ventilated place.',
      'Clean only with a dry, soft cloth.',
      'If the wood looks dull, rub a touch of natural oil into a cloth and buff lightly.',
    ],
  },
  'karungali-mala': {
    label: 'Karungali Mala',
    intro: 'Hold it with care. Hold it with intention.',
    wear: [
      'Wear around the neck with respect and clean intention.',
      'Use during prayer, meditation, or daily spiritual wear.',
      'Best worn over clean clothing or directly on the skin.',
      'Remove before sleep if it feels uncomfortable.',
    ],
    care: [
      'Keep away from water, sweat build-up, and perfume.',
      'Store in a clean, sacred pouch or box.',
      'Clean gently with a dry, soft cloth.',
      'Avoid pulling the thread sharply or dropping the mala.',
      'Rest it in a calm, clean place when not in use.',
    ],
  },
  'rudraksha-bracelet': {
    label: 'Rudraksha Bracelet',
    intro: 'A sacred bead — worn pure, kept dry.',
    wear: [
      'Wear on either wrist comfortably.',
      'Traditionally worn after a bath or during prayer.',
      'Ideal for meditation, focus, and peaceful daily wear.',
      'Wear with a clean, respectful mindset.',
    ],
    care: [
      'Avoid soap, perfume, and chemical sprays.',
      'Remove before showering or swimming.',
      'Keep dry after every wear.',
      'Apply a tiny amount of natural oil occasionally to nourish the beads.',
      'Store in a soft pouch when not in use.',
    ],
  },
  'rudraksha-mala': {
    label: 'Rudraksha Mala',
    intro: 'Honour each bead with mindful care.',
    wear: [
      'Wear around the neck respectfully.',
      'Use for chanting, meditation, or daily spiritual wear.',
      'Traditionally worn after a bath in a clean state.',
      'Handle gently and mindfully throughout the day.',
    ],
    care: [
      'Keep away from water and chemicals.',
      'Avoid prolonged exposure to direct sunlight.',
      'Wipe with a dry cloth regularly.',
      'Oil lightly on occasion to preserve the natural texture.',
      'Store in a clean pouch or sacred space.',
    ],
  },
} satisfies Record<string, CareGuide>;

type CareKey = keyof typeof CARE_GUIDES;

function resolveCategory({
  tags = [],
  collections = [],
  productType = '',
  title = '',
}: {
  tags?: string[];
  collections?: string[];
  productType?: string;
  title?: string;
}): CareKey {
  const haystack = [...tags, ...collections, productType, title]
    .map((s) => (s ?? '').toLowerCase());
  const has = (kw: string) => haystack.some((s) => s.includes(kw));
  const isMala = has('mala') || has('maala') || has('necklace');

  if (has('karungali') || has('ebony')) {
    return isMala ? 'karungali-mala' : 'karungali-bracelet';
  }
  if (has('rudraksha') || has('rudraksh')) {
    return isMala ? 'rudraksha-mala' : 'rudraksha-bracelet';
  }
  return 'stone-bracelet';
}

interface ProductCareGuideProps {
  product: {
    title?: string;
    tags?: string[] | null;
    productType?: string | null;
    collections?: { nodes?: Array<{ handle?: string | null; title?: string | null } | null> | null } | null;
  };
}

export function ProductCareGuide({ product }: ProductCareGuideProps) {
  const guideKey = useMemo<CareKey>(
    () =>
      resolveCategory({
        tags: product.tags ?? [],
        collections: (product.collections?.nodes ?? [])
          .flatMap((c) => [c?.handle, c?.title])
          .filter((v): v is string => typeof v === 'string'),
        productType: product.productType ?? '',
        title: product.title ?? '',
      }),
    [product],
  );
  const guide = CARE_GUIDES[guideKey];

  return (
    <section className="mt-14">
      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="mb-8 text-center md:text-left">
        <p className="text-[10px] tracking-[0.3em] uppercase text-stone-400 dark:text-muted-foreground mb-2">
          Wear &amp; Care · {guide.label}
        </p>
        <h3 className="text-2xl sm:text-3xl font-heading font-semibold text-stone-900 dark:text-foreground leading-tight">
          {guide.intro}
        </h3>
        <div className="mt-4 flex items-center gap-3 justify-center md:justify-start">
          <span className="h-px w-10 bg-[#F14514]/40" />
          <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-[#F14514]" />
          <span className="h-px w-10 bg-[#F14514]/40" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-6">
        {/* ── HOW TO WEAR ─────────────────────────────────────────────── */}
        <article className="relative overflow-hidden rounded-3xl border border-stone-200/60 dark:border-border bg-linear-to-br from-[#fffaf6] via-white to-[#fff4ea] dark:from-card dark:via-card dark:to-card p-6 sm:p-8 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-0.5">
          <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#F14514]/10 blur-2xl" />
          <header className="relative flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl border border-[#F14514]/30 bg-[#F14514]/5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#F14514]">
                <path d="M21 12c0 4.97-4.03 9-9 9-1.7 0-3.3-.47-4.66-1.29" />
                <path d="M3 12C3 7.03 7.03 3 12 3c1.7 0 3.3.47 4.66 1.29" />
                <circle cx="6" cy="18" r="1.3" />
                <circle cx="18" cy="6" r="1.3" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#F14514]">Ritual</p>
              <h4 className="text-lg font-heading font-semibold text-stone-900 dark:text-foreground leading-none mt-1">
                How to Wear
              </h4>
            </div>
          </header>
          <ul className="relative space-y-3.5">
            {guide.wear.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-stone-700 dark:text-muted-foreground leading-relaxed"
              >
                <span aria-hidden="true" className="mt-2 inline-block h-1.5 w-1.5 rotate-45 bg-[#F14514] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* ── CARE INSTRUCTIONS ───────────────────────────────────────── */}
        <article className="relative overflow-hidden rounded-3xl border border-stone-200/60 dark:border-border bg-linear-to-br from-[#f7f6f1] via-white to-[#eeede7] dark:from-card dark:via-card dark:to-card p-6 sm:p-8 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-0.5">
          <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-stone-400/15 blur-2xl" />
          <header className="relative flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl border border-stone-300/70 bg-stone-100/70 dark:bg-muted/30 dark:border-border flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-stone-700 dark:text-muted-foreground">
                <path d="M12 3l1.6 4.2L18 9l-4.4 1.8L12 15l-1.6-4.2L6 9l4.4-1.8L12 3z" />
                <path d="M19 14l.7 1.8L21.5 16.5l-1.8.7L19 19l-.7-1.8L16.5 16.5l1.8-.7L19 14z" />
                <path d="M5 15l.5 1.3L6.8 16.8l-1.3.5L5 18.5l-.5-1.2L3.2 16.8l1.3-.5L5 15z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-500 dark:text-muted-foreground">
                Reverence
              </p>
              <h4 className="text-lg font-heading font-semibold text-stone-900 dark:text-foreground leading-none mt-1">
                Care Instructions
              </h4>
            </div>
          </header>
          <ul className="relative space-y-3.5">
            {guide.care.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-stone-700 dark:text-muted-foreground leading-relaxed"
              >
                <span aria-hidden="true" className="mt-2 inline-block h-1.5 w-1.5 rotate-45 bg-stone-400 dark:bg-muted-foreground/60 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {/* ── Footnote ──────────────────────────────────────────────────── */}
      <p className="mt-6 text-center md:text-left text-[11px] italic text-stone-500 dark:text-muted-foreground/80 leading-relaxed">
        Treat each piece as a small altar — kept clean, kept close, kept with care.
      </p>
    </section>
  );
}
