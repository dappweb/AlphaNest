'use client';

import { useState } from 'react';
import { Copy, Check, Share2, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useReferral } from '@/hooks/use-referral';

export function ReferralLink() {
  const { referralCode, referralLink, copyReferralLink, copyReferralCode, isConnected } = useReferral();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCode = async () => {
    const success = await copyReferralCode();
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Join AlphaNest - the premier cross-chain Meme asset platform! 🚀\n\nUse my referral link to get bonus rewards:\n${referralLink}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = encodeURIComponent(`Join AlphaNest using my referral link: ${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, '_blank');
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">
              Connect your wallet to get your unique referral link
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          Your Referral Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Referral Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-secondary/50 px-4 py-3 font-mono text-lg font-bold tracking-wider">
              {referralCode}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="h-12 w-12"
            >
              {copiedCode ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Referral Link
          </label>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
            >
              {copiedLink ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Share
          </label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={shareOnTwitter}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={shareOnTelegram}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </Button>
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
          <div className="text-center text-muted-foreground">
            <QrCode className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">QR Code coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
