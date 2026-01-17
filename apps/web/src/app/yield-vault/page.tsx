'use client';

import { VaultCard } from '@/components/yield-vault/vault-card';
import { VaultType } from '@/hooks/use-yield-vault';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function YieldVaultPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">PopCow Yield Vault</h1>
        <p className="text-muted-foreground text-lg">
          智能收益聚合器 - 自动复投，收益最大化
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>产品概览</CardTitle>
          <CardDescription>
            PopCow Yield Vault 通过智能资产分配和自动复投机制，将您的资金分配到多个收益来源，
            实现收益最大化。所有操作均在 Solana 链上执行，享受极低费用和超快速度。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">40-120%</p>
              <p className="text-sm text-muted-foreground">年化收益率</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">$0.00025</p>
              <p className="text-sm text-muted-foreground">单笔交易费用</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">400ms</p>
              <p className="text-sm text-muted-foreground">交易确认时间</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">收益来源</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="flexible">灵活型</TabsTrigger>
          <TabsTrigger value="stable">稳健型</TabsTrigger>
          <TabsTrigger value="growth">增长型</TabsTrigger>
          <TabsTrigger value="aggressive">激进型</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <VaultCard
            vaultType={VaultType.Flexible}
            title="灵活型"
            description="无锁定期，随时存取，适合短期资金和流动性需求"
            apy={40}
            lockPeriod={0}
            minDeposit={100}
          />
          <VaultCard
            vaultType={VaultType.Stable}
            title="稳健型"
            description="30天锁定期，平衡收益与流动性，适合中期投资"
            apy={55}
            lockPeriod={30}
            minDeposit={500}
          />
          <VaultCard
            vaultType={VaultType.Growth}
            title="增长型"
            description="90天锁定期，追求更高收益，适合长期投资"
            apy={80}
            lockPeriod={90}
            minDeposit={1000}
          />
          <VaultCard
            vaultType={VaultType.Aggressive}
            title="激进型"
            description="180天锁定期，最高收益，适合高风险承受能力用户"
            apy={120}
            lockPeriod={180}
            minDeposit={5000}
          />
        </TabsContent>

        <TabsContent value="flexible">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <VaultCard
              vaultType={VaultType.Flexible}
              title="灵活型"
              description="无锁定期，随时存取，适合短期资金和流动性需求"
              apy={40}
              lockPeriod={0}
              minDeposit={100}
            />
          </div>
        </TabsContent>

        <TabsContent value="stable">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <VaultCard
              vaultType={VaultType.Stable}
              title="稳健型"
              description="30天锁定期，平衡收益与流动性，适合中期投资"
              apy={55}
              lockPeriod={30}
              minDeposit={500}
            />
          </div>
        </TabsContent>

        <TabsContent value="growth">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <VaultCard
              vaultType={VaultType.Growth}
              title="增长型"
              description="90天锁定期，追求更高收益，适合长期投资"
              apy={80}
              lockPeriod={90}
              minDeposit={1000}
            />
          </div>
        </TabsContent>

        <TabsContent value="aggressive">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <VaultCard
              vaultType={VaultType.Aggressive}
              title="激进型"
              description="180天锁定期，最高收益，适合高风险承受能力用户"
              apy={120}
              lockPeriod={180}
              minDeposit={5000}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>收益来源</CardTitle>
          <CardDescription>
            PopCow Yield Vault 通过智能分配，将资金投入到多个收益来源，实现风险分散和收益最大化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">POPCOW 质押</h3>
              <p className="text-sm text-muted-foreground mb-2">30-50% APY</p>
              <p className="text-xs text-muted-foreground">资金占比: 40%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">PopCowDefi 质押</h3>
              <p className="text-sm text-muted-foreground mb-2">20-35% APY</p>
              <p className="text-xs text-muted-foreground">资金占比: 20%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Raydium LP</h3>
              <p className="text-sm text-muted-foreground mb-2">50-100% APY</p>
              <p className="text-xs text-muted-foreground">资金占比: 25%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Alpha 交易</h3>
              <p className="text-sm text-muted-foreground mb-2">80-200% APY</p>
              <p className="text-xs text-muted-foreground">资金占比: 10%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">保险分成</h3>
              <p className="text-sm text-muted-foreground mb-2">15-25% APY</p>
              <p className="text-xs text-muted-foreground">资金占比: 5%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>常见问题</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">如何开始使用？</h3>
            <p className="text-sm text-muted-foreground">
              连接您的 Solana 钱包（如 Phantom），选择适合的产品类型，输入存款金额即可开始。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">收益如何计算？</h3>
            <p className="text-sm text-muted-foreground">
              收益按日结算，自动复投。您可以在个人持仓页面查看实时收益。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">可以提前提取吗？</h3>
            <p className="text-sm text-muted-foreground">
              灵活型产品可随时提取。其他产品在锁定期内提取需支付 0.1% 的提前提取费。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">有风险吗？</h3>
            <p className="text-sm text-muted-foreground">
              所有 DeFi 产品都存在风险。我们通过资产分散、动态调整和保险覆盖来降低风险，
              但无法完全消除风险。请根据自身风险承受能力选择合适的产品。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
