'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PopCowAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  mood?: 'happy' | 'thinking' | 'alert' | 'sleeping' | 'excited';
  animated?: boolean;
  className?: string;
  onClick?: () => void;
  showBorder?: boolean;
}

const sizeConfig = {
  sm: { container: 'w-8 h-8', image: 24 },
  md: { container: 'w-12 h-12', image: 40 }, 
  lg: { container: 'w-16 h-16', image: 56 },
  xl: { container: 'w-24 h-24', image: 88 }
};

export function PopCowAvatar({ 
  size = 'md', 
  mood = 'happy', 
  animated = false,
  className,
  onClick,
  showBorder = true
}: PopCowAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        config.container,
        'flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 overflow-hidden',
        showBorder && 'border-4 border-orange-500/30 bg-gradient-to-br from-orange-400/20 to-orange-600/20',
        animated && 'hover:scale-110',
        isHovered && 'shadow-lg shadow-orange-500/40 border-orange-500',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image
        src="/logo.png"
        alt="PopCow"
        width={config.image}
        height={config.image}
        className="object-contain"
        priority
      />
    </div>
  );
}