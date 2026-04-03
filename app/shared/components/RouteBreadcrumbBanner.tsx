import { Link, useLocation, useMatches } from 'react-router';
import { useMemo } from 'react';

type Crumb = { to: string; label: string; isCurrent: boolean };
type BreadcrumbVariant = 'contrast' | 'light' | 'overlay';

interface RouteBreadcrumbBannerProps {
  variant?: BreadcrumbVariant;
  className?: string;
  containerClassName?: string;
  navClassName?: string;
}

const STATIC_LABELS: Record<string, string> = {
  account: 'Account',
  addresses: 'Addresses',
  blogs: 'Blog',
  cart: 'Cart',
  collections: 'Collections',
  all: 'All Products',
  orders: 'Orders',
  pages: 'Pages',
  policies: 'Policies',
  products: 'Products',
  profile: 'Profile',
  search: 'Search',
};
const HIDDEN_SEGMENTS = new Set(['pages']);

function titleCaseFromSegment(segment: string) {
  const cleaned = decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
  if (!cleaned) return segment;
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

function getMatchLabel(matches: ReturnType<typeof useMatches>) {
  for (const match of matches) {
    const id = String(match.id || '');
    const data = (match as any).data;

    if (id.includes('products.$handle') && data?.product?.title) {
      return String(data.product.title);
    }
    if (id.includes('collections.$handle') && data?.collection?.title) {
      return String(data.collection.title);
    }
    if (id.includes('pages.$handle') && data?.page?.title) {
      return String(data.page.title);
    }
    if (id.includes('policies.$handle') && data?.policy?.title) {
      return String(data.policy.title);
    }
    if (id.includes('blogs.$blogHandle.$articleHandle') && data?.article?.title) {
      return String(data.article.title);
    }
    if (id.includes('blogs.$blogHandle._index') && data?.blog?.title) {
      return String(data.blog.title);
    }
    if (id.includes('account.orders.$id') && data?.order?.name) {
      return `Order ${String(data.order.name)}`;
    }
  }

  return null;
}

function buildBreadcrumbs(
  pathname: string,
  matches: ReturnType<typeof useMatches>,
): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const localeSegment =
    segments[0] && /^[a-z]{2}-[a-z]{2}$/i.test(segments[0]) ? segments[0] : null;

  const offset = localeSegment ? 1 : 0;
  const base = localeSegment ? `/${localeSegment}` : '';
  const homeTo = base || '/';

  const crumbs: Crumb[] = [
    { to: homeTo, label: 'Home', isCurrent: segments.length === 0 },
  ];

  const matchLabel = getMatchLabel(matches);

  for (let index = offset; index < segments.length; index++) {
    const segment = segments[index];
    if (HIDDEN_SEGMENTS.has(segment)) continue;
    let to = `${base}/${segments.slice(offset, index + 1).join('/')}`;

    // Redirect /products breadcrumb to /collections/all
    if (segment === 'products') {
      to = `${base}/collections/all`;
    }

    const isCurrent = index === segments.length - 1;

    let label = STATIC_LABELS[segment] || titleCaseFromSegment(segment);
    if (isCurrent && matchLabel) label = matchLabel;

    crumbs.push({ to, label, isCurrent });
  }

  return crumbs;
}

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

export function useRouteBreadcrumbs() {
  const location = useLocation();
  const matches = useMatches();

  return useMemo(
    () => buildBreadcrumbs(location.pathname, matches),
    [location.pathname, matches],
  );
}

const VARIANT_STYLES: Record<
  BreadcrumbVariant,
  {
    wrapper: string;
    container: string;
    nav: string;
    link: string;
    current: string;
    separator: string;
  }
> = {
  contrast: {
    wrapper: 'relative z-20 text-white mix-blend-difference',
    container: 'mx-auto container px-4 py-2 md:px-10 md:py-8',
    nav: 'flex w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[10px] uppercase tracking-[0.14em] md:w-fit md:gap-2 md:text-xs md:tracking-[0.2em]',
    link: 'text-white transition-opacity hover:opacity-70',
    current: 'text-white/85',
    separator: 'text-white',
  },
  light: {
    wrapper: 'border-b border-border/70 bg-background/95',
    container: 'container mx-auto px-4 py-4 sm:px-6 lg:px-8',
    nav: 'flex w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-foreground md:w-fit md:gap-2 md:text-xs md:tracking-[0.2em]',
    link: 'text-foreground transition-opacity hover:opacity-65',
    current: 'text-muted-foreground',
    separator: 'text-muted-foreground',
  },
  overlay: {
    wrapper: 'pointer-events-none relative z-30',
    container: 'container mx-auto px-4 py-4 sm:px-6 lg:px-8',
    nav: 'pointer-events-auto flex w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-white md:w-fit md:gap-2 md:text-xs md:tracking-[0.2em]',
    link: 'text-white transition-opacity hover:opacity-70',
    current: 'text-white/80',
    separator: 'text-white/75',
  },
};

export function RouteBreadcrumbBanner({
  variant = 'contrast',
  className,
  containerClassName,
  navClassName,
}: RouteBreadcrumbBannerProps) {
  const crumbs = useRouteBreadcrumbs();
  const styles = VARIANT_STYLES[variant];

  if (crumbs.length <= 1) return null;

  return (
    <div className={cn(styles.wrapper, className)}>
      <div className={cn(styles.container, containerClassName)}>
      <nav
        aria-label="Breadcrumb"
        className={cn(styles.nav, navClassName)}
      >
        {crumbs.map((crumb, idx) => (
          <span key={crumb.to} className="inline-flex items-center gap-1.5 md:gap-2">
            {idx > 0 ? (
              <svg
                aria-hidden="true"
                className={cn('h-2.5 w-2.5 md:h-3 md:w-3', styles.separator)}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 4l6 6-6 6"
                />
              </svg>
            ) : null}
            {crumb.isCurrent ? (
              <span className={styles.current}>{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to}
                className={styles.link}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      </div>
    </div>
  );
}
