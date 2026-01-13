'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PopCowAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'thinking' | 'alert' | 'sleeping' | 'excited';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const moodEmojis = {
  happy: '🐄',
  thinking: '🤔🐄',
  alert: '⚠️🐄', 
  sleeping: '😴🐄',
  excited: '🚀🐄'
};

export function PopCowAvatar({ 
  size = 'md', 
  mood = 'happy', 
  animated = false,
  className,
  onClick 
}: PopCowAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        sizeClasses[size],
        'flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 cursor-pointer transition-all duration-300',
        animated && 'hover:scale-110 hover:rotate-12',
        isHovered && 'shadow-lg shadow-orange-500/25',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-lg select-none">
        {moodEmojis[mood]}
      </span>
    </div>
  );
}