-- Basic Access NFT Process - ANS-110 Compliant
-- Handles time-limited video viewing rights

local json = require('json')

-- Constants
local PLATFORM_WALLET = "WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg"  -- Replace if needed
local PLATFORM_FEE_PERCENTAGE = 0.10 -- 10% platform fee
local CREATOR_SHARE_PERCENTAGE = 0.90 -- 90% to creator

-- ANS-110 Collection Info
Name = "ZDrive Basic Access"
Ticker = "ZBA"
Description = "Time-limited video viewing rights on ZDrive"
Logo = "arweave_logo_tx_id" -- Replace with actual Arweave TX ID for logo
Denomination = 0
Supply = 1000000
Minted = 0

-- Token Protocol Tags (for wallet recognition)
-- These tags should be included in the spawn transaction:
-- { name: 'Variant', value: 'ao.TKN' }
-- { name: 'Type', value: 'Process' }
-- { name: 'Token-Name', value: 'ZDrive Basic Access' }
-- { name: 'Token-Symbol', value: 'ZBA' }
-- { name: 'Token-Decimals', value: '0' }
-- { name: 'Token-Total-Supply', value: '1000000' }
-- { name: 'Implements', value: 'ANS-110' }
-- { name: 'Data-Protocol', value: 'ao' }

-- Process State
Balances = {} -- address -> token_count
BasicAccessNFTs = {} -- token_id -> nft_data
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
    return "zba-" .. videoId .. "-" .. TokenCounter .. "-" .. os.time()
end

local function isExpired(expiresAt)
    return expiresAt and os.time() > expiresAt
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
    local balance = 0
    
    -- Count non-expired tokens
    if Balances[target] then
        for tokenId, _ in pairs(Balances[target]) do
            local nft = BasicAccessNFTs[tokenId]
            if nft and not isExpired(nft.metadata.expires_at) then
                balance = balance + 1
            end
        end
    end
    
    ao.send({
        Target = msg.From,
        Data = tostring(balance)
    })
end)

Handlers.add("Balances", Handlers.utils.hasMatchingTag("Action", "Balances"), function(msg)
    local validBalances = {}
    
    for address, tokens in pairs(Balances) do
        local count = 0
        for tokenId, _ in pairs(tokens) do
            local nft = BasicAccessNFTs[tokenId]
            if nft and not isExpired(nft.metadata.expires_at) then
                count = count + 1
            end
        end
        if count > 0 then
            validBalances[address] = count
        end
    end
    
    ao.send({
        Target = msg.From,
        Data = json.encode(validBalances)
    })
end)

-- Purchase Basic Access NFT
Handlers.add("Purchase-Basic-Access", Handlers.utils.hasMatchingTag("Action", "Purchase-Basic-Access"), function(msg)
    local buyer = msg.From
    local videoId = msg.Tags.VideoId
    local durationDays = tonumber(msg.Tags.Duration) or 30
    local paymentAmount = tonumber(msg.Tags.Payment)
    local title = msg.Tags.Title or "Unknown Video"
    local thumbnailTx = msg.Tags.ThumbnailTx
    local arweaveMetadataId = msg.Tags.ArweaveMetadataId
    
    -- Validate input
    assert(videoId, "VideoId is required")
    assert(paymentAmount and paymentAmount > 0, "Valid payment amount required")
    assert(durationDays >= 1 and durationDays <= 90, "Duration must be between 1-90 days")
    assert(arweaveMetadataId, "ArweaveMetadataId required - post metadata from wallet first")
    
    -- Get current creator from Creator NFT process
    ao.send({
        Target = CREATOR_NFT_PROCESS,
        Action = "Get-Video",
        Tags = {
            VideoId = videoId
        }
    })
    
    -- This will be handled in a response handler
    -- For now, we'll create the access token assuming valid video
    
    local currentTime = os.time()
    local expiresAt = currentTime + (durationDays * 24 * 60 * 60) -- Convert days to seconds
    local tokenId = generateTokenId(videoId)
    
    -- Calculate revenue distribution
    local platformFee = paymentAmount * PLATFORM_FEE_PERCENTAGE
    local creatorShare = paymentAmount * CREATOR_SHARE_PERCENTAGE
    
    -- Metadata reference (posted by frontend from user's wallet)
    local metadata = {
        name = "Basic Access - " .. title,
        description = "Time-limited viewing rights (" .. durationDays .. " days)",
        image = thumbnailTx and ("https://arweave.net/" .. thumbnailTx) or nil,
        external_url = "https://zdrive.app/video/" .. videoId,
        video_id = videoId,
        type = "basic_access_token",
        tier = "basic",
        purchased_at = currentTime,
        expires_at = expiresAt,
        duration_days = durationDays,
        purchase_price = paymentAmount,
        renewable = true,
        attributes = {
            {trait_type = "Access Type", value = "Time-Limited"},
            {trait_type = "Duration", value = durationDays .. " days"},
            {trait_type = "Tier", value = "Basic"},
            {trait_type = "Renewable", value = "Yes"},
            {trait_type = "Purchase Price", value = paymentAmount .. " AR"},
            {trait_type = "Expires", value = os.date("%Y-%m-%d", expiresAt)},
            {trait_type = "Collection", value = "ZDrive Access Tokens"}
        }
    }
    
    -- Use metadata transaction ID posted by frontend from user's wallet
    local nftTxId = arweaveMetadataId
    print("✅ Using Basic Access metadata TX ID from wallet: " .. nftTxId)
    
    -- Create NFT record
    BasicAccessNFTs[tokenId] = {
        token_id = tokenId,
        owner = buyer,
        video_id = videoId,
        metadata = metadata,
        created_at = currentTime,
        platform_fee = platformFee,
        creator_share = creatorShare,
        arweave_tx_id = nftTxId -- Store the Arweave transaction ID for wallet visibility
    }
    
    -- Update user access
    UserAccess[buyer] = UserAccess[buyer] or {}
    UserAccess[buyer][videoId] = {
        token_id = tokenId,
        expires_at = expiresAt,
        tier = "basic",
        duration_days = durationDays,
        purchased_at = currentTime
    }
    
    -- Update balances
    Balances[buyer] = Balances[buyer] or {}
    Balances[buyer][tokenId] = 1
    Minted = Minted + 1
    
    -- Update revenue summary
    RevenueSummary[videoId] = RevenueSummary[videoId] or {
        total_revenue = 0,
        platform_fees = 0,
        creator_earnings = 0,
        sales_count = 0
    }
    RevenueSummary[videoId].total_revenue = RevenueSummary[videoId].total_revenue + paymentAmount
    RevenueSummary[videoId].platform_fees = RevenueSummary[videoId].platform_fees + platformFee
    RevenueSummary[videoId].creator_earnings = RevenueSummary[videoId].creator_earnings + creatorShare
    RevenueSummary[videoId].sales_count = RevenueSummary[videoId].sales_count + 1
    
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
    
    -- Send creator share to creator NFT process for distribution
    ao.send({
        Target = CREATOR_NFT_PROCESS,
        Action = "Distribute-Revenue",
        Tags = {
            VideoId = videoId,
            Amount = tostring(creatorShare),
            Buyer = buyer,
            TokenId = tokenId
        }
    })
    
    -- Notify buyer
    ao.send({
        Target = buyer,
        Action = "Basic-Access-Purchased",
        Data = json.encode({
            TokenId = tokenId,
            VideoId = videoId,
            ExpiresAt = expiresAt,
            Duration = durationDays,
            PurchasePrice = paymentAmount,
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
            ExpiresAt = expiresAt
        })
    })
end)

-- Verify Access Rights
Handlers.add("Verify-Access", Handlers.utils.hasMatchingTag("Action", "Verify-Access"), function(msg)
    local user = msg.From
    local videoId = msg.Tags.VideoId
    local currentTime = os.time()
    
    local hasAccess = false
    local accessDetails = nil
    
    -- Check user's access tokens for this video
    if UserAccess[user] and UserAccess[user][videoId] then
        local access = UserAccess[user][videoId]
        
        -- Check if access is still valid
        if not isExpired(access.expires_at) then
            hasAccess = true
            accessDetails = {
                token_id = access.token_id,
                expires_at = access.expires_at,
                time_remaining = access.expires_at - currentTime,
                tier = access.tier,
                duration_days = access.duration_days,
                purchased_at = access.purchased_at
            }
        else
            -- Access expired, remove from active access
            UserAccess[user][videoId] = nil
        end
    end
    
    ao.send({
        Target = user,
        Action = "Access-Verification",
        Data = json.encode({
            VideoId = videoId,
            HasAccess = hasAccess,
            AccessDetails = accessDetails,
            CheckedAt = currentTime
        })
    })
end)

-- Renew Expired Access
Handlers.add("Renew-Access", Handlers.utils.hasMatchingTag("Action", "Renew-Access"), function(msg)
    local user = msg.From
    local tokenId = msg.Tags.TokenId
    local durationDays = tonumber(msg.Tags.Duration) or 30
    local paymentAmount = tonumber(msg.Tags.Payment)
    
    assert(tokenId, "TokenId required")
    assert(paymentAmount and paymentAmount > 0, "Valid payment amount required")
    
    local nft = BasicAccessNFTs[tokenId]
    
    if not nft or nft.owner ~= user then
        ao.send({
            Target = user,
            Action = "Error",
            Data = "Token not found or not owned by user"
        })
        return
    end
    
    local currentTime = os.time()
    local newExpiresAt = currentTime + (durationDays * 24 * 60 * 60)
    
    -- Calculate revenue distribution for renewal
    local platformFee = paymentAmount * PLATFORM_FEE_PERCENTAGE
    local creatorShare = paymentAmount * CREATOR_SHARE_PERCENTAGE
    
    -- Update NFT metadata
    nft.metadata.expires_at = newExpiresAt
    nft.metadata.renewed_at = currentTime
    nft.metadata.renewal_price = paymentAmount
    
    -- Update user access
    UserAccess[user][nft.video_id] = {
        token_id = tokenId,
        expires_at = newExpiresAt,
        tier = "basic",
        duration_days = durationDays,
        renewed_at = currentTime
    }
    
    -- Update revenue summary
    local videoId = nft.video_id
    RevenueSummary[videoId].total_revenue = RevenueSummary[videoId].total_revenue + paymentAmount
    RevenueSummary[videoId].platform_fees = RevenueSummary[videoId].platform_fees + platformFee
    RevenueSummary[videoId].creator_earnings = RevenueSummary[videoId].creator_earnings + creatorShare
    
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
    
    -- Send creator share
    ao.send({
        Target = CREATOR_NFT_PROCESS,
        Action = "Distribute-Revenue",
        Tags = {
            VideoId = videoId,
            Amount = tostring(creatorShare),
            Buyer = user,
            TokenId = tokenId,
            Type = "renewal"
        }
    })
    
    ao.send({
        Target = user,
        Action = "Access-Renewed",
        Data = json.encode({
            TokenId = tokenId,
            VideoId = videoId,
            NewExpiresAt = newExpiresAt,
            Duration = durationDays,
            RenewalPrice = paymentAmount
        })
    })
end)

-- Get User's Access Tokens
Handlers.add("Get-User-Access", Handlers.utils.hasMatchingTag("Action", "Get-User-Access"), function(msg)
    local user = msg.Tags.User or msg.From
    local userTokens = {}
    local currentTime = os.time()
    
    if UserAccess[user] then
        for videoId, access in pairs(UserAccess[user]) do
            if not isExpired(access.expires_at) then
                local nft = BasicAccessNFTs[access.token_id]
                table.insert(userTokens, {
                    video_id = videoId,
                    token_id = access.token_id,
                    expires_at = access.expires_at,
                    time_remaining = access.expires_at - currentTime,
                    metadata = nft and nft.metadata or nil
                })
            end
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "User-Access-Tokens",
        Data = json.encode({
            User = user,
            AccessCount = #userTokens,
            AccessTokens = userTokens
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
    
    local nft = BasicAccessNFTs[tokenId]
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
    
    -- Check if token is expired
    if isExpired(nft.metadata.expires_at) then
        ao.send({
            Target = from,
            Action = "Error",
            Data = "Cannot transfer expired access token"
        })
        return
    end
    
    -- Update ownership
    nft.owner = to
    nft.metadata.last_transfer = os.time()
    
    -- Update balances
    Balances[from][tokenId] = nil
    if not Balances[from] or next(Balances[from]) == nil then
        Balances[from] = nil
    end
    
    Balances[to] = Balances[to] or {}
    Balances[to][tokenId] = 1
    
    -- Update user access
    if UserAccess[from] then
        UserAccess[from][nft.video_id] = nil
    end
    UserAccess[to] = UserAccess[to] or {}
    UserAccess[to][nft.video_id] = {
        token_id = tokenId,
        expires_at = nft.metadata.expires_at,
        tier = "basic",
        transferred_at = os.time()
    }
    
    -- Handle royalty if this is a sale
    if salePrice then
        local royalty = salePrice * 0.10
        
        -- Send royalty to creator via Creator NFT process
        ao.send({
            Target = CREATOR_NFT_PROCESS,
            Action = "Pay-Royalty",
            Tags = {
                VideoId = nft.video_id,
                Amount = tostring(royalty),
                TokenId = tokenId,
                Seller = from,
                Buyer = to
            }
        })
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
            ["Access-Type"] = "basic",
            ["Expires-At"] = tostring(nft.metadata.expires_at),
            ["Sale-Price"] = salePrice and tostring(salePrice) or "0"
        },
        Data = json.encode({
            TokenId = tokenId,
            Quantity = 1,
            Recipient = to,
            VideoId = nft.video_id,
            ArweaveTxId = nft.arweave_tx_id,
            TransferType = "debit",
            AccessType = "basic",
            ExpiresAt = nft.metadata.expires_at,
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
            ["Access-Type"] = "basic",
            ["Expires-At"] = tostring(nft.metadata.expires_at),
            ["Sale-Price"] = salePrice and tostring(salePrice) or "0"
        },
        Data = json.encode({
            TokenId = tokenId,
            Quantity = 1,
            Sender = from,
            VideoId = nft.video_id,
            ArweaveTxId = nft.arweave_tx_id,
            TransferType = "credit",
            AccessType = "basic",
            ExpiresAt = nft.metadata.expires_at,
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

-- Cleanup Expired Tokens (can be called by anyone)
Handlers.add("Cleanup-Expired", Handlers.utils.hasMatchingTag("Action", "Cleanup-Expired"), function(msg)
    local currentTime = os.time()
    local cleanedCount = 0
    
    for tokenId, nft in pairs(BasicAccessNFTs) do
        if isExpired(nft.metadata.expires_at) then
            -- Remove from balances
            if Balances[nft.owner] then
                Balances[nft.owner][tokenId] = nil
                if next(Balances[nft.owner]) == nil then
                    Balances[nft.owner] = nil
                end
            end
            
            -- Remove from user access
            if UserAccess[nft.owner] then
                UserAccess[nft.owner][nft.video_id] = nil
            end
            
            -- Mark as expired (but keep for history)
            nft.metadata.cleaned_at = currentTime
            cleanedCount = cleanedCount + 1
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Cleanup-Complete",
        Data = json.encode({
            CleanedTokens = cleanedCount,
            CleanedAt = currentTime
        })
    })
end)

-- Get Revenue Summary
Handlers.add("Get-Revenue", Handlers.utils.hasMatchingTag("Action", "Get-Revenue"), function(msg)
    local videoId = msg.Tags.VideoId
    
    if videoId then
        local revenue = RevenueSummary[videoId] or {
            total_revenue = 0,
            platform_fees = 0,
            creator_earnings = 0,
            sales_count = 0
        }
        
        ao.send({
            Target = msg.From,
            Action = "Video-Revenue",
            Data = json.encode({
                VideoId = videoId,
                Revenue = revenue
            })
        })
    else
        ao.send({
            Target = msg.From,
            Action = "All-Revenue",
            Data = json.encode({
                RevenueByVideo = RevenueSummary
            })
        })
    end
end)

