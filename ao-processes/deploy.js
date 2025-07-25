#!/usr/bin/env node

// AO Process Deployment Script for ZDrive
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Deploy a single process
function deployProcess(processFile, processName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Deploying ${processName}...`);
    
    const child = spawn('aos', [processFile, '--cron', '5-minute'], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${processName} deployed successfully`);
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
    console.log('🎯 ZDrive AO Process Deployment\n');
    
    // Check prerequisites
    await checkAOSCLI();
    
    console.log('\n📋 Deployment Plan:');
    console.log('1. Creator NFT Process');
    console.log('2. Basic Access NFT Process');
    console.log('3. Premium Access NFT Process');
    console.log('4. Access Control Process');
    console.log('5. Update frontend configuration\n');
    
    const processIds = {};
    
    // Deploy processes
    processIds.creatorNFT = await deployProcess('creator-nft-process.lua', 'Creator NFT Process');
    processIds.basicAccess = await deployProcess('basic-access-nft-process.lua', 'Basic Access Process');
    processIds.premiumAccess = await deployProcess('premium-access-nft-process.lua', 'Premium Access Process');
    processIds.accessControl = await deployProcess('access-control-process.lua', 'Access Control Process');
    
    // Update frontend
    updateFrontendConfig(processIds);
    
    console.log('\n🎉 Deployment Complete!');
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
    
  } catch (error) {
    console.log('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployAll();
}

module.exports = { deployAll, deployProcess, updateFrontendConfig };