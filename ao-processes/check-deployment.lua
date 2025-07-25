-- Deployment Verification Script for ZDrive AO Processes
-- Run this script to verify that all processes are deployed and working

local json = require('json')

-- Production Process IDs - ZDrive Mainnet Deployment
local CREATOR_NFT_PROCESS = "Lk-5IzUn46w7d0BliSvR9Yo4jazeEZ1kxt54F2SlpPc"
local BASIC_ACCESS_PROCESS = "VxGBhfTqCQwrcxovPPpY6fdHqooHh8xITuI5ry3lTJs"
local PREMIUM_ACCESS_PROCESS = "IXOzHMQZoBIyq_mtcoHG9mfhusxSwYu932wWB6L6RjE"
local ACCESS_CONTROL_PROCESS = "X-Lbejt0NVMaYtknT9FW9FhXNeH8-pu0t7Y2ej0iawI"

-- Test counter
local testCount = 0
local passedTests = 0

-- Helper function to run a test
local function runTest(testName, processId, action, expectedResponse)
    testCount = testCount + 1
    print("\n🧪 Test " .. testCount .. ": " .. testName)
    print("Process: " .. processId)
    print("Action: " .. action)
    
    -- Send test message
    ao.send({
        Target = processId,
        Action = action
    })
    
    print("✅ Test message sent - check for response in process logs")
    passedTests = passedTests + 1
end

-- Main verification function
local function verifyDeployment()
    print("🔍 ZDrive AO Process Deployment Verification")
    print("============================================")
    
    -- Test 1: Creator NFT Process Info
    runTest(
        "Creator NFT Process Info",
        CREATOR_NFT_PROCESS,
        "Info",
        "Should return Name, Ticker, Description, etc."
    )
    
    -- Test 2: Basic Access Process Info
    runTest(
        "Basic Access Process Info", 
        BASIC_ACCESS_PROCESS,
        "Info",
        "Should return basic access token info"
    )
    
    -- Test 3: Premium Access Process Info
    runTest(
        "Premium Access Process Info",
        PREMIUM_ACCESS_PROCESS, 
        "Info",
        "Should return premium access token info"
    )
    
    -- Test 4: Platform Stats
    runTest(
        "Platform Statistics",
        CREATOR_NFT_PROCESS,
        "Platform-Stats",
        "Should return platform statistics"
    )
    
    -- Test 5: Access Control Health Check
    runTest(
        "Access Control Health Check",
        ACCESS_CONTROL_PROCESS,
        "Get-Access-Stats", 
        "Should return access control statistics"
    )
    
    print("\n📊 Verification Summary")
    print("======================")
    print("Total tests: " .. testCount)
    print("Messages sent: " .. passedTests)
    print("\n📝 Next Steps:")
    print("1. Check the process logs for responses")
    print("2. Verify that all processes respond correctly")
    print("3. If any process doesn't respond, redeploy it")
    print("4. Update frontend configuration with correct process IDs")
    print("\n💡 Process ID Configuration:")
    print("CREATOR_NFT: " .. CREATOR_NFT_PROCESS)
    print("BASIC_ACCESS: " .. BASIC_ACCESS_PROCESS) 
    print("PREMIUM_ACCESS: " .. PREMIUM_ACCESS_PROCESS)
    print("ACCESS_CONTROL: " .. ACCESS_CONTROL_PROCESS)
end

-- Test video upload simulation
local function testVideoUpload()
    print("\n🎬 Testing Video Upload Simulation")
    print("==================================")
    
    local testVideoId = "test-video-" .. os.time()
    
    runTest(
        "Simulated Video Upload",
        CREATOR_NFT_PROCESS,
        "Upload-Video",
        "Should create creator NFT"
    )
    
    print("VideoId: " .. testVideoId)
    print("Title: Test Video")
    print("StorageFee: 0.1") 
end

-- Test purchase simulation  
local function testPurchaseFlow()
    print("\n💰 Testing Purchase Flow Simulation")
    print("===================================")
    
    runTest(
        "Simulated Basic Access Purchase",
        BASIC_ACCESS_PROCESS,
        "Purchase-Basic-Access",
        "Should create basic access NFT"
    )
    
    runTest(
        "Simulated Premium Access Purchase", 
        PREMIUM_ACCESS_PROCESS,
        "Purchase-Premium-Access",
        "Should create premium access NFT"
    )
end

-- Run all verifications
print("🚀 Starting ZDrive Process Verification...")
print("⚠️  Make sure to replace the process IDs with your actual deployed process IDs!")
print("")

verifyDeployment()
testVideoUpload() 
testPurchaseFlow()

print("\n✅ Verification script completed!")
print("📋 Check the individual process logs to verify responses")
print("🔗 Use these commands to check process responses:")
print("   Inbox[#Inbox] -- to see latest message")
print("   Send({ Target = 'process_id', Action = 'Info' }) -- to test process")