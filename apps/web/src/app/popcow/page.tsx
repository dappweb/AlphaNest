import { PopCowAvatar } from '@/components/popcow/popcow-avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PopCowPage() {
  return (
    <div className="space-y-6">
      {/* PopCow Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-lg">
        <PopCowAvatar size="xl" mood="excited" animated className="mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
          Welcome to PopCow Platform 🐄
        </h1>
        <p className="text-xl text-muted-foreground mb-4">
          The smartest cow in crypto - Your guide to Alpha discoveries and safe trading
        </p>
        <div className="flex justify-center gap-2 mb-6">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">🎯 Alpha Hunter</Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">🛡️ Rug Detector</Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">📊 Market Analyst</Badge>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">🚀 Meme Expert</Badge>
        </div>
        <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
          Follow PopCow on Twitter
        </Button>
      </div>

      {/* PopCow Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-orange-600">87%</CardTitle>
            <CardDescription>Alpha Success Rate</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-orange-600">156</CardTitle>
            <CardDescription>Rug Pulls Prevented</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-orange-600">$2.3M</CardTitle>
            <CardDescription>User Losses Saved</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-orange-600">50K+</CardTitle>
            <CardDescription>Followers Trust PopCow</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* PopCow Features */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 PopCow Intelligence
            </CardTitle>
            <CardDescription>
              Advanced AI-powered analysis to identify Alpha projects and detect scams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Smart Contract Analysis</span>
                <Badge variant="outline" className="text-green-600 border-green-600">✓ Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Dev Reputation Tracking</span>
                <Badge variant="outline" className="text-green-600 border-green-600">✓ Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Liquidity Health Monitor</span>
                <Badge variant="outline" className="text-green-600 border-green-600">✓ Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Social Sentiment Analysis</span>
                <Badge variant="outline" className="text-green-600 border-green-600">✓ Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛡️ CowGuard Protection
            </CardTitle>
            <CardDescription>
              Revolutionary insurance system to protect your investments from Rug Pulls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Coverage Active</span>
                  <p className="text-xs text-muted-foreground">$50K Protected</p>
                </div>
                <Badge className="bg-green-500">Protected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Premium Rate</span>
                  <p className="text-xs text-muted-foreground">Lower for PopCow users</p>
                </div>
                <Badge variant="secondary">3% vs 5%</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div>
                  <span className="text-sm font-medium">Instant Claims</span>
                  <p className="text-xs text-muted-foreground">Automated payouts</p>
                </div>
                <Badge variant="outline">24/7</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PopCow Services */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-orange-600">🎯 Alpha Hunting</CardTitle>
            <CardDescription>
              PopCow scouts the market 24/7 to find the next big opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Real-time market scanning</li>
              <li>• Early project detection</li>
              <li>• Risk assessment scoring</li>
              <li>• Community sentiment analysis</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-orange-600">🤖 Trading Bots</CardTitle>
            <CardDescription>
              Automated trading strategies powered by PopCow's intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Copy PopCow's trades</li>
              <li>• Custom strategy builder</li>
              <li>• Risk management tools</li>
              <li>• Performance tracking</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-orange-600">📊 Market Analytics</CardTitle>
            <CardDescription>
              Deep insights and data analysis from PopCow's perspective
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Token performance metrics</li>
              <li>• Dev reputation scores</li>
              <li>• Market trend analysis</li>
              <li>• Portfolio optimization</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* PopCow Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">PopCow's Journey to Crypto Stardom</CardTitle>
          <CardDescription>From farm to fame - How PopCow became the smartest cow in crypto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-orange-600">2024.01 - The Awakening 🌅</h4>
                <p className="text-sm text-muted-foreground">
                  PopCow discovers crypto and realizes most projects are just "bull" without substance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-orange-600">2024.03 - First Alpha Discovery 🎯</h4>
                <p className="text-sm text-muted-foreground">
                  PopCow's analytical mind identifies the first 100x gem, gaining recognition
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-orange-600">2024.06 - Rug Pull Prevention Hero 🛡️</h4>
                <p className="text-sm text-muted-foreground">
                  PopCow saves thousands of investors by exposing a major scam before it happens
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-orange-600">2024.09 - Community Growth 📈</h4>
                <p className="text-sm text-muted-foreground">
                  PopCow's following grows to 50K+ as more people trust the cow's judgment
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium text-green-600">2025.01 - PopCow Platform Launch 🚀</h4>
                <p className="text-sm text-muted-foreground">
                  PopCow creates the ultimate platform for safe and profitable crypto trading
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4 text-orange-600">Ready to Follow the Smartest Cow?</h3>
          <p className="text-muted-foreground mb-6">
            Join thousands of traders who trust PopCow's intelligence for safer, more profitable trading
          </p>
          <div className="flex justify-center gap-4">
            <Button className="bg-orange-500 hover:bg-orange-600">
              Start Trading with PopCow
            </Button>
            <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
              Learn More About CowGuard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}