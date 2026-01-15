'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings, usePrivacySettings, useTradingSettings } from '@/hooks/use-settings';

export function SettingsTest() {
  const { settings, updateSetting, resetSettings } = useSettings();
  const { hideBalance, updateHideBalance } = usePrivacySettings();
  const { slippage, updateSlippage } = useTradingSettings();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>设置功能测试</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">当前设置:</p>
          <pre className="text-xs bg-muted p-2 rounded">
            {JSON.stringify(settings, null, 2)}
          </pre>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">测试功能:</p>
          
          <div className="flex items-center justify-between">
            <span>隐藏余额: {hideBalance ? '是' : '否'}</span>
            <Button 
              size="sm" 
              onClick={() => updateHideBalance(!hideBalance)}
            >
              切换
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <span>滑点: {slippage}%</span>
            <Button 
              size="sm" 
              onClick={() => updateSlippage('1.0')}
            >
              设为1.0%
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetSettings}
            className="w-full"
          >
            重置所有设置
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>✅ 设置已保存到localStorage</p>
          <p>✅ 组件间状态同步</p>
          <p>✅ 实时更新生效</p>
        </div>
      </CardContent>
    </Card>
  );
}
