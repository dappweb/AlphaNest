'use client';

import { FileText, Scale, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
                    <Scale className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Terms of Service</h1>
                <p className="text-muted-foreground">
                    Last updated: January 11, 2026
                </p>
            </div>

            {/* Content */}
            <div className="space-y-8">
                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        1. Acceptance of Terms
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        By accessing and using AlphaNest ("the Platform"), you agree to be bound by these Terms of Service.
                        If you do not agree to these terms, please do not use the Platform. These terms apply to all users
                        of the Platform, including without limitation users who are browsers, vendors, customers, merchants,
                        and/or contributors of content.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        2. Description of Services
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        AlphaNest provides the following services:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                            Cross-chain Meme token trading and discovery
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                            AlphaGuard insurance protection against rug pulls
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                            Developer reputation scoring and tracking
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                            Copy trading functionality
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                            Points and rewards system
                        </li>
                    </ul>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        3. Risk Acknowledgment
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        You acknowledge that trading cryptocurrency and digital assets involves significant risk.
                        The value of digital assets can fluctuate dramatically, and you may lose some or all of
                        your investment. AlphaNest does not provide financial, investment, or legal advice.
                        You are solely responsible for your trading decisions.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4">4. User Responsibilities</h2>
                    <ul className="space-y-2 text-muted-foreground">
                        <li>• You must be at least 18 years old to use the Platform</li>
                        <li>• You are responsible for maintaining the security of your wallet</li>
                        <li>• You agree not to use the Platform for illegal activities</li>
                        <li>• You will not attempt to manipulate or exploit the Platform</li>
                        <li>• You will comply with all applicable laws and regulations</li>
                    </ul>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        AlphaNest and its affiliates shall not be liable for any indirect, incidental, special,
                        consequential, or punitive damages resulting from your use of the Platform. This includes
                        but is not limited to loss of profits, data, or other intangible losses.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4">6. Modifications</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We reserve the right to modify these Terms at any time. Changes will be effective immediately
                        upon posting to the Platform. Your continued use of the Platform following any changes
                        constitutes acceptance of those changes.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4">7. Contact</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        For questions about these Terms, please contact us at{' '}
                        <a href="mailto:legal@alphanest.dev" className="text-primary hover:underline">
                            legal@alphanest.dev
                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
}
