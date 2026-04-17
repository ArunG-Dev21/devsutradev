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
import { useAside } from '~/shared/components/Aside';
import { SEARCH_ENDPOINT, SearchFormPredictive } from '~/features/search/components/SearchFormPredictive';
import { SearchResultsPredictive } from '~/features/search/components/SearchResultsPredictive';
import { BrandLogo } from '~/shared/components/BrandLogo';
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

  // Accumulate per-frame deltas so smooth-scroll (Lenis) doesn't break detection.
  // The old per-frame threshold never fired because Lenis spreads movement across
  // many frames (~5–10px each), so the single-frame delta never reached 40px.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let prevY = window.scrollY;
    let accumulated = 0;
    let rafId: number;

    const COLLAPSE_PX = 50;  // accumulated downward px before hiding first header
    const EXPAND_PX   = 25;  // accumulated upward px before showing it again

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - prevY;
        prevY = y;

        if (y <= 8) {
          accumulated = 0;
          setScrolled(false);
          return;
        }

        // Reset accumulation when direction reverses
        if ((delta > 0 && accumulated < 0) || (delta < 0 && accumulated > 0)) {
          accumulated = 0;
        }
        accumulated += delta;

        if (accumulated > COLLAPSE_PX) {
          accumulated = 0;
          setScrolled(true);
        } else if (accumulated < -EXPAND_PX) {
          accumulated = 0;
          setScrolled(false);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
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
    <header ref={headerRef} className="sticky top-0 z-50 bg-background text-foreground transition-all duration-300">
      <div className={`relative z-20 transition-all duration-300 md:border-b md:border-border
        grid ease-in-out
        ${scrolled ? 'grid-rows-[0fr] opacity-0 md:border-b-0' : 'grid-rows-[1fr] opacity-100'}
      `}>
        <div className={`min-h-0 ${scrolled ? 'overflow-hidden' : 'overflow-visible md:overflow-visible'}`}>
          <div className="container px-3 mx-auto sm:px-6 lg:px-8 py-3 lg:py-4 flex items-center justify-between relative">

            {/* 1. Left Section — hamburger (mobile) | search bar (desktop) */}
            <div className="flex items-center gap-3 shrink-0 z-10">
              {/* Mobile: hamburger toggle */}
              <div className="md:hidden">
                <HeaderMenuMobileToggle />
              </div>
              {/* Desktop: search bar on the left */}
              <div className="hidden md:block">
                <DesktopSearchBar />
              </div>
            </div>

            {/* 2. Center Section — Logo always centered absolutely */}
            <div className="absolute inset-x-0 flex justify-center pointer-events-none z-0">
              <NavLink
                to="/"
                end
                prefetch="intent"
                className="flex items-center pointer-events-auto"
              >
                <BrandLogo
                  lightSrc={BRAND_LOGO_LIGHT_SRC}
                  darkSrc={BRAND_LOGO_DARK_SRC}
                  alt={shop.name}
                  className="h-8 md:h-8 lg:h-9 xl:h-11 2xl:h-12 w-auto object-contain"
                />
              </NavLink>
            </div>

            {/* 3. Right Section (Icons & Links) */}
            <div className="flex items-center justify-end gap-2 md:gap-2 lg:gap-3 xl:gap-5 shrink-0 z-10">

              {/* Account and Cart Icons */}
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

              {/* Vertical Decorative Divider */}
              <div className="hidden md:block w-px h-6 bg-border/80 mx-1 lg:mx-2" />

              {/* About and Help Dropdowns */}
              <div className="hidden md:flex items-center gap-3 lg:gap-5 xl:gap-8">
                <HeaderDropdown title="About" items={ABOUT_LINKS} />
                <HeaderDropdown title="Help" items={HELP_LINKS} />
              </div>
            </div>

          </div>
        </div>
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

  const SECONDARY_NAV_ITEMS = [
    { title: 'Karungali', handle: 'karungali' },
    { title: 'Rudraksha', handle: 'rudraksha' },
    { title: 'Bracelets', handle: 'bracelets' },
    { title: 'Shiva Idols', handle: 'shiva-idols' },
    { title: 'Pyrite Stones', handle: 'pyrite-stones' },
    { title: 'Pyramids', handle: 'pyramids' },
  ];

  return (
    <>
      <div className="hidden md:block w-full bg-background md:border-b md:border-border shadow-[0_4px_10px_rgb(0,0,0,0.02)]">
        <div className="w-full overflow-x-auto no-scrollbar py-2.5 2xl:py-3 px-4 xl:px-8 text-center whitespace-nowrap">
          <nav className="inline-flex items-center gap-3 lg:gap-4 align-middle">
            {SECONDARY_NAV_ITEMS.map((item) => {
              const url = `/collections/${item.handle}`;
              const imageUrl = getCollectionImage(url);

              return (
                <NavLink
                  key={item.handle}
                  to={url}
                  end
                  prefetch="intent"
                  className={({ isActive }) =>
                    `
                    group relative
                    pr-6 pl-2 py-1.5
                    text-xs lg:text-[13px] tracking-[0.1em]
                    uppercase
                    font-semibold
                    rounded-[30px]
                    flex items-center gap-3
                    transition-all duration-300
                    border
                    ${isActive
                      ? 'bg-[#F14514] text-white border-[#F14514] shadow-md'
                      : 'text-foreground bg-card border-border hover:border-[#F14514] hover:text-[#F14514] shadow-xs'
                    }
                  `
                  }
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.title}
                      width={100}
                      height={100}
                      sizes="100px"
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover shrink-0 border border-black/10 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-muted border border-black/10 shrink-0" />
                  )}
                  <span className="relative z-10 whitespace-nowrap leading-none mt-[2px]">{item.title}</span>
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
    `group flex items-center gap-4 py-3.5 transition-colors duration-200 ${isActive
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

  const SECONDARY_NAV_ITEMS = [
    { title: 'Karungali', handle: 'karungali' },
    { title: 'Rudraksha', handle: 'rudraksha' },
    { title: 'Bracelets', handle: 'bracelets' },
    { title: 'Shiva Idols', handle: 'shiva-idols' },
    { title: 'Pyrite Stones', handle: 'pyrite-stones' },
    { title: 'Pyramids', handle: 'pyramids' },
  ];

  const mobileCollectionCards = [
    {
      id: 'all-collections',
      title: 'All Collections',
      url: '/collections/all',
      imageUrl: '/menu-all-collections.png',
    },
    ...SECONDARY_NAV_ITEMS.map((item) => ({
      id: item.handle,
      title: item.title,
      url: `/collections/${item.handle}`,
      imageUrl: getCollectionImage(`/collections/${item.handle}`),
    })),
  ];

  return (
    <nav
      role="navigation"
      className="flex flex-col pt-2"
    >
      <div className="px-6 pb-5 pt-3">
        <p className="text-sm uppercase tracking-[0.2em] font-medium text-[#F14514] mb-5">
          Browse Collections
        </p>
        <div className="grid grid-cols-3 gap-2">
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
                <div className="relative w-full px-2.5 pb-2.5">
                  <p className="text-white text-[10px] tracking-[0.08em] uppercase leading-tight line-clamp-2">
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
    <nav className="flex items-center gap-3 md:gap-5 ml-auto md:ml-0">
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
      className="p-1.5 border border-black rounded-full hover:text-accent transition cursor-pointer flex items-center justify-center"
      aria-label="Open menu"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-8 h-8 md:w-9 md:h-9"
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
    <div ref={containerRef} className="hidden md:block relative group/search">
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-transparent rounded-[30px] px-3 md:px-4 lg:px-5 py-2 md:py-2 lg:py-2.5 2xl:py-3 gap-2 lg:gap-3 w-44 md:w-44 lg:w-64 xl:w-[22rem] 2xl:w-[28rem] transition-all duration-300 border border-gray-300 hover:border-gold focus-within:!border-gold focus-within:shadow-[0_0_0_1px_#BC9251]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-gray-800 shrink-0 transition-colors group-focus-within/search:text-[#F14514]"
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
          className="header-search-input flex-1 text-xs md:text-xs lg:text-sm xl:text-base text-gray-800 placeholder-gray-800 bg-transparent outline-none ring-0 border-none shadow-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
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
        <div className="px-4 pb-3">
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
      className="relative p-1.5 border border-black rounded-full text-foreground transition cursor-pointer flex items-center justify-center"
      aria-label={`Cart with ${count ?? 0} items`}
    >
      <img
        src="/icons/bag-icon.png"
        alt=""
        width={36}
        height={36}
        className="w-7 h-7 md:w-8 md:h-8 object-contain"
        loading="lazy"
      />
      {(count ?? 0) > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-black text-white"
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
}

// ============================================
// HEADER DROPDOWN COMPONENT & ICONS
// ============================================

const MapPinIcon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PhoneIcon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const DocumentIcon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SparklesIcon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const GridIcon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const StarIcon = <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;

const ABOUT_LINKS = [
  { label: 'Our Story', url: '/pages/about', icon: SparklesIcon },
  { label: 'Our Collections', url: '/collections', icon: GridIcon },
  { label: 'All Products', url: '/collections/all', icon: StarIcon },
];

const HELP_LINKS = [
  { label: 'Track Order', url: '/account', icon: MapPinIcon },
  { label: 'Contact Us', url: '/pages/contact', icon: PhoneIcon },
  { label: 'Return & Refund Policy', url: '/policies/refund-policy', icon: DocumentIcon },
  { label: 'Shipping Policy', url: '/policies/shipping-policy', icon: DocumentIcon },
];

function HeaderDropdown({ title, items }: { title: string; items: typeof ABOUT_LINKS }) {
  return (
    <div className="relative group">
      {/* Trigger */}
      <button className="flex items-center gap-1 lg:gap-1.5 text-[10px] md:text-[10px] lg:text-xs xl:text-sm tracking-[0.12em] uppercase text-foreground hover:text-[#F14514] transition-colors duration-300 py-1.5 lg:py-2">
        {title}
        <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Card */}
      <div className="absolute top-full left-0 mt-3 w-64 bg-card border border-border rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top group-hover:translate-y-0 translate-y-3 z-50">

        {/* Top Floating Arrow */}
        <div className="absolute -top-[7px] left-6 w-3.5 h-3.5 bg-card border-l border-t border-border rotate-45" />

        <div className="flex flex-col py-3 px-2 relative z-10 bg-card rounded-2xl">
          {items.map((item, i) => (
            <div key={item.label}>
              <NavLink
                to={item.url}
                className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors duration-200 group/item"
              >
                <div className="text-muted-foreground group-hover/item:text-[#F14514] transition-colors">
                  {item.icon}
                </div>
                <span className="text-[13px] font-medium text-foreground group-hover/item:text-[#F14514] transition-colors">
                  {item.label}
                </span>
              </NavLink>
              {i < items.length - 1 && <div className="h-px bg-border/50 mx-4 my-1" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
