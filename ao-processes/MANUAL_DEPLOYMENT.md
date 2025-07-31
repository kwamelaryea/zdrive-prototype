# Manual AO Process Deployment Guide

## Overview
This guide explains how to manually deploy the ZDrive AO processes with proper token protocol tags for wallet recognition.

## Prerequisites
1. Install AOS CLI: `npm install -g https://get_ao.g8way.io`
2. Ensure you have Arweave wallet configured
3. Have sufficient AR tokens for deployment

## Token Protocol Tags for Wallet Recognition

The key to making NFTs appear as collectibles in wallets like Wander/ArConnect is including the proper token protocol tags during spawn. These tags tell wallets that the AO process is a token/NFT.

### Required Tags for Each Process Type

#### Creator NFT Process
```bash
aos creator-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Creator Rights" \
  --tag "Token-Symbol" "ZCR" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "100000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Creator distribution rights for ZDrive video platform"
```

#### Premium Access NFT Process
```bash
aos premium-access-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Premium Access" \
  --tag "Token-Symbol" "ZPA" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Permanent video viewing rights on ZDrive"
```

#### Basic Access NFT Process
```bash
aos basic-access-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Basic Access" \
  --tag "Token-Symbol" "ZBA" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Time-limited video viewing rights on ZDrive"
```

#### Access Control Process
```bash
aos access-control-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Access Control" \
  --tag "Token-Symbol" "ZAC" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Access control and verification for ZDrive"
```

## Deployment Steps

### 1. Deploy Creator NFT Process
```bash
cd ao-processes
aos creator-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Creator Rights" \
  --tag "Token-Symbol" "ZCR" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "100000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Creator distribution rights for ZDrive video platform"
```

**Save the process ID** (e.g., `Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc`)

### 2. Deploy Basic Access NFT Process
```bash
aos basic-access-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Basic Access" \
  --tag "Token-Symbol" "ZBA" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Time-limited video viewing rights on ZDrive"
```

**Save the process ID** (e.g., `VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs`)

### 3. Deploy Premium Access NFT Process
```bash
aos premium-access-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Premium Access" \
  --tag "Token-Symbol" "ZPA" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Permanent video viewing rights on ZDrive"
```

**Save the process ID** (e.g., `IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE`)

### 4. Deploy Access Control Process
```bash
aos access-control-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Access Control" \
  --tag "Token-Symbol" "ZAC" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Access control and verification for ZDrive"
```

**Save the process ID** (e.g., `X-Lbejt0NVMaYtknT9FW9FhXNeH8-pu0t7Y2ej0iawI`)

## Update Frontend Configuration

After deployment, update the process IDs in `project/src/services/aoService.ts`:

```typescript
const AO_PROCESSES = {
  CREATOR_NFT: 'Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc',
  BASIC_ACCESS: 'VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs',
  PREMIUM_ACCESS: 'IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE',
  ACCESS_CONTROL: 'X-Lbejt0NVMaYtknT9FW9FhXNeH8-pu0t7Y2ej0iawI',
  TOKEN: 'xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10'
};
```

## Verification

### 1. Check Process Deployment
```bash
# Test each process with a dryrun
aos --dryrun --process <PROCESS_ID> --tag "Action" "Info"
```

### 2. Check Wallet Recognition
1. Open Wander/ArConnect wallet
2. Go to Collectibles section
3. Look for your deployed tokens
4. They should appear with proper names and symbols

### 3. Test Token Functions
```bash
# Test balance
aos --dryrun --process <PROCESS_ID> --tag "Action" "Balance" --tag "Target" <YOUR_ADDRESS>

# Test info
aos --dryrun --process <PROCESS_ID> --tag "Action" "Info"
```

## Troubleshooting

### NFTs Not Appearing in Wallet
1. **Check token protocol tags**: Ensure all required tags are present
2. **Verify process deployment**: Use dryrun to test process functionality
3. **Check wallet sync**: Some wallets may need time to index new tokens
4. **Verify ANS-110 compliance**: Ensure metadata follows the standard

### Process Deployment Fails
1. **Check AOS CLI version**: Ensure you have the latest version
2. **Verify wallet connection**: Ensure your wallet is properly connected
3. **Check AR balance**: Ensure sufficient tokens for deployment
4. **Review error messages**: Look for specific error details

## Key Differences from Previous Implementation

### What Changed
1. **Added token protocol tags**: `Variant: ao.TKN`, `Type: Process`, etc.
2. **Enhanced ANS-110 compliance**: Proper metadata structure
3. **Wallet recognition**: Tokens now appear as collectibles
4. **Standard token interface**: Follows AO Token Protocol

### Benefits
1. **Wallet compatibility**: NFTs appear in Wander/ArConnect collectibles
2. **Standard compliance**: Follows established AO token standards
3. **Better discoverability**: Proper metadata for marketplaces
4. **Enhanced UX**: Users can see their NFTs in wallet

## Next Steps

1. **Test upload flow**: Upload a video and verify creator NFT creation
2. **Test purchase flow**: Purchase access and verify access NFT creation
3. **Monitor wallet display**: Check that NFTs appear in wallet collectibles
4. **Test transfers**: Verify NFT transfer functionality
5. **Monitor performance**: Check process logs for any issues