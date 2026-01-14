import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  trailingSlash: false,
  
  // 性能优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 实验性优化
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
    ],
  },
  
  // 减少打包体积
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  
  // Webpack 优化
  webpack: (config, { isServer }) => {
    // 忽略不需要的模块警告
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // 解决 pino-pretty 警告
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pino-pretty': false,
      };
    }
    
    // 优化分块策略
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // 将大型库分离
          wagmi: {
            test: /[\\/]node_modules[\\/](wagmi|viem|@wagmi)[\\/]/,
            name: 'wagmi',
            priority: 30,
            reuseExistingChunk: true,
          },
          rainbowkit: {
            test: /[\\/]node_modules[\\/](@rainbow-me)[\\/]/,
            name: 'rainbowkit',
            priority: 25,
            reuseExistingChunk: true,
          },
          solana: {
            test: /[\\/]node_modules[\\/](@solana)[\\/]/,
            name: 'solana',
            priority: 20,
            reuseExistingChunk: true,
          },
          charts: {
            test: /[\\/]node_modules[\\/](lightweight-charts)[\\/]/,
            name: 'charts',
            priority: 15,
            reuseExistingChunk: true,
          },
          radix: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'radix',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    return config;
  },
};

// Sentry 配置
const sentryWebpackPluginOptions = {
  // 组织和项目 (从环境变量读取)
  org: process.env.SENTRY_ORG || 'alphanest',
  project: process.env.SENTRY_PROJECT || 'alphanest-web',

  // 静默模式 (减少构建日志)
  silent: !process.env.CI,

  // 上传 Source Maps (生产环境)
  widenClientFileUpload: true,

  // 隐藏 Source Maps (不暴露给用户)
  hideSourceMaps: true,

  // 禁用日志
  disableLogger: true,

  // 自动检测 CI 环境
  automaticVercelMonitors: true,
};

// 如果没有配置 Sentry DSN，跳过 Sentry 包装
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
