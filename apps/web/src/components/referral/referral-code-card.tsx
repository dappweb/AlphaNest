'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Copy, 
  Link2, 
  Twitter, 
  Send, 
  CheckCircle, 
  Gift,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { useReferralCode } from '@/hooks/use-referral';
import { cn } from '@/lib/utils';

interface ReferralCodeCardProps {
  className?: string;
}

export function ReferralCodeCard({ className }: ReferralCodeCardProps) {
  const { 
    referralCode, 
    copyCode, 
    copyLink, 
    shareToTwitter, 
    shareToTelegram,
    isLoading,
  } = useReferralCode();

  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyCode = async () => {
    const success = await copyCode();
    if (success) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyLink();
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  if (!referralCode) {
    return (
      <Card className={cn('border-dashed', className)}>
        <CardContent className="py-8 text-center">
          <Gift className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Connect your wallet to get your referral code
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10 pointer-events-none" />
      
      <CardHeader className="relative pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-yellow-500" />
          Invite & Earn
        </CardTitle>
        <CardDescription>
          Share your code and earn up to 15% commission
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* 推荐码 */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Your Referral Code</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={referralCode.code}
                readOnly
                className="font-mono text-lg font-bold text-center bg-secondary/50 border-yellow-500/30 pr-10"
              />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-500" />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className={cn(
                'transition-colors',
                codeCopied && 'bg-green-500/20 border-green-500/50 text-green-500'
              )}
            >
              {codeCopied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 推荐链接 */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Referral Link</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={referralCode.link}
                readOnly
                className="font-mono text-xs bg-secondary/50 border-muted pr-10 truncate"
              />
              <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className={cn(
                'transition-colors',
                linkCopied && 'bg-green-500/20 border-green-500/50 text-green-500'
              )}
            >
              {linkCopied ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 分享按钮 */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Share</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-10 border-[#1DA1F2]/30 hover:bg-[#1DA1F2]/10 text-[#1DA1F2]"
              onClick={shareToTwitter}
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="h-10 border-[#0088cc]/30 hover:bg-[#0088cc]/10 text-[#0088cc]"
              onClick={shareToTelegram}
            >
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </Button>
          </div>
        </div>

        {/* 奖励提示 */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-2">
            <Gift className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-yellow-500">双向奖励!</p>
              <p className="text-muted-foreground mt-0.5">
                您的好友首次质押获得 <span className="text-yellow-500 font-bold">5% 奖励</span>，
                您获得他们质押/投保金额的 <span className="text-yellow-500 font-bold">5-15% 佣金</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
