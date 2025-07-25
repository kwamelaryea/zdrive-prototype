# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
The main project is located in the `/project` directory. All development commands should be run from `/project`.

## Architecture Overview

### Core Technology Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with dark mode default
- **Animations**: Framer Motion
- **State Management**: React Context (WalletContext, ThemeContext)
- **Forms**: React Hook Form with Zod validation
- **Blockchain**: Arweave integration with ArConnect/Wander wallets
- **UI Components**: Headless UI, Heroicons, Lucide React
- **Video Streaming**: Livepeer for transcoding and adaptive streaming
- **Media**: React Player for video playback with HLS.js support

### Project Structure
```
project/src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (WalletContext, ThemeContext)
├── pages/         # Page components
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── data/          # Mock data and constants
└── index.css      # Global styles and Tailwind imports
```

### Key Features

#### NFT-Based Video Streaming Platform
- **Creator NFTs**: Distribution rights ownership tokens
- **Access NFTs**: Time-limited (Basic) and permanent (Premium) viewing rights
- **Free Content**: No NFT requirement
- **Revenue Distribution**: 90% creator, 10% platform split
- **Royalty System**: 10% creator royalties on NFT resales
- **Livepeer Integration**: Professional video transcoding and adaptive streaming
- **HLS/DASH Support**: Adaptive bitrate streaming for optimal playback

#### Access Control System
- **My Uploads**: Creators see their own content (full access)
- **Free Section**: All users see free content
- **Basic Section**: Time-limited access (7-90 days) requiring Access NFT
- **Premium Section**: Permanent access requiring Premium NFT

#### Wallet Integration
- **ArConnect**: Primary Arweave wallet
- **Wander**: Alternative Arweave wallet
- **Real-time conversion**: AR to USD pricing
- **Balance tracking**: AR balance and token holdings

### Design System

#### Color Palette
- **Primary**: Purple variants (rgb(124, 58, 237) accent)
- **Dark Mode**: Black/dark gray backgrounds (default)
- **Glass morphism**: Backdrop blur effects

#### Component Patterns
- **Mobile-first**: Responsive design starting from mobile
- **Touch-friendly**: 44px+ touch targets
- **Loading states**: Skeleton loading animations
- **Glass effects**: Backdrop blur for modern UI
- **NFT badges**: Visual indicators for content tiers

### Important Technical Implementation

#### ANS-110 Compliance
The platform implements ANS-110 compliant NFT tokens with:
- Required fields: Name, Ticker, Logo, Denomination
- Standard handlers: Balance, Balances, Info, Transfer
- Proper debit/credit notices for transfers

#### Time-Limited Access
- Basic Access NFTs expire after specified timeframes
- Renewal system for expired access
- Real-time expiration validation

#### Smart Contract Architecture (AO/Lua)
- **Creator Tokens**: Minted on video upload
- **Access Tokens**: Minted on purchase with expiration timestamps
- **Revenue Distribution**: Automated payment splitting
- **Royalty Handling**: 10% royalties on secondary sales

### Development Guidelines

#### Component Development
- Use TypeScript interfaces from `src/types/index.ts`
- Follow existing component patterns (VideoCard, Layout components)
- Implement proper error handling with toast notifications
- Use loading states and skeleton components

#### Wallet Integration
- Always check `isConnected` before wallet operations
- Use `useWallet` hook for wallet state management
- Handle wallet connection/disconnection gracefully
- Implement proper error handling for transaction failures

#### NFT Operations
- Validate NFT ownership before granting access
- Check expiration timestamps for time-limited NFTs
- Handle different NFT types (Creator, Basic Access, Premium Access)
- Implement proper royalty calculations

#### Video Streaming Integration
- Use `LivepeerService` for video upload and transcoding
- Implement proper video processing status tracking
- Handle Livepeer API errors gracefully
- Use `LivepeerVideoPlayer` component for optimal playback
- Support both HLS and MP4 fallback formats
- Implement video analytics and metrics tracking

#### Mobile Optimization
- Use responsive design patterns
- Implement touch gestures where appropriate
- Ensure safe area handling for notched devices
- Test on various screen sizes
- Optimize video streaming for mobile networks

### Important Business Rules

#### Access Control
- Creators have full access to their own content
- Basic Access NFTs expire and require renewal
- Premium Access NFTs are permanent
- Free content is accessible to all users

#### Revenue Model
- 0.85% upload fee on storage cost (sent to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`)
- 90% creator share, 10% platform fee on sales (platform fee to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`)
- 10% royalty to original creator on resales
- Time-based pricing for Basic access (7/30/90 days)

#### Security Considerations
- Verify wallet signatures for all transactions
- Validate NFT ownership before content access
- Implement proper access control checks
- Handle expired NFT cleanup

### Testing Approach
- Test wallet connection flows
- Validate NFT purchase and access flows
- Test time-limited access expiration
- Verify royalty distribution calculations
- Test mobile responsiveness

### Common Issues to Avoid
- Don't assume wallet is connected without checking
- Don't grant access without proper NFT validation
- Don't forget to check NFT expiration timestamps
- Don't hardcode wallet addresses or contract IDs
- Always handle async operations with proper error handling

This platform combines Netflix-style streaming with Web3 NFT technology, emphasizing mobile-first design and creator monetization through blockchain-based access control.