-- Premium Access NFT Process - ANS-110 Compliant
-- Handles permanent video viewing rights

local json = require('json')

-- Constants
local PLATFORM_WALLET = "WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg"  -- Replace if needed
local PLATFORM_FEE_PERCENTAGE = 0.10 -- 10% platform fee
local CREATOR_SHARE_PERCENTAGE = 0.90 -- 90% to creator

-- ANS-110 Collection Info
Name = "ZDrive Premium Access"
Ticker = "ZPA"
Description = "Permanent video viewing rights on ZDrive"
Logo = "arweave_logo_tx_id" -- Replace with actual Arweave TX ID for logo
Denomination = 0
Supply = 1000000
Minted = 0

-- Process State
Balances = {} -- address -> token_count
PremiumAccessNFTs = {} -- token_id -> nft_data
UserAccess = {} -- user_address -> {video_id -> access_info}
TokenCounter = 0
RevenueSummary = {} -- video_id -> revenue_data
TransferHistory = {} -- token_id -> transfer_record[]

-- External Process IDs (to be set)
CREATOR_NFT_PROCESS = "Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc"  -- Replace with actual Creator NFT process ID after deploying it
TOKEN_PROCESS = "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10"  -- AO token process ID on mainnet

-- Utility Functions
local function generateTokenId(videoId)
    TokenCounter = TokenCounter + 1
    return "zpa-" .. videoId .. "-" .. TokenCounter .. "-" .. os.time()
end

-- ANS-110 Required Handlers
Handlers.add("Info", Handlers.utils.hasMatchingTag("Action", "Info"), function(msg)
    ao.send({
        Target = msg.From,
        Data = json.encode({
            Name = Name,
            Ticker = Ticker,
            Description = Description,
            Logo = Logo,
            Denomination = Denomination,
            Supply = Supply,
            Minted = Minted
        })
    })
end)

Handlers.add("Balance", Handlers.utils.hasMatchingTag("Action", "Balance"), function(msg)
    local target = msg.Tags.Target or msg.From
    local balance = Balances[target] or 0
    ao.send({
        Target = msg.From,
        Data = tostring(balance)
    })
end)

Handlers.add("Balances", Handlers.utils.hasMatchingTag("Action", "Balances"), function(msg)
    ao.send({
        Target = msg.From,
        Data = json.encode(Balances)
    })
end)

-- Purchase Premium Access NFT
Handlers.add("Purchase-Premium-Access", Handlers.utils.hasMatchingTag("Action", "Purchase-Premium-Access"), function(msg)
    local buyer = msg.From
    local videoId = msg.Tags.VideoId
    local paymentAmount = tonumber(msg.Tags.Payment)
    local title = msg.Tags.Title or "Unknown Video"
    local thumbnailTx = msg.Tags.ThumbnailTx
    local arweaveMetadataId = msg.Tags.ArweaveMetadataId
    
    -- Validate input
    assert(videoId, "VideoId is required")
    assert(paymentAmount and paymentAmount > 0, "Valid payment amount required")
    
    -- For demo/testing purposes, allow placeholder ArweaveMetadataId
    if not arweaveMetadataId or arweaveMetadataId == "" then
        arweaveMetadataId = "demo-metadata-" .. videoId .. "-" .. os.time()
    end
    
    -- Check if user already has premium access to this video
    if UserAccess[buyer] and UserAccess[buyer][videoId] then
        ao.send({
            Target = buyer,
            Action = "Error",
            Data = "User already has premium access to this video"
        })
        return
    end
    
    local currentTime = os.time()
    local tokenId = generateTokenId(videoId)
    
    -- Calculate revenue distribution
    local platformFee = paymentAmount * PLATFORM_FEE_PERCENTAGE
    local creatorShare = paymentAmount * CREATOR_SHARE_PERCENTAGE
    
    -- Metadata reference (posted by frontend from user's wallet)
    local metadata = {
        name = "Premium Access - " .. title,
        description = "Permanent viewing rights for " .. title,
        image = thumbnailTx and ("https://arweave.net/" .. thumbnailTx) or nil,
        external_url = "https://zdrive.app/video/" .. videoId,
        video_id = videoId,
        type = "premium_access_token",
        tier = "premium",
        purchased_at = currentTime,
        expires_at = nil, -- Permanent access
        purchase_price = paymentAmount,
        permanent = true,
        renewable = false,
        attributes = {
            {trait_type = "Access Type", value = "Permanent"},
            {trait_type = "Tier", value = "Premium"},
            {trait_type = "Renewable", value = "No"},
            {trait_type = "Purchase Price", value = paymentAmount .. " AR"},
            {trait_type = "Permanent", value = "Yes"},
            {trait_type = "Collection", value = "ZDrive Access Tokens"},
            {trait_type = "Tradeable", value = "Yes"}
        }
    }
    
    -- Use metadata transaction ID posted by frontend from user's wallet
    local nftTxId = arweaveMetadataId
    print("✅ Using Premium Access metadata TX ID from wallet: " .. nftTxId)
    
    -- Create NFT record
    PremiumAccessNFTs[tokenId] = {
        token_id = tokenId,
        owner = buyer,
        video_id = videoId,
        metadata = metadata,
        created_at = currentTime,
        platform_fee = platformFee,
        creator_share = creatorShare,
        transfer_count = 0,
        arweave_tx_id = nftTxId -- Store the Arweave transaction ID for wallet visibility
    }
    
    -- Update user access
    UserAccess[buyer] = UserAccess[buyer] or {}
    UserAccess[buyer][videoId] = {
        token_id = tokenId,
        expires_at = nil, -- Permanent
        tier = "premium",
        purchased_at = currentTime,
        permanent = true
    }
    
    -- Update balances
    Balances[buyer] = (Balances[buyer] or 0) + 1
    Minted = Minted + 1
    
    -- Update revenue summary
    RevenueSummary[videoId] = RevenueSummary[videoId] or {
        total_revenue = 0,
        platform_fees = 0,
        creator_earnings = 0,
        sales_count = 0,
        premium_sales = 0
    }
    RevenueSummary[videoId].total_revenue = RevenueSummary[videoId].total_revenue + paymentAmount
    RevenueSummary[videoId].platform_fees = RevenueSummary[videoId].platform_fees + platformFee
    RevenueSummary[videoId].creator_earnings = RevenueSummary[videoId].creator_earnings + creatorShare
    RevenueSummary[videoId].sales_count = RevenueSummary[videoId].sales_count + 1
    RevenueSummary[videoId].premium_sales = RevenueSummary[videoId].premium_sales + 1
    
    -- Initialize transfer history
    TransferHistory[tokenId] = {{
        from = "mint",
        to = buyer,
        timestamp = currentTime,
        price = paymentAmount,
        type = "purchase"
    }}
    
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
    
    -- Send creator share to creator NFT process for distribution
    ao.send({
        Target = CREATOR_NFT_PROCESS,
        Action = "Distribute-Revenue",
        Tags = {
            VideoId = videoId,
            Amount = tostring(creatorShare),
            Buyer = buyer,
            TokenId = tokenId,
            Type = "premium"
        }
    })
    
    -- Notify buyer
    ao.send({
        Target = buyer,
        Action = "Premium-Access-Purchased",
        Data = json.encode({
            TokenId = tokenId,
            VideoId = videoId,
            PurchasePrice = paymentAmount,
            Permanent = true,
            Metadata = metadata
        })
    })
    
    -- Send credit notice (ANS-110)
    ao.send({
        Target = buyer,
        Action = "Credit-Notice",
        Data = json.encode({
            TokenId = tokenId,
            Quantity = 1,
            VideoId = videoId,
            Permanent = true
        })
    })
end)

-- Verify Premium Access Rights
Handlers.add("Verify-Premium-Access", Handlers.utils.hasMatchingTag("Action", "Verify-Premium-Access"), function(msg)
    local user = msg.From
    local videoId = msg.Tags.VideoId
    local currentTime = os.time()
    
    local hasAccess = false
    local accessDetails = nil
    
    -- Check user's premium access tokens for this video
    if UserAccess[user] and UserAccess[user][videoId] then
        local access = UserAccess[user][videoId]
        
        -- Premium access is permanent, so always valid
        hasAccess = true
        accessDetails = {
            token_id = access.token_id,
            tier = access.tier,
            purchased_at = access.purchased_at,
            permanent = access.permanent
        }
    end
    
    ao.send({
        Target = user,
        Action = "Premium-Access-Verification",
        Data = json.encode({
            VideoId = videoId,
            HasAccess = hasAccess,
            AccessDetails = accessDetails,
            CheckedAt = currentTime
        })
    })
end)

-- Get User's Premium Access Tokens
Handlers.add("Get-User-Premium-Access", Handlers.utils.hasMatchingTag("Action", "Get-User-Premium-Access"), function(msg)
    local user = msg.Tags.User or msg.From
    local userTokens = {}
    
    if UserAccess[user] then
        for videoId, access in pairs(UserAccess[user]) do
            local nft = PremiumAccessNFTs[access.token_id]
            if nft then
                table.insert(userTokens, {
                    video_id = videoId,
                    token_id = access.token_id,
                    purchased_at = access.purchased_at,
                    permanent = access.permanent,
                    metadata = nft.metadata,
                    transfer_count = nft.transfer_count
                })
            end
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "User-Premium-Access-Tokens",
        Data = json.encode({
            User = user,
            AccessCount = #userTokens,
            PremiumAccessTokens = userTokens
        })
    })
end)

-- ANS-110 Transfer Handler
Handlers.add("Transfer", Handlers.utils.hasMatchingTag("Action", "Transfer"), function(msg)
    local from = msg.From
    local to = msg.Tags.Recipient
    local tokenId = msg.Tags.TokenId
    local salePrice = msg.Tags.Price and tonumber(msg.Tags.Price) or nil
    
    assert(to, "Recipient required")
    assert(tokenId, "TokenId required")
    
    local nft = PremiumAccessNFTs[tokenId]
    if not nft then
        ao.send({
            Target = from,
            Action = "Error",
            Data = "Token not found"
        })
        return
    end
    
    if nft.owner ~= from then
        ao.send({
            Target = from,
            Action = "Error",
            Data = "Not token owner"
        })
        return
    end
    
    -- Check if recipient already has premium access to this video
    if UserAccess[to] and UserAccess[to][nft.video_id] then
        ao.send({
            Target = from,
            Action = "Error",
            Data = "Recipient already has premium access to this video"
        })
        return
    end
    
    local currentTime = os.time()
    
    -- Update ownership
    nft.owner = to
    nft.metadata.last_transfer = currentTime
    nft.transfer_count = nft.transfer_count + 1
    
    -- Update balances
    Balances[from] = Balances[from] - 1
    if Balances[from] == 0 then
        Balances[from] = nil
    end
    Balances[to] = (Balances[to] or 0) + 1
    
    -- Update user access
    if UserAccess[from] then
        UserAccess[from][nft.video_id] = nil
        if next(UserAccess[from]) == nil then
            UserAccess[from] = nil
        end
    end
    
    UserAccess[to] = UserAccess[to] or {}
    UserAccess[to][nft.video_id] = {
        token_id = tokenId,
        expires_at = nil,
        tier = "premium",
        transferred_at = currentTime,
        permanent = true
    }
    
    -- Record transfer in history
    table.insert(TransferHistory[tokenId], {
        from = from,
        to = to,
        timestamp = currentTime,
        price = salePrice,
        type = "transfer"
    })
    
    -- Handle royalty if this is a sale
    if salePrice then
        local royalty = salePrice * 0.10
        local sellerAmount = salePrice - royalty
        
        -- Send royalty to creator via Creator NFT process
        ao.send({
            Target = CREATOR_NFT_PROCESS,
            Action = "Pay-Royalty",
            Tags = {
                VideoId = nft.video_id,
                Amount = tostring(royalty),
                TokenId = tokenId,
                Seller = from,
                Buyer = to,
                Type = "premium"
            }
        })
        
        -- Update NFT with sale information
        nft.metadata.last_sale_price = salePrice
        nft.metadata.last_sale_at = currentTime
        nft.metadata.royalty_paid = royalty
        
        -- Update revenue summary for resale
        RevenueSummary[nft.video_id].resale_volume = (RevenueSummary[nft.video_id].resale_volume or 0) + salePrice
        RevenueSummary[nft.video_id].royalties_paid = (RevenueSummary[nft.video_id].royalties_paid or 0) + royalty
    end
    
    -- Send transfer notifications as Arweave-tagged transactions (ANS-110 required)
    
    -- Debit-Notice as Arweave-tagged transaction
    ao.send({
        Target = from,
        Action = "Debit-Notice",
        Tags = {
            ["Token-ID"] = tokenId,
            ["Arweave-TX-ID"] = nft.arweave_tx_id or "pending",
            ["Name"] = nft.metadata.name,
            ["Image"] = nft.metadata.image or "",
            ["External-Url"] = nft.metadata.external_url,
            ["Collection"] = "ZDrive Access Tokens",
            ["Type"] = "ANS-110",
            ["Transfer-Type"] = "debit",
            ["Recipient"] = to,
            ["Video-ID"] = nft.video_id,
            ["Access-Type"] = "premium",
            ["Permanent"] = "true",
            ["Sale-Price"] = salePrice and tostring(salePrice) or "0"
        },
        Data = json.encode({
            TokenId = tokenId,
            Quantity = 1,
            Recipient = to,
            VideoId = nft.video_id,
            ArweaveTxId = nft.arweave_tx_id,
            TransferType = "debit",
            AccessType = "premium",
            Permanent = true,
            SalePrice = salePrice,
            Metadata = nft.metadata
        })
    })
    
    -- Credit-Notice as Arweave-tagged transaction
    ao.send({
        Target = to,
        Action = "Credit-Notice",
        Tags = {
            ["Token-ID"] = tokenId,
            ["Arweave-TX-ID"] = nft.arweave_tx_id or "pending",
            ["Name"] = nft.metadata.name,
            ["Image"] = nft.metadata.image or "",
            ["External-Url"] = nft.metadata.external_url,
            ["Collection"] = "ZDrive Access Tokens",
            ["Type"] = "ANS-110",
            ["Transfer-Type"] = "credit",
            ["Sender"] = from,
            ["Video-ID"] = nft.video_id,
            ["Access-Type"] = "premium",
            ["Permanent"] = "true",
            ["Sale-Price"] = salePrice and tostring(salePrice) or "0"
        },
        Data = json.encode({
            TokenId = tokenId,
            Quantity = 1,
            Sender = from,
            VideoId = nft.video_id,
            ArweaveTxId = nft.arweave_tx_id,
            TransferType = "credit",
            AccessType = "premium",
            Permanent = true,
            SalePrice = salePrice,
            Metadata = nft.metadata,
            WalletDisplayData = {
                name = nft.metadata.name,
                description = nft.metadata.description,
                image = nft.metadata.image,
                external_url = nft.metadata.external_url,
                attributes = nft.metadata.attributes
            }
        })
    })
end)

-- Get Token Details
Handlers.add("Token-Info", Handlers.utils.hasMatchingTag("Action", "Token-Info"), function(msg)
    local tokenId = msg.Tags.TokenId
    
    local nft = PremiumAccessNFTs[tokenId]
    if not nft then
        ao.send({
            Target = msg.From,
            Action = "Error",
            Data = "Token not found"
        })
        return
    end
    
    ao.send({
        Target = msg.From,
        Action = "Premium-Token-Info",
        Data = json.encode({
            TokenId = tokenId,
            Owner = nft.owner,
            VideoId = nft.video_id,
            Metadata = nft.metadata,
            CreatedAt = nft.created_at,
            TransferCount = nft.transfer_count,
            TransferHistory = TransferHistory[tokenId] or {}
        })
    })
end)

-- Get Video's Premium Access Holders
Handlers.add("Get-Video-Premium-Holders", Handlers.utils.hasMatchingTag("Action", "Get-Video-Premium-Holders"), function(msg)
    local videoId = msg.Tags.VideoId
    local holders = {}
    
    for tokenId, nft in pairs(PremiumAccessNFTs) do
        if nft.video_id == videoId then
            table.insert(holders, {
                token_id = tokenId,
                owner = nft.owner,
                purchased_at = nft.created_at,
                transfer_count = nft.transfer_count,
                last_transfer = nft.metadata.last_transfer,
                purchase_price = nft.metadata.purchase_price,
                last_sale_price = nft.metadata.last_sale_price
            })
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Video-Premium-Holders",
        Data = json.encode({
            VideoId = videoId,
            HolderCount = #holders,
            Holders = holders
        })
    })
end)

-- Get Premium Access Statistics
Handlers.add("Get-Premium-Stats", Handlers.utils.hasMatchingTag("Action", "Get-Premium-Stats"), function(msg)
    local stats = {
        total_minted = Minted,
        total_holders = 0,
        total_revenue = 0,
        total_royalties = 0,
        videos_with_premium = 0,
        average_price = 0
    }
    
    local uniqueHolders = {}
    local totalPurchasePrice = 0
    local videosWithPremium = {}
    
    for tokenId, nft in pairs(PremiumAccessNFTs) do
        uniqueHolders[nft.owner] = true
        totalPurchasePrice = totalPurchasePrice + nft.metadata.purchase_price
        videosWithPremium[nft.video_id] = true
    end
    
    -- Count unique holders
    for _ in pairs(uniqueHolders) do
        stats.total_holders = stats.total_holders + 1
    end
    
    -- Count videos with premium access
    for _ in pairs(videosWithPremium) do
        stats.videos_with_premium = stats.videos_with_premium + 1
    end
    
    -- Calculate totals from revenue summary
    for videoId, revenue in pairs(RevenueSummary) do
        stats.total_revenue = stats.total_revenue + revenue.total_revenue
        stats.total_royalties = stats.total_royalties + (revenue.royalties_paid or 0)
    end
    
    -- Calculate average price
    if Minted > 0 then
        stats.average_price = totalPurchasePrice / Minted
    end
    
    ao.send({
        Target = msg.From,
        Action = "Premium-Stats",
        Data = json.encode(stats)
    })
end)

-- Get Revenue Summary
Handlers.add("Get-Premium-Revenue", Handlers.utils.hasMatchingTag("Action", "Get-Premium-Revenue"), function(msg)
    local videoId = msg.Tags.VideoId
    
    if videoId then
        local revenue = RevenueSummary[videoId] or {
            total_revenue = 0,
            platform_fees = 0,
            creator_earnings = 0,
            sales_count = 0,
            premium_sales = 0,
            resale_volume = 0,
            royalties_paid = 0
        }
        
        ao.send({
            Target = msg.From,
            Action = "Video-Premium-Revenue",
            Data = json.encode({
                VideoId = videoId,
                Revenue = revenue
            })
        })
    else
        ao.send({
            Target = msg.From,
            Action = "All-Premium-Revenue",
            Data = json.encode({
                RevenueByVideo = RevenueSummary
            })
        })
    end
end)

-- Check Multiple Videos Access
Handlers.add("Bulk-Access-Check", Handlers.utils.hasMatchingTag("Action", "Bulk-Access-Check"), function(msg)
    local user = msg.Tags.User or msg.From
    local videoIds = json.decode(msg.Tags.VideoIds or "[]")
    local results = {}
    
    for _, videoId in ipairs(videoIds) do
        local hasAccess = false
        local accessDetails = nil
        
        if UserAccess[user] and UserAccess[user][videoId] then
            hasAccess = true
            accessDetails = {
                token_id = UserAccess[user][videoId].token_id,
                tier = "premium",
                permanent = true
            }
        end
        
        results[videoId] = {
            has_access = hasAccess,
            access_details = accessDetails
        }
    end
    
    ao.send({
        Target = msg.From,
        Action = "Bulk-Access-Results",
        Data = json.encode({
            User = user,
            Results = results
        })
    })
end)

