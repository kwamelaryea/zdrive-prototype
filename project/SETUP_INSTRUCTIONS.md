# ZDrive Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:** Go to `http://localhost:5173`

## Development Mode

The application is currently in development mode, which means:

- **Upload functionality** is simulated (no actual AO process deployment required)
- **Access control** is simulated (always grants free access)
- **Wallet connection** is required but AO messages are mocked

## Testing Upload

1. **Connect your wallet** (ArConnect or compatible)
2. **Go to Upload page** (`/upload`)
3. **Fill in the form:**
   - Select a video file
   - Select a thumbnail image
   - Enter title and description
   - Set pricing (if not free)
   - Choose genre and tags
4. **Click Upload** - The process will be simulated

## Production Deployment

To deploy to production:

1. **Deploy AO processes** following the deployment guide in `../ao-processes/DEPLOYMENT_GUIDE.md`
2. **Update process IDs** in `src/services/aoService.ts`:
   ```typescript
   export const AO_PROCESSES = {
     CREATOR_NFT: 'your_deployed_creator_process_id',
     BASIC_ACCESS: 'your_deployed_basic_access_process_id',
     PREMIUM_ACCESS: 'your_deployed_premium_access_process_id',
     ACCESS_CONTROL: 'your_deployed_access_control_process_id',
     TOKEN: 'your_token_process_id'
   };
   ```
3. **Build and deploy:** `npm run build`

## Troubleshooting

### Common Issues

1. **"Cannot redefine property: ethereum"** - This is a browser extension conflict, not related to our code
2. **Upload fails** - Make sure wallet is connected and form is filled out correctly
3. **Access denied** - In development mode, access should always be granted

### Dependencies

The project requires these key dependencies:
- `@permaweb/aoconnect` - For AO integration
- `arweave` - For Arweave integration
- `react-hot-toast` - For notifications

All dependencies are included in `package.json`.