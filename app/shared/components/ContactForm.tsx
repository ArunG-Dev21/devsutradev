import { useState, useRef } from "react";

// ─── Validation Helpers ──────────────────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^\+?[0-9\s\-()]{7,15}$/;
// Spam patterns — catches common bot payloads
const SPAM_PATTERNS = [
    /https?:\/\//i,          // Links
    /\[url/i,                // BBCode
    /<\s*a\s+href/i,         // HTML links
    /buy\s+now/i,            // Spam phrases
    /click\s+here/i,
    /free\s+money/i,
    /viagra|cialis|crypto/i,
    /(.)\1{6,}/,             // Repeated chars (aaaaaaa)
];

function hasSpam(text: string): boolean {
    return SPAM_PATTERNS.some((p) => p.test(text));
}

function validateName(v: string): string | null {
    if (!v.trim()) return "Name is required";
    if (v.trim().length < 2) return "Name is too short";
    if (v.trim().length > 60) return "Name is too long";
    if (hasSpam(v)) return "Invalid content detected";
    return null;
}

function validateEmail(v: string): string | null {
    if (!v.trim()) return "Email is required";
    if (!EMAIL_RE.test(v.trim())) return "Enter a valid email address";
    return null;
}

function validatePhone(v: string): string | null {
    if (v.trim() && !PHONE_RE.test(v.trim())) return "Enter a valid phone number";
    return null;
}

function validateMessage(v: string): string | null {
    if (!v.trim()) return "Message is required";
    if (v.trim().length < 10) return "Message is too short (min 10 characters)";
    if (v.trim().length > 1000) return "Message is too long (max 1000 characters)";
    if (hasSpam(v)) return "Invalid content detected";
    return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ContactForm() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const honeypotRef = useRef<HTMLInputElement>(null);
    const formStartTime = useRef(Date.now());

    const validate = () => {
        const e = {
            name: validateName(form.name),
            email: validateEmail(form.email),
            phone: validatePhone(form.phone),
            message: validateMessage(form.message),
        };
        setErrors(e);
        return !Object.values(e).some(Boolean);
    };

    const handleBlur = (field: string) => {
        setTouched((t) => ({ ...t, [field]: true }));
        // Validate single field on blur
        const validators: Record<string, (v: string) => string | null> = {
            name: validateName,
            email: validateEmail,
            phone: validatePhone,
            message: validateMessage,
        };
        if (validators[field]) {
            setErrors((prev) => ({ ...prev, [field]: validators[field]((form as any)[field]) }));
        }
    };

    const handleChange = (field: string, value: string) => {
        setForm((f) => ({ ...f, [field]: value }));
        // Clear error on type if field was touched
        if (touched[field]) {
            const validators: Record<string, (v: string) => string | null> = {
                name: validateName,
                email: validateEmail,
                phone: validatePhone,
                message: validateMessage,
            };
            if (validators[field]) {
                setErrors((prev) => ({ ...prev, [field]: validators[field](value) }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Honeypot check — bots fill hidden fields
        if (honeypotRef.current?.value) return;

        // Time-based check — bots submit too fast (< 3 seconds)
        if (Date.now() - formStartTime.current < 3000) return;

        if (!validate()) return;

        setStatus("submitting");

        // TODO: Connect to Web3Forms or WhatsApp API
        // For now, simulate success after a brief delay
        try {
            await new Promise((r) => setTimeout(r, 1200));

            // Placeholder: replace with actual API call
            console.warn("Contact form submitted:", {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                message: form.message.trim(),
            });

            setStatus("success");
            setForm({ name: "", email: "", phone: "", message: "" });
            setTouched({});
            setErrors({});

            // Reset after 5 seconds
            setTimeout(() => setStatus("idle"), 5000);
        } catch {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 4000);
        }
    };

    const inputBase =
        "w-full px-4 py-3 bg-input border rounded-xl text-sm text-foreground placeholder-muted-foreground/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50";

    return (
        <form onSubmit={(e) => { void handleSubmit(e); }} noValidate className="space-y-5">
            {/* Honeypot — invisible to humans */}
            <div className="absolute opacity-0 h-0 overflow-hidden" aria-hidden="true">
                <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            {/* Name + Email row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <input
                        type="text"
                        placeholder="Your Name *"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        className={`${inputBase} ${touched.name && errors.name ? "border-red-300 focus:ring-red-200" : "border-gold-muted/20"}`}
                        maxLength={60}
                    />
                    {touched.name && errors.name && (
                        <p className="mt-1.5 text-xs text-red-500 pl-1">{errors.name}</p>
                    )}
                </div>
                <div>
                    <input
                        type="email"
                        placeholder="Your Email *"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        className={`${inputBase} ${touched.email && errors.email ? "border-red-300 focus:ring-red-200" : "border-gold-muted/20"}`}
                    />
                    {touched.email && errors.email && (
                        <p className="mt-1.5 text-xs text-red-500 pl-1">{errors.email}</p>
                    )}
                </div>
            </div>

            {/* Phone */}
            <div>
                <input
                    type="tel"
                    placeholder="Phone Number (optional)"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    className={`${inputBase} ${touched.phone && errors.phone ? "border-red-300 focus:ring-red-200" : "border-gold-muted/20"}`}
                />
                {touched.phone && errors.phone && (
                    <p className="mt-1.5 text-xs text-red-500 pl-1">{errors.phone}</p>
                )}
            </div>

            {/* Message */}
            <div>
                <textarea
                    placeholder="How can we help you? *"
                    rows={4}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    onBlur={() => handleBlur("message")}
                    className={`${inputBase} resize-none ${touched.message && errors.message ? "border-red-300 focus:ring-red-200" : "border-gold-muted/20"}`}
                    maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                    {touched.message && errors.message ? (
                        <p className="text-xs text-red-500 pl-1">{errors.message}</p>
                    ) : (
                        <span />
                    )}
                    <span className="text-[10px] text-muted-foreground">{form.message.length}/1000</span>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={status === "submitting"}
                className={`w-full sm:w-auto px-8 py-3 text-sm font-medium tracking-wider uppercase rounded-xl transition-all duration-300 disabled:cursor-not-allowed ${status === "success"
                    ? "bg-green-600 text-white"
                    : status === "error"
                        ? "bg-red-500 text-white"
                        : "bg-foreground text-background hover:bg-gold hover:text-white"
                    }`}
            >
                {status === "submitting" ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                    </span>
                ) : status === "success" ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Message Sent!
                    </span>
                ) : status === "error" ? (
                    "Something went wrong — try again"
                ) : (
                    "Send Message"
                )}
            </button>
        </form>
    );
}
