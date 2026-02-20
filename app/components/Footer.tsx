import { Suspense } from 'react';
import { Await, NavLink } from 'react-router';
import type { FooterQuery, HeaderQuery } from 'storefrontapi.generated';
import { SITE_NAME, SITE_TAGLINE } from '~/lib/constants';

interface FooterProps {
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery;
  publicStoreDomain: string;
}

export function Footer({
  footer: footerPromise,
  header,
  publicStoreDomain,
}: FooterProps) {
  return (
    <Suspense>
      <Await resolve={footerPromise}>
        {(footer) => (
          <footer className="bg-neutral-950 text-white mt-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              {/* 4-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
                {/* Column 1 — Brand */}
                <div>
                  <h3
                    className="text-xl font-bold tracking-[0.15em] uppercase mb-3"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {header.shop.name || SITE_NAME}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                    {SITE_TAGLINE}
                  </p>
                  <p className="text-neutral-500 text-xs leading-relaxed">
                    Authentic devotional ornaments handcrafted with love and
                    blessed by spiritual experts. Bringing divine energy to your
                    doorstep.
                  </p>
                </div>

                {/* Column 2 — Quick Links */}
                <div>
                  <h4 className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4 font-semibold">
                    Quick Links
                  </h4>
                  <ul className="space-y-2.5">
                    {[
                      { title: 'Home', url: '/' },
                      { title: 'Shop All', url: '/collections/all' },
                      { title: 'About Us', url: '/pages/about' },
                      { title: 'Contact', url: '/pages/contact' },
                    ].map((link) => (
                      <li key={link.title}>
                        <NavLink
                          to={link.url}
                          prefetch="intent"
                          className="text-neutral-300 text-sm hover:text-[#C5A355] transition duration-300"
                        >
                          {link.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3 — Policies */}
                <div>
                  <h4 className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4 font-semibold">
                    Policies
                  </h4>
                  <ul className="space-y-2.5">
                    {footer?.menu
                      ? footer.menu.items.map((item) => {
                        if (!item.url) return null;
                        const url =
                          item.url.includes('myshopify.com') ||
                            item.url.includes(publicStoreDomain) ||
                            item.url.includes(
                              header.shop.primaryDomain?.url || '',
                            )
                            ? new URL(item.url).pathname
                            : item.url;
                        return (
                          <li key={item.id}>
                            <NavLink
                              to={url}
                              prefetch="intent"
                              className="text-neutral-300 text-sm hover:text-[#C5A355] transition duration-300"
                            >
                              {item.title}
                            </NavLink>
                          </li>
                        );
                      })
                      : FALLBACK_POLICY_LINKS.map((link) => (
                        <li key={link.title}>
                          <NavLink
                            to={link.url}
                            className="text-neutral-300 text-sm hover:text-[#C5A355] transition duration-300"
                          >
                            {link.title}
                          </NavLink>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Column 4 — Contact & Social */}
                <div>
                  <h4 className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4 font-semibold">
                    Get In Touch
                  </h4>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">📧</span>
                      <span>support@devasutra.com</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">📞</span>
                      <span>+91 XXXXX XXXXX</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">📍</span>
                      <span>India</span>
                    </li>
                  </ul>

                  {/* Social Icons */}
                  <div className="flex gap-3 mt-5">
                    {[
                      { label: 'Instagram', icon: 'IG', url: '#' },
                      { label: 'Facebook', icon: 'FB', url: '#' },
                      { label: 'YouTube', icon: 'YT', url: '#' },
                      { label: 'WhatsApp', icon: 'WA', url: '#' },
                    ].map((social) => (
                      <a
                        key={social.label}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full border border-neutral-700 flex items-center justify-center text-xs text-neutral-400 hover:border-[#C5A355] hover:text-[#C5A355] transition duration-300"
                        aria-label={social.label}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-neutral-500 text-xs tracking-wide">
                  © {new Date().getFullYear()} {header.shop.name || SITE_NAME}
                  . All rights reserved.
                </p>
                <div className="flex items-center gap-3">
                  {['Visa', 'MC', 'UPI', 'GPay'].map((pm) => (
                    <span
                      key={pm}
                      className="px-2 py-1 text-[10px] border border-neutral-700 rounded text-neutral-500 uppercase tracking-wider"
                    >
                      {pm}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </footer>
        )}
      </Await>
    </Suspense>
  );
}

const FALLBACK_POLICY_LINKS = [
  { title: 'Privacy Policy', url: '/policies/privacy-policy' },
  { title: 'Refund Policy', url: '/policies/refund-policy' },
  { title: 'Shipping Policy', url: '/policies/shipping-policy' },
  { title: 'Terms of Service', url: '/policies/terms-of-service' },
];