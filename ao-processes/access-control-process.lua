-- Access Control Process
-- Central validation system for video viewing permissions

local json = require('json')

-- External Process IDs (to be configured)
CREATOR_NFT_PROCESS = "Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc"  -- Replace with actual Creator NFT process ID
BASIC_ACCESS_PROCESS = "VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs"  -- Replace with actual Basic Access process ID
PREMIUM_ACCESS_PROCESS = "IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE"  -- Replace with actual Premium Access process ID

-- Process State
AccessLogs = {} -- user_address -> {video_id -> access_log[]}
ViewingSessions = {} -- session_id -> session_data
SessionCounter = 0

-- Constants
local MAX_LOG_ENTRIES = 1000 -- Maximum log entries per user per video

-- Utility Functions
local function generateSessionId()
    SessionCounter = SessionCounter + 1
    return "session-" .. SessionCounter .. "-" .. os.time()
end

local function logAccess(user, videoId, accessType, granted, reason)
    AccessLogs[user] = AccessLogs[user] or {}
    AccessLogs[user][videoId] = AccessLogs[user][videoId] or {}
    
    local log = {
        timestamp = os.time(),
        access_type = accessType,
        granted = granted,
        reason = reason,
        session_id = generateSessionId()
    }
    
    table.insert(AccessLogs[user][videoId], log)
    
    -- Limit log size
    if #AccessLogs[user][videoId] > MAX_LOG_ENTRIES then
        table.remove(AccessLogs[user][videoId], 1)
    end
    
    return log.session_id
end

-- Main Access Validation Handler
Handlers.add("Request-Access", Handlers.utils.hasMatchingTag("Action", "Request-Access"), function(msg)
    local user = msg.From
    local videoId = msg.Tags.VideoId
    local requestType = msg.Tags.RequestType or "view" -- view, download, stream
    local currentTime = os.time()
    
    assert(videoId, "VideoId is required")
    
    -- First, check if video exists and get its details
    ao.send({
        Target = CREATOR_NFT_PROCESS,
        Action = "Get-Video",
        Tags = {
            VideoId = videoId
        }
    })
    
    -- This will trigger a response that we handle below
    -- For now, we'll create a pending session
    local sessionId = generateSessionId()
    ViewingSessions[sessionId] = {
        user = user,
        video_id = videoId,
        request_type = requestType,
        status = "pending",
        created_at = currentTime,
        expires_at = currentTime + 300 -- 5 minute validation window
    }
    
    ao.send({
        Target = user,
        Action = "Access-Pending",
        Data = json.encode({
            SessionId = sessionId,
            VideoId = videoId,
            RequestType = requestType,
            Status = "pending"
        })
    })
end)

-- Handle Video Details Response from Creator NFT Process
Handlers.add("Video-Details", Handlers.utils.hasMatchingTag("Action", "Video-Details"), function(msg)
    local videoData = json.decode(msg.Data)
    local videoId = videoData.VideoId
    local video = videoData.VideoData
    local creatorToken = videoData.CreatorToken
    local currentOwner = videoData.CurrentOwner
    
    -- Find pending session for this video
    local sessionId = nil
    local session = nil
    local user = nil
    
    for sId, s in pairs(ViewingSessions) do
        if s.video_id == videoId and s.status == "pending" then
            sessionId = sId
            session = s
            user = s.user
            break
        end
    end
    
    if not session then
        return -- No pending session found
    end
    
    -- Check access permissions in order of priority
    local hasAccess = false
    local accessType = "none"
    local accessDetails = nil
    
    -- 1. Check if user is the creator token owner (full access)
    if user == currentOwner then
        hasAccess = true
        accessType = "creator"
        accessDetails = {
            type = "creator",
            token_id = creatorToken.token_id,
            unlimited = true
        }
        
        local logId = logAccess(user, videoId, "creator", true, "Creator token owner")
        
        session.status = "granted"
        session.access_type = accessType
        session.access_details = accessDetails
        
        ao.send({
            Target = user,
            Action = "Access-Granted",
            Data = json.encode({
                SessionId = sessionId,
                VideoId = videoId,
                AccessType = accessType,
                AccessDetails = accessDetails,
                Granted = true,
                LogId = logId
            })
        })
        return
    end
    
    -- 2. Check if video is free
    if video.is_free then
        hasAccess = true
        accessType = "free"
        accessDetails = {
            type = "free",
            unlimited = true
        }
        
        local logId = logAccess(user, videoId, "free", true, "Free video")
        
        session.status = "granted"
        session.access_type = accessType
        session.access_details = accessDetails
        
        ao.send({
            Target = user,
            Action = "Access-Granted",
            Data = json.encode({
                SessionId = sessionId,
                VideoId = videoId,
                AccessType = accessType,
                AccessDetails = accessDetails,
                Granted = true,
                LogId = logId
            })
        })
        return
    end
    
    -- 3. Check for Premium Access NFT
    ao.send({
        Target = PREMIUM_ACCESS_PROCESS,
        Action = "Verify-Premium-Access",
        Tags = {
            VideoId = videoId,
            User = user,
            SessionId = sessionId
        }
    })
end)

-- Handle Premium Access Response
Handlers.add("Premium-Access-Verification", Handlers.utils.hasMatchingTag("Action", "Premium-Access-Verification"), function(msg)
    local verificationData = json.decode(msg.Data)
    local videoId = verificationData.VideoId
    local hasAccess = verificationData.HasAccess
    local accessDetails = verificationData.AccessDetails
    
    -- Find the session
    local sessionId = nil
    local session = nil
    
    for sId, s in pairs(ViewingSessions) do
        if s.video_id == videoId and s.status == "pending" then
            sessionId = sId
            session = s
            break
        end
    end
    
    if not session then
        return
    end
    
    if hasAccess then
        local logId = logAccess(session.user, videoId, "premium", true, "Premium access NFT")
        
        session.status = "granted"
        session.access_type = "premium"
        session.access_details = accessDetails
        
        ao.send({
            Target = session.user,
            Action = "Access-Granted",
            Data = json.encode({
                SessionId = sessionId,
                VideoId = videoId,
                AccessType = "premium",
                AccessDetails = accessDetails,
                Granted = true,
                LogId = logId
            })
        })
        return
    end
    
    -- 4. Check for Basic Access NFT
    ao.send({
        Target = BASIC_ACCESS_PROCESS,
        Action = "Verify-Access",
        Tags = {
            VideoId = videoId,
            User = session.user,
            SessionId = sessionId
        }
    })
end)

-- Handle Basic Access Response
Handlers.add("Access-Verification", Handlers.utils.hasMatchingTag("Action", "Access-Verification"), function(msg)
    local verificationData = json.decode(msg.Data)
    local videoId = verificationData.VideoId
    local hasAccess = verificationData.HasAccess
    local accessDetails = verificationData.AccessDetails
    
    -- Find the session
    local sessionId = nil
    local session = nil
    
    for sId, s in pairs(ViewingSessions) do
        if s.video_id == videoId and s.status == "pending" then
            sessionId = sId
            session = s
            break
        end
    end
    
    if not session then
        return
    end
    
    if hasAccess then
        local logId = logAccess(session.user, videoId, "basic", true, "Basic access NFT")
        
        session.status = "granted"
        session.access_type = "basic"
        session.access_details = accessDetails
        
        ao.send({
            Target = session.user,
            Action = "Access-Granted",
            Data = json.encode({
                SessionId = sessionId,
                VideoId = videoId,
                AccessType = "basic",
                AccessDetails = accessDetails,
                Granted = true,
                LogId = logId
            })
        })
    else
        -- No access found - deny access
        local logId = logAccess(session.user, videoId, "none", false, "No valid access token")
        
        session.status = "denied"
        session.reason = "No valid access token found"
        
        ao.send({
            Target = session.user,
            Action = "Access-Denied",
            Data = json.encode({
                SessionId = sessionId,
                VideoId = videoId,
                Granted = false,
                Reason = "No valid access token found",
                LogId = logId
            })
        })
    end
end)

-- Start Viewing Session
Handlers.add("Start-Viewing", Handlers.utils.hasMatchingTag("Action", "Start-Viewing"), function(msg)
    local user = msg.From
    local sessionId = msg.Tags.SessionId
    local videoId = msg.Tags.VideoId
    
    local session = ViewingSessions[sessionId]
    if not session or session.user ~= user then
        ao.send({
            Target = user,
            Action = "Error",
            Data = "Invalid session"
        })
        return
    end
    
    if session.status ~= "granted" then
        ao.send({
            Target = user,
            Action = "Error",
            Data = "Access not granted for this session"
        })
        return
    end
    
    -- Update session for viewing
    session.viewing_started = os.time()
    session.last_heartbeat = os.time()
    session.status = "viewing"
    
    ao.send({
        Target = user,
        Action = "Viewing-Started",
        Data = json.encode({
            SessionId = sessionId,
            VideoId = videoId,
            StartedAt = session.viewing_started,
            AccessType = session.access_type
        })
    })
end)

-- Viewing Heartbeat (to track active sessions)
Handlers.add("Viewing-Heartbeat", Handlers.utils.hasMatchingTag("Action", "Viewing-Heartbeat"), function(msg)
    local user = msg.From
    local sessionId = msg.Tags.SessionId
    local currentTime = os.time()
    
    local session = ViewingSessions[sessionId]
    if not session or session.user ~= user then
        ao.send({
            Target = user,
            Action = "Error",
            Data = "Invalid session"
        })
        return
    end
    
    if session.status ~= "viewing" then
        ao.send({
            Target = user,
            Action = "Error",
            Data = "Session not in viewing state"
        })
        return
    end
    
    session.last_heartbeat = currentTime
    session.total_watch_time = (session.total_watch_time or 0) + 30 -- Assume 30 second intervals
    
    ao.send({
        Target = user,
        Action = "Heartbeat-Acknowledged",
        Data = json.encode({
            SessionId = sessionId,
            LastHeartbeat = currentTime,
            TotalWatchTime = session.total_watch_time
        })
    })
end)

-- End Viewing Session
Handlers.add("End-Viewing", Handlers.utils.hasMatchingTag("Action", "End-Viewing"), function(msg)
    local user = msg.From
    local sessionId = msg.Tags.SessionId
    local watchTime = tonumber(msg.Tags.WatchTime) or 0
    
    local session = ViewingSessions[sessionId]
    if not session or session.user ~= user then
        ao.send({
            Target = user,
            Action = "Error",
            Data = "Invalid session"
        })
        return
    end
    
    local currentTime = os.time()
    session.viewing_ended = currentTime
    session.total_watch_time = watchTime
    session.status = "completed"
    
    -- Send analytics to Creator NFT process
    ao.send({
        Target = CREATOR_NFT_PROCESS,
        Action = "Record-View",
        Tags = {
            VideoId = session.video_id,
            User = user,
            WatchTime = tostring(watchTime),
            AccessType = session.access_type,
            SessionId = sessionId
        }
    })
    
    ao.send({
        Target = user,
        Action = "Viewing-Ended",
        Data = json.encode({
            SessionId = sessionId,
            VideoId = session.video_id,
            WatchTime = watchTime,
            ViewingDuration = session.viewing_ended - session.viewing_started
        })
    })
end)

-- Get User's Access History
Handlers.add("Get-Access-History", Handlers.utils.hasMatchingTag("Action", "Get-Access-History"), function(msg)
    local user = msg.Tags.User or msg.From
    local videoId = msg.Tags.VideoId
    local limit = tonumber(msg.Tags.Limit) or 50
    
    local history = {}
    
    if videoId then
        -- Get history for specific video
        if AccessLogs[user] and AccessLogs[user][videoId] then
            local logs = AccessLogs[user][videoId]
            local startIndex = math.max(1, #logs - limit + 1)
            
            for i = startIndex, #logs do
                table.insert(history, logs[i])
            end
        end
    else
        -- Get history for all videos
        if AccessLogs[user] then
            for vId, logs in pairs(AccessLogs[user]) do
                for _, log in ipairs(logs) do
                    table.insert(history, {
                        video_id = vId,
                        timestamp = log.timestamp,
                        access_type = log.access_type,
                        granted = log.granted,
                        reason = log.reason,
                        session_id = log.session_id
                    })
                end
            end
            
            -- Sort by timestamp (most recent first)
            table.sort(history, function(a, b) return a.timestamp > b.timestamp end)
            
            -- Limit results
            if #history > limit then
                local limited = {}
                for i = 1, limit do
                    table.insert(limited, history[i])
                end
                history = limited
            end
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Access-History",
        Data = json.encode({
            User = user,
            VideoId = videoId,
            HistoryCount = #history,
            History = history
        })
    })
end)

-- Get Active Sessions
Handlers.add("Get-Active-Sessions", Handlers.utils.hasMatchingTag("Action", "Get-Active-Sessions"), function(msg)
    local user = msg.Tags.User or msg.From
    local activeSessions = {}
    local currentTime = os.time()
    
    for sessionId, session in pairs(ViewingSessions) do
        if session.user == user and session.status == "viewing" then
            -- Check if session is still active (heartbeat within last 2 minutes)
            if currentTime - session.last_heartbeat < 120 then
                table.insert(activeSessions, {
                    session_id = sessionId,
                    video_id = session.video_id,
                    access_type = session.access_type,
                    viewing_started = session.viewing_started,
                    last_heartbeat = session.last_heartbeat,
                    total_watch_time = session.total_watch_time or 0
                })
            else
                -- Mark as expired
                session.status = "expired"
            end
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Active-Sessions",
        Data = json.encode({
            User = user,
            ActiveCount = #activeSessions,
            Sessions = activeSessions
        })
    })
end)

-- Bulk Access Check for Multiple Videos
Handlers.add("Bulk-Access-Check", Handlers.utils.hasMatchingTag("Action", "Bulk-Access-Check"), function(msg)
    local user = msg.Tags.User or msg.From
    local videoIds = json.decode(msg.Tags.VideoIds or "[]")
    local results = {}
    
    -- This is a simplified check - in a real implementation,
    -- you'd want to query each access process
    for _, videoId in ipairs(videoIds) do
        -- Check recent access logs for quick results
        local hasRecentAccess = false
        local accessType = "none"
        
        if AccessLogs[user] and AccessLogs[user][videoId] then
            local logs = AccessLogs[user][videoId]
            if #logs > 0 then
                local lastLog = logs[#logs]
                -- If granted access within last hour, assume still valid
                if lastLog.granted and (os.time() - lastLog.timestamp) < 3600 then
                    hasRecentAccess = true
                    accessType = lastLog.access_type
                end
            end
        end
        
        results[videoId] = {
            has_recent_access = hasRecentAccess,
            access_type = accessType,
            needs_verification = not hasRecentAccess
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

-- Session Cleanup (remove expired sessions)
Handlers.add("Cleanup-Sessions", Handlers.utils.hasMatchingTag("Action", "Cleanup-Sessions"), function(msg)
    local currentTime = os.time()
    local cleanedCount = 0
    
    for sessionId, session in pairs(ViewingSessions) do
        -- Remove sessions older than 24 hours
        if currentTime - session.created_at > 86400 then
            ViewingSessions[sessionId] = nil
            cleanedCount = cleanedCount + 1
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Cleanup-Complete",
        Data = json.encode({
            CleanedSessions = cleanedCount,
            CleanedAt = currentTime
        })
    })
end)

-- Get Access Control Statistics
Handlers.add("Get-Access-Stats", Handlers.utils.hasMatchingTag("Action", "Get-Access-Stats"), function(msg)
    local stats = {
        total_sessions = 0,
        active_sessions = 0,
        total_users = 0,
        access_granted = 0,
        access_denied = 0,
        by_access_type = {
            creator = 0,
            free = 0,
            premium = 0,
            basic = 0,
            none = 0
        }
    }
    
    local currentTime = os.time()
    local uniqueUsers = {}
    
    -- Count sessions
    for sessionId, session in pairs(ViewingSessions) do
        stats.total_sessions = stats.total_sessions + 1
        uniqueUsers[session.user] = true
        
        if session.status == "viewing" and currentTime - session.last_heartbeat < 120 then
            stats.active_sessions = stats.active_sessions + 1
        end
    end
    
    -- Count unique users
    for _ in pairs(uniqueUsers) do
        stats.total_users = stats.total_users + 1
    end
    
    -- Count access logs
    for user, userLogs in pairs(AccessLogs) do
        for videoId, logs in pairs(userLogs) do
            for _, log in ipairs(logs) do
                if log.granted then
                    stats.access_granted = stats.access_granted + 1
                    stats.by_access_type[log.access_type] = (stats.by_access_type[log.access_type] or 0) + 1
                else
                    stats.access_denied = stats.access_denied + 1
                end
            end
        end
    end
    
    ao.send({
        Target = msg.From,
        Action = "Access-Stats",
        Data = json.encode(stats)
    })
end)