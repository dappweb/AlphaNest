'use client';

import { useState, useEffect } from 'react';
import { PopCowAvatar } from './popcow-avatar';

interface PopCowTooltipProps {
  message?: string;
  autoShow?: boolean;
  duration?: number;
}

const randomMessages = [
  "🐄 Moo! PopCow discovered a new Alpha opportunity!",
  "🚀 Follow the smartest cow to find great projects!",
  "⚠️ PopCow Alert: Watch out for potential Rug Pulls!",
  "💎 PopCow only recommends premium projects!",
  "🔍 PopCow is analyzing market trends...",
  "🎯 PopCow helps you find the next golden opportunity!",
  "🛡️ Use CowGuard to protect your investments!",
  "📊 PopCow's data analysis is never wrong!",
  "🌟 PopCow's intelligence at your service!",
  "🔥 Hot tip from PopCow: Check the new trending tokens!",
  "💰 PopCow users get better rates and protection!",
  "🎪 Welcome to PopCow's crypto circus - but safer!"
];

export function PopCowTooltip({ 
  message, 
  autoShow = true, 
  duration = 5000 
}: PopCowTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(
    message || randomMessages[Math.floor(Math.random() * randomMessages.length)]
  );

  useEffect(() => {
    if (!autoShow) return;

    const showTooltip = () => {
      setCurrentMessage(
        message || randomMessages[Math.floor(Math.random() * randomMessages.length)]
      );
      setIsVisible(true);
      
      setTimeout(() => {
        setIsVisible(false);
      }, duration);
    };

    // 首次显示
    const initialDelay = setTimeout(showTooltip, 2000);
    
    // 定期显示
    const interval = setInterval(showTooltip, 30000); // 每30秒显示一次

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [autoShow, duration, message]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <PopCowAvatar 
          size="lg" 
          mood="thinking" 
          animated 
          onClick={() => setIsVisible(!isVisible)}
        />
        
        {isVisible && (
          <div className="absolute bottom-full right-0 mb-2 w-64 rounded-lg bg-white dark:bg-gray-800 p-3 shadow-lg border animate-in slide-in-from-bottom-2">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {currentMessage}
            </div>
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-white dark:bg-gray-800 border-r border-b rotate-45"></div>
          </div>
        )}
      </div>
    </div>
  );
}