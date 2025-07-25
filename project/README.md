# ZDrive - Mobile-First NFT Video Streaming Platform

A comprehensive mobile-first video streaming dApp that combines Netflix-style content delivery with NFT marketplace features, built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Platform Features
- **Mobile-First Design** - Optimized for mobile devices with responsive layouts
- **Dark Mode Default** - Modern dark theme with purple accent colors (rgb(124, 58, 237))
- **Video Streaming** - High-quality video playback with adaptive streaming
- **NFT Marketplace** - Buy, sell, and trade video access NFTs
- **Wallet Integration** - ArConnect and Wander wallet support
- **Real-time Price Conversion** - Live AR/USD price conversion

### User Experience
- **Hero Carousel** - Featured content showcase
- **Category Browsing** - Organized content discovery
- **Search & Filters** - Advanced content filtering
- **Loading States** - Smooth loading animations
- **Progress Indicators** - Real-time feedback
- **Toast Notifications** - User-friendly notifications

### Content Features
- **Multiple Access Tiers**:
  - Free content for audience building
  - Premium NFT-gated content ($2.99 typical)
  - Time-limited rentals ($0.99-$2.99, 7-30 days)
- **Creator Tools** - Upload, pricing, analytics
- **Video Metadata** - Duration, ratings, descriptions, tags
- **Social Features** - Likes, comments, shares, bookmarks

### NFT & Blockchain Features
- **Dual NFT System**:
  - Creator NFTs (distribution rights)
  - User NFTs (access rights)
- **Revenue Distribution** - 90% creator, 10% platform
- **Royalty System** - 10% creator royalties on resales
- **Blockchain Integration** - Arweave storage and transactions
- **Access Control** - NFT-based content gating

### Creator Features
- **Analytics Dashboard** - Revenue, views, engagement metrics
- **Profile Management** - Editable profiles with social links
- **Content Management** - Upload, edit, delete videos
- **Revenue Tracking** - Real-time earnings and analytics
- **NFT Configuration** - Supply, pricing, royalty settings

### Admin & Moderation
- **Report System** - Categorized content reporting
- **Admin Dashboard** - Platform analytics and controls
- **Content Moderation** - Visibility and access controls
- **Platform Wallet** - Admin authentication and management

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form with Zod validation
- **Blockchain**: Arweave integration
- **Media**: React Player for video playback
- **Charts**: Recharts for analytics
- **Notifications**: React Hot Toast

## 📱 Mobile-First Design

The platform is built with mobile-first principles:
- Touch-friendly interface elements (44px+ touch targets)
- Responsive grid layouts
- Optimized image loading
- Swipe gestures support
- Safe area handling for notched devices
- Progressive enhancement for larger screens

## 🎨 Design System

### Color Palette
- **Primary**: Purple variants (rgb(124, 58, 237) accent)
- **Dark Mode**: Black/dark gray backgrounds
- **Success**: Green variants
- **Warning**: Yellow/orange variants
- **Error**: Red variants

### Typography
- **Font**: Inter (system fallback)
- **Responsive text** classes for scalable typography
- **Text gradients** for enhanced visual appeal

### Components
- **Glass morphism** effects for modern UI
- **Card system** with hover states
- **Button variants** (primary, secondary, ghost, outline)
- **Input styling** with focus states
- **NFT badges** for content categorization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zdrive-new/project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── VideoCard.tsx   # Video display component
│   ├── HeroCarousel.tsx # Featured content carousel
│   ├── ContentGrid.tsx # Content grid layout
│   ├── Header.tsx      # Navigation header
│   ├── BottomNav.tsx   # Mobile navigation
│   └── Layout.tsx      # App layout wrapper
├── pages/              # Page components
│   ├── Home.tsx        # Homepage with featured content
│   ├── VideoPage.tsx   # Individual video page
│   ├── Profile.tsx     # User profile page
│   ├── CreatorProfile.tsx # Creator profile page
│   ├── Upload.tsx      # Video upload page
│   ├── Search.tsx      # Search and discovery
│   └── Admin.tsx       # Admin dashboard
├── contexts/           # React contexts
│   ├── WalletContext.tsx # Blockchain wallet state
│   └── ThemeContext.tsx  # Theme management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   └── format.ts       # Formatting helpers
├── data/               # Mock data and constants
│   └── mockData.ts     # Sample content data
└── styles/             # Global styles
    └── index.css       # Tailwind and custom CSS
```

## 🔗 Wallet Integration

The platform supports multiple wallet providers:

### ArConnect
- Primary wallet for Arweave ecosystem
- Full transaction signing support
- NFT management capabilities

### Wander
- Alternative Arweave wallet
- Mobile-optimized experience
- Seamless blockchain interactions

### Features
- Automatic wallet detection
- Balance tracking
- Transaction history
- NFT collection display
- Real-time price conversion

## 💰 Monetization Model

### Revenue Streams
- **Creator Revenue**: 90% of sales go to creators
- **Platform Fee**: 10% platform commission
- **Upload Fee**: 1% fee on content uploads
- **NFT Royalties**: 10% creator royalties on resales

### Pricing Structure
- **Free Tier**: Audience building content
- **Basic Access**: $0.99-$2.99 for time-limited access
- **Premium NFTs**: $2.99+ for permanent access
- **Creator NFTs**: Variable pricing for distribution rights

## 🎯 Content Categories

- **Technology** - Web3, AI, blockchain content
- **Education** - Tutorials and learning content  
- **Art & Design** - Creative and artistic content
- **Entertainment** - General entertainment content
- **Documentary** - Educational documentaries
- **Gaming** - Gaming-related content
- **Wellness** - Health and wellness content
- **Music** - Music and audio content

## 📊 Analytics & Metrics

### Creator Analytics
- Total views and unique viewers
- Watch time and completion rates
- Revenue tracking and trends
- Audience demographics
- Engagement metrics
- NFT sales performance

### Platform Analytics
- Total content and creators
- NFT marketplace volume
- User engagement metrics
- Revenue distribution
- Geographic insights

## 🔒 Security Features

- **Wallet Authentication** - Secure blockchain-based auth
- **Content Encryption** - Protected premium content
- **Access Control** - NFT-based content gating
- **Report System** - Community moderation tools
- **Admin Controls** - Platform management tools

## 🌐 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Create a `.env` file with:
```env
VITE_APP_NAME=ZDrive
VITE_ARWEAVE_GATEWAY=https://arweave.net
VITE_PRICE_API_URL=https://api.coingecko.com/api/v3
```

### Deployment Platforms
- **Vercel** - Recommended for React apps
- **Netlify** - Alternative static hosting
- **IPFS** - Decentralized hosting option
- **Arweave** - Permanent storage option

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Arweave** - Permanent storage infrastructure
- **React Team** - Frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Vite** - Build tool and development server

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core platform functionality
- ✅ NFT marketplace integration
- ✅ Mobile-first responsive design
- ✅ Wallet connectivity

### Phase 2 (Next)
- [ ] Live streaming capabilities
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Enhanced search and discovery
- [ ] Creator collaboration tools

### Phase 3 (Future)
- [ ] Cross-chain NFT support
- [ ] AI-powered content recommendations
- [ ] Virtual reality content support
- [ ] Advanced monetization features
- [ ] Creator DAO governance

## 📞 Support

For support and questions:
- Create an issue in the repository
- Join our Discord community
- Follow us on Twitter for updates

---

Built with ❤️ for the decentralized creator economy 