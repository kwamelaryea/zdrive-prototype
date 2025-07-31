-- Enhanced Creator NFT Process - ANS-110 Compliant (Bazar-Style Implementation)
-- Handles video upload and creator token minting with full wallet compatibility

local json = require('json')

-- Constants
local PLATFORM_WALLET = "WJw8VdUteXegMDMEUmpT0ly39F4Uobn_KyX2fFDs8eg"
local UPLOAD_FEE_PERCENTAGE = 0.0085 -- 0.85% of storage fee
local ROYALTY_PERCENTAGE = 0.10 -- 10% royalty on secondary sales

-- ANS-110 Collection Info (Enhanced for Bazar-style compatibility)
Name = "ZDrive Creator Rights"
Ticker = "ZCR"
Description = "Creator distribution rights for ZDrive video platform - permanent ownership of video monetization rights"
Logo = "https://arweave.net/your-logo-tx-id" -- Replace with actual logo TX ID
Denomination = 0 -- NFTs are non-divisible
Supply = 100000 -- Maximum possible supply
Minted = 0 -- Current minted count

-- Token Protocol Tags (for wallet recognition)
-- These tags should be included in the spawn transaction:
-- { name: 'Variant', value: 'ao.TKN' }
-- { name: 'Type', value: 'Process' }
-- { name: 'Token-Name', value: 'ZDrive Creator Rights' }
-- { name: 'Token-Symbol', value: 'ZCR' }
-- { name: 'Token-Decimals', value: '0' }
-- { name: 'Token-Total-Supply', value: '100000' }
-- { name: 'Implements', value: 'ANS-110' }
-- { name: 'Data-Protocol', value: 'ao' }

-- Enhanced Process State
Balances = {} -- address -> token_count
AllTokens = {} -- token_id -> complete_nft_data
CreatorNFTs = {} -- video_id -> creator_nft_data
VideoMetadata = {} -- video_id -> video_metadata
TokenOwnership = {} -- token_id -> current_owner
TokenTransfers = {} -- token_id -> transfer_history
CollectionMetadata = {} -- Collection-level metadata
StorageFees = {} -- video_id -> storage_cost
TokenCounter = 0

-- Enhanced Utility Functions
local function generateTokenId()
    TokenCounter = TokenCounter + 1
    return "zcr-" .. string.format("%06d", TokenCounter) .. "-" .. os.time()
end

local function generateVideoId()
    return "video-" .. os.time() .. "-" .. math.random(100000, 999999)
end

local function calculateUploadFee(storageFee)
    return storageFee * UPLOAD_FEE_PERCENTAGE
end

local function createANS110Metadata(videoData, tokenId)
    return {
        -- Core ANS-110 Required Fields
        name = "ZDrive Creator Rights: " .. videoData.title,
        description = "Creator distribution rights for: " .. videoData.description,
        image = "https://arweave.net/" .. videoData.arweaveThumbnailId,
        animation_url = "https://arweave.net/" .. videoData.arweaveVideoId,
        external_url = "https://zdrive.app/video/" .. videoData.videoId,
        
        -- Enhanced metadata for wallet compatibility
        symbol = Ticker,
        decimals = 0,
        background_color = "000000",
        
        -- Content-specific metadata
        content_type = "video/mp4",
        video_id = videoData.videoId,
        type = "creator_token",
        token_id = tokenId,
        creator_original = videoData.creator,
        created_at = os.time(),
        
        -- Rights and monetization
        royalty_rate = ROYALTY_PERCENTAGE,
        transferable = true,
        burnable = false,
        
        -- Platform metadata
        platform = "ZDrive",
        platform_version = "1.0.0",
        collection = "ZDrive Creator Rights",
        
        -- Enhanced attributes for discoverability
        attributes = {
            {trait_type = "Content Type", value = "Video"},
            {trait_type = "Rights Type", value = "Creator Distribution"},
            {trait_type = "Platform", value = "ZDrive"},
            {trait_type = "Collection", value = "ZDrive Creator Rights"},
            {trait_type = "Royalty Rate", value = tostring(ROYALTY_PERCENTAGE * 100) .. "%"},
            {trait_type = "Duration", value = tostring(videoData.duration or 0) .. " seconds"},
            {trait_type = "Genre", value = videoData.genre or "General"},
            {trait_type = "Free Content", value = videoData.isFree and "Yes" or "No"},
            {trait_type = "Buy Price", value = tostring(videoData.buyPrice or 0)},
            {trait_type = "Rent Price", value = tostring(videoData.rentPrice or 0)},
            {trait_type = "Creator", value = videoData.creator},
            {trait_type = "Upload Date", value = os.date("%Y-%m-%d", os.time())},
            {trait_type = "Token Standard", value = "ANS-110"},
            {trait_type = "Blockchain", value = "Arweave/AO"}
        },
        
        -- Technical metadata
        arweave_video_id = videoData.arweaveVideoId,
        arweave_thumbnail_id = videoData.arweaveThumbnailId,
        arweave_metadata_id = videoData.arweaveMetadataId,
        storage_fee = videoData.storageFee,
        upload_fee = calculateUploadFee(videoData.storageFee or 0)
    }
end

-- ANS-110 Required Handlers (Enhanced)
Handlers.add("Info", Handlers.utils.hasMatchingTag("Action", "Info"), function(msg)
    ao.send({
        Target = msg.From,
        Action = "Info-Response",
        Data = json.encode({
            Name = Name,
            Ticker = Ticker,
            Description = Description,
            Logo = Logo,
            Denomination = Denomination,
            Supply = Supply,
            Minted = Minted,
            ProcessId = ao.id,
            CollectionSize = Minted,
            Standard = "ANS-110",
            Platform = "ZDrive",
            Version = "1.0.0"
        })
    })
end)

Handlers.add("Balance", Handlers.utils.hasMatchingTag("Action", "Balance"), function(msg)
    local target = msg.Tags.Target or msg.From
    local balance = Balances[target] or 0
    ao.send({
        Target = msg.From,
        Action = "Balance-Response",
        Data = tostring(balance),
        Tags = {
            {name = "Balance", value = tostring(balance)},
            {name = "Target", value = target}
        }
    })
end)

Handlers.add("Balances", Handlers.utils.hasMatchingTag("Action", "Balances"), function(msg)
    local target = msg.Tags.Target or msg.From
    local userTokens = {}
    
    -- Get all tokens owned by the target
    for tokenId, owner in pairs(TokenOwnership) do
        if owner == target then
            table.insert(userTokens, {
                token_id = tokenId,
                metadata = AllTokens[tokenId] and AllTokens[tokenId].metadata or {}
            })
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Balances-Response",
        Data = json.encode({
            address = target,
            balance = Balances[target] or 0,
            tokens = userTokens
        })
    })
end)

-- Enhanced Token Query Handlers
Handlers.add("Token-Info", Handlers.utils.hasMatchingTag("Action", "Token-Info"), function(msg)
    local tokenId = msg.Tags.TokenId
    
    if not tokenId or not AllTokens[tokenId] then
        ao.send({
            Target = msg.From,
            Action = "Error",
            Data = "Token not found: " .. (tokenId or "undefined")
        })
        return
    end
    
    local token = AllTokens[tokenId]
    ao.send({
        Target = msg.From,
        Action = "Token-Info-Response",
        Data = json.encode({
            token_id = tokenId,
            owner = TokenOwnership[tokenId],
            metadata = token.metadata,
            created_at = token.created_at,
            video_id = token.video_id,
            collection = "ZDrive Creator Rights"
        })
    })
end)

Handlers.add("Collection-Info", Handlers.utils.hasMatchingTag("Action", "Collection-Info"), function(msg)
    local collectionStats = {
        name = Name,
        description = Description,
        total_supply = Supply,
        minted = Minted,
        floor_price = 0, -- Could be calculated from marketplace data
        total_volume = 0, -- Could be tracked from sales
        unique_owners = 0,
        total_videos = 0
    }
    
    -- Calculate unique owners
    local owners = {}
    for _, owner in pairs(TokenOwnership) do
        owners[owner] = true
    end
    collectionStats.unique_owners = 0
    for _ in pairs(owners) do
        collectionStats.unique_owners = collectionStats.unique_owners + 1
    end
    
    -- Count videos
    collectionStats.total_videos = 0
    for _ in pairs(VideoMetadata) do
        collectionStats.total_videos = collectionStats.total_videos + 1
    end
    
    ao.send({
        Target = msg.From,
        Action = "Collection-Info-Response",
        Data = json.encode(collectionStats)
    })
end)

-- Enhanced Video Upload & Creator NFT Creation
Handlers.add("Upload-Video", Handlers.utils.hasMatchingTag("Action", "Upload-Video"), function(msg)
    local creator = msg.From
    local videoId = msg.Tags.VideoId or generateVideoId()
    local title = msg.Tags.Title
    local description = msg.Tags.Description or ""
    local arweaveVideoId = msg.Tags.ArweaveVideoId
    local arweaveThumbnailId = msg.Tags.ArweaveThumbnailId
    local arweaveMetadataId = msg.Tags.ArweaveMetadataId
    local duration = tonumber(msg.Tags.Duration) or 0
    local buyPrice = tonumber(msg.Tags.BuyPrice) or 0
    local rentPrice = tonumber(msg.Tags.RentPrice) or 0
    local rentDuration = tonumber(msg.Tags.RentDuration) or 7
    local isFree = msg.Tags.IsFree == "true"
    local storageFee = tonumber(msg.Tags.StorageFee) or 0
    local tags = json.decode(msg.Tags.Tags or "[]")
    local genre = msg.Tags.Genre or "General"
    
    -- Enhanced validation
    assert(videoId, "VideoId is required")
    assert(title and title ~= "", "Title is required and cannot be empty")
    assert(arweaveVideoId and arweaveVideoId ~= "", "ArweaveVideoId is required")
    assert(arweaveThumbnailId and arweaveThumbnailId ~= "", "ArweaveThumbnailId is required")
    assert(storageFee > 0, "StorageFee must be greater than 0")
    
    -- Check if video already exists
    if CreatorNFTs[videoId] then
        ao.send({
            Target = creator,
            Action = "Error",
            Data = "Video with this ID already exists: " .. videoId
        })
        return
    end
    
    -- Calculate fees
    local uploadFee = calculateUploadFee(storageFee)
    
    -- Generate enhanced token ID
    local tokenId = generateTokenId()
    
    -- Create comprehensive video data
    local videoData = {
        videoId = videoId,
        title = title,
        description = description,
        creator = creator,
        arweaveVideoId = arweaveVideoId,
        arweaveThumbnailId = arweaveThumbnailId,
        arweaveMetadataId = arweaveMetadataId,
        duration = duration,
        buyPrice = buyPrice,
        rentPrice = rentPrice,
        rentDuration = rentDuration,
        isFree = isFree,
        storageFee = storageFee,
        genre = genre,
        tags = tags
    }
    
    -- Create enhanced ANS-110 metadata
    local metadata = createANS110Metadata(videoData, tokenId)
    
    -- Create comprehensive Creator NFT record
    local creatorNFT = {
        token_id = tokenId,
        video_id = videoId,
        owner = creator,
        metadata = metadata,
        created_at = os.time(),
        storage_fee = storageFee,
        upload_fee = uploadFee,
        status = "active",
        
        -- Technical data
        arweave_video_id = arweaveVideoId,
        arweave_thumbnail_id = arweaveThumbnailId,
        arweave_metadata_id = arweaveMetadataId,
        
        -- Rights data
        original_creator = creator,
        current_holder = creator,
        royalty_rate = ROYALTY_PERCENTAGE,
        transferable = true,
        
        -- Platform data
        platform = "ZDrive",
        standard = "ANS-110",
        collection = "ZDrive Creator Rights"
    }
    
    -- Update all state
    CreatorNFTs[videoId] = creatorNFT
    AllTokens[tokenId] = creatorNFT
    TokenOwnership[tokenId] = creator
    Balances[creator] = (Balances[creator] or 0) + 1
    Minted = Minted + 1
    
    -- Store enhanced video metadata
    VideoMetadata[videoId] = {
        title = title,
        description = description,
        creator_original = creator,
        creator_current = creator,
        arweave_video_id = arweaveVideoId,
        arweave_thumbnail_id = arweaveThumbnailId,
        arweave_metadata_id = arweaveMetadataId,
        duration = duration,
        buy_price = buyPrice,
        rent_price = rentPrice,
        rent_duration = rentDuration,
        is_free = isFree,
        genre = genre,
        tags = tags,
        created_at = os.time(),
        total_earnings = 0,
        total_views = 0,
        storage_fee = storageFee,
        upload_fee = uploadFee,
        status = "active",
        creator_token_id = tokenId
    }
    
    -- Store storage fee info
    StorageFees[videoId] = {
        storage_cost = storageFee,
        upload_fee = uploadFee,
        paid_at = os.time(),
        paid_by = creator
    }
    
    -- Send upload fee to platform wallet if applicable
    if uploadFee > 0 then
        ao.send({
            Target = "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
            Action = "Transfer",
            Recipient = PLATFORM_WALLET,
            Quantity = tostring(uploadFee),
            Tags = {
                {name = "Upload-Fee", value = videoId},
                {name = "Creator", value = creator},
                {name = "Token-ID", value = tokenId}
            }
        })
    end
    
    -- Send comprehensive success response
    ao.send({
        Target = creator,
        Action = "Video-Uploaded",
        Data = json.encode({
            VideoId = videoId,
            TokenId = tokenId,
            Status = "success",
            Message = "Creator NFT created successfully",
            Metadata = metadata,
            UploadFee = uploadFee,
            CollectionInfo = {
                name = Name,
                ticker = Ticker,
                total_supply = Supply,
                current_supply = Minted
            }
        }),
        Tags = {
            {name = "Video-ID", value = videoId},
            {name = "Token-ID", value = tokenId},
            {name = "Creator", value = creator},
            {name = "Collection", value = "ZDrive Creator Rights"},
            {name = "Standard", value = "ANS-110"}
        }
    })
    
    -- Emit collection event
    ao.send({
        Target = ao.id, -- Self-message for event logging
        Action = "Collection-Event",
        Data = json.encode({
            event_type = "mint",
            token_id = tokenId,
            video_id = videoId,
            creator = creator,
            collection = "ZDrive Creator Rights",
            timestamp = os.time()
        })
    })
    
    print("✅ Creator NFT created successfully:")
    print("  Video ID: " .. videoId)
    print("  Token ID: " .. tokenId)
    print("  Creator: " .. creator)
    print("  Collection: ZDrive Creator Rights")
    print("  Standard: ANS-110")
end)

-- Enhanced ANS-110 Transfer Handler
Handlers.add("Transfer", Handlers.utils.hasMatchingTag("Action", "Transfer"), function(msg)
    local from = msg.From
    local to = msg.Tags.Recipient or msg.Tags.Target
    local tokenId = msg.Tags.TokenId
    local quantity = tonumber(msg.Tags.Quantity) or 1
    local price = tonumber(msg.Tags.Price) or 0
    
    -- Enhanced validation
    assert(to and to ~= "", "Recipient is required")
    assert(tokenId and tokenId ~= "", "TokenId is required")
    assert(AllTokens[tokenId], "Token does not exist: " .. tokenId)
    assert(TokenOwnership[tokenId] == from, "Unauthorized: sender does not own token")
    assert(quantity == 1, "NFTs can only be transferred in quantity of 1")
    assert(to ~= from, "Cannot transfer to self")
    
    local token = AllTokens[tokenId]
    local videoId = token.video_id
    
    -- Handle royalty payment if this is a sale
    if price > 0 and token.metadata.creator_original then
        local royalty = price * ROYALTY_PERCENTAGE
        local originalCreator = token.metadata.creator_original
        
        -- Send royalty to original creator if different from seller
        if originalCreator ~= from then
            ao.send({
                Target = "xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10",
                Action = "Transfer",
                Recipient = originalCreator,
                Quantity = tostring(royalty),
                Tags = {
                    {name = "Royalty-Payment", value = tokenId},
                    {name = "Original-Creator", value = originalCreator},
                    {name = "Sale-Price", value = tostring(price)},
                    {name = "Royalty-Amount", value = tostring(royalty)}
                }
            })
        end
    end
    
    -- Execute transfer
    TokenOwnership[tokenId] = to
    token.owner = to
    token.current_holder = to
    token.last_transfer = os.time()
    
    -- Update balances
    Balances[from] = (Balances[from] or 1) - 1
    Balances[to] = (Balances[to] or 0) + 1
    
    -- Update video creator if this is a creator token
    if CreatorNFTs[videoId] then
        CreatorNFTs[videoId].owner = to
        CreatorNFTs[videoId].current_holder = to
        VideoMetadata[videoId].creator_current = to
    end
    
    -- Record transfer
    if not TokenTransfers[tokenId] then
        TokenTransfers[tokenId] = {}
    end
    table.insert(TokenTransfers[tokenId], {
        from = from,
        to = to,
        price = price,
        timestamp = os.time(),
        transaction_id = msg.Id
    })
    
    -- Send ANS-110 compliant debit notice
    ao.send({
        Target = from,
        Action = "Debit-Notice",
        Data = json.encode({
            TokenId = tokenId,
            Quantity = quantity,
            Recipient = to,
            Price = price
        }),
        Tags = {
            {name = "Token-ID", value = tokenId},
            {name = "Recipient", value = to},
            {name = "Quantity", value = tostring(quantity)}
        }
    })
    
    -- Send ANS-110 compliant credit notice
    ao.send({
        Target = to,
        Action = "Credit-Notice",
        Data = json.encode({
            TokenId = tokenId,
            Quantity = quantity,
            Sender = from,
            Price = price,
            Metadata = token.metadata
        }),
        Tags = {
            {name = "Token-ID", value = tokenId},
            {name = "Sender", value = from},
            {name = "Quantity", value = tostring(quantity)}
        }
    })
    
    -- Emit transfer event
    ao.send({
        Target = ao.id,
        Action = "Transfer-Event",
        Data = json.encode({
            event_type = "transfer",
            token_id = tokenId,
            from = from,
            to = to,
            price = price,
            timestamp = os.time()
        })
    })
    
    print("✅ Token transferred successfully:")
    print("  Token ID: " .. tokenId)
    print("  From: " .. from)
    print("  To: " .. to)
    if price > 0 then
        print("  Sale Price: " .. price)
    end
end)

-- Video and NFT Query Handlers
Handlers.add("Get-Video", Handlers.utils.hasMatchingTag("Action", "Get-Video"), function(msg)
    local videoId = msg.Tags.VideoId
    
    if not videoId or not VideoMetadata[videoId] then
        ao.send({
            Target = msg.From,
            Action = "Error",
            Data = "Video not found: " .. (videoId or "undefined")
        })
        return
    end
    
    local video = VideoMetadata[videoId]
    local creatorNFT = CreatorNFTs[videoId]
    
    ao.send({
        Target = msg.From,
        Action = "Video-Info-Response",
        Data = json.encode({
            video_metadata = video,
            creator_nft = creatorNFT,
            token_id = creatorNFT and creatorNFT.token_id,
            current_owner = creatorNFT and TokenOwnership[creatorNFT.token_id]
        })
    })
end)

Handlers.add("Get-All-Videos", Handlers.utils.hasMatchingTag("Action", "Get-All-Videos"), function(msg)
    local allVideos = {}
    
    for videoId, video in pairs(VideoMetadata) do
        local creatorNFT = CreatorNFTs[videoId]
        table.insert(allVideos, {
            video_id = videoId,
            video_metadata = video,
            creator_nft = creatorNFT,
            token_id = creatorNFT and creatorNFT.token_id,
            current_owner = creatorNFT and TokenOwnership[creatorNFT.token_id]
        })
    end
    
    ao.send({
        Target = msg.From,
        Action = "All-Videos-Response",
        Data = json.encode({
            videos = allVideos,
            total_count = #allVideos,
            collection_info = {
                name = Name,
                ticker = Ticker,
                total_minted = Minted
            }
        })
    })
end)

Handlers.add("Get-Videos-By-Creator", Handlers.utils.hasMatchingTag("Action", "Get-Videos-By-Creator"), function(msg)
    local creatorAddress = msg.Tags.CreatorAddress or msg.From
    local creatorVideos = {}
    
    for videoId, video in pairs(VideoMetadata) do
        if video.creator_original == creatorAddress then
            local creatorNFT = CreatorNFTs[videoId]
            table.insert(creatorVideos, {
                video_id = videoId,
                video_metadata = video,
                creator_nft = creatorNFT,
                token_id = creatorNFT and creatorNFT.token_id,
                current_owner = creatorNFT and TokenOwnership[creatorNFT.token_id],
                is_current_owner = creatorNFT and TokenOwnership[creatorNFT.token_id] == creatorAddress
            })
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Creator-Videos-Response",
        Data = json.encode({
            creator = creatorAddress,
            videos = creatorVideos,
            total_count = #creatorVideos
        })
    })
end)

-- Collection Statistics Handler
Handlers.add("Get-Collection-Stats", Handlers.utils.hasMatchingTag("Action", "Get-Collection-Stats"), function(msg)
    local stats = {
        collection_name = Name,
        ticker = Ticker,
        description = Description,
        total_supply = Supply,
        minted = Minted,
        unique_owners = 0,
        total_videos = 0,
        total_transfers = 0,
        platform = "ZDrive",
        standard = "ANS-110"
    }
    
    -- Calculate unique owners
    local owners = {}
    for _, owner in pairs(TokenOwnership) do
        owners[owner] = true
    end
    for _ in pairs(owners) do
        stats.unique_owners = stats.unique_owners + 1
    end
    
    -- Count videos
    for _ in pairs(VideoMetadata) do
        stats.total_videos = stats.total_videos + 1
    end
    
    -- Count transfers
    for _, transfers in pairs(TokenTransfers) do
        stats.total_transfers = stats.total_transfers + #transfers
    end
    
    ao.send({
        Target = msg.From,
        Action = "Collection-Stats-Response",
        Data = json.encode(stats)
    })
end)

-- Error handling wrapper
local function safeHandler(handler)
    return function(msg)
        local success, error = pcall(handler, msg)
        if not success then
            print("❌ Handler error: " .. tostring(error))
            ao.send({
                Target = msg.From,
                Action = "Error",
                Data = "Handler error: " .. tostring(error)
            })
        end
    end
end

-- Wrap all handlers with error handling
for i, handler in ipairs(Handlers.list) do
    if handler.handle then
        handler.handle = safeHandler(handler.handle)
    end
end

print("✅ Enhanced Creator NFT Process loaded successfully")
print("📋 Collection: " .. Name .. " (" .. Ticker .. ")")
print("🎯 Standard: ANS-110 (Bazar-compatible)")
print("🔧 Platform: ZDrive v1.0.0")
print("📊 Supply: " .. Minted .. "/" .. Supply)