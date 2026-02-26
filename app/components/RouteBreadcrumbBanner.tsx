import {Link, useLocation, useMatches} from 'react-router';
import {useMemo} from 'react';

type Crumb = {to: string; label: string; isCurrent: boolean};

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
    {to: homeTo, label: 'Home', isCurrent: segments.length === 0},
  ];

  const matchLabel = getMatchLabel(matches);

  for (let index = offset; index < segments.length; index++) {
    const segment = segments[index];
    if (HIDDEN_SEGMENTS.has(segment)) continue;
    const to = `${base}/${segments.slice(offset, index + 1).join('/')}`;
    const isCurrent = index === segments.length - 1;

    let label = STATIC_LABELS[segment] || titleCaseFromSegment(segment);
    if (isCurrent && matchLabel) label = matchLabel;

    crumbs.push({to, label, isCurrent});
  }

  return crumbs;
}

export function RouteBreadcrumbBanner() {
  const location = useLocation();
  const matches = useMatches();

  const crumbs = useMemo(
    () => buildBreadcrumbs(location.pathname, matches),
    [location.pathname, matches],
  );

  if (crumbs.length <= 1) return null;

  return (
    <div className="bg-neutral-950 border-b border-neutral-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-neutral-400 flex-wrap"
        >
          {crumbs.map((crumb, idx) => (
            <span
              key={`${crumb.to}-${idx}`}
              className="inline-flex items-center gap-2"
            >
              {idx > 0 ? (
                <svg
                  aria-hidden="true"
                  className="w-3 h-3 text-neutral-700"
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
                <span className="text-white">{crumb.label}</span>
              ) : (
                <Link to={crumb.to} className="hover:text-white transition-colors">
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
