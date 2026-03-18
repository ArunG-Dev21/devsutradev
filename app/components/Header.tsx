import { Suspense, useRef, useState, useEffect, useCallback, useId, forwardRef, useImperativeHandle } from 'react';
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
import { SEARCH_ENDPOINT, SearchFormPredictive } from '~/components/SearchFormPredictive';
import { SearchResultsPredictive } from '~/components/SearchResultsPredictive';
import { BrandLogo } from '~/components/BrandLogo';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
  type PredictiveSearchReturn,
} from '~/lib/search';

import { BRAND_LOGO_DARK_SRC, BRAND_LOGO_LIGHT_SRC } from '~/lib/branding';

const SEARCH_PLACEHOLDERS = [
  'Karungali mala',
  'gemstone bracelets',
  'karungali silver',
  'silver rudraksha',
];

/** Hook that cycles through placeholder strings with a typing animation */
function useAnimatedPlaceholder(phrases: string[], typingSpeed = 80, pauseMs = 1800) {
  const [text, setText] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    let charIdx = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const phrase = phrases[idxRef.current % phrases.length];
      if (!deleting) {
        charIdx++;
        setText(phrase.slice(0, charIdx));
        if (charIdx === phrase.length) {
          deleting = true;
          timer = setTimeout(tick, pauseMs);
          return;
        }
      } else {
        charIdx--;
        setText(phrase.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          idxRef.current++;
        }
      }
      timer = setTimeout(tick, deleting ? typingSpeed / 2 : typingSpeed);
    }

    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [phrases, typingSpeed, pauseMs]);

  return text;
}

interface HeaderProps {
  header: HeaderQuery;
  cart: Promise<CartApiQueryFragment | null>;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
}

type Viewport = 'desktop' | 'mobile';

/** Imperative handle for SubNavIsland so the bottom nav can open/close it */
export interface SubNavIslandHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function Header({
  header,
  isLoggedIn,
  cart,
  publicStoreDomain,
  subNavRef,
}: HeaderProps & { subNavRef?: React.RefObject<SubNavIslandHandle | null> }) {
  const { shop, menu } = header;
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchFocused, setMobileSearchFocused] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Track scroll position with hysteresis to prevent jitter when the
  // mobile search bar collapses and shifts the page height by ~72px.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolling down past 120px, hide the search bar
      if (currentScrollY > 120 && lastScrollY <= 120) {
        setScrolled(true);
      } 
      // If scrolling up past 40px, show the search bar
      else if (currentScrollY < 40 && lastScrollY >= 40) {
        setScrolled(false);
      }
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Set --header-h CSS variable so floating controls can position below the header
  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--header-h', `${entry.contentRect.height}px`);
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-background text-foreground border-b border-border transition-all duration-300">
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
        <HeaderCtas
          isLoggedIn={isLoggedIn}
          cart={cart}
          scrolled={scrolled}
          onSearchOpen={() => {
            setMobileSearchFocused(true);
            setTimeout(() => {
              document.getElementById('mobile-search-input')?.focus();
            }, 50);
          }}
        />
      </div>

      {/* Mobile inline search bar — collapses on scroll, but forces open if focused */}
      <MobileSearchBar
        scrolled={scrolled}
        isFocused={mobileSearchFocused}
        setIsFocused={setMobileSearchFocused}
      />

      {/* Floating Sub-Nav Island — desktop only for inline, mobile controlled externally */}
      <SubNavIsland
        ref={subNavRef as React.Ref<SubNavIslandHandle>}
        menu={menu}
        collections={(header as any).collections}
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
    </header>
  );
}

/** Floating pill-shaped sub-navigation bar — uses Shopify menu links.
 *  Mobile modal is now triggered externally via ref (from MobileBottomNav).
 */
const SubNavIsland = forwardRef<SubNavIslandHandle, {
  menu: HeaderProps['header']['menu'];
  collections: any;
  primaryDomainUrl: string;
  publicStoreDomain: string;
}>(function SubNavIsland({
  menu,
  collections,
  primaryDomainUrl,
  publicStoreDomain,
}, ref) {
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

  // Expose open/close/toggle to parent via ref
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
  }));

  return (
    <>
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
                  group relative
                  px-8 py-3
                  text-sm tracking-[0.15em]
                  uppercase
                  font-semibold
                  rounded-full
                  flex items-center gap-1
                  transition-all duration-300
                  overflow-hidden
                  ${isActive
                      ? 'bg-gold text-white shadow-lg'
                      : 'text-foreground bg-card border border-border hover:text-white'
                    }
                  `
                  }
                >
                  {imageUrl && (
                    <>
                      {/* Spacer to maintain gap in static state */}
                      <span className="w-4 shrink-0 group-hover:w-0 transition-all duration-500" />
                      {/* Circle image that expands to fill the pill on hover */}
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        width={200}
                        height={200}
                        sizes="200px"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full object-cover transition-all duration-500 ease-in-out group-hover:left-0 group-hover:top-0 group-hover:translate-y-0 group-hover:w-full group-hover:h-full group-hover:rounded-none z-0"
                      />
                      {/* Dark overlay for text readability on hover */}
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 z-1 pointer-events-none rounded-full" />
                    </>
                  )}
                  <span className="relative z-2">{item.title}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
});

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
  collections,
}: {
  menu: HeaderProps['header']['menu'];
  primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
  viewport: Viewport;
  publicStoreDomain: HeaderProps['publicStoreDomain'];
  collections?: any;
}) {
  const { close } = useAside();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-4 py-3.5 transition-colors duration-200 ${
      isActive
        ? 'text-foreground'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  const chevron = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-auto text-muted-foreground/50 group-hover:text-foreground/60 transition-colors">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );

  const getCollectionImage = (url: string) => {
    if (!collections?.nodes || !url) return null;
    const handle = url.split('/').filter(Boolean).pop();
    const collection = collections.nodes.find((c: any) => c.handle === handle);
    return collection?.image?.url || null;
  };

  const normalizeMenuUrl = (url: string) =>
    url.includes('myshopify.com') ||
    url.includes(publicStoreDomain) ||
    url.includes(primaryDomainUrl)
      ? new URL(url).pathname
      : url;

  const rawItems = menu?.items?.length ? menu.items : [];
  const collectionItems = rawItems.filter(
    (item) => !['About', 'Contact'].includes(item.title)
  );
  const mobileCollectionCards = [
    {
      id: 'all-collections',
      title: 'All Collections',
      url: '/collections/all',
      imageUrl: '/menu-all-collections.png',
    },
    ...collectionItems
      .map((item) => {
        if (!item.url) return null;

        const url = normalizeMenuUrl(item.url);
        if (url === '/collections/all') return null;

        return {
          id: item.id,
          title: item.title,
          url,
          imageUrl: getCollectionImage(url),
        };
      })
      .filter(Boolean),
  ];

  return (
    <nav
      role="navigation"
      className="flex flex-col pt-2"
    >
      <div className="px-6 pb-5 pt-3">
        <p className="text-sm uppercase tracking-[0.2em] font-medium text-gold mb-5">
          Browse Collections
        </p>
        <div className="grid grid-cols-2 gap-2">
          {mobileCollectionCards.map((item) => {
            if (!item) return null;

            return (
              <NavLink
                key={item.id}
                to={item.url}
                end
                replace
                prefetch="intent"
                onClick={close}
                className={({ isActive }) =>
                  `group relative rounded-2xl overflow-hidden aspect-square flex items-end
             transition-all duration-300 active:scale-95 border border-border/40
             ${isActive ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`
                }
              >
                {/* Background image */}
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={400}
                    height={500}
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-active:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-muted to-muted-foreground/20" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-12 bg-linear-to-b from-black/20 to-transparent" />

                {/* Collection name */}
                <div className="relative w-full px-4 pb-4">
                  <p className="text-white text-sm tracking-[0.12em] uppercase leading-tight drop-shadow-sm line-clamp-2">
                    {item.title}
                  </p>
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="w-full h-px bg-border/60 my-2" />

      {/* ── Main Navigation ── */}
      <div className="flex flex-col px-6">
        <NavLink to="/" end replace onClick={close} className={navLinkClass}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="text-base font-medium">Home</span>
          {chevron}
        </NavLink>
        <NavLink to="/pages/about" replace onClick={close} className={navLinkClass}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <span className="text-base font-medium">About</span>
          {chevron}
        </NavLink>
        <NavLink to="/pages/contact" replace onClick={close} className={navLinkClass}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          <span className="text-base font-medium">Contact</span>
          {chevron}
        </NavLink>
        <NavLink to="/blogs" replace onClick={close} className={navLinkClass}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          <span className="text-base font-medium">Blog</span>
          {chevron}
        </NavLink>
      </div>

    </nav>
  );
}

function HeaderCtas({
  isLoggedIn,
  cart,
  scrolled,
  onSearchOpen,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart'> & {
  scrolled: boolean;
  onSearchOpen: () => void;
}) {
  return (
    <nav className="flex items-center gap-3 md:gap-4 ml-auto md:ml-0">
      {/* Inline Search Bar — desktop only */}
      <DesktopSearchBar />

      {/* Mobile search icon — only appears when scrolled (search bar collapsed) */}
      <button
        onClick={onSearchOpen}
        className={`md:hidden text-foreground transition-all duration-300 cursor-pointer
          ${scrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none w-0 overflow-hidden'}`}
        aria-label="Search"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {/* Account — desktop only (mobile uses bottom nav) */}
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
          className="w-5 h-5 xl:w-8 xl:h-8"
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
        className="w-7 h-7"
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
  const animatedPlaceholder = useAnimatedPlaceholder(SEARCH_PLACEHOLDERS);

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
          className="w-4 h-4 text-text-muted shrink-0"
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
          placeholder={animatedPlaceholder || 'Search…'}
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
          className="absolute top-full right-0 mt-2 w-80 lg:w-96 bg-card rounded-xl shadow-silver border border-border overflow-hidden z-200"
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
                                sizes="44px"
                                className="rounded-lg object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-main truncate">{product.title}</p>
                              {price && (
                                <span className="text-xs text-foreground font-medium">
                                  <Money withoutTrailingZeros data={price} />
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
                                sizes="44px"
                                className="rounded-lg object-cover shrink-0"
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

/** Inline search bar shown below header on mobile — collapses on scroll */
function MobileSearchBar({
  scrolled,
  isFocused,
  setIsFocused,
}: {
  scrolled: boolean;
  isFocused: boolean;
  setIsFocused: (v: boolean) => void;
}) {
  const animatedPlaceholder = useAnimatedPlaceholder(SEARCH_PLACEHOLDERS);

  return (
    <>
      <div
        className={`md:hidden overflow-visible transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${scrolled && !isFocused 
            ? 'max-h-0 opacity-0 -translate-y-4 pointer-events-none' 
            : 'max-h-18 opacity-100 translate-y-0'}`}
      >
        <div className="px-4 pb-4">
          <div className="predictive-search p-0">
            <SearchFormPredictive>
              {({ fetchResults, goToSearch, inputRef }) => (
                <div className={`flex items-center w-full rounded-[10px] px-4 py-2 gap-2.5 border transition-all duration-300 bg-card ${isFocused ? 'border-accent shadow-[0_0_0_1px_rgba(var(--color-accent),1)]' : 'border-border'}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-muted-foreground shrink-0"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    id="mobile-search-input"
                    name="q"
                    onChange={fetchResults}
                    onFocus={(e) => {
                      setIsFocused(true);
                      fetchResults(e);
                    }}
                    onBlur={() => {
                      // Small delay so picking a result works before blur hides it
                      setTimeout(() => setIsFocused(false), 200);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        goToSearch();
                        inputRef.current?.blur();
                        setIsFocused(false);
                      }
                    }}
                    placeholder={animatedPlaceholder || 'Search…'}
                    ref={inputRef}
                    type="search"
                    autoComplete="off"
                    className="flex-1 text-sm bg-transparent outline-none border-0 focus:ring-0 focus:border-0 placeholder:text-muted-foreground/70 font-body h-7 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                  />
                  {isFocused && inputRef?.current?.value && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // keep focus
                        if (inputRef.current) {
                          inputRef.current.value = '';
                          setIsFocused(false);
                        }
                      }}
                      className="w-5 h-5 rounded-full flex items-center justify-center bg-muted-foreground/20 text-foreground hover:bg-muted-foreground/40 transition-all duration-200 active:scale-90 shrink-0"
                      aria-label="Clear search"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </SearchFormPredictive>
          </div>
        </div>
      </div>

      {/* Fullscreen Mobile Search Results overlay */}
      <div 
        className={`md:hidden absolute top-full left-0 right-0 h-[calc(100vh-100%)] bg-background border-t border-border overflow-y-auto transition-all duration-300 ease-out z-45
        ${isFocused ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
      >
        <div className="px-5 pt-3 pb-8">
           <SearchResultsPredictive>
             {({ items, total, term, state, closeSearch }) => {
                const { articles, collections: searchCollections, pages, products, queries } = items;

                if (state === 'loading' && term.current) {
                  return (
                    <div className="mt-3">
                      <div className="p-3 text-sm opacity-60">Searching…</div>
                    </div>
                  );
                }

                if (!term.current) return null;

                if (!total) {
                  return (
                    <div className="mt-3">
                      <SearchResultsPredictive.Empty term={term} />
                    </div>
                  );
                }

                return (
                  <div className="mt-1">
                    <div className="flex flex-col gap-3 pb-2 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      <SearchResultsPredictive.Queries
                        queries={queries}
                        queriesDatalistId="mobile-fullscreen-search-queries"
                      />
                      <SearchResultsPredictive.Products
                        products={products}
                        closeSearch={() => { closeSearch(); setIsFocused(false); }}
                        term={term}
                      />
                      <SearchResultsPredictive.Collections
                        collections={searchCollections}
                        closeSearch={() => { closeSearch(); setIsFocused(false); }}
                        term={term}
                      />
                      <SearchResultsPredictive.Pages
                        pages={pages}
                        closeSearch={() => { closeSearch(); setIsFocused(false); }}
                        term={term}
                      />
                      <SearchResultsPredictive.Articles
                        articles={articles}
                        closeSearch={() => { closeSearch(); setIsFocused(false); }}
                        term={term}
                      />
                      {total ? (
                        <Link
                          onClick={() => { closeSearch(); setIsFocused(false); }}
                          to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                          className="block text-center p-3 mt-1 border-t border-border text-[11px] tracking-widest uppercase font-semibold text-foreground hover:underline"
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
    </>
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
        className="w-6 h-6 xl:w-8 xl:h-8"
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
