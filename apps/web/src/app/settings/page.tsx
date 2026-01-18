'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Save, 
  Bell, 
  Shield, 
  Palette, 
  Sliders,
  CheckCircle,
  AlertCircle,
  Coins,
  Link2,
  Zap,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useTheme } from '@/stores/theme-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Settings {
  // Chain Preference
  preferredChain: 'bsc' | 'solana' | 'auto';
  // Staking
  defaultLockPeriod: 'flexible' | '30' | '90' | '180' | '365';
  autoCompound: boolean;
  stakingAlerts: boolean;
  // Trading
  slippage: string;
  deadline: string;
  expertMode: boolean;
  autoApprove: boolean;
  // Notifications
  priceAlerts: boolean;
  whaleAlerts: boolean;
  newLaunches: boolean;
  insuranceReminders: boolean;
  stakingReminders: boolean;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  // Display
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'zh';
  // Privacy
  hideBalance: boolean;
  hideActivity: boolean;
  // Insurance
  autoInsurance: boolean;
  insuranceThreshold: string;
  preferredCoverage: 'rug_pull' | 'price_drop' | 'smart_contract' | 'comprehensive';
}

const defaultSettings: Settings = {
  preferredChain: 'auto',
  defaultLockPeriod: 'flexible',
  autoCompound: false,
  stakingAlerts: true,
  slippage: '0.5',
  deadline: '20',
  expertMode: false,
  autoApprove: false,
  priceAlerts: true,
  whaleAlerts: true,
  newLaunches: true,
  insuranceReminders: true,
  stakingReminders: true,
  emailNotifications: false,
  telegramNotifications: false,
  theme: 'dark',
  language: 'en',
  hideBalance: false,
  hideActivity: false,
  autoInsurance: false,
  insuranceThreshold: '1000',
  preferredCoverage: 'comprehensive',
};

export default function SettingsPage() {
  const { isConnected } = useAccount();
  const { t } = useTranslation();
  const { theme: currentTheme, setTheme } = useTheme();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('popcow-settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      localStorage.setItem('popcow-settings', JSON.stringify(settings));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const Toggle = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: (v: boolean) => void; 
    label: string;
    description?: string;
  }) => (
    <label className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t.settings.title}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {t.settings.subtitle}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            'Saving...'
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Saved
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
              Error
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Chain Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Chain Preference
          </CardTitle>
          <CardDescription>
            选择默认使用的区块链网络
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Network</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={settings.preferredChain === 'bsc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('preferredChain', 'bsc')}
                className={settings.preferredChain === 'bsc' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                <Zap className="h-3 w-3 mr-1" />
                BSC (Four.meme)
              </Button>
              <Button
                variant={settings.preferredChain === 'solana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('preferredChain', 'solana')}
                className={settings.preferredChain === 'solana' ? 'bg-purple-500 hover:bg-purple-600' : ''}
              >
                🟣 Solana (pump.fun)
              </Button>
              <Button
                variant={settings.preferredChain === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateSetting('preferredChain', 'auto')}
              >
                Auto Detect
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Auto: 根据已连接的钱包自动选择网络
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Staking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            Staking Settings
          </CardTitle>
          <CardDescription>
            配置质押偏好
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Lock Period</Label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'flexible', label: 'Flexible (1x)', color: '' },
                { value: '30', label: '30 Days (1.5x)', color: '' },
                { value: '90', label: '90 Days (2x)', color: '' },
                { value: '180', label: '180 Days (3x)', color: '' },
                { value: '365', label: '365 Days (5x)', color: 'text-yellow-500' },
              ] as const).map((period) => (
                <Badge
                  key={period.value}
                  variant={settings.defaultLockPeriod === period.value ? 'default' : 'secondary'}
                  className={`cursor-pointer ${period.color}`}
                  onClick={() => updateSetting('defaultLockPeriod', period.value)}
                >
                  {period.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <Toggle
              checked={settings.autoCompound}
              onChange={(v) => updateSetting('autoCompound', v)}
              label="Auto Compound"
              description="自动将奖励复投到质押池"
            />
            <Toggle
              checked={settings.stakingAlerts}
              onChange={(v) => updateSetting('stakingAlerts', v)}
              label="Staking Alerts"
              description="锁定期结束时通知"
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            CowGuard Insurance
          </CardTitle>
          <CardDescription>
            配置自动保险保护
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Toggle
              checked={settings.autoInsurance}
              onChange={(v) => updateSetting('autoInsurance', v)}
              label="Auto Insurance"
              description="自动为高风险交易购买保险"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="threshold">Insurance Threshold ($)</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={settings.insuranceThreshold}
                  onChange={(e) => updateSetting('insuranceThreshold', e.target.value)}
                  min="100"
                  max="10000"
                  step="100"
                />
                <p className="text-xs text-muted-foreground">
                  超过此金额自动投保
                </p>
              </div>
              <div className="space-y-2">
                <Label>Preferred Coverage</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'rug_pull', label: '🚨 Rug', color: 'bg-red-500/10 text-red-500' },
                    { value: 'price_drop', label: '📉 Drop', color: 'bg-yellow-500/10 text-yellow-500' },
                    { value: 'smart_contract', label: '🔒 Contract', color: 'bg-blue-500/10 text-blue-500' },
                    { value: 'comprehensive', label: '🛡️ All', color: 'bg-green-500/10 text-green-500' },
                  ] as const).map((coverage) => (
                    <Badge
                      key={coverage.value}
                      variant={settings.preferredCoverage === coverage.value ? 'default' : 'secondary'}
                      className={`cursor-pointer text-xs ${
                        settings.preferredCoverage === coverage.value ? coverage.color : ''
                      }`}
                      onClick={() => updateSetting('preferredCoverage', coverage.value)}
                    >
                      {coverage.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            Trading Settings
          </CardTitle>
          <CardDescription>
            配置默认交易参数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
              <Input
                id="slippage"
                type="number"
                value={settings.slippage}
                onChange={(e) => updateSetting('slippage', e.target.value)}
                step="0.1"
                min="0.01"
                max="50"
              />
              <p className="text-xs text-muted-foreground">
                建议: 稳定币 0.5%, Meme 代币 1-3%
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Transaction Deadline (min)</Label>
              <Input
                id="deadline"
                type="number"
                value={settings.deadline}
                onChange={(e) => updateSetting('deadline', e.target.value)}
                min="1"
                max="60"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <Toggle
              checked={settings.expertMode}
              onChange={(v) => updateSetting('expertMode', v)}
              label="Expert Mode"
              description="禁用高滑点交易警告"
            />
            <Toggle
              checked={settings.autoApprove}
              onChange={(v) => updateSetting('autoApprove', v)}
              label="Auto Approve Tokens"
              description="自动授权代币 (谨慎使用)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            选择要接收的通知类型
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Alert Types</p>
            <Toggle
              checked={settings.priceAlerts}
              onChange={(v) => updateSetting('priceAlerts', v)}
              label="Price Alerts"
              description="代币达到目标价格时通知"
            />
            <Toggle
              checked={settings.stakingReminders}
              onChange={(v) => updateSetting('stakingReminders', v)}
              label="Staking Reminders"
              description="质押奖励和解锁提醒"
            />
            <Toggle
              checked={settings.insuranceReminders}
              onChange={(v) => updateSetting('insuranceReminders', v)}
              label="Insurance Reminders"
              description="保单到期和理赔提醒"
            />
            <Toggle
              checked={settings.newLaunches}
              onChange={(v) => updateSetting('newLaunches', v)}
              label="New Token Launches"
              description="Four.meme/pump.fun 新代币通知"
            />
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Channels</p>
            <Toggle
              checked={settings.emailNotifications}
              onChange={(v) => updateSetting('emailNotifications', v)}
              label="Email Notifications"
            />
            <Toggle
              checked={settings.telegramNotifications}
              onChange={(v) => updateSetting('telegramNotifications', v)}
              label="Telegram Notifications"
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Display
          </CardTitle>
          <CardDescription>
            自定义显示设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as const).map((themeOption) => (
                <Button
                  key={themeOption}
                  variant={currentTheme === themeOption ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(themeOption)}
                  className="flex-1"
                >
                  {themeOption === 'dark' ? '🌙 深色' : themeOption === 'light' ? '☀️ 浅色' : '🔄 系统'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy
          </CardTitle>
          <CardDescription>
            控制隐私设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Toggle
            checked={settings.hideBalance}
            onChange={(v) => updateSetting('hideBalance', v)}
            label="Hide Portfolio Balance"
            description="用星号代替实际余额"
          />
          <Toggle
            checked={settings.hideActivity}
            onChange={(v) => updateSetting('hideActivity', v)}
            label="Hide Activity"
            description="在公共排行榜隐藏您的活动"
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isConnected && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              不可逆操作 - 请谨慎
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-destructive/10">
              <div>
                <p className="font-medium">Reset All Settings</p>
                <p className="text-sm text-muted-foreground">
                  重置所有设置为默认值
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setSettings(defaultSettings);
                  localStorage.removeItem('popcow-settings');
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
