/**
 * 设置管理Hook
 * 提供全局设置的读取和更新功能
 */

import { useState, useEffect, useCallback } from 'react';

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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 加载设置
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('popcow-settings');
        if (saved) {
          const parsedSettings = JSON.parse(saved);
          setSettings({ ...defaultSettings, ...parsedSettings });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 更新单个设置
  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      // 保存到localStorage
      try {
        localStorage.setItem('popcow-settings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
      return newSettings;
    });
  }, []);

  // 批量更新设置
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      // 保存到localStorage
      try {
        localStorage.setItem('popcow-settings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
      return newSettings;
    });
  }, []);

  // 重置设置
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    try {
      localStorage.removeItem('popcow-settings');
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSetting,
    updateSettings,
    resetSettings,
  };
}

// 便捷的设置hooks
export function useTradingSettings() {
  const { settings, updateSetting } = useSettings();
  
  return {
    slippage: settings.slippage,
    deadline: settings.deadline,
    expertMode: settings.expertMode,
    autoApprove: settings.autoApprove,
    updateSlippage: (value: string) => updateSetting('slippage', value),
    updateDeadline: (value: string) => updateSetting('deadline', value),
    updateExpertMode: (value: boolean) => updateSetting('expertMode', value),
    updateAutoApprove: (value: boolean) => updateSetting('autoApprove', value),
  };
}

export function useNotificationSettings() {
  const { settings, updateSetting } = useSettings();
  
  return {
    priceAlerts: settings.priceAlerts,
    whaleAlerts: settings.whaleAlerts,
    newLaunches: settings.newLaunches,
    insuranceReminders: settings.insuranceReminders,
    emailNotifications: settings.emailNotifications,
    telegramNotifications: settings.telegramNotifications,
    updatePriceAlerts: (value: boolean) => updateSetting('priceAlerts', value),
    updateWhaleAlerts: (value: boolean) => updateSetting('whaleAlerts', value),
    updateNewLaunches: (value: boolean) => updateSetting('newLaunches', value),
    updateInsuranceReminders: (value: boolean) => updateSetting('insuranceReminders', value),
    updateEmailNotifications: (value: boolean) => updateSetting('emailNotifications', value),
    updateTelegramNotifications: (value: boolean) => updateSetting('telegramNotifications', value),
  };
}

export function useDisplaySettings() {
  const { settings, updateSetting } = useSettings();
  
  return {
    theme: settings.theme,
    language: settings.language,
    currency: settings.currency,
    updateTheme: (value: 'dark' | 'light' | 'system') => updateSetting('theme', value),
    updateLanguage: (value: 'en' | 'zh') => updateSetting('language', value),
    updateCurrency: (value: 'USD' | 'EUR' | 'CNY') => updateSetting('currency', value),
  };
}

export function usePrivacySettings() {
  const { settings, updateSetting } = useSettings();
  
  return {
    hideBalance: settings.hideBalance,
    hideActivity: settings.hideActivity,
    updateHideBalance: (value: boolean) => updateSetting('hideBalance', value),
    updateHideActivity: (value: boolean) => updateSetting('hideActivity', value),
  };
}

export function useInsuranceSettings() {
  const { settings, updateSetting } = useSettings();
  
  return {
    autoInsurance: settings.autoInsurance,
    insuranceThreshold: settings.insuranceThreshold,
    preferredCoverage: settings.preferredCoverage,
    updateAutoInsurance: (value: boolean) => updateSetting('autoInsurance', value),
    updateInsuranceThreshold: (value: string) => updateSetting('insuranceThreshold', value),
    updatePreferredCoverage: (value: 'rug_pull' | 'price_drop' | 'smart_contract' | 'comprehensive') => 
      updateSetting('preferredCoverage', value),
  };
}

export function useCopyTradingSettings() {
  const { settings, updateSetting } = useSettings();
  
  return {
    copyTradingEnabled: settings.copyTradingEnabled,
    maxCopyAmount: settings.maxCopyAmount,
    copyRiskLevel: settings.copyRiskLevel,
    autoStopLoss: settings.autoStopLoss,
    updateCopyTradingEnabled: (value: boolean) => updateSetting('copyTradingEnabled', value),
    updateMaxCopyAmount: (value: string) => updateSetting('maxCopyAmount', value),
    updateCopyRiskLevel: (value: 'low' | 'medium' | 'high') => updateSetting('copyRiskLevel', value),
    updateAutoStopLoss: (value: boolean) => updateSetting('autoStopLoss', value),
  };
}
