// AO Process Deployment Script
// This script deploys the ZDrive AO processes to the AO blockchain

const { spawn, connect, message, result, createDataItemSigner } = require('@permaweb/aoconnect');
const fs = require('fs');
const path = require('path');

// Configuration
const AO_MODULE = "SBNb1qPQ1TDwpD_mboxm2YllmMLXpWw4U8P9Ff8W9vk"; // AO Lua module
const AO_SCHEDULER = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA"; // AO Scheduler

async function deployProcess(processName, luaFilePath) {
  try {
    console.log(`\n🚀 Deploying ${processName} process...`);
    
    // Read the Lua code
    const luaCode = fs.readFileSync(luaFilePath, 'utf8');
    console.log(`📖 Read ${luaCode.length} characters from ${luaFilePath}`);
    
    // Create data item signer (you'll need to provide wallet)
    // For now, we'll just show the process that needs to be done
    console.log(`
🔧 To deploy ${processName}:

1. Install AOS CLI:
   npm i -g https://get_ao.g8way.io

2. Start AOS:
   aos

3. Load the process:
   .load ${luaFilePath}

4. Get the process ID:
   .getid

5. Update the process ID in the configuration:
   NEXT_PUBLIC_${processName.toUpperCase()}_PROCESS=<your-process-id>

Process file: ${luaFilePath}
Module: ${AO_MODULE}
Scheduler: ${AO_SCHEDULER}
    `);
    
    return null; // Will return actual process ID when deployed
  } catch (error) {
    console.error(`❌ Failed to deploy ${processName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🎯 ZDrive AO Process Deployment');
  console.log('================================');
  
  const processes = [
    {
      name: 'CREATOR_NFT',
      file: './ao-processes/creator-nft-process.lua'
    },
    {
      name: 'BASIC_ACCESS',
      file: './ao-processes/basic-access-nft-process.lua'
    },
    {
      name: 'PREMIUM_ACCESS', 
      file: './ao-processes/premium-access-nft-process.lua'
    },
    {
      name: 'ACCESS_CONTROL',
      file: './ao-processes/access-control-process.lua'
    }
  ];
  
  console.log('📋 Processes to deploy:');
  processes.forEach(p => {
    const fullPath = path.resolve(p.file);
    const exists = fs.existsSync(fullPath);
    console.log(`  - ${p.name}: ${exists ? '✅' : '❌'} ${fullPath}`);
  });
  
  for (const process of processes) {
    if (fs.existsSync(path.resolve(process.file))) {
      await deployProcess(process.name, path.resolve(process.file));
    } else {
      console.log(`⚠️ Skipping ${process.name} - file not found`);
    }
  }
  
  console.log(`
🎉 Deployment Instructions Complete!

After deploying each process with AOS:
1. Update your .env.local file with the process IDs
2. Restart the Next.js development server
3. Test the upload functionality

Example .env.local:
NEXT_PUBLIC_CREATOR_NFT_PROCESS=your-creator-nft-process-id
NEXT_PUBLIC_BASIC_ACCESS_PROCESS=your-basic-access-process-id
NEXT_PUBLIC_PREMIUM_ACCESS_PROCESS=your-premium-access-process-id
NEXT_PUBLIC_ACCESS_CONTROL_PROCESS=your-access-control-process-id
NEXT_PUBLIC_TOKEN_PROCESS=xU9zFkq3X2ZQ6olwNVvr1vUWIjc3kXTWr7xKQD6dh10
  `);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deployProcess };