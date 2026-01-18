'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { SOLANA_TOKENS } from '@/config/solana';
import { useState } from 'react';

// SVG Icons
const XIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const socialLinks = [
  { name: 'Twitter', href: 'https://x.com/popcowxyz', icon: <XIcon /> },
  { name: 'Telegram', href: 'https://t.me/popcowxyz', icon: <TelegramIcon /> },
];

const footerLinks = [
  {
    title: 'Product',
    links: [
      { name: 'Staking', href: '/staking' },
      { name: 'Insurance', href: '/insurance' },
    ],
  },
  {
    title: 'Community',
    links: [
      { name: 'Referral', href: '/referral' },
      { name: 'Docs', href: 'https://docs.popcow.xyz', external: true },
    ],
  },
];

const chains = ['Solana'];

function FooterLink({ href, name, external }: { href: string; name: string; external?: boolean }) {
  const className = "text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1";
  
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {name}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  
  return <Link href={href} className={className}>{name}</Link>;
}

function TokenAddress({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
  const solscanUrl = `https://solscan.io/token/${address}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <a
        href={solscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        {shortAddress}
      </a>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Copy address"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={`border-t bg-background/50 backdrop-blur-sm ${className || ''}`}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="PopCowDefi" width={28} height={28} className="rounded-lg" />
              <span className="font-bold">PopCowDefi</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Solana Meme asset platform with curated launches & CowGuard insurance.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium text-sm mb-2">{section.title}</h3>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Token Addresses */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col gap-2 text-xs">
            <h4 className="font-medium text-sm mb-2">Token Addresses</h4>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <TokenAddress label="POPCOW_DEFI" address={SOLANA_TOKENS.POPCOW_DEFI} />
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} PopCowDefi</p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Follow us:</span>
              <div className="flex gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground border border-border hover:border-primary/30"
                    aria-label={link.name}
                    title={link.name}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Built on</span>
              {chains.map((chain) => (
                <span key={chain} className="px-2 py-0.5 rounded bg-secondary">{chain}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
