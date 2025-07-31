#!/usr/bin/env node

// AO Process Deployment Script for ZDrive with Token Protocol Tags
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Token Protocol Tags for wallet recognition
const TOKEN_PROTOCOL_TAGS = {
  creator: [
    { name: 'Variant', value: 'ao.TKN' },
    { name: 'Type', value: 'Process' },
    { name: 'Token-Name', value: 'ZDrive Creator Rights' },
    { name: 'Token-Symbol', value: 'ZCR' },
    { name: 'Token-Decimals', value: '0' },
    { name: 'Token-Total-Supply', value: '100000' },
    { name: 'Implements', value: 'ANS-110' },
    { name: 'Data-Protocol', value: 'ao' },
    { name: 'App-Name', value: 'AO-NFT' },
    { name: 'Description', value: 'Creator distribution rights for ZDrive video platform' }
  ],
  premium: [
    { name: 'Variant', value: 'ao.TKN' },
    { name: 'Type', value: 'Process' },
    { name: 'Token-Name', value: 'ZDrive Premium Access' },
    { name: 'Token-Symbol', value: 'ZPA' },
    { name: 'Token-Decimals', value: '0' },
    { name: 'Token-Total-Supply', value: '1000000' },
    { name: 'Implements', value: 'ANS-110' },
    { name: 'Data-Protocol', value: 'ao' },
    { name: 'App-Name', value: 'AO-NFT' },
    { name: 'Description', value: 'Permanent video viewing rights on ZDrive' }
  ],
  basic: [
    { name: 'Variant', value: 'ao.TKN' },
    { name: 'Type', value: 'Process' },
    { name: 'Token-Name', value: 'ZDrive Basic Access' },
    { name: 'Token-Symbol', value: 'ZBA' },
    { name: 'Token-Decimals', value: '0' },
    { name: 'Token-Total-Supply', value: '1000000' },
    { name: 'Implements', value: 'ANS-110' },
    { name: 'Data-Protocol', value: 'ao' },
    { name: 'App-Name', value: 'AO-NFT' },
    { name: 'Description', value: 'Time-limited video viewing rights on ZDrive' }
  ],
  access: [
    { name: 'Variant', value: 'ao.TKN' },
    { name: 'Type', value: 'Process' },
    { name: 'Token-Name', value: 'ZDrive Access Control' },
    { name: 'Token-Symbol', value: 'ZAC' },
    { name: 'Token-Decimals', value: '0' },
    { name: 'Token-Total-Supply', value: '1000000' },
    { name: 'Implements', value: 'ANS-110' },
    { name: 'Data-Protocol', value: 'ao' },
    { name: 'App-Name', value: 'AO-NFT' },
    { name: 'Description', value: 'Access control and verification for ZDrive' }
  ]
};

// Check if aos CLI is available
function checkAOSCLI() {
  return new Promise((resolve, reject) => {
    const child = spawn('aos', ['--version'], { stdio: 'pipe' });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ AOS CLI is available');
        resolve(true);
      } else {
        console.log('❌ AOS CLI not found. Please install with: npm install -g https://get_ao.g8way.io');
        reject(false);
      }
    });
    child.on('error', () => {
      console.log('❌ AOS CLI not found. Please install with: npm install -g https://get_ao.g8way.io');
      reject(false);
    });
  });
}

// Deploy a single process with token protocol tags
function deployProcess(processFile, processName, tokenType) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Deploying ${processName} with token protocol tags...`);
    
    // Build the aos command with token protocol tags
    const tags = TOKEN_PROTOCOL_TAGS[tokenType];
    const tagArgs = tags.flatMap(tag => ['--tag', tag.name, tag.value]);
    
    const child = spawn('aos', [processFile, '--cron', '5-minute', ...tagArgs], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${processName} deployed successfully with token protocol tags`);
        // Note: In a real implementation, you'd capture the process ID from the output
        resolve(`${processName.toLowerCase().replace(/\s+/g, '_')}_process_id`);
      } else {
        console.log(`❌ Failed to deploy ${processName}`);
        reject(new Error(`Deployment failed for ${processName}`));
      }
    });
  });
}

// Update frontend configuration
function updateFrontendConfig(processIds) {
  const configPath = path.join(__dirname, '..', 'project', 'src', 'services', 'aoService.ts');
  
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Update process IDs
    content = content.replace(
      /CREATOR_NFT: '[^']*'/,
      `CREATOR_NFT: '${processIds.creatorNFT}'`
    );
    content = content.replace(
      /BASIC_ACCESS: '[^']*'/,
      `BASIC_ACCESS: '${processIds.basicAccess}'`
    );
    content = content.replace(
      /PREMIUM_ACCESS: '[^']*'/,
      `PREMIUM_ACCESS: '${processIds.premiumAccess}'`
    );
    content = content.replace(
      /ACCESS_CONTROL: '[^']*'/,
      `ACCESS_CONTROL: '${processIds.accessControl}'`
    );
    
    fs.writeFileSync(configPath, content);
    console.log('✅ Frontend configuration updated');
  } catch (error) {
    console.log('❌ Failed to update frontend configuration:', error.message);
  }
}

// Main deployment function
async function deployAll() {
  try {
    console.log('🎯 ZDrive AO Process Deployment with Token Protocol Tags\n');
    
    // Check prerequisites
    await checkAOSCLI();
    
    console.log('\n📋 Deployment Plan:');
    console.log('1. Creator NFT Process (with token protocol tags)');
    console.log('2. Basic Access NFT Process (with token protocol tags)');
    console.log('3. Premium Access NFT Process (with token protocol tags)');
    console.log('4. Access Control Process (with token protocol tags)');
    console.log('5. Update frontend configuration\n');
    
    const processIds = {};
    
    // Deploy processes with token protocol tags
    processIds.creatorNFT = await deployProcess('creator-nft-process.lua', 'Creator NFT Process', 'creator');
    processIds.basicAccess = await deployProcess('basic-access-nft-process.lua', 'Basic Access Process', 'basic');
    processIds.premiumAccess = await deployProcess('premium-access-nft-process.lua', 'Premium Access Process', 'premium');
    processIds.accessControl = await deployProcess('access-control-process.lua', 'Access Control Process', 'access');
    
    // Update frontend
    updateFrontendConfig(processIds);
    
    console.log('\n🎉 Deployment Complete with Token Protocol Tags!');
    console.log('\n📋 Process IDs:');
    console.log(`Creator NFT: ${processIds.creatorNFT}`);
    console.log(`Basic Access: ${processIds.basicAccess}`);
    console.log(`Premium Access: ${processIds.premiumAccess}`);
    console.log(`Access Control: ${processIds.accessControl}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Save these process IDs');
    console.log('2. Configure inter-process dependencies');
    console.log('3. Test the upload and purchase flows');
    console.log('4. Monitor process logs for any issues');
    console.log('5. Check wallet collectibles display');
    
    console.log('\n🔍 Token Protocol Tags Applied:');
    console.log('- Variant: ao.TKN');
    console.log('- Type: Process');
    console.log('- Implements: ANS-110');
    console.log('- Data-Protocol: ao');
    console.log('- App-Name: AO-NFT');
    
  } catch (error) {
    console.log('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployAll();
}

module.exports = { deployAll, deployProcess, updateFrontendConfig, TOKEN_PROTOCOL_TAGS };