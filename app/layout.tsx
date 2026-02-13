import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paxeer User Stats API — Playground',
  description: 'Portfolio tracking and analytics service for Paxeer Network wallets.

Provides real-time portfolio data, token holdings, transaction history,
PNL tracking, and chart data for visualization.

## Features
- **Portfolio Overview**: Complete wallet summary with native and token holdings
- **Token Holdings**: Detailed token balances with USD values
- **Transaction History**: Native transactions and ERC-20/721 transfers
- **PNL Tracking**: Daily profit/loss calculations and history
- **Chart Data**: Time-series data for portfolio analytics

## Authentication
Currently no authentication required. Rate limiting applies.
',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface-0 text-surface-900 antialiased">
        {children}
      </body>
    </html>
  );
}
