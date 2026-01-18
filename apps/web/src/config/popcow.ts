// PopCowDefi Brand Configuration
export const POPCOW_CONFIG = {
  // Brand Identity
  name: 'PopCowDefi',
  tagline: 'The Smartest Cow in Crypto',
  description: 'Follow PopCowDefi for Alpha discoveries, Rug Pull protection, and safe Meme coin trading.',
  
  // Social Links
  social: {
    twitter: 'https://x.com/popcowxyz',
    telegram: 'https://t.me/popcowxyz',
    discord: 'https://discord.gg/popcow',
  },
  
  // Brand Colors
  colors: {
    primary: '#f97316', // orange-500
    secondary: '#ea580c', // orange-600
    accent: '#fed7aa', // orange-200
    background: '#fff7ed', // orange-50
  },
  
  // PopCowDefi Stats
  stats: {
    successRate: 87,
    rugsPrevented: 156,
    usersSaved: 2300000, // $2.3M
    followers: 50000,
  },
  
  // Product Names
  products: {
    platform: 'PopCowDefi Platform',
    insurance: 'CowGuard Insurance',
    bot: 'PopCowDefi Intelligence Bot',
    token: 'PopCowDefi Token',
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
  
  // Moods for PopCowDefi Avatar
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
  
  // Messages for PopCowDefi Tooltip
  messages: [
    "🐄 Moo! PopCowDefi discovered a new Alpha opportunity!",
    "🚀 Follow the smartest cow to find great projects!",
    "⚠️ PopCowDefi Alert: Watch out for potential Rug Pulls!",
    "💎 PopCowDefi only recommends premium projects!",
    "🔍 PopCowDefi is analyzing market trends...",
    "🎯 PopCowDefi helps you find the next golden opportunity!",
    "🛡️ Use CowGuard to protect your investments!",
    "📊 PopCowDefi's data analysis is never wrong!",
    "🌟 PopCowDefi's intelligence at your service!",
    "🔥 Hot tip from PopCowDefi: Check the new trending tokens!",
    "💰 PopCowDefi users get better rates and protection!",
    "🎪 Welcome to PopCowDefi's crypto adventure - but safer!",
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
