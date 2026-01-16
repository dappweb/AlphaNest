'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  Settings, 
  Shield, 
  Users, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

// 管理功能模块
const ADMIN_MODULES = [
  {
    id: 'tokens',
    name: '代币管理',
    icon: Coins,
    description: '添加、更新、移除质押代币',
    color: 'text-blue-500',
  },
  {
    id: 'referral',
    name: '推荐系统',
    icon: Users,
    description: '配置推荐奖励比例',
    color: 'text-green-500',
  },
  {
    id: 'reputation',
    name: '信誉系统',
    icon: Shield,
    description: '验证社交身份、审核红V认证',
    color: 'text-purple-500',
  },
  {
    id: 'insurance',
    name: '保险系统',
    icon: TrendingUp,
    description: '创建保险产品、配置预言机',
    color: 'text-orange-500',
  },
  {
    id: 'funds',
    name: '资金分配',
    icon: Settings,
    description: '管理资金分配比例',
    color: 'text-yellow-500',
  },
];

export default function AdminPage() {
  const { connected, publicKey } = useWallet();
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<string>('tokens');
  const [isAdmin, setIsAdmin] = useState(false);

  // TODO: 验证管理员权限
  useEffect(() => {
    if (connected && publicKey) {
      // 检查是否为管理员
      // const checkAdmin = async () => {
      //   const adminAddress = 'YOUR_ADMIN_ADDRESS';
      //   setIsAdmin(publicKey.equals(adminAddress));
      // };
      // checkAdmin();
      
      // 临时：允许所有连接的钱包访问（仅用于开发）
      setIsAdmin(true);
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-2xl font-bold">管理员登录</h2>
        <p className="text-muted-foreground">请连接钱包以访问管理系统</p>
        <WalletMultiButton />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">访问被拒绝</h2>
        <p className="text-muted-foreground">您没有管理员权限</p>
        <p className="text-sm text-muted-foreground font-mono">
          {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-6)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            管理员系统
          </h1>
          <p className="text-muted-foreground mt-1">
            管理平台参数和配置
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-500/10 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            管理员模式
          </Badge>
          <WalletMultiButton />
        </div>
      </div>

      {/* Admin Modules */}
      <Tabs value={activeModule} onValueChange={setActiveModule}>
        <TabsList className="grid w-full grid-cols-5">
          {ADMIN_MODULES.map((module) => (
            <TabsTrigger key={module.id} value={module.id} className="flex items-center gap-2">
              <module.icon className={`h-4 w-4 ${module.color}`} />
              <span className="hidden md:inline">{module.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 代币管理 */}
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>代币管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                添加、更新或移除可质押的代币品种
              </p>
              <div className="space-y-4">
                <Button className="w-full">
                  <Coins className="h-4 w-4 mr-2" />
                  添加新代币
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>• 添加代币配置（名称、小数位、APY、奖励倍数）</p>
                  <p>• 更新代币参数</p>
                  <p>• 移除代币（需确保无活跃质押）</p>
                  <p>• 激活/停用代币</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 推荐系统管理 */}
        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>推荐系统管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                配置推荐奖励比例
              </p>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">一级推荐</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">10%</p>
                      <p className="text-xs text-muted-foreground">最大 50%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">二级推荐</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">5%</p>
                      <p className="text-xs text-muted-foreground">最大 30%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">三级推荐</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">2%</p>
                      <p className="text-xs text-muted-foreground">最大 10%</p>
                    </CardContent>
                  </Card>
                </div>
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  更新推荐比例
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 信誉系统管理 */}
        <TabsContent value="reputation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>信誉系统管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                验证社交身份、审核红V认证
              </p>
              <div className="space-y-4">
                <Button className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  查看待审核列表
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>• 验证社交身份（Gitcoin Passport、World ID）</p>
                  <p>• 批准/拒绝红V认证申请</p>
                  <p>• 管理 Dev 信誉评分</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 保险系统管理 */}
        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>保险系统管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                创建保险产品、配置预言机
              </p>
              <div className="space-y-4">
                <Button className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  创建保险产品
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  配置价格预言机
                </Button>
                <div className="text-sm text-muted-foreground">
                  <p>• 创建新的保险产品类型</p>
                  <p>• 配置保费率、赔付率</p>
                  <p>• 设置价格预言机</p>
                  <p>• 暂停/恢复保险协议</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 资金分配管理 */}
        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>资金分配管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                管理质押资金的分配比例
              </p>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">开发资金</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">40%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">流动性资金</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">30%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">奖励资金</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">20%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">储备资金</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">10%</p>
                    </CardContent>
                  </Card>
                </div>
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  更新分配比例
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">质押池</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                运行中
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">保险协议</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                运行中
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">推荐系统</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                运行中
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">收益聚合</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                运行中
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
