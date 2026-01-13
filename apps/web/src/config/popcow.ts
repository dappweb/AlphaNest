// PopCow Brand Configuration
export const POPCOW_CONFIG = {
  // Brand Identity
  name: 'PopCow',
  tagline: 'The Smartest Cow in Crypto',
  description: 'Follow PopCow for Alpha discoveries, Rug Pull protection, and safe Meme coin trading.',
  
  // Social Links
  social: {
    twitter: 'https://x.com/popcowxyz',
    telegram: 'https://t.me/popcowofficial',
    discord: 'https://discord.gg/popcow',
  },
  
  // Brand Colors
  colors: {
    primary: '#f97316', // orange-500
    secondary: '#ea580c', // orange-600
    accent: '#fed7aa', // orange-200
    background: '#fff7ed', // orange-50
  },
  
  // PopCow Stats
  stats: {
    successRate: 87,
    rugsPrevented: 156,
    usersSaved: 2300000, // $2.3M
    followers: 50000,
  },
  
  // Product Names
  products: {
    platform: 'PopCow Platform',
    insurance: 'CowGuard Insurance',
    bot: 'PopCow Intelligence Bot',
    token: 'PopCow Token',
    protection: 'CowGuard Protection',
  },
  
  // Features
  features: [
    'Alpha Hunter',
    'Rug Detector', 
    'Market Analyst',
    'Meme Expert',
    'Smart Trading',
    'Risk Assessment',
  ],
  
  // Moods for PopCow Avatar
  moods: {
    happy: '🐄',
    thinking: '🤔🐄',
    alert: '⚠️🐄',
    sleeping: '😴🐄',
    excited: '🚀🐄',
    smart: '🧠🐄',
    rich: '💰🐄',
    detective: '🔍🐄',
  },
  
  // Messages for PopCow Tooltip
  messages: [
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
    "🎪 Welcome to PopCow's crypto adventure - but safer!",
  ],
} as const;

// Helper functions
export const getRandomPopCowMessage = () => {
  const messages = POPCOW_CONFIG.messages;
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getPopCowMood = (context: 'default' | 'alert' | 'excited' | 'thinking' = 'default') => {
  switch (context) {
    case 'alert':
      return POPCOW_CONFIG.moods.alert;
    case 'excited':
      return POPCOW_CONFIG.moods.excited;
    case 'thinking':
      return POPCOW_CONFIG.moods.thinking;
    default:
      return POPCOW_CONFIG.moods.happy;
  }
};