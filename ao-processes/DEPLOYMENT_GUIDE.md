# ZDrive AO Processes Deployment Guide

## Overview
ZDrive uses 4 separate AO processes to handle different aspects of the NFT-based video streaming platform:

1. **Creator NFT Process** - Handles video uploads and creator token minting
2. **Basic Access Process** - Manages time-limited viewing rights (7-90 days)
3. **Premium Access Process** - Manages permanent viewing rights
4. **Access Control Process** - Validates viewing permissions and manages sessions

## Prerequisites

### Required Tools
- AO CLI installed (`npm install -g @permaweb/ao`)
- Arweave wallet with AR tokens for deployment
- Node.js 18+ for frontend integration

### Required Dependencies
Each process uses the following Lua libraries:
- `json` - JSON encoding/decoding (built-in)
- Standard Lua libraries

## Deployment Steps

### 1. Deploy Creator NFT Process

```bash
# Navigate to the ao-processes directory
cd ao-processes

# Deploy the Creator NFT process
ao deploy creator-nft-process.lua

# Save the returned process ID
export CREATOR_NFT_PROCESS_ID="<returned_process_id>"
```

### 2. Deploy Basic Access Process

```bash
# Deploy the Basic Access process
ao deploy basic-access-nft-process.lua

# Save the returned process ID
export BASIC_ACCESS_PROCESS_ID="<returned_process_id>"
```

### 3. Deploy Premium Access Process

```bash
# Deploy the Premium Access process
ao deploy premium-access-nft-process.lua

# Save the returned process ID
export PREMIUM_ACCESS_PROCESS_ID="<returned_process_id>"
```

### 4. Deploy Access Control Process

```bash
# Deploy the Access Control process
ao deploy access-control-process.lua

# Save the returned process ID
export ACCESS_CONTROL_PROCESS_ID="<returned_process_id>"
```

### 5. Configure Process Inter-Dependencies

After deployment, each process needs to know about the others. Send configuration messages:

#### Configure Basic Access Process
```bash
ao send $BASIC_ACCESS_PROCESS_ID --tags Action=Set-Config CreatorNFTProcess=$CREATOR_NFT_PROCESS_ID TokenProcess=$TOKEN_PROCESS_ID
```

#### Configure Premium Access Process
```bash
ao send $PREMIUM_ACCESS_PROCESS_ID --tags Action=Set-Config CreatorNFTProcess=$CREATOR_NFT_PROCESS_ID TokenProcess=$TOKEN_PROCESS_ID
```

#### Configure Access Control Process
```bash
ao send $ACCESS_CONTROL_PROCESS_ID --tags Action=Set-Config CreatorNFTProcess=$CREATOR_NFT_PROCESS_ID BasicAccessProcess=$BASIC_ACCESS_PROCESS_ID PremiumAccessProcess=$PREMIUM_ACCESS_PROCESS_ID
```

### 6. Update Frontend Configuration

Update the process IDs in your frontend code:

```typescript
// In src/services/aoService.ts
export const AO_PROCESSES = {
  CREATOR_NFT: 'your_creator_nft_process_id',
  BASIC_ACCESS: 'your_basic_access_process_id',
  PREMIUM_ACCESS: 'your_premium_access_process_id',
  ACCESS_CONTROL: 'your_access_control_process_id',
  TOKEN: 'your_token_process_id' // AR token process
};
```

## Configuration

### Platform Configuration
The platform uses these constants across all processes:

```lua
-- Platform wallet for receiving fees
PLATFORM_WALLET = "WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg"

-- Fee structure
UPLOAD_FEE_PERCENTAGE = 0.0085 -- 0.85% of storage fee
PLATFORM_FEE_PERCENTAGE = 0.10 -- 10% of sales
CREATOR_SHARE_PERCENTAGE = 0.90 -- 90% of sales
ROYALTY_PERCENTAGE = 0.10 -- 10% royalty on resales
```

### ANS-110 Compliance
All processes implement ANS-110 standard handlers:
- `Info` - Token collection information
- `Balance` - Get user's token balance
- `Balances` - Get all user balances
- `Transfer` - Transfer tokens between users

## Testing

### 1. Test Creator NFT Process
```bash
# Test video upload
ao send $CREATOR_NFT_PROCESS_ID --tags Action=Upload-Video VideoId=test-video-1 Title="Test Video" ArweaveVideoId=test-video-tx ArweaveThumbnailId=test-thumb-tx StorageFee=0.1

# Check if video was created
ao send $CREATOR_NFT_PROCESS_ID --tags Action=Get-Video VideoId=test-video-1
```

### 2. Test Access Purchases
```bash
# Test basic access purchase
ao send $BASIC_ACCESS_PROCESS_ID --tags Action=Purchase-Basic-Access VideoId=test-video-1 Duration=30 Payment=2.99

# Test premium access purchase
ao send $PREMIUM_ACCESS_PROCESS_ID --tags Action=Purchase-Premium-Access VideoId=test-video-1 Payment=9.99
```

### 3. Test Access Control
```bash
# Test access validation
ao send $ACCESS_CONTROL_PROCESS_ID --tags Action=Request-Access VideoId=test-video-1
```

## Monitoring

### Key Metrics to Monitor
- Total videos uploaded
- Total NFTs minted
- Revenue distribution
- Active viewing sessions
- Failed access attempts

### Useful Queries
```bash
# Get platform statistics
ao send $CREATOR_NFT_PROCESS_ID --tags Action=Platform-Stats

# Get access control statistics
ao send $ACCESS_CONTROL_PROCESS_ID --tags Action=Get-Access-Stats

# Get revenue summary
ao send $BASIC_ACCESS_PROCESS_ID --tags Action=Get-Revenue
ao send $PREMIUM_ACCESS_PROCESS_ID --tags Action=Get-Premium-Revenue
```

## Security Considerations

### Access Control
- All processes validate wallet signatures
- Access tokens expire appropriately
- Creator ownership is verified before operations
- Platform fees are automatically collected

### Data Integrity
- Video metadata is stored immutably
- NFT ownership is tracked accurately
- Transfer history is maintained
- Revenue distribution is transparent

### Error Handling
- Invalid requests are rejected with clear error messages
- Failed transactions don't leave inconsistent state
- Expired tokens are properly cleaned up
- Edge cases are handled gracefully

## Troubleshooting

### Common Issues

1. **Process deployment fails**
   - Check AR balance for deployment fees
   - Verify Lua syntax in process files
   - Ensure all required dependencies are available

2. **Inter-process communication fails**
   - Verify process IDs are correct
   - Check that configuration messages were sent
   - Ensure processes are properly initialized

3. **Frontend integration issues**
   - Verify process IDs in `aoService.ts`
   - Check wallet connection
   - Ensure proper error handling

4. **Access control not working**
   - Check that all processes are deployed
   - Verify video exists in Creator NFT process
   - Ensure user has valid access tokens

### Debug Commands
```bash
# Check process status
ao process $PROCESS_ID

# View recent messages
ao messages $PROCESS_ID --limit 10

# Check process state
ao send $PROCESS_ID --tags Action=Debug-State
```

## Maintenance

### Regular Tasks
- Clean up expired access tokens
- Monitor revenue distribution
- Update process configurations if needed
- Backup important process states

### Updates
To update a process:
1. Deploy new version
2. Update process ID in configuration
3. Test functionality
4. Update frontend if needed

### Scaling
- Monitor process message limits
- Consider splitting high-traffic processes
- Implement caching for frequently accessed data
- Optimize query patterns

## Support

For issues with deployment or operation:
1. Check process logs using AO CLI
2. Verify all configuration steps were completed
3. Test with minimal examples first
4. Ensure all dependencies are properly installed

## License

This implementation is part of the ZDrive platform and follows the project's licensing terms.