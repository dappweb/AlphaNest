'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Save, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Sliders,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SettingsTest } from '@/components/settings-test';

interface Settings {
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
  emailNotifications: boolean;
  telegramNotifications: boolean;
  // Display
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'zh';
  currency: 'USD' | 'EUR' | 'CNY';
  // Privacy
  hideBalance: boolean;
  hideActivity: boolean;
  // Insurance
  autoInsurance: boolean;
  insuranceThreshold: string;
  preferredCoverage: 'rug_pull' | 'price_drop' | 'smart_contract' | 'comprehensive';
  // Copy Trading
  copyTradingEnabled: boolean;
  maxCopyAmount: string;
  copyRiskLevel: 'low' | 'medium' | 'high';
  autoStopLoss: boolean;
}

const defaultSettings: Settings = {
  slippage: '0.5',
  deadline: '20',
  expertMode: false,
  autoApprove: false,
  priceAlerts: true,
  whaleAlerts: true,
  newLaunches: true,
  insuranceReminders: true,
  emailNotifications: false,
  telegramNotifications: false,
  theme: 'dark',
  language: 'en',
  currency: 'USD',
  hideBalance: false,
  hideActivity: false,
  // Insurance
  autoInsurance: false,
  insuranceThreshold: '1000',
  preferredCoverage: 'comprehensive',
  // Copy Trading
  copyTradingEnabled: false,
  maxCopyAmount: '500',
  copyRiskLevel: 'medium',
  autoStopLoss: true,
};

export default function SettingsPage() {
  const { isConnected } = useAccount();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('alphanest-settings');
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
      // Save to localStorage
      localStorage.setItem('alphanest-settings', JSON.stringify(settings));
      
      // In production, also sync to API
      // await saveSettingsToAPI(settings);
      
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and account settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            'Saving...'
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 text-success" />
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

      {/* Trading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            Trading Settings
          </CardTitle>
          <CardDescription>
            Configure default trading parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                Recommended: 0.5% for stable pairs, 1-3% for volatile tokens
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Transaction Deadline (minutes)</Label>
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
              description="Disable warnings for high price impact trades"
            />
            <Toggle
              checked={settings.autoApprove}
              onChange={(v) => updateSetting('autoApprove', v)}
              label="Auto Approve Tokens"
              description="Automatically approve tokens for trading (use with caution)"
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
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Alert Types</p>
            <Toggle
              checked={settings.priceAlerts}
              onChange={(v) => updateSetting('priceAlerts', v)}
              label="Price Alerts"
              description="Get notified when tokens hit your target price"
            />
            <Toggle
              checked={settings.whaleAlerts}
              onChange={(v) => updateSetting('whaleAlerts', v)}
              label="Whale Alerts"
              description="Large transactions from tracked wallets"
            />
            <Toggle
              checked={settings.newLaunches}
              onChange={(v) => updateSetting('newLaunches', v)}
              label="New Token Launches"
              description="Notify when verified devs launch new tokens"
            />
            <Toggle
              checked={settings.insuranceReminders}
              onChange={(v) => updateSetting('insuranceReminders', v)}
              label="Insurance Reminders"
              description="Policy expiration and claim reminders"
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
            Customize how information is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {(['dark', 'light', 'system'] as const).map((theme) => (
                  <Button
                    key={theme}
                    variant={settings.theme === theme ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('theme', theme)}
                    className="flex-1"
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <div className="flex gap-2">
                {([
                  { value: 'en', label: 'English' },
                  { value: 'zh', label: '中文' },
                ] as const).map((lang) => (
                  <Button
                    key={lang.value}
                    variant={settings.language === lang.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('language', lang.value)}
                    className="flex-1"
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <div className="flex gap-2">
                {(['USD', 'EUR', 'CNY'] as const).map((currency) => (
                  <Button
                    key={currency}
                    variant={settings.currency === currency ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('currency', currency)}
                    className="flex-1"
                  >
                    {currency}
                  </Button>
                ))}
              </div>
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
            Control your privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Toggle
            checked={settings.hideBalance}
            onChange={(v) => updateSetting('hideBalance', v)}
            label="Hide Portfolio Balance"
            description="Show asterisks instead of actual balance values"
          />
          <Toggle
            checked={settings.hideActivity}
            onChange={(v) => updateSetting('hideActivity', v)}
            label="Hide Activity from Leaderboards"
            description="Your trades won't appear on public leaderboards"
          />
        </CardContent>
      </Card>

      {/* Insurance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            CowGuard Insurance
          </CardTitle>
          <CardDescription>
            Configure automatic insurance protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Toggle
              checked={settings.autoInsurance}
              onChange={(v) => updateSetting('autoInsurance', v)}
              label="Auto Insurance"
              description="Automatically purchase insurance for high-risk trades"
            />
            <div className="grid grid-cols-2 gap-4">
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
                  Auto-insure trades above this amount
                </p>
              </div>
              <div className="space-y-2">
                <Label>Preferred Coverage</Label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'rug_pull', label: 'Rug Pull', color: 'bg-red-500/10 text-red-500' },
                    { value: 'price_drop', label: 'Price Drop', color: 'bg-yellow-500/10 text-yellow-500' },
                    { value: 'smart_contract', label: 'Contract', color: 'bg-blue-500/10 text-blue-500' },
                    { value: 'comprehensive', label: 'All', color: 'bg-green-500/10 text-green-500' },
                  ] as const).map((coverage) => (
                    <Badge
                      key={coverage.value}
                      variant={settings.preferredCoverage === coverage.value ? 'default' : 'secondary'}
                      className={`cursor-pointer ${
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

      {/* Copy Trading Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Copy Trading
          </CardTitle>
          <CardDescription>
            Manage your copy trading preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Toggle
              checked={settings.copyTradingEnabled}
              onChange={(v) => updateSetting('copyTradingEnabled', v)}
              label="Enable Copy Trading"
              description="Allow others to copy your trades"
            />
            <Toggle
              checked={settings.autoStopLoss}
              onChange={(v) => updateSetting('autoStopLoss', v)}
              label="Auto Stop Loss"
              description="Automatically set stop loss for copied trades"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxCopyAmount">Max Copy Amount ($)</Label>
              <Input
                id="maxCopyAmount"
                type="number"
                value={settings.maxCopyAmount}
                onChange={(e) => updateSetting('maxCopyAmount', e.target.value)}
                min="10"
                max="10000"
                step="10"
              />
              <p className="text-xs text-muted-foreground">
                Maximum amount per copied trade
              </p>
            </div>
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <div className="flex gap-2">
                {([
                  { value: 'low', label: 'Low', color: 'bg-green-500/10 text-green-500' },
                  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500' },
                  { value: 'high', label: 'High', color: 'bg-red-500/10 text-red-500' },
                ] as const).map((risk) => (
                  <Button
                    key={risk.value}
                    variant={settings.copyRiskLevel === risk.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSetting('copyRiskLevel', risk.value)}
                    className="flex-1"
                  >
                    {risk.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isConnected && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions - proceed with caution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10">
              <div>
                <p className="font-medium">Reset All Settings</p>
                <p className="text-sm text-muted-foreground">
                  Reset all settings to their default values
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setSettings(defaultSettings);
                  localStorage.removeItem('alphanest-settings');
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Test Component */}
      <SettingsTest />
    </div>
  );
}
