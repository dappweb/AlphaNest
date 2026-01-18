import Link from 'next/link';
import Image from 'next/image';
import { Github, ExternalLink } from 'lucide-react';

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
  { name: 'GitHub', href: 'https://github.com/popcowxyz', icon: <Github className="h-5 w-5" /> },
];

const footerLinks = [
  {
    title: 'Product',
    links: [
      { name: 'Trade', href: '/trade' },
      { name: 'Insurance', href: '/insurance' },
      { name: 'Points', href: '/points' },
      { name: 'Bots', href: '/bots' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Docs', href: 'https://app.popcow.xyz/docs', external: true },
      { name: 'API', href: 'https://alphanest-api.dappweb.workers.dev', external: true },
      { name: 'Whitepaper', href: '/PopCow-Whitepaper.pdf', external: true },
    ],
  },
  {
    title: 'Community',
    links: [
      { name: 'Referral', href: '/referral' },
      { name: 'Dev Rankings', href: '/devs' },
      { name: 'Leaderboard', href: '/points' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Terms', href: '/terms' },
      { name: 'Privacy', href: '/privacy' },
      { name: 'Risk', href: '/risk' },
    ],
  },
];

const chains = ['Base', 'Solana', 'Ethereum'];

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

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={`border-t bg-background/50 backdrop-blur-sm ${className || ''}`}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="PopCow" width={28} height={28} className="rounded-lg" />
              <span className="font-bold">PopCow</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Cross-chain Meme asset platform with curated launches & CowGuard insurance.
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

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PopCow</p>
          <div className="flex items-center gap-2">
            <span>Built on</span>
            {chains.map((chain) => (
              <span key={chain} className="px-2 py-0.5 rounded bg-secondary">{chain}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
