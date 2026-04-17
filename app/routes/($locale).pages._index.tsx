import {Link} from 'react-router';
import type {Route} from './+types/($locale).pages._index';
import { RouteBreadcrumbBanner } from '~/shared/components/RouteBreadcrumbBanner';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Pages | Devasutra'}];
};

const PAGE_LINKS = [
  {
    title: 'About',
    description: 'Our story, philosophy, and sacred crafting process.',
    href: '/pages/about',
  },
  {
    title: 'Contact',
    description: 'Reach our team for support, guidance, and order help.',
    href: '/pages/contact',
  },
];

export default function PagesIndexRoute() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative bg-neutral-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/60 dark:bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-400 rounded-full blur-3xl" />
        </div>
        <RouteBreadcrumbBanner variant="overlay" className="relative z-10" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Pages</h1>
          <p className="text-sm text-neutral-300 max-w-xl mx-auto">
            Explore essential information about Devasutra.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {PAGE_LINKS.map((page) => (
            <Link
              key={page.href}
              to={page.href}
              className="group bg-card text-card-foreground rounded-2xl border border-border p-6 hover:-translate-y-0.5 transition-all no-underline"
            >
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
                Page
              </p>
              <h2 className="text-2xl font-semibold text-foreground mb-3 group-hover:text-muted-foreground transition-colors">
                {page.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">{page.description}</p>
              <span className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase font-semibold text-foreground">
                Open
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
