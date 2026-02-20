import { useState } from 'react';

/**
 * Quick contact form — right side of the testimonials section.
 */
export function ContactForm() {
    const [submitted, setSubmitted] = useState(false);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        // For now, show success toast. User can connect to backend later.
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
    }

    return (
        <div className="flex flex-col h-full">
            <p
                className="text-xs tracking-[0.3em] uppercase mb-3"
                style={{ color: '#C5A355' }}
            >
                Get In Touch
            </p>
            <h2
                className="text-2xl md:text-3xl font-light mb-6"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
                Contact Us
            </h2>

            {submitted ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">✓</div>
                        <p className="text-lg font-medium mb-2">Thank You!</p>
                        <p className="text-sm text-neutral-500">
                            We&apos;ll get back to you shortly.
                        </p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 max-w-full">
                    <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        required
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A355]/50 focus:border-[#C5A355] transition"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        required
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A355]/50 focus:border-[#C5A355] transition"
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A355]/50 focus:border-[#C5A355] transition"
                    />
                    <textarea
                        name="message"
                        placeholder="Your Message"
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C5A355]/50 focus:border-[#C5A355] transition resize-none"
                    />
                    <button
                        type="submit"
                        className="w-full py-3 text-sm tracking-[0.15em] uppercase font-semibold rounded-lg transition-all duration-300 hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: '#C5A355', color: '#fff' }}
                    >
                        Send Message
                    </button>

                    {/* Social Links */}
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-neutral-400">Follow us:</span>
                        {['IG', 'FB', 'YT', 'WA'].map((social) => (
                            <a
                                key={social}
                                href="#"
                                className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 hover:border-[#C5A355] hover:text-[#C5A355] transition"
                            >
                                {social}
                            </a>
                        ))}
                    </div>
                </form>
            )}
        </div>
    );
}
