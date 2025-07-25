# ZDrive AO Process Deployment Guide

## Overview

ZDrive requires 4 AO processes to be deployed on the AO blockchain to create real NFTs:

1. **Creator NFT Process** - Creates NFTs when videos are uploaded
2. **Basic Access Process** - Handles time-limited video access NFTs
3. **Premium Access Process** - Handles permanent video access NFTs
4. **Access Control Process** - Manages viewing permissions

## Prerequisites

1. **ArConnect Wallet** - Connected and funded with AR tokens
2. **AOS CLI** - AO Operating System command line interface
3. **Node.js** - Version 16 or higher

## Step 1: Install AOS CLI

```bash
npm install -g https://get_ao.g8way.io
```

## Step 2: Deploy Each Process

### 2.1 Deploy Creator NFT Process

```bash
# Start AOS
aos

# Load the Creator NFT process
.load ./ao-processes/creator-nft-process.lua

# Get the process ID
.getid

# Copy the process ID (43 characters)
```

### 2.2 Deploy Basic Access Process

```bash
# In a new terminal or after .exit
aos

# Load the Basic Access process
.load ./ao-processes/basic-access-nft-process.lua

# Get the process ID
.getid

# Copy the process ID
```

### 2.3 Deploy Premium Access Process

```bash
# In a new terminal or after .exit
aos

# Load the Premium Access process
.load ./ao-processes/premium-access-nft-process.lua

# Get the process ID
.getid

# Copy the process ID
```

### 2.4 Deploy Access Control Process

```bash
# In a new terminal or after .exit
aos

# Load the Access Control process
.load ./ao-processes/access-control-process.lua

# Get the process ID
.getid

# Copy the process ID
```

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Replace with your actual process IDs
NEXT_PUBLIC_CREATOR_NFT_PROCESS=your-creator-nft-process-id-here
NEXT_PUBLIC_BASIC_ACCESS_PROCESS=your-basic-access-process-id-here
NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS=your-premium-access-process-id-here
NEXT_PUBLIC_ACCESS_CONTROL_PROCESS=your-access-control-process-id-here

# Token process (already deployed)
NEXT_PUBLIC_TOKEN_PROCESS=xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10

# Platform wallet (already configured)
NEXT_PUBLIC_PLATFORM_WALLET=WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg
```

## Step 4: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Step 5: Verify Deployment

1. Go to your Profile page in the app
2. Check the "AO Process Deployment Status" section
3. All processes should show "✅ Deployed"
4. Try uploading a video - it should create real NFTs

## Testing NFT Creation

After deployment:

1. **Upload a video** - Should complete all 5 steps including blockchain registration
2. **Check console logs** - Look for "NFT creation verified! Token ID: xxx"
3. **Check Profile page** - AO Creator NFT Balance should increase
4. **Check Arweave** - Video and thumbnail should be stored permanently

## Troubleshooting

### Process Not Responding
- Ensure the process ID is exactly 43 characters
- Check that the process was loaded successfully in AOS
- Verify your wallet has sufficient AR tokens

### Environment Variables Not Loading
- Ensure `.env.local` is in the project root
- Restart the development server after changes
- Check for typos in variable names

### Upload Still Failing
- Check browser console for detailed error messages
- Verify all 4 processes show "✅ Deployed" in Profile
- Ensure ArConnect wallet is connected

## Process IDs Format

Valid AO process IDs are exactly 43 characters and look like:
```
Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc
```

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify all processes are deployed using the Profile page
3. Ensure your wallet has sufficient AR tokens for transactions

## Security Notes

- Keep your wallet secure and never share private keys
- The platform wallet receives small fees for video uploads
- All video/thumbnail data is stored permanently on Arweave
- NFT ownership is tracked on the AO blockchain