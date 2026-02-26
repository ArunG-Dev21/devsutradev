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
          <footer className="bg-bg-dark border-t border-primary-border text-text-main mt-0 relative z-10 w-full">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-10">

              {/* Top Section */}
              <div className="flex flex-col lg:flex-row justify-between items-start mb-20 gap-16 lg:gap-8">
                {/* Left side Tagline */}
                <div className="lg:w-1/3">
                  <h3 className="text-3xl md:text-5xl font-subheading tracking-tight text-text-main mb-6">
                    Experience divine craftsmanship.
                  </h3>
                  <p className="text-text-muted text-lg leading-relaxed max-w-md">
                    Authentic devotional ornaments handcrafted with love and
                    blessed by spiritual experts.
                  </p>
                </div>

                {/* Right side Links */}
                <div className="flex flex-wrap lg:justify-end gap-16 sm:gap-24 w-full lg:w-2/3">
                  {/* Quick Links */}
                  <div className="flex flex-col">
                    <ul className="space-y-5">
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
                            className="text-text-muted hover:text-text-main text-[15px] font-medium transition-colors duration-300"
                          >
                            {link.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Policies */}
                  <div className="flex flex-col">
                    <ul className="space-y-5">
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
                                className="text-text-muted hover:text-text-main text-[15px] font-medium transition-colors duration-300"
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
                              className="text-text-muted hover:text-text-main text-[15px] font-medium transition-colors duration-300"
                            >
                              {link.title}
                            </NavLink>
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Socials */}
                  <div className="flex flex-col">
                    <ul className="space-y-5">
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
                            className="text-text-muted hover:text-text-main text-[15px] font-medium transition-colors duration-300"
                          >
                            {social.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Massive Brand Name */}
              <div className="w-full flex justify-center items-center mt-10 mb-10 cursor-default select-none">
                <span className="text-[13vw] sm:text-[10vw] leading-none font-bold tracking-tighter text-text-main uppercase font-heading">
                  {header.shop.name || SITE_NAME}
                </span>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-primary-border pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-text-main font-bold tracking-wider uppercase flex items-center gap-2">
                  <span className="text-lg">©</span>
                  {new Date().getFullYear()} {header.shop.name || SITE_NAME}
                </div>

                <div className="flex flex-wrap justify-center gap-6">
                  {['Privacy Policy', 'Terms of Service', 'Refund Policy'].map((item) => (
                    <NavLink
                      key={item}
                      to={`/policies/${item.toLowerCase().replace(/ /g, '-')}`}
                      className="text-text-muted text-sm hover:text-text-main transition-colors"
                    >
                      {item}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </footer>
        )
        }
      </Await >
    </Suspense >
  );
}

const FALLBACK_POLICY_LINKS = [
  { title: 'Privacy Policy', url: '/policies/privacy-policy' },
  { title: 'Refund Policy', url: '/policies/refund-policy' },
  { title: 'Shipping Policy', url: '/policies/shipping-policy' },
  { title: 'Terms of Service', url: '/policies/terms-of-service' },
];