import { Suspense, useRef, useState, useEffect, useCallback, useId } from 'react';
import { Await, NavLink, useAsyncValue, Link, useFetcher, useNavigate } from 'react-router';
import {
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
  Image,
  Money,
} from '@shopify/hydrogen';
import type { HeaderQuery, CartApiQueryFragment } from 'storefrontapi.generated';
import { useAside } from '~/components/Aside';
import { SUB_NAV_ITEMS } from '~/lib/constants';
import { SEARCH_ENDPOINT, SearchFormPredictive } from '~/components/SearchFormPredictive';
import { SearchResultsPredictive } from '~/components/SearchResultsPredictive';
import { BrandLogo } from '~/components/BrandLogo';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
  type PredictiveSearchReturn,
} from '~/lib/search';

import { BRAND_LOGO_DARK_SRC, BRAND_LOGO_LIGHT_SRC } from '~/lib/branding';

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
}: HeaderProps) {
  const { shop, menu } = header;

  return (
    <header className="relative top-0 z-50 bg-background text-foreground border-b border-border shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-8 flex items-center gap-4 relative">
        {/* Mobile Menu Toggle (left on mobile) */}
        <div className="md:hidden">
          <HeaderMenuMobileToggle />
        </div>

        {/* Logo — left on mobile, centered on desktop */}
        <NavLink
          to="/"
          end
          prefetch="intent"
          className="absolute left-1/2 -translate-x-1/2 -mt-1 md:-mt-7 shrink-0"
        >
          <BrandLogo
            lightSrc={BRAND_LOGO_LIGHT_SRC}
            darkSrc={BRAND_LOGO_DARK_SRC}
            alt={shop.name}
            className="h-8 md:h-12 w-auto object-contain"
          />
        </NavLink>

        {/* Spacer to push icons right on desktop */}
        {/* Desktop Left Links (About + Contact) */}
        <div className="hidden md:flex items-center gap-8">
          <NavLink
            to="/pages/about"
            className="text-xs lg:text-lg tracking-[0.18em] uppercase text-foreground hover:text-foreground transition"
          >
            About
          </NavLink>

          <NavLink
            to="/pages/contact"
            className="text-xs lg:text-lg tracking-[0.18em] uppercase text-foreground hover:text-foreground transition"
          >
            Contact
          </NavLink>

          <NavLink
            to="/blogs"
            className="text-xs lg:text-lg tracking-[0.18em] uppercase text-foreground hover:text-foreground transition"
          >
            Blog
          </NavLink>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right Side Icons */}
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
      </div>

      {/* Floating Sub-Nav Island — desktop only, loops through Shopify menu links */}
      <SubNavIsland
        menu={menu}
        collections={(header as any).collections}
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
    </header>
  );
}

/** Floating pill-shaped sub-navigation bar — uses Shopify menu links */
function SubNavIsland({
  menu,
  collections,
  primaryDomainUrl,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  collections: any;
  primaryDomainUrl: string;
  publicStoreDomain: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rawItems = menu?.items?.length ? menu.items : FALLBACK_HEADER_MENU.items;

  // Filter out About + Contact
  const items = rawItems.filter(
    (item) =>
      !['About', 'Contact'].includes(item.title)
  );

  const getCollectionImage = (url: string) => {
    if (!collections?.nodes || !url) return null;
    const handle = url.split('/').filter(Boolean).pop();
    const collection = collections.nodes.find((c: any) => c.handle === handle);
    return collection?.image?.url || null;
  };

  return (
    <>
{/* Animated trigger button — fixed to top-right of the header */}
<div className="md:hidden">
  {/* ── TRIGGER BUTTON ── */}
  <button
    onClick={() => setIsOpen(!isOpen)}
    aria-label="Browse collections"
    className={`
      group absolute top-20 right-4 z-50
      w-12 h-12 rounded-full
      flex items-center justify-center
      border border-border bg-card/80 backdrop-blur-md
      shadow-md active:scale-90
      transition-all duration-300 ease-out
      ${isOpen ? 'scale-90 ring-2 ring-foreground/20' : ''}
    `}
  >
    {/* PNG icon — fades + shrinks when open */}
    <img
      src="/icons/collections.png"
      alt=""
      className={`w-7 h-7 object-contain transition-all duration-300
        ${isOpen ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}
    />

    {/* X — fades in when open */}
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className={`absolute transition-all duration-300 text-foreground
        ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>

    {/* Pulse ring — only when closed, invites interaction */}
    {!isOpen && (
      <span className="absolute inset-0 rounded-full border border-foreground/25 animate-ping pointer-events-none" />
    )}
  </button>

  {/* ── BACKDROP ── */}
  <div
    onClick={() => setIsOpen(false)}
    className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-400
      ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
  />

  {/* ── SLIDE-UP MODAL PANEL ── */}
  <div
    className={`
      fixed left-3 right-3 bottom-4 z-50
      bg-card rounded-3xl border border-border shadow-2xl
      transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
      ${isOpen
        ? 'translate-y-0 opacity-100'
        : 'translate-y-[110%] opacity-0 pointer-events-none'}
    `}
  >
    {/* Handle bar */}
    <div className="flex justify-center pt-3 pb-1">
      <div className="w-10 h-1 rounded-full bg-border" />
    </div>

    {/* Header row */}
    <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-border">
      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
        Browse Collections
      </p>
      <button
        onClick={() => setIsOpen(false)}
        className="w-7 h-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-foreground hover:text-background transition-all duration-200 active:scale-90"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Collection cards grid */}
    <nav className="p-4 grid grid-cols-2 gap-3 max-h-[65vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {items.map((item, index) => {
        if (!item.url) return null;

        const url =
          item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;

        const imageUrl = getCollectionImage(url);

        return (
          <NavLink
            key={item.id}
            to={url}
            end
            prefetch="intent"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `group relative rounded-2xl overflow-hidden aspect-[3/4] flex items-end
               transition-all duration-300 active:scale-95
               ${isActive ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}
               ${index === 0 && items.length % 2 !== 0 ? 'col-span-2 aspect-[16/7]' : ''}`
            }
            style={{
              animationDelay: `${index * 60}ms`,
            }}
          >
            {/* Background image */}
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.title}
                width={400}
                height={500}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-active:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/20 to-transparent" />

            {/* Collection name */}
            <div className="relative w-full px-3.5 pb-3.5">
              <p className="text-white text-[11px] font-semibold tracking-[0.12em] uppercase leading-tight drop-shadow-sm line-clamp-2">
                {item.title}
              </p>
              <div className="mt-1.5 flex items-center gap-1 opacity-70">
                <span className="text-white/80 text-[9px] tracking-wider uppercase font-medium">Shop</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </NavLink>
        );
      })}
    </nav>

    <div className="h-2" />
  </div>
</div>

      {/* Desktop Horizontal List */}
      <div className="hidden md:flex justify-center absolute mt-2 pb-3 md:pb-0 md:mt-0 md:top-28 md:left-1/2 w-full px-2 md:px-0 md:-translate-x-1/2 md:-translate-y-1/2 z-50">
        <div className="w-full max-w-[95vw] md:w-auto overflow-x-auto no-scrollbar flex justify-start md:justify-center">
          <nav
            className="
            bg-card
            shadow-inner
            rounded-full
            px-2.5 py-2
            flex items-center gap-2
            border border-border
            min-w-max
          "
          >
            {items.map((item) => {
              if (!item.url) return null;

              const url =
                item.url.includes('myshopify.com') ||
                  item.url.includes(publicStoreDomain) ||
                  item.url.includes(primaryDomainUrl)
                  ? new URL(item.url).pathname
                  : item.url;

              const imageUrl = getCollectionImage(url);

              return (
                <NavLink
                  key={item.id}
                  to={url}
                  end
                  prefetch="intent"
                  className={({ isActive }) =>
                    `
                  px-8 py-3
                  text-sm tracking-[0.15em]
                  uppercase
                  font-semibold
                  rounded-full
                  flex items-center gap-2
                  transition-all duration-300
                  ${isActive
                      ? 'bg-gold text-white shadow-lg'
                      : 'text-foreground bg-card border border-border hover:bg-muted'
                    }
                  `
                  }
                >
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={item.title}
                      width={20}
                      height={20}
                      className="rounded-full object-cover w-5 h-5 shrink-0"
                    />
                  )}
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
}) {
  const { close } = useAside();
  const navigate = useNavigate();
  const queriesDatalistId = useId();

  return (
    <nav
      role="navigation"
      className="flex flex-col gap-5 pt-2"
    >
      {/* ── Search ── */}
      <div className="px-5 pb-1">
        <div className="predictive-search">
          <SearchFormPredictive>
            {({ fetchResults, goToSearch, inputRef }) => (
              <div className="flex items-center bg-muted/60 backdrop-blur-sm rounded-2xl pl-4 pr-1.5 py-1.5 gap-2 border border-border/50 focus-within:border-foreground/20 focus-within:bg-muted transition-all duration-300 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <input
                  name="q"
                  onChange={fetchResults}
                  onFocus={fetchResults}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      goToSearch();
                    }
                  }}
                  placeholder="Search sacred items…"
                  ref={inputRef}
                  type="search"
                  list={queriesDatalistId}
                  autoComplete="off"
                  className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-muted-foreground/60 font-body [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                />
                <button
                  type="button"
                  onClick={goToSearch}
                  className="bg-foreground text-background text-[10px] font-semibold px-4 py-2 rounded-xl tracking-[0.12em] uppercase shrink-0 hover:opacity-90 active:scale-95 transition-all duration-200"
                >
                  Go
                </button>
              </div>
            )}
          </SearchFormPredictive>
          <SearchResultsPredictive>
            {({ items, total, term, state, closeSearch }) => {
              const { articles, collections, pages, products, queries } = items;

              if (state === 'loading' && term.current) {
                return (
                  <div className="mt-4">
                    <div className="p-4 text-sm opacity-60">Searching…</div>
                  </div>
                );
              }

              if (!term.current) {
                return null;
              }

              if (!total) {
                return (
                  <div className="mt-4">
                    <SearchResultsPredictive.Empty term={term} />
                  </div>
                );
              }

              return (
                <div className="mt-4">
                  <div className="flex flex-col gap-4 pb-4">
                    <SearchResultsPredictive.Queries
                      queries={queries}
                      queriesDatalistId={queriesDatalistId}
                    />
                    <SearchResultsPredictive.Products
                      products={products}
                      closeSearch={closeSearch}
                      term={term}
                    />
                    <SearchResultsPredictive.Collections
                      collections={collections}
                      closeSearch={closeSearch}
                      term={term}
                    />
                    <SearchResultsPredictive.Pages
                      pages={pages}
                      closeSearch={closeSearch}
                      term={term}
                    />
                    <SearchResultsPredictive.Articles
                      articles={articles}
                      closeSearch={closeSearch}
                      term={term}
                    />
                    {total ? (
                      <Link
                        onClick={closeSearch}
                        to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                        className="block text-center p-3 mt-2 border-t border-border text-[11px] tracking-widest uppercase font-semibold text-foreground hover:underline"
                      >
                        View all {total} results →
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            }}
          </SearchResultsPredictive>
        </div>
      </div>

      {/* ── Navigation Links Grid ── */}
      <div className="grid grid-cols-2 gap-2.5 px-5">
        <NavLink
          to="/"
          end
          onClick={close}
          className={({ isActive }) =>
            `group relative overflow-hidden rounded-2xl py-4 text-center text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center ${isActive
              ? 'bg-foreground text-background shadow-lg scale-[1.02]'
              : 'bg-muted/50 text-foreground border border-border/40 hover:bg-muted hover:border-border hover:shadow-md active:scale-95'
            }`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/pages/about"
          onClick={close}
          className={({ isActive }) =>
            `group relative overflow-hidden rounded-2xl py-4 text-center text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center ${isActive
              ? 'bg-foreground text-background shadow-lg scale-[1.02]'
              : 'bg-muted/50 text-foreground border border-border/40 hover:bg-muted hover:border-border hover:shadow-md active:scale-95'
            }`
          }
        >
          About
        </NavLink>
        <NavLink
          to="/pages/contact"
          onClick={close}
          className={({ isActive }) =>
            `group relative overflow-hidden rounded-2xl py-4 text-center text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center ${isActive
              ? 'bg-foreground text-background shadow-lg scale-[1.02]'
              : 'bg-muted/50 text-foreground border border-border/40 hover:bg-muted hover:border-border hover:shadow-md active:scale-95'
            }`
          }
        >
          Contact
        </NavLink>
        <NavLink
          to="/blogs"
          onClick={close}
          className={({ isActive }) =>
            `group relative overflow-hidden rounded-2xl py-4 text-center text-[11px] font-semibold tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center ${isActive
              ? 'bg-foreground text-background shadow-lg scale-[1.02]'
              : 'bg-muted/50 text-foreground border border-border/40 hover:bg-muted hover:border-border hover:shadow-md active:scale-95'
            }`
          }
        >
          Blog
        </NavLink>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-border/30" />

      {/* ── Quick Links / Promotions ── */}
      <div className="flex flex-col gap-2 px-5">
        <p className="text-[9px] font-semibold tracking-[0.25em] uppercase text-muted-foreground px-1 mb-0.5">Quick Links</p>
        <NavLink
          to="/collections/all"
          onClick={close}
          className="group flex items-center gap-3.5 px-4 py-3.5 bg-muted/30 hover:bg-muted/70 rounded-2xl transition-all duration-300 active:scale-[0.98]"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm shadow-sm">🔥</span>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold tracking-[0.08em] text-foreground">Best Sellers</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Our most loved items</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </NavLink>
        <NavLink
          to="/collections/new-arrivals"
          onClick={close}
          className="group flex items-center gap-3.5 px-4 py-3.5 bg-muted/30 hover:bg-muted/70 rounded-2xl transition-all duration-300 active:scale-[0.98]"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-sm shadow-sm">✨</span>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold tracking-[0.08em] text-foreground">New Arrivals</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Fresh additions</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </NavLink>
        <NavLink
          to="/collections/sale"
          onClick={close}
          className="group flex items-center gap-3.5 px-4 py-3.5 bg-muted/30 hover:bg-muted/70 rounded-2xl transition-all duration-300 active:scale-[0.98]"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 text-white text-sm shadow-sm">🛍️</span>
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold tracking-[0.08em] text-foreground">Sale</span>
            <span className="text-[10px] text-muted-foreground leading-tight">Up to 40% off</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 ml-auto text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </NavLink>
      </div>
    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'>) {
  return (
    <nav className="flex items-center gap-3 md:gap-4 ml-auto md:ml-0">
      {/* Inline Search Bar — desktop only */}
      <DesktopSearchBar />

      {/* Account — desktop only */}
      <NavLink
        to="/account"
        prefetch="intent"
        className="text-foreground transition hidden md:block"
        aria-label="Account"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 xl:w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </NavLink>

      {/* Account — mobile only */}
      <NavLink
        to="/account"
        prefetch="intent"
        className="text-foreground transition md:hidden"
        aria-label="Account"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </NavLink>

      {/* Cart */}
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const { open } = useAside();

  return (
    <button
      onClick={() => open('mobile')}
      className="p-1 hover:text-accent transition cursor-pointer"
      aria-label="Open menu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
        />
      </svg>
    </button>
  );
}

/** Inline search bar with predictive dropdown — desktop only */
function DesktopSearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const fetcher = useFetcher<PredictiveSearchReturn>({ key: 'desktop-search' });
  const [open, setOpen] = useState(false);

  const { items, total } =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();
  const term = String(fetcher.formData?.get('q') || inputRef.current?.value || '');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      if (q.length > 0) {
        setOpen(true);
        void fetcher.submit(
          { q, limit: '5', predictive: 'true' },
          { method: 'GET', action: SEARCH_ENDPOINT },
        );
      } else {
        setOpen(false);
      }
    },
    [fetcher],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value?.trim();
    if (q) {
      setOpen(false);
      void navigate(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(q)}`);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeDropdown() {
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.blur();
    }
  }

  const hasResults = total > 0;
  const isLoading = fetcher.state === 'loading';

  return (
    <div ref={containerRef} className="hidden md:block relative">
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-card rounded-full px-5 py-3 gap-2 w-44 lg:w-64 transition-all border border-border focus-within:ring-1 focus-within:ring-ring focus-within:bg-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 text-text-muted flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          name="q"
          placeholder="Search sacred items…"
          onChange={handleChange}
          onFocus={(e) => {
            if (e.target.value.length > 0) setOpen(true);
          }}
          className="header-search-input flex-1 text-xs text-text-main placeholder-text-muted bg-transparent [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          autoComplete="off"
        />
      </form>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-card rounded-xl shadow-silver border border-border overflow-hidden z-[200]"
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {isLoading && term && (
            <div className="px-4 py-3 text-xs text-neutral-400">Searching…</div>
          )}

          {!isLoading && term && !hasResults && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-text-muted">No results for <q className="font-medium text-text-main">{term}</q></p>
            </div>
          )}

          {hasResults && (
            <>
              {items.products.length > 0 && (
                <div className="p-3">
                  <h6 className="text-[10px] uppercase tracking-widest text-neutral-400 mb-2 px-1">Products</h6>
                  <ul className="space-y-1">
                    {items.products.map((product) => {
                      const productUrl = urlWithTrackingParams({
                        baseUrl: `/products/${product.handle}`,
                        trackingParams: product.trackingParameters,
                        term,
                      });
                      const image = product?.selectedOrFirstAvailableVariant?.image;
                      const price = product?.selectedOrFirstAvailableVariant?.price;
                      return (
                        <li key={product.id}>
                          <Link
                            to={productUrl}
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            {image && (
                              <Image
                                alt={image.altText ?? ''}
                                src={image.url}
                                width={44}
                                height={44}
                                className="rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-main truncate">{product.title}</p>
                              {price && (
                                <span className="text-xs text-foreground font-medium">
                                  <Money data={price} />
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {items.collections.length > 0 && (
                <div className="p-3 border-t border-border">
                  <h6 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-1">Collections</h6>
                  <ul className="space-y-1">
                    {items.collections.map((collection) => {
                      const collectionUrl = urlWithTrackingParams({
                        baseUrl: `/collections/${collection.handle}`,
                        trackingParams: collection.trackingParameters,
                        term,
                      });
                      return (
                        <li key={collection.id}>
                          <Link
                            to={collectionUrl}
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            {collection.image?.url && (
                              <Image
                                alt={collection.image.altText ?? ''}
                                src={collection.image.url}
                                width={44}
                                height={44}
                                className="rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm text-text-main">{collection.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {items.pages.length > 0 && (
                <div className="p-3 border-t border-border">
                  <h6 className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-1">Pages</h6>
                  <ul className="space-y-1">
                    {items.pages.map((page) => {
                      const pageUrl = urlWithTrackingParams({
                        baseUrl: `/pages/${page.handle}`,
                        trackingParams: page.trackingParameters,
                        term,
                      });
                      return (
                        <li key={page.id}>
                          <Link
                            to={pageUrl}
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <span className="text-sm text-text-main">{page.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="border-t border-border">
                <Link
                  to={`${SEARCH_ENDPOINT}?q=${encodeURIComponent(term)}`}
                  onClick={closeDropdown}
                  className="block px-4 py-3 text-center text-xs uppercase tracking-wider text-foreground hover:bg-muted transition-colors font-medium"
                >
                  View all {total} results →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchToggle() {
  const { open } = useAside();

  return (
    <button
      onClick={() => open('search')}
      className="md:hidden hover:text-accent transition cursor-pointer"
      aria-label="Search"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
    </button>
  );
}

function CartBadge({ count }: { count: number | null }) {
  const { open } = useAside();
  const { publish, shop, cart, prevCart } = useAnalytics();

  return (
    <button
      onClick={() => {
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        } as CartViewPayload);
      }}
      className="relative text-foreground transition cursor-pointer"
      aria-label={`Cart with ${count ?? 0} items`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 xl:w-8 xl:h-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
      {(count ?? 0) > 0 && (
        <span
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-silver-dark)', color: 'var(--color-bg-dark)' }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function CartToggle({ cart }: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      title: 'Shop',
      url: '/collections/all',
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      title: 'About',
      url: '/pages/about',
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      title: 'Contact',
      url: '/pages/contact',
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      title: 'Blog',
      url: '/blogs',
    },
  ],
};
