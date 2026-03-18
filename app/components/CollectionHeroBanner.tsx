import type { ReactNode } from 'react';

interface CollectionHeroBannerProps {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc?: string | null;
  imageAlt?: string;
  align?: 'center' | 'right';
  highlights?: string[];
  breadcrumb?: ReactNode;
  breadcrumbPlacement?: 'above' | 'inside-top';
}

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

export function CollectionHeroBanner({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  align = 'center',
  highlights = [],
  breadcrumb,
  breadcrumbPlacement = 'above',
}: CollectionHeroBannerProps) {
  const isRightAligned = align === 'right';
  const breadcrumbInside = breadcrumb && breadcrumbPlacement === 'inside-top';

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-neutral-950 text-white">
      {breadcrumb && breadcrumbPlacement === 'above' ? breadcrumb : null}

      <div className="relative min-h-[300px] sm:min-h-[360px] lg:min-h-[420px]">
        {breadcrumbInside ? (
          <div className="absolute inset-x-0 top-0 z-30">{breadcrumb}</div>
        ) : null}
        <div className="absolute inset-0">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt || title}
              width={1920}
              height={1080}
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-linear-to-br from-stone-950 via-black to-stone-900" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_48%)]" />
        <div
          className={cn(
            'absolute inset-0',
            isRightAligned
              ? 'bg-linear-to-r from-black/70 via-black/35 to-black/60'
              : 'bg-linear-to-b from-black/55 via-black/35 to-black/70',
          )}
        />

        <div
          className={cn(
            'relative container mx-auto flex min-h-[300px] px-4 py-14 sm:min-h-[360px] sm:px-6 lg:min-h-[420px] lg:px-8',
            breadcrumbInside ? 'pt-24 sm:pt-28 lg:pt-32' : '',
          )}
        >
          <div
            className={cn(
              'flex w-full items-center',
              isRightAligned ? 'justify-end' : 'justify-center',
            )}
          >
            <div
              className={cn(
                'max-w-2xl',
                isRightAligned ? 'text-left lg:max-w-xl' : 'text-center',
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-white/75 sm:text-[11px]">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-heading text-4xl font-medium uppercase leading-[0.95] tracking-[0.04em] text-white sm:text-5xl lg:text-7xl">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                {description}
              </p>

              {highlights.length > 0 ? (
                <div
                  className={cn(
                    'mt-7 flex flex-wrap gap-2.5',
                    isRightAligned ? '' : 'justify-center',
                  )}
                >
                  {highlights.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
