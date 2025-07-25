# Platform Fee Collection Verification

## Platform Wallet Address
All fees are collected to: `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`

## Fee Collection Points

### 1. Creator NFT Process (`creator-nft-process.lua`)

**Upload Fee Collection:**
- **Location**: Line 172-184 in `Upload-Video` handler
- **Amount**: 0.85% of storage fee (`storageFee * 0.0085`)
- **Recipient**: `PLATFORM_WALLET` (set to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`)
- **Code**:
```lua
-- Send upload fee to platform wallet
if uploadFee > 0 then
    ao.send({
        Target = "TOKEN_PROCESS_ID",
        Action = "Transfer",
        Recipient = PLATFORM_WALLET,
        Quantity = tostring(uploadFee),
        Tags = {
            {name = "Upload-Fee", value = videoId},
            {name = "Creator", value = creator}
        }
    })
end
```

### 2. Basic Access NFT Process (`basic-access-nft-process.lua`)

**Platform Fee Collection:**
- **Location**: Line 193-201 in `Purchase-Basic-Access` handler
- **Amount**: 10% of payment amount (`paymentAmount * 0.10`)
- **Recipient**: `PLATFORM_WALLET` (set to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`)
- **Code**:
```lua
-- Send platform fee
ao.send({
    Target = TOKEN_PROCESS,
    Action = "Transfer",
    Recipient = PLATFORM_WALLET,
    Quantity = tostring(platformFee),
    Tags = {
        {name = "Platform-Fee", value = videoId},
        {name = "Buyer", value = buyer}
    }
})
```

**Renewal Fee Collection:**
- **Location**: Line 334-342 in `Renew-Access` handler
- **Amount**: 10% of renewal payment (`paymentAmount * 0.10`)
- **Recipient**: `PLATFORM_WALLET` (set to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`)
- **Code**:
```lua
-- Send platform fee
ao.send({
    Target = TOKEN_PROCESS,
    Action = "Transfer",
    Recipient = PLATFORM_WALLET,
    Quantity = tostring(platformFee),
    Tags = {
        {name = "Platform-Fee-Renewal", value = videoId},
        {name = "User", value = user}
    }
})
```

### 3. Premium Access NFT Process (`premium-access-nft-process.lua`)

**Platform Fee Collection:**
- **Location**: Line 170-181 in `Purchase-Premium-Access` handler
- **Amount**: 10% of payment amount (`paymentAmount * 0.10`)
- **Recipient**: `PLATFORM_WALLET` (set to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`)
- **Code**:
```lua
-- Send platform fee
ao.send({
    Target = TOKEN_PROCESS,
    Action = "Transfer",
    Recipient = PLATFORM_WALLET,
    Quantity = tostring(platformFee),
    Tags = {
        {name = "Platform-Fee", value = videoId},
        {name = "Buyer", value = buyer},
        {name = "Type", value = "premium"}
    }
})
```

### 4. Access Control Process (`access-control-process.lua`)

**No Direct Fee Collection:**
- This process handles access validation and session management
- Does not collect fees directly
- All fee collection happens in the other processes

## Fee Structure Summary

| Fee Type | Amount | Collected From | Sent To |
|----------|--------|----------------|---------|
| Upload Fee | 0.85% of storage cost | Video uploader | `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg` |
| Basic Access Fee | 10% of purchase price | Access buyer | `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg` |
| Basic Renewal Fee | 10% of renewal price | Access renewer | `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg` |
| Premium Access Fee | 10% of purchase price | Access buyer | `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg` |

## Constants Verification

All processes have the platform wallet correctly set:

```lua
local PLATFORM_WALLET = "WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg"
local PLATFORM_FEE_PERCENTAGE = 0.10 -- 10% platform fee
local UPLOAD_FEE_PERCENTAGE = 0.0085 -- 0.85% upload fee
```

## Frontend Configuration

The frontend service (`aoService.ts`) also has the correct platform wallet:

```typescript
export const PLATFORM_CONFIG = {
  PLATFORM_WALLET: 'WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg',
  UPLOAD_FEE_PERCENTAGE: 0.0085,
  PLATFORM_FEE_PERCENTAGE: 0.10,
  CREATOR_SHARE_PERCENTAGE: 0.90,
  ROYALTY_PERCENTAGE: 0.10
};
```

## Revenue Distribution Flow

1. **Upload**: Creator pays 0.85% of storage fee → Platform wallet
2. **Basic Purchase**: Buyer pays price → 10% to Platform wallet, 90% to Creator
3. **Premium Purchase**: Buyer pays price → 10% to Platform wallet, 90% to Creator
4. **Basic Renewal**: User pays renewal → 10% to Platform wallet, 90% to Creator
5. **NFT Resale**: Seller receives 90%, Original Creator receives 10% royalty

## Verification Checklist

✅ **Creator NFT Process**: Upload fee sent to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`
✅ **Basic Access Process**: Platform fee sent to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`
✅ **Basic Access Process**: Renewal fee sent to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`
✅ **Premium Access Process**: Platform fee sent to `WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg`
✅ **Frontend Service**: Platform wallet correctly configured
✅ **Documentation**: CLAUDE.md updated with correct wallet address

## Monitoring Platform Fees

To monitor platform fee collection, use these queries:

```bash
# Check Creator NFT process upload fees
ao send $CREATOR_NFT_PROCESS_ID --tags Action=Platform-Stats

# Check Basic Access process revenue
ao send $BASIC_ACCESS_PROCESS_ID --tags Action=Get-Revenue

# Check Premium Access process revenue
ao send $PREMIUM_ACCESS_PROCESS_ID --tags Action=Get-Premium-Revenue
```

All platform fees are correctly configured to be sent to the specified wallet address.