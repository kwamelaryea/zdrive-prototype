#!/usr/bin/env node

// Quick script to update frontend configuration with deployed process IDs

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateConfig() {
  console.log('🔧 ZDrive Process ID Configuration Update\n');
  
  console.log('Enter your deployed process IDs:');
  
  const creatorNFT = await question('Creator NFT Process ID: ');
  const basicAccess = await question('Basic Access Process ID: ');
  const premiumAccess = await question('Premium Access Process ID: ');
  const accessControl = await question('Access Control Process ID: ');
  
  // Validate inputs
  if (!creatorNFT || !basicAccess || !premiumAccess || !accessControl) {
    console.log('❌ All process IDs are required!');
    rl.close();
    return;
  }
  
  // Update the configuration file
  const configPath = path.join(__dirname, 'project', 'src', 'services', 'aoService.ts');
  
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    
    // Update process IDs
    content = content.replace(
      /CREATOR_NFT: '[^']*'/,
      `CREATOR_NFT: '${creatorNFT}'`
    );
    content = content.replace(
      /BASIC_ACCESS: '[^']*'/,
      `BASIC_ACCESS: '${basicAccess}'`
    );
    content = content.replace(
      /PREMIUM_ACCESS: '[^']*'/,
      `PREMIUM_ACCESS: '${premiumAccess}'`
    );
    content = content.replace(
      /ACCESS_CONTROL: '[^']*'/,
      `ACCESS_CONTROL: '${accessControl}'`
    );
    
    fs.writeFileSync(configPath, content);
    
    console.log('\n✅ Configuration updated successfully!');
    console.log('\n📋 Process IDs configured:');
    console.log(`Creator NFT: ${creatorNFT}`);
    console.log(`Basic Access: ${basicAccess}`);
    console.log(`Premium Access: ${premiumAccess}`);
    console.log(`Access Control: ${accessControl}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server: npm run dev');
    console.log('2. Test the upload functionality');
    console.log('3. Monitor browser console for any errors');
    
  } catch (error) {
    console.log('❌ Failed to update configuration:', error.message);
  }
  
  rl.close();
}

updateConfig();