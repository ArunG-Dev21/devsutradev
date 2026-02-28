import { Suspense } from 'react';
import { Await, NavLink } from 'react-router';
import type { FooterQuery, HeaderQuery } from 'storefrontapi.generated';
import { SITE_NAME } from '~/lib/constants';

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
          <footer className="border-t border-primary-border text-text-main w-full">
            <div className="container mx-auto px-6 sm:px-10 lg:px-16 pt-10 pb-10">

              {/* ───────────── Main Section ───────────── */}
              <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-16">

                {/* LEFT — Branding */}
                <div className="w-full">
                  <div className="w-fit mr-auto">
                    <img
                      src="/icons/hindi-logo.png"
                      alt="Brand Logo"
                      className="w-72 lg:w-80 xl:w-180 object-contain dark:invert dark:brightness-0"
                    />
                  </div>
                </div>

                {/* RIGHT — Links */}
                <div className="lg:w-[60%]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-14">

                    {/* Quick Links */}
                    <div>
                      <h4 className="text-xs uppercase tracking-widest font-semibold mb-5">
                        Quick Links
                      </h4>
                      <ul className="space-y-3">
                        {[
                          { title: 'Home', url: '/' },
                          { title: 'Shop All', url: '/collections/all' },
                          { title: 'About Us', url: '/pages/about' },
                          { title: 'Contact', url: '/pages/contact' },
                          { title: 'Blog', url: '/blogs' },
                        ].map((link) => (
                          <li key={link.title}>
                            <NavLink
                              to={link.url}
                              prefetch="intent"
                              className="text-text-muted hover:text-text-main text-sm transition-colors duration-300"
                            >
                              {link.title}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Policies */}
                    <div>
                      <h4 className="text-xs uppercase tracking-widest font-semibold mb-5">
                        Policies
                      </h4>
                      <ul className="space-y-3">
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
                                  className="text-text-muted hover:text-text-main text-sm transition-colors duration-300"
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
                                className="text-text-muted hover:text-text-main text-sm transition-colors duration-300"
                              >
                                {link.title}
                              </NavLink>
                            </li>
                          ))}
                      </ul>
                    </div>

                    {/* Social */}
                    <div>
                      <h4 className="text-xs uppercase tracking-widest font-semibold mb-5">
                        Social
                      </h4>
                      <ul className="space-y-3">
                        {[
                          { label: 'Instagram', url: '#' },
                          { label: 'Facebook', url: '#' },
                          { label: 'YouTube', url: '#' },
                          { label: 'WhatsApp', url: '#' },
                        ].map((social) => (
                          <li key={social.label}>
                            <a
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-muted hover:text-text-main text-sm transition-colors duration-300"
                            >
                              {social.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>

              </div>

              {/* ───────────── Bottom Bar ───────────── */}
              <div className="border-t border-primary-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-text-muted">
                <div>
                  © {new Date().getFullYear()} {header.shop.name || SITE_NAME}
                </div>

                <div className="flex gap-6">
                  <span>All Rights Reserved</span>
                  <span>Made in India</span>
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