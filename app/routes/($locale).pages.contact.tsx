import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
  return [{ title: 'Contact Support | Devasutra' }];
};

export default function Contact() {
  return (
    <div className="min-h-screen text-stone-900 dark:bg-background dark:text-foreground overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 px-6 flex flex-col items-center justify-center text-center">
        {/* Soft Radial Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-200/50 via-stone-50 to-stone-50 dark:from-neutral-900/40 dark:via-background dark:to-background -z-10" />

        <span className="text-xs font-bold tracking-[0.3em] text-stone-500 dark:text-muted-foreground uppercase mb-6">
          Reach Out
        </span>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide text-stone-900 dark:text-foreground mb-6"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          We Are Here To Help
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-stone-600 dark:text-muted-foreground leading-relaxed">
          Questions about sizing, cleansing rituals for your Rudraksha, or the
          consecration process? Our team of spiritual consultants is available
          to guide you.
        </p>
      </section>

      {/* Main Content Layout */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-5 gap-12 lg:gap-24">
        {/* Left Column: Direct Info */}
        <div className="md:col-span-2 flex flex-col gap-10">
          <div>
            <h3
              className="text-xl font-serif text-stone-900 dark:text-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Get in Touch
            </h3>
            <ul className="flex flex-col gap-6">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-muted flex items-center justify-center shrink-0 border border-stone-200/50 dark:border-border">
                  <svg
                    className="w-5 h-5 text-stone-600 dark:text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest text-stone-500 dark:text-muted-foreground uppercase mb-1">
                    Email
                  </p>
                  <a
                    href="mailto:support@devasutra.com"
                    className="text-stone-900 dark:text-foreground font-medium hover:text-stone-600 dark:hover:text-muted-foreground transition-colors"
                  >
                    support@devasutra.com
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-muted flex items-center justify-center shrink-0 border border-stone-200/50 dark:border-border">
                  <svg
                    className="w-5 h-5 text-stone-600 dark:text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.273-3.974-6.869-6.87l1.292-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold tracking-widest text-stone-500 dark:text-muted-foreground uppercase mb-1">
                    Phone (Call or WhatsApp)
                  </p>
                  <p className="text-stone-900 dark:text-foreground font-medium">
                    +91 98765 43210
                  </p>
                  <p className="text-sm text-stone-500 dark:text-muted-foreground mt-1">
                    Mon - Sat, 10am to 7pm IST
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-stone-900 rounded-2xl text-stone-50 shadow-lg">
            <h3
              className="text-xl font-serif mb-3 text-white"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Wholesale Inquiries
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">
              For bulk orders of Rudraksha malas or Karungali artifacts for
              corporate gifting or spiritual centers, please reach out directly.
            </p>
            <a
              href="mailto:wholesale@devasutra.com"
              className="inline-block text-sm font-bold tracking-widest uppercase border-b border-stone-500 pb-1 hover:border-white transition-colors"
            >
              Contact Wholesale
            </a>
          </div>
        </div>

        {/* Right Column: High-End Contact Form */}
        <div className="md:col-span-3 bg-white dark:bg-card p-8 sm:p-12 rounded-3xl border border-stone-200/80 dark:border-border shadow-sm relative overflow-hidden">
          {/* Abstract Decorative SVG inside Form */}
          <svg
            className="absolute top-0 right-0 text-stone-50 dark:text-white/5 w-64 h-64 -translate-y-1/2 translate-x-1/3 rotate-45 pointer-events-none"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50 0L61 39L100 50L61 61L50 100L39 61L0 50L39 39Z" />
          </svg>

          <h3
            className="text-2xl font-light mb-8 relative z-10"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Send a Message
          </h3>

          <form
            className="relative z-10 flex flex-col gap-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="name"
                  className="text-xs font-bold tracking-widest text-stone-500 dark:text-muted-foreground uppercase"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full  dark:bg-background border border-stone-200 dark:border-border text-stone-900 dark:text-foreground placeholder:text-stone-400 dark:placeholder:text-muted-foreground rounded-lg px-4 py-3 focus:outline-none focus:border-stone-400 dark:focus:border-ring focus:bg-white dark:focus:bg-background transition-colors"
                  placeholder="e.g. Anjali Sharma"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-xs font-bold tracking-widest text-stone-500 dark:text-muted-foreground uppercase"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full dark:bg-background border border-stone-200 dark:border-border text-stone-900 dark:text-foreground placeholder:text-stone-400 dark:placeholder:text-muted-foreground rounded-lg px-4 py-3 focus:outline-none focus:border-stone-400 dark:focus:border-ring focus:bg-white dark:focus:bg-background transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="subject"
                className="text-xs font-bold tracking-widest text-stone-500 dark:text-muted-foreground uppercase"
              >
                Subject
              </label>
              <select
                id="subject"
                className="w-full dark:bg-background border border-stone-200 dark:border-border text-stone-900 dark:text-foreground rounded-lg px-4 py-3 focus:outline-none focus:border-stone-400 dark:focus:border-ring focus:bg-white dark:focus:bg-background transition-colors appearance-none"
              >
                <option value="order">Order Support &amp; Tracking</option>
                <option value="product">Product Information</option>
                <option value="ritual">Ritual &amp; Consecration Query</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="message"
                className="text-xs font-bold tracking-widest text-stone-500 dark:text-muted-foreground uppercase"
              >
                Your Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full dark:bg-background border border-stone-200 dark:border-border text-stone-900 dark:text-foreground placeholder:text-stone-400 dark:placeholder:text-muted-foreground rounded-lg px-4 py-3 focus:outline-none focus:border-stone-400 dark:focus:border-ring focus:bg-white dark:focus:bg-background transition-colors resize-none"
                placeholder="How can we assist you today?"
              ></textarea>
            </div>

            <button
              type="button"
              className="mt-4 w-full sm:w-auto self-start bg-stone-900 text-white font-bold tracking-widest uppercase text-[11px] px-10 py-4 rounded-full hover:bg-stone-800 transition-colors shadow-md"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

