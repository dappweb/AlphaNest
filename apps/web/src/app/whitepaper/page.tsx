'use client';

import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';
import Link from 'next/link';

export default function WhitepaperPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-orange-500" />
            {t.whitepaper.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t.whitepaper.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/PopCow-Whitepaper.pdf" target="_blank" download>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              <Download className="h-4 w-4 mr-2" />
              {t.whitepaper.downloadPDF}
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.whitepaper.vision.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.whitepaper.vision.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.whitepaper.tokenomics.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.whitepaper.tokenomics.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.whitepaper.roadmap.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.whitepaper.roadmap.description}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.whitepaper.document.title}</CardTitle>
              <CardDescription className="mt-1">
                {t.whitepaper.document.subtitle}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
              v1.0
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/PopCow-Whitepaper.pdf"
              target="_blank"
              className="group p-4 rounded-lg border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                  <FileText className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t.whitepaper.viewPDF}</p>
                  <p className="text-xs text-muted-foreground">PDF Document</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>

            <Link
              href="https://github.com/dappweb/AlphaNest"
              target="_blank"
              className="group p-4 rounded-lg border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <ExternalLink className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t.whitepaper.viewGitHub}</p>
                  <p className="text-xs text-muted-foreground">Source Code</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </div>

          {/* Key Highlights */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">{t.whitepaper.highlights.title}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {t.whitepaper.highlights.items.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                  <div className="p-1 rounded bg-orange-500/20 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                  </div>
                  <p className="text-sm flex-1">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Document Sections */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">{t.whitepaper.sections.title}</h3>
            <div className="space-y-2">
              {t.whitepaper.sections.items.map((section, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm flex-1">{section}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="border-t pt-6">
            <div className="rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{t.whitepaper.cta.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t.whitepaper.cta.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href="/PopCow-Whitepaper.pdf" target="_blank" download>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Download className="h-4 w-4 mr-2" />
                      {t.whitepaper.downloadPDF}
                    </Button>
                  </Link>
                  <Link href="/PopCow-Whitepaper.pdf" target="_blank">
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t.whitepaper.viewOnline}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
