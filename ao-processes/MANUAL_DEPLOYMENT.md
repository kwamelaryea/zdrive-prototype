# Manual AO Process Deployment

## Prerequisites

1. **Install AOS CLI:**
   ```bash
   npm install -g https://get_ao.g8way.io
   ```

2. **Verify installation:**
   ```bash
   aos --version
   ```

3. **Have AR tokens in your wallet** (for deployment fees)

## Step-by-Step Deployment

### 1. Deploy Creator NFT Process

```bash
# Navigate to ao-processes directory
cd ao-processes

# Start AOS CLI
aos

# In the AOS CLI, load and deploy the Creator NFT process
.load creator-nft-process.lua

# The CLI will return a process ID - save this!
# Example output: Process ID: abc123...
```

**Save the Creator NFT Process ID**: `_________________`

### 2. Deploy Basic Access NFT Process

```bash
# In AOS CLI (or restart if needed)
.load basic-access-nft-process.lua

# Save this process ID too!
```

**Save the Basic Access Process ID**: `_________________`

### 3. Deploy Premium Access NFT Process

```bash
# In AOS CLI
.load premium-access-nft-process.lua

# Save this process ID!
```

**Save the Premium Access Process ID**: `_________________`

### 4. Deploy Access Control Process

```bash
# In AOS CLI
.load access-control-process.lua

# Save this process ID!
```

**Save the Access Control Process ID**: `_________________`

### 5. Update Frontend Configuration

Edit `project/src/services/aoService.ts` and replace the process IDs:

```typescript
export const AO_PROCESSES = {
  CREATOR_NFT: 'your_creator_nft_process_id_here',
  BASIC_ACCESS: 'your_basic_access_process_id_here', 
  PREMIUM_ACCESS: 'your_premium_access_process_id_here',
  ACCESS_CONTROL: 'your_access_control_process_id_here',
  TOKEN: 'token_process_id' // Keep this as is for now
};
```

### 6. Configure Inter-Process Dependencies

After deployment, send configuration messages to link the processes:

```bash
# In AOS CLI, send configuration to Basic Access Process
Send({ Target = "your_basic_access_process_id", Action = "Set-Config", CreatorNFTProcess = "your_creator_nft_process_id", TokenProcess = "token_process_id" })

# Send configuration to Premium Access Process  
Send({ Target = "your_premium_access_process_id", Action = "Set-Config", CreatorNFTProcess = "your_creator_nft_process_id", TokenProcess = "token_process_id" })

# Send configuration to Access Control Process
Send({ Target = "your_access_control_process_id", Action = "Set-Config", CreatorNFTProcess = "your_creator_nft_process_id", BasicAccessProcess = "your_basic_access_process_id", PremiumAccessProcess = "your_premium_access_process_id" })
```

### 7. Test the Deployment

1. **Restart your development server:**
   ```bash
   cd project
   npm run dev
   ```

2. **Test upload functionality** - should now use real AO processes

3. **Monitor the browser console** for any errors

## Quick Copy-Paste Template

After deployment, copy this template and fill in your process IDs:

```typescript
// Replace in project/src/services/aoService.ts
export const AO_PROCESSES = {
  CREATOR_NFT: 'PASTE_CREATOR_NFT_PROCESS_ID_HERE',
  BASIC_ACCESS: 'PASTE_BASIC_ACCESS_PROCESS_ID_HERE',
  PREMIUM_ACCESS: 'PASTE_PREMIUM_ACCESS_PROCESS_ID_HERE', 
  ACCESS_CONTROL: 'PASTE_ACCESS_CONTROL_PROCESS_ID_HERE',
  TOKEN: 'token_process_id'
};
```

## Troubleshooting

### Common Issues:

1. **"Process not found"** - Make sure process ID is correct
2. **"Insufficient funds"** - Add AR tokens to your wallet
3. **"CORS errors"** - This is normal during deployment, should resolve once processes are active
4. **"Signer not found"** - Make sure ArConnect wallet is connected

### Verification Commands:

```bash
# Test if a process is active
Send({ Target = "your_process_id", Action = "Info" })

# Check process state
Send({ Target = "your_process_id", Action = "Platform-Stats" })
```

## Expected Results

After successful deployment:
- ✅ Upload should create real Creator NFTs
- ✅ Purchase flows should work with real payments
- ✅ Access control should validate against real NFTs
- ✅ Platform fees should be collected to the platform wallet

The CORS errors you saw will disappear once real process IDs are in place!