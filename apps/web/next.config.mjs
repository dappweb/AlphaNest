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
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  trailingSlash: false,
  
  // 性能优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 压缩优化
  compress: true,
  
  // 生产环境优化
  productionBrowserSourceMaps: false,
  
  // 静态页面生成优化
  generateBuildId: async () => {
    return 'build-' + Date.now();
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
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-label',
      '@solana/web3.js',
      'wagmi',
      'viem',
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
        minSize: 20000,
        maxSize: 244000,
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
          radix: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'radix',
            priority: 10,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };
    
    return config;
  },
};

export default nextConfig;
