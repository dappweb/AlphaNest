# AlphaNest Web Client

The frontend web application for AlphaNest - a cross-chain Meme asset issuance and traffic aggregation platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TailwindCSS + shadcn/ui
- **Wallet**: RainbowKit + Wagmi (EVM) / Wallet Adapter (Solana)
- **State**: Zustand + React Query
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect Cloud Project ID |
| `NEXT_PUBLIC_API_URL` | Backend API endpoint |
| `NEXT_PUBLIC_ENVIRONMENT` | Current environment (development/production) |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

### Cloudflare Pages

```bash
# Build for Cloudflare Pages
npm run pages:build

# Deploy to Cloudflare Pages
npm run pages:deploy
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Base UI components (shadcn/ui)
│   ├── layout/             # Layout components (Header, Sidebar)
│   ├── dashboard/          # Dashboard page components
│   └── providers/          # React context providers
├── config/                 # Configuration files
├── lib/                    # Utility functions
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

## Key Features

- **Dashboard**: Overview of trending tokens, Dev rankings, and platform stats
- **Trade**: Multi-chain token trading with aggregated liquidity
- **Dev Rankings**: Reputation-based Dev leaderboard with win rate tracking
- **Insurance**: AlphaGuard Rug insurance marketplace
- **Points**: Verify-to-Earn points system and rewards center

## License

MIT
