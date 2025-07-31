#!/bin/bash

# Deploy AO processes for ZDrive
echo "🚀 Deploying ZDrive AO Processes..."

# Deploy Creator NFT Process
echo "📦 Deploying Creator NFT Process..."
CREATOR_PROCESS=$(aos --spawn creator-nft 2>&1 | grep "Your AOS process:" | cut -d' ' -f4)
if [ ! -z "$CREATOR_PROCESS" ]; then
    echo "✅ Creator NFT Process: $CREATOR_PROCESS"
    aos --load ./ao-processes/creator-nft-process.lua $CREATOR_PROCESS
else
    echo "❌ Failed to deploy Creator NFT Process"
fi

# Deploy Basic Access Process
echo "📦 Deploying Basic Access Process..."
BASIC_PROCESS=$(aos --spawn basic-access 2>&1 | grep "Your AOS process:" | cut -d' ' -f4)
if [ ! -z "$BASIC_PROCESS" ]; then
    echo "✅ Basic Access Process: $BASIC_PROCESS"
    aos --load ./ao-processes/basic-access-nft-process.lua $BASIC_PROCESS
else
    echo "❌ Failed to deploy Basic Access Process"
fi

# Deploy Premium Access Process
echo "📦 Deploying Premium Access Process..."
PREMIUM_PROCESS=$(aos --spawn premium-access 2>&1 | grep "Your AOS process:" | cut -d' ' -f4)
if [ ! -z "$PREMIUM_PROCESS" ]; then
    echo "✅ Premium Access Process: $PREMIUM_PROCESS"
    aos --load ./ao-processes/premium-access-nft-process.lua $PREMIUM_PROCESS
else
    echo "❌ Failed to deploy Premium Access Process"
fi

# Deploy Access Control Process
echo "📦 Deploying Access Control Process..."
ACCESS_PROCESS=$(aos --spawn access-control 2>&1 | grep "Your AOS process:" | cut -d' ' -f4)
if [ ! -z "$ACCESS_PROCESS" ]; then
    echo "✅ Access Control Process: $ACCESS_PROCESS"
    aos --load ./ao-processes/access-control-process.lua $ACCESS_PROCESS
else
    echo "❌ Failed to deploy Access Control Process"
fi

echo "🎉 Process deployment complete!"
echo ""
echo "Update your .env.local file with these process IDs:"
echo "NEXT_PUBLIC_CREATOR_NFT_PROCESS=$CREATOR_PROCESS"
echo "NEXT_PUBLIC_BASIC_ACCESS_PROCESS=$BASIC_PROCESS"
echo "NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS=$PREMIUM_PROCESS"
echo "NEXT_PUBLIC_ACCESS_CONTROL_PROCESS=$ACCESS_PROCESS"
echo "NEXT_PUBLIC_TOKEN_PROCESS=your_token_process_id"