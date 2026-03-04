import { useEffect, useState } from 'react';

export function ProductShare({ title }: { title: string }) {
    const [url, setUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setUrl(window.location.href);
    }, []);

    if (!url) return null;

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    // Social share links configuration
    const socialLinks = [
        {
            name: 'WhatsApp',
            href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
            className: 'hover:bg-[#25D366] hover:text-white hover:border-[#25D366]',
            icon: <WhatsAppIcon />,
        },
        {
            name: 'Facebook',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            className: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]',
            icon: <FacebookIcon />,
        },
        {
            name: 'X (Twitter)',
            href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            className: 'hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white',
            icon: <XIcon />,
        },
        {
            name: 'Email',
            href: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Check this out: ${title}\n\n${url}`)}`,
            className: 'hover:bg-gray-600 hover:text-white hover:border-gray-600',
            icon: <EmailIcon />,
        },
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-bold">
                    Share Product
                </p>
                <span className="w-12 h-px bg-border/60 hidden sm:block"></span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {socialLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground transition-all duration-300 hover:-translate-y-1 shadow-sm ${link.className}`}
                        aria-label={`Share on ${link.name}`}
                    >
                        {link.icon}
                    </a>
                ))}

                <div className="w-px h-8 bg-border mx-1 hidden sm:block"></div>

                <button
                    onClick={copyToClipboard}
                    className="group relative flex items-center gap-2 px-4 h-10 rounded-full bg-muted/30 border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-all duration-300 ml-auto sm:ml-0"
                    type="button"
                >
                    {copied ? (
                        <CheckIcon className="w-4 h-4 text-green-500 group-hover:text-background" />
                    ) : (
                        <LinkIcon className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                    )}
                    <span className="text-xs font-semibold">
                        {copied ? 'Copied' : 'Copy Link'}
                    </span>
                </button>
            </div>
        </div>
    );
}

/* ---------------------------------- Icons --------------------------------- */

function WhatsAppIcon() {
    return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
    );
}

function FacebookIcon() {
    return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function EmailIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function LinkIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}
