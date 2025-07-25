# Video Platform Access Control Rules

## Core Access Rules

### **My Uploads Section**
- **Rule**: Wallet-connected users see only their own uploaded content
- **Access**: Full access to own content regardless of pricing tier
- **Implementation**: Filter by creator wallet address

### **Free to Watch Section**
- **Rule**: All users see all content marked as "Free" by creators
- **Access**: Unlimited viewing without payment or NFT requirement
- **Implementation**: Filter by `price: 0` or `tier: "free"`

### **Basic Section (Timeframe-Based Access)**
- **Rule**: 
  - Creators see their own Basic content (full access)
  - Non-creators must purchase time-limited Access NFT to view (e.g., 7 days, 30 days)
  - Access expires after the specified timeframe
- **Access**: Timeframe-based NFT access for non-creators
- **Implementation**: Check creator wallet OR verify Access NFT ownership + expiration timestamp

### **Premium Section**
- **Rule**: All creators' Premium content visible
- **Access**: Requires permanent Access NFT purchase for viewing
- **Implementation**: Verify Access NFT ownership for playback

## Advanced Access Rules

### **1. Creator Token Ownership Transfer**
- **Rule**: If a Creator NFT is sold/transferred, the new holder receives all revenue from future Access NFT sales for that video
- **Access**: New Creator NFT holder gains distribution rights
- **Implementation**: Check current Creator NFT owner, not original uploader

### **2. Access NFT Resale Rights**
- **Rule**: Users can resell their Access NFTs with 10% royalty to original creator
- **Access**: Purchaser of resold Access NFT gains viewing rights (with remaining time if timeframe-based)
- **Implementation**: Update Access NFT ownership + royalty distribution + transfer remaining time

### **3. Wallet Disconnection State**
- **Rule**: When wallet disconnects, user loses access to paid content
- **Access**: Reverts to "Free" content only until wallet reconnects
- **Implementation**: Real-time wallet connection monitoring

### **4. Multiple Wallet Support**
- **Rule**: User switching between wallets sees content based on active wallet's NFTs
- **Access**: Each wallet maintains separate Access NFT collection
- **Implementation**: Re-verify NFT ownership on wallet change

### **5. Content Visibility vs Access**
- **Rule**: All content visible in sections, but playback requires proper access
- **Access**: Metadata/thumbnails visible, video player requires NFT/ownership verification
- **Implementation**: Separate display permissions from playback permissions

### **6. Creator Revenue Dashboard**
- **Rule**: Creators see revenue from their current Creator NFT holdings (not original uploads)
- **Access**: Revenue tracking follows Creator NFT ownership, not upload history
- **Implementation**: Link revenue to current Creator NFT holder

### **7. Failed Payment Handling**
- **Rule**: If NFT minting fails after payment, user gets refund or retry option
- **Access**: No access granted until successful NFT creation
- **Implementation**: Payment escrow until NFT confirmation

### **8. Bulk Purchase Discounts**
- **Rule**: Multiple Access NFT purchases from same creator could offer discounts
- **Access**: Bulk purchase creates multiple Access NFTs (each with their own timeframes)
- **Implementation**: Creator-defined bulk pricing tiers

### **9. Time-Limited Access Expiration**
- **Rule**: Basic tier Access NFTs expire after specified timeframe and must be renewed
- **Access**: Expired NFTs no longer grant viewing rights
- **Implementation**: Timestamp-based access verification with current time checks

### **10. Access NFT Renewal**
- **Rule**: Users can renew expired Basic Access NFTs at a discounted rate
- **Access**: Renewal extends the expiration timestamp
- **Implementation**: Update `expires_at` field in NFT metadata

## Updated Access Control Matrix

| User Type | Free Content | Basic Content | Premium Content | My Uploads |
|-----------|-------------|---------------|----------------|------------|
| **Disconnected** | ✅ View | ❌ No Access | ❌ No Access | ❌ No Access |
| **Creator (Own)** | ✅ View | ✅ View | ✅ View | ✅ Full Access |
| **Creator (Others)** | ✅ View | 🔐 Need Time-NFT | 🔐 Need NFT | ❌ No Access |
| **User (Has Valid NFT)** | ✅ View | ✅ View | ✅ View | ❌ No Access |
| **User (Has Expired NFT)** | ✅ View | 🔄 Need Renewal | ✅ View* | ❌ No Access |
| **User (No NFT)** | ✅ View | 🔐 Need Time-NFT | 🔐 Need NFT | ❌ No Access |

*Premium NFTs are permanent unless specified otherwise

## Timeframe-Based Access Implementation

### **Basic Tier Access Duration Options**
- **7 Days**: $0.99
- **30 Days**: $2.99
- **90 Days**: $6.99
- **Custom Duration**: Creator-defined

### **Access NFT Metadata Structure**
```json
{
  "name": "Basic Access - [Video Title]",
  "description": "Time-limited viewing rights",
  "video_id": "[video_id]",
  "type": "basic_access_token",
  "tier": "basic",
  "purchased_at": "timestamp",
  "expires_at": "timestamp",
  "duration_days": 30,
  "renewable": true
}
```

### **Premium Access NFT Metadata Structure**
```json
{
  "name": "Premium Access - [Video Title]",
  "description": "Permanent viewing rights",
  "video_id": "[video_id]",
  "type": "premium_access_token",
  "tier": "premium",
  "purchased_at": "timestamp",
  "expires_at": null,
  "permanent": true
}
```

## Implementation Priority

### **Phase 1 (Core)**
- Wallet-based content filtering
- NFT ownership verification
- Creator vs user access differentiation
- Basic timeframe-based access system
- Expiration timestamp validation

### **Phase 2 (Enhanced)**
- Creator NFT transfer handling
- Access NFT resale mechanics with time transfer
- Revenue dashboard updates
- Multiple wallet support
- NFT renewal system

### **Phase 3 (Advanced)**
- Bulk purchase options
- Custom duration settings
- Failed payment recovery
- Advanced revenue tracking
- Automated expiration notifications

## Technical Implementation Notes

### **Timeframe Access Verification**
```lua
-- AO Process: Verify time-based access rights
Handlers.add("Verify-Access", function(msg)
    local user = msg.From
    local video_id = msg.Tags.VideoId
    local current_time = tonumber(msg.Timestamp)
    
    -- Check Creator NFT ownership
    if CreatorNFTs[video_id] and CreatorNFTs[video_id].owner == user then
        ao.send({Target = user, Data = "creator_access"})
        return
    end
    
    -- Check Access NFT ownership and expiration
    for token_id, nft in pairs(AccessNFTs) do
        if nft.owner == user and nft.video_id == video_id then
            -- Check if NFT has expired
            if nft.expires_at and current_time > nft.expires_at then
                ao.send({Target = user, Data = "expired_access"})
                return
            end
            ao.send({Target = user, Data = "valid_access"})
            return
        end
    end
    
    ao.send({Target = user, Data = "no_access"})
end)
```

### **Purchase with Duration**
```lua
-- Purchase Access NFT with specified duration
Handlers.add("Purchase-Access", function(msg)
    local video_id = msg.Tags.VideoId
    local duration_days = tonumber(msg.Tags.Duration or "30")
    local current_time = tonumber(msg.Timestamp)
    local expires_at = current_time + (duration_days * 24 * 60 * 60 * 1000) -- Convert to milliseconds
    
    -- Create Access NFT with expiration
    local token_id = video_id .. "-access-" .. msg.From .. "-" .. current_time
    AccessNFTs[token_id] = {
        token_id = token_id,
        owner = msg.From,
        video_id = video_id,
        purchased_at = current_time,
        expires_at = expires_at,
        duration_days = duration_days,
        renewable = true
    }
    
    -- Revenue distribution logic here...
end)
```

### **NFT Renewal System**
```lua
-- Renew expired Access NFT
Handlers.add("Renew-Access", function(msg)
    local token_id = msg.Tags.TokenId
    local duration_days = tonumber(msg.Tags.Duration or "30")
    local current_time = tonumber(msg.Timestamp)
    
    if AccessNFTs[token_id] and AccessNFTs[token_id].owner == msg.From then
        -- Extend expiration from current time
        AccessNFTs[token_id].expires_at = current_time + (duration_days * 24 * 60 * 60 * 1000)
        AccessNFTs[token_id].renewed_at = current_time
        
        ao.send({Target = msg.From, Data = "renewal_success"})
    else
        ao.send({Target = msg.From, Data = "renewal_failed"})
    end
end)
```

### **Frontend Expiration Handling**
```javascript
// Check if user's access has expired
const checkAccessExpiration = (accessNFT) => {
    const currentTime = Date.now();
    const expiresAt = accessNFT.expires_at;
    
    if (expiresAt && currentTime > expiresAt) {
        return {
            status: 'expired',
            message: 'Your access has expired. Renew to continue watching.',
            renewalAvailable: true
        };
    }
    
    return {
        status: 'valid',
        timeRemaining: expiresAt - currentTime
    };
};
```