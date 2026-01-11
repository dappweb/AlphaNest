'use client';

import { AlertTriangle, TrendingDown, Shield, Skull, Zap, DollarSign, HelpCircle } from 'lucide-react';

export default function RiskPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500/10 mx-auto">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
                <h1 className="text-3xl font-bold">Risk Disclaimer</h1>
                <p className="text-muted-foreground">
                    Important information about the risks of using AlphaNest
                </p>
            </div>

            {/* Warning Banner */}
            <div className="p-6 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="font-semibold text-yellow-500 mb-2">High Risk Investment Warning</h3>
                        <p className="text-sm text-muted-foreground">
                            Trading cryptocurrency and Meme tokens involves substantial risk of loss. Only invest what
                            you can afford to lose. Past performance is not indicative of future results.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid gap-6 md:grid-cols-2">
                <section className="p-6 rounded-lg bg-card border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                        </div>
                        <h2 className="text-lg font-semibold">Market Volatility</h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Cryptocurrency prices are highly volatile. The value of Meme tokens can drop to zero
                        within hours or minutes. Be prepared for extreme price swings.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-red-500/10">
                            <Skull className="h-5 w-5 text-red-500" />
                        </div>
                        <h2 className="text-lg font-semibold">Rug Pull Risk</h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Meme tokens are susceptible to "rug pulls" where developers abandon projects
                        and drain liquidity. While AlphaGuard offers protection, it cannot cover all losses.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <Zap className="h-5 w-5 text-orange-500" />
                        </div>
                        <h2 className="text-lg font-semibold">Smart Contract Risk</h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Smart contracts may contain bugs or vulnerabilities. Despite audits, there is
                        always risk of exploits or unintended behavior.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <DollarSign className="h-5 w-5 text-orange-500" />
                        </div>
                        <h2 className="text-lg font-semibold">Liquidity Risk</h2>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Some tokens may have low liquidity, making it difficult to sell at desired prices.
                        Large trades can significantly impact prices.
                    </p>
                </section>
            </div>

            {/* AlphaGuard Section */}
            <section className="p-6 rounded-lg bg-card border">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold">AlphaGuard Insurance Limitations</h2>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    While AlphaGuard provides protection against rug pulls, please be aware of the following limitations:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        Insurance payouts are subject to available pool funds
                    </li>
                    <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        Coverage is limited to 80% of the insured amount
                    </li>
                    <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        Claims require verification and may take time to process
                    </li>
                    <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                        Not all tokens are eligible for insurance coverage
                    </li>
                </ul>
            </section>

            {/* Not Financial Advice */}
            <section className="p-6 rounded-lg bg-card border">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <HelpCircle className="h-5 w-5 text-blue-500" />
                    </div>
                    <h2 className="text-lg font-semibold">Not Financial Advice</h2>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    The information provided on AlphaNest is for informational purposes only and should not
                    be construed as financial, investment, trading, or other advice. We do not recommend
                    buying or selling any tokens. Always do your own research (DYOR) before making any
                    investment decisions.
                </p>
            </section>

            {/* Acknowledgment */}
            <div className="p-6 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground">
                    By using AlphaNest, you acknowledge that you have read, understood, and accept
                    these risks. You agree that AlphaNest is not responsible for any losses you may incur.
                </p>
            </div>
        </div>
    );
}
