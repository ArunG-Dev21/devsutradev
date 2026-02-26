import { useEffect, useMemo, useState } from 'react';

export function ProductShare({ title }: { title: string }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const shareText = useMemo(() => {
    if (!url) return '';
    return `${title} — ${url}`;
  }, [title, url]);

  if (!url) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-6">
      <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-3 font-semibold">
        Share
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodedText}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400 transition-colors text-xs no-underline"
          title="Share on WhatsApp"
        >
          <WhatsAppIcon />
          WhatsApp
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400 transition-colors text-xs no-underline"
          title="Share on Facebook"
        >
          <FacebookIcon />
          Facebook
        </a>

        <button
          type="button"
          onClick={() => {
            void copy().finally(() => {
              window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
            });
          }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400 transition-colors text-xs cursor-pointer"
          title="Copy link and open Instagram"
        >
          <InstagramIcon />
          Instagram
        </button>

        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-stone-200 bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400 transition-colors text-xs cursor-pointer"
          title="Copy link"
        >
          <LinkIcon />
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.5 3.5A11 11 0 0 0 3.9 18.7L3 22l3.4-.9A11 11 0 0 0 20.5 3.5Zm-8.9 17A9 9 0 0 1 6.8 19l-.3-.2-2 .5.5-1.9-.2-.3A9 9 0 1 1 11.6 20.5Zm5.2-6.7c-.3-.2-1.7-.8-2-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a7.3 7.3 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-2c-.1-.3 0-.4.1-.6l.5-.6.2-.3c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3 .2.4.4.7a10.8 10.8 0 0 0 4.1 4 4.7 4.7 0 0 0 .7.3c.3.2 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.5-.4Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.5-3h-3.2V9.2c0-.9.2-1.5 1.6-1.5H17V5c-.3 0-1.4-.1-2.7-.1-2.6 0-4.4 1.6-4.4 4.5V11H7v3h2.9v8h3.6Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
    </svg>
  );
}

