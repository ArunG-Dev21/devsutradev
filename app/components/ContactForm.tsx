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
            <p className="text-xs tracking-[0.3em] uppercase mb-3 text-accent font-medium">
                Get In Touch
            </p>
            <h2 className="text-2xl md:text-3xl font-heading font-medium text-text-main text-glow mb-6">
                Contact Us
            </h2>

            {submitted ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                        <div className="text-4xl mb-4">✓</div>
                        <p className="text-lg font-medium mb-2">Thank You!</p>
                        <p className="text-sm text-text-muted">
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
                        className="w-full px-4 py-3 bg-bg-light border border-primary-border text-text-main placeholder-text-muted rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shadow-silver transition-all duration-300"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Your Email"
                        required
                        className="w-full px-4 py-3 bg-bg-light border border-primary-border text-text-main placeholder-text-muted rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shadow-silver transition-all duration-300"
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        className="w-full px-4 py-3 bg-bg-light border border-primary-border text-text-main placeholder-text-muted rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shadow-silver transition-all duration-300"
                    />
                    <textarea
                        name="message"
                        placeholder="Your Message"
                        rows={4}
                        required
                        className="w-full px-4 py-3 bg-bg-light border border-primary-border text-text-main placeholder-text-muted rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent shadow-silver transition-all duration-300 resize-none"
                    />
                    <button
                        type="submit"
                        className="w-full py-3 text-sm tracking-[0.15em] uppercase font-semibold rounded-lg bg-accent text-bg-dark shadow-glow transition-all duration-300 hover:bg-white cursor-pointer"
                    >
                        Send Message
                    </button>
                </form>
            )}
        </div>
    );
}
