-- ZDrive NFT PST Contract
-- Standard SmartWeave PST for atomic NFTs (supply=1, non-divisible)

local json = require('json')

-- Contract State
if not Balances then Balances = {} end
if not Name then Name = "" end
if not Ticker then Ticker = "" end
if not Description then Description = "" end
if not Logo then Logo = "" end
if not Denomination then Denomination = 0 end
if not TotalSupply then TotalSupply = 1 end
if not Owner then Owner = "" end

-- NFT Metadata
if not Metadata then Metadata = {} end
if not VideoId then VideoId = "" end
if not CreatorAddress then CreatorAddress = "" end
if not RoyaltyRate then RoyaltyRate = 0.10 end
if not CreatedAt then CreatedAt = 0 end

-- Handlers for PST standard

-- Get contract info
function info(state, action)
  return {
    result = {
      name = state.Name,
      ticker = state.Ticker,
      description = state.Description,
      logo = state.Logo,
      denomination = state.Denomination,
      totalSupply = state.TotalSupply,
      owner = state.Owner,
      metadata = state.Metadata,
      videoId = state.VideoId,
      creatorAddress = state.CreatorAddress,
      royaltyRate = state.RoyaltyRate,
      createdAt = state.CreatedAt
    }
  }
end

-- Get balance for an address
function balance(state, action)
  local target = action.input.target or action.caller
  local balance = state.Balances[target] or 0
  
  return {
    result = {
      target = target,
      balance = balance
    }
  }
end

-- Get all balances
function balances(state, action)
  return {
    result = state.Balances
  }
end

-- Transfer NFT (only works for full supply since non-divisible)
function transfer(state, action)
  local qty = action.input.qty or 1
  local target = action.input.target
  local caller = action.caller
  
  -- Validate inputs
  assert(target, "No target specified")
  assert(qty == 1, "NFT is non-divisible, can only transfer 1")
  
  -- Check if caller owns the NFT
  if not state.Balances[caller] or state.Balances[caller] < 1 then
    return {
      result = {
        status = "error",
        message = "Caller does not own this NFT"
      }
    }
  end
  
  -- Check if target already owns the NFT
  if state.Balances[target] and state.Balances[target] >= 1 then
    return {
      result = {
        status = "error", 
        message = "Target already owns this NFT"
      }
    }
  end
  
  -- Execute transfer
  state.Balances[caller] = 0
  state.Balances[target] = 1
  
  -- Update owner
  state.Owner = target
  
  return {
    state = state,
    result = {
      status = "success",
      message = "NFT transferred successfully",
      from = caller,
      to = target,
      qty = qty
    }
  }
end

-- Get contract owner
function owner(state, action)
  return {
    result = state.Owner
  }
end

-- Update metadata (only owner can do this)
function updateMetadata(state, action)
  local caller = action.caller
  
  if caller ~= state.Owner then
    return {
      result = {
        status = "error",
        message = "Only owner can update metadata"
      }
    }
  end
  
  if action.input.metadata then
    state.Metadata = action.input.metadata
  end
  
  return {
    state = state,
    result = {
      status = "success",
      message = "Metadata updated"
    }
  }
end

-- Main handler
function handle(state, action)
  local input = action.input
  local func = input.function
  
  if func == "info" then
    return info(state, action)
  elseif func == "balance" then
    return balance(state, action)
  elseif func == "balances" then
    return balances(state, action)
  elseif func == "transfer" then
    return transfer(state, action)
  elseif func == "owner" then
    return owner(state, action)
  elseif func == "updateMetadata" then
    return updateMetadata(state, action)
  else
    return {
      result = {
        status = "error",
        message = "Function not recognized: " .. (func or "undefined")
      }
    }
  end
end