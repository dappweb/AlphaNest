import type { Metadata } from 'next';
import Link from 'next/link';
import {
    FileText,
    Scale,
    Shield,
    AlertTriangle,
    CheckCircle,
    ArrowLeft,
    User,
    Ban,
    RefreshCw,
    Mail
} from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms of Service | AlphaNest',
    description: 'Read the terms of service for using the AlphaNest platform. Learn about user responsibilities, risk acknowledgment, and service descriptions.',
};

// Reusable Section Component
function Section({
    icon: Icon,
    iconColor = "text-primary",
    title,
    children,
    delay = 0
}: {
    icon?: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    title: string;
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <section
            className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            style={{ animationDelay: `${delay}ms` }}
        >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                {Icon && (
                    <span className={`p-2 rounded-lg bg-primary/10 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                {title}
            </h2>
            {children}
        </section>
    );
}

// Reusable List Item Component
function ListItem({
    children,
    icon: Icon = CheckCircle,
    iconColor = "text-primary"
}: {
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    iconColor?: string;
}) {
    return (
        <li className="flex items-start gap-3 py-2">
            <span className={`mt-0.5 shrink-0 ${iconColor}`}>
                <Icon className="h-4 w-4" />
            </span>
            <span className="text-muted-foreground">{children}</span>
        </li>
    );
}

export default function TermsPage() {
    return (
        <div className="min-h-screen">
            {/* Back Navigation */}
            <div className="max-w-4xl mx-auto mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
            </div>

            <div className="space-y-8 max-w-4xl mx-auto pb-12">
                {/* Header */}
                <div className="text-center space-y-4 py-8">
                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mx-auto shadow-lg shadow-primary/10">
                        <Scale className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Terms of Service
                    </h1>
                    <p className="text-muted-foreground">
                        Last updated: January 11, 2026
                    </p>
                    <p className="text-sm text-muted-foreground/70 max-w-2xl mx-auto">
                        Please read these terms carefully before using our platform. By using AlphaNest, you agree to be bound by these terms.
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <Section icon={FileText} title="1. Acceptance of Terms" delay={100}>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing and using AlphaNest (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use the Platform. These terms apply to all users
                            of the Platform, including without limitation users who are browsers, vendors, customers, merchants,
                            and/or contributors of content.
                        </p>
                    </Section>

                    <Section icon={Shield} title="2. Description of Services" delay={200}>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            AlphaNest provides the following services:
                        </p>
                        <ul className="space-y-1">
                            <ListItem>Cross-chain Meme token trading and discovery</ListItem>
                            <ListItem>AlphaGuard insurance protection against rug pulls</ListItem>
                            <ListItem>Developer reputation scoring and tracking</ListItem>
                            <ListItem>Copy trading functionality</ListItem>
                            <ListItem>Points and rewards system</ListItem>
                        </ul>
                    </Section>

                    <Section
                        icon={AlertTriangle}
                        iconColor="text-yellow-500"
                        title="3. Risk Acknowledgment"
                        delay={300}
                    >
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
                            <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                                ⚠️ Important: Trading cryptocurrency involves significant risk
                            </p>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            You acknowledge that trading cryptocurrency and digital assets involves significant risk.
                            The value of digital assets can fluctuate dramatically, and you may lose some or all of
                            your investment. AlphaNest does not provide financial, investment, or legal advice.
                            You are solely responsible for your trading decisions.
                        </p>
                    </Section>

                    <Section icon={User} title="4. User Responsibilities" delay={400}>
                        <ul className="space-y-1">
                            <ListItem>You must be at least 18 years old to use the Platform</ListItem>
                            <ListItem>You are responsible for maintaining the security of your wallet</ListItem>
                            <ListItem>You agree not to use the Platform for illegal activities</ListItem>
                            <ListItem>You will not attempt to manipulate or exploit the Platform</ListItem>
                            <ListItem>You will comply with all applicable laws and regulations</ListItem>
                        </ul>
                    </Section>

                    <Section icon={Ban} iconColor="text-red-500" title="5. Limitation of Liability" delay={500}>
                        <p className="text-muted-foreground leading-relaxed">
                            AlphaNest and its affiliates shall not be liable for any indirect, incidental, special,
                            consequential, or punitive damages resulting from your use of the Platform. This includes
                            but is not limited to loss of profits, data, or other intangible losses.
                        </p>
                    </Section>

                    <Section icon={RefreshCw} title="6. Modifications" delay={600}>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to modify these Terms at any time. Changes will be effective immediately
                            upon posting to the Platform. Your continued use of the Platform following any changes
                            constitutes acceptance of those changes.
                        </p>
                    </Section>

                    <Section icon={Mail} title="7. Contact" delay={700}>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions about these Terms, please contact us at{' '}
                            <a
                                href="mailto:legal@popcow.xyz"
                                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                            >
                                legal@popcow.xyz
                            </a>
                        </p>
                    </Section>
                </div>

                {/* Footer CTA */}
                <div className="text-center pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-4">
                        By continuing to use PopCow, you acknowledge that you have read and understood these terms.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <Link
                            href="/privacy"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <span className="text-muted-foreground/30">•</span>
                        <Link
                            href="/risk"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Risk Disclaimer
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
