'use client';

import { Shield, Eye, Database, Lock, Users, Globe, Mail } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
                    <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">
                    Last updated: January 11, 2026
                </p>
            </div>

            {/* Content */}
            <div className="space-y-8">
                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        1. Information We Collect
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        AlphaNest collects minimal information to provide our services:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <Database className="h-4 w-4 text-primary mt-1 shrink-0" />
                            <span><strong>Wallet Addresses:</strong> Your public blockchain addresses for transactions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Database className="h-4 w-4 text-primary mt-1 shrink-0" />
                            <span><strong>Transaction Data:</strong> On-chain transaction history (publicly available)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Database className="h-4 w-4 text-primary mt-1 shrink-0" />
                            <span><strong>Usage Data:</strong> Anonymous analytics to improve our services</span>
                        </li>
                    </ul>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        2. How We Use Your Information
                    </h2>
                    <ul className="space-y-2 text-muted-foreground">
                        <li>• Provide and maintain our services</li>
                        <li>• Process transactions and insurance claims</li>
                        <li>• Calculate Dev reputation scores</li>
                        <li>• Send notifications about your account</li>
                        <li>• Improve and optimize the Platform</li>
                        <li>• Detect and prevent fraud</li>
                    </ul>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        3. Information Sharing
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We do <strong>not</strong> sell your personal information. We may share information with:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mt-4">
                        <li>• <strong>Service Providers:</strong> Third parties that help us operate the Platform</li>
                        <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        <li>• <strong>Public Blockchain:</strong> On-chain data is publicly visible by design</li>
                    </ul>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        4. Cookies and Tracking
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We use cookies and similar technologies to:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mt-4">
                        <li>• Remember your preferences and settings</li>
                        <li>• Analyze site traffic and usage patterns</li>
                        <li>• Improve user experience</li>
                    </ul>
                    <p className="text-muted-foreground leading-relaxed mt-4">
                        You can control cookies through your browser settings.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4">5. Data Security</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We implement industry-standard security measures to protect your information, including
                        encryption, secure connections (HTTPS), and regular security audits. However, no method
                        of transmission over the Internet is 100% secure.
                    </p>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        You have the right to:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mt-4">
                        <li>• Access your personal data</li>
                        <li>• Request correction of inaccurate data</li>
                        <li>• Request deletion of your data</li>
                        <li>• Opt out of marketing communications</li>
                    </ul>
                </section>

                <section className="p-6 rounded-lg bg-card border">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        7. Contact Us
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        For privacy-related questions, please contact us at{' '}
                        <a href="mailto:privacy@alphanest.dev" className="text-primary hover:underline">
                            privacy@alphanest.dev
                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
}
