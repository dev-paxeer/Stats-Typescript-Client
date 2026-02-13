/**
 * API Playground Configuration
 *
 * Customize the playground appearance, branding, and behavior.
 * This file is the single source of truth for all customizations.
 */
export interface PlaygroundConfig {
  /** API display name */
  name: string;
  /** Short description / tagline */
  description?: string;
  /** Logo URL (displayed in sidebar header) */
  logo?: string;
  /** Default base URL for API requests */
  baseUrl: string;
  /** Path to the OpenAPI YAML spec file (relative to project root) */
  specPath: string;
  /** Theme customization */
  theme?: {
    /** Primary brand color (hex) — generates full palette */
    primaryColor?: string;
    /** Dark mode by default */
    darkMode?: boolean;
    /** Border radius for cards/inputs: 'none' | 'sm' | 'md' | 'lg' */
    radius?: 'none' | 'sm' | 'md' | 'lg';
  };
  /** Authentication defaults */
  auth?: {
    type?: 'bearer' | 'apiKey' | 'basic' | 'none';
    /** Header name for API key auth */
    headerName?: string;
    /** Placeholder text for the token input */
    placeholder?: string;
  };
  /** Feature toggles */
  features?: {
    /** Show code snippet panel */
    codeSnippets?: boolean;
    /** Which snippet languages to show */
    snippetLanguages?: ('curl' | 'javascript' | 'python' | 'sdk')[];
    /** Show response headers */
    responseHeaders?: boolean;
    /** Enable request history */
    history?: boolean;
    /** Show the "Try it" button */
    tryIt?: boolean;
  };
  /** Custom links in the sidebar footer */
  links?: { label: string; href: string }[];
  /** Custom CSS class applied to the root */
  className?: string;
}

const config: PlaygroundConfig = {
  name: 'Paxeer User Stats API',
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
  baseUrl: 'https://us-east-1.user-stats.sidiora.exchange',
  specPath: './openapi.yaml',
  theme: {
    primaryColor: '#6366f1',
    darkMode: true,
    radius: 'md',
  },
  auth: {
    type: 'bearer',
    placeholder: 'Enter your API token...',
  },
  features: {
    codeSnippets: true,
    snippetLanguages: ['curl', 'javascript', 'python'],
    responseHeaders: true,
    history: true,
    tryIt: true,
  },
  links: [
    { label: 'Documentation', href: '/docs' },
  ],
};

export default config;
