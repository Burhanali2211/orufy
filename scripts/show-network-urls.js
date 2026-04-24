#!/usr/bin/env node

/**
 * Show Network URLs for Local Development
 * This script displays all available URLs to access the application
 * including local network URLs for mobile device testing
 */

import os from 'os';

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address
        });
      }
    }
  }

  return addresses;
}

function displayUrls() {
  const frontendPort = 5173;
  const backendPort = 5000;
  const networkAddresses = getNetworkAddresses();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║         🌐 HimalayanSpicesExportss - Network Access URLs              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📱 LOCAL ACCESS (This Computer):');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`   Frontend:  http://localhost:${frontendPort}`);
  console.log(`   Backend:   http://localhost:${backendPort}`);
  console.log('');

  if (networkAddresses.length > 0) {
    console.log('📱 NETWORK ACCESS (Mobile Devices on Same WiFi):');
    console.log('─────────────────────────────────────────────────────────────────');
    
    networkAddresses.forEach(({ name, address }) => {
      console.log(`   Network (${name}):`);
      console.log(`   Frontend:  http://${address}:${frontendPort}`);
      console.log(`   Backend:   http://${address}:${backendPort}`);
      console.log('');
    });

    console.log('📋 INSTRUCTIONS FOR MOBILE ACCESS:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('   1. Make sure your mobile device is on the SAME WiFi network');
    console.log('   2. Open your mobile browser');
    console.log(`   3. Enter one of the network URLs above (e.g., http://${networkAddresses[0].address}:${frontendPort})`);
    console.log('   4. The application should load on your mobile device!');
    console.log('');
    
    console.log('🔒 FIREWALL NOTICE:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log('   If you cannot access from mobile, you may need to:');
    console.log('   • Allow Node.js through Windows Firewall');
    console.log('   • Temporarily disable firewall for testing');
    console.log('   • Add firewall rules for ports 5173 and 5000');
    console.log('');
  } else {
    console.log('⚠️  WARNING: No network interfaces found!');
    console.log('   Make sure you are connected to a network (WiFi or Ethernet)');
    console.log('');
  }

  console.log('💡 TIPS:');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('   • Use the network URL to test on real mobile devices');
  console.log('   • Both devices must be on the same WiFi network');
  console.log('   • The server must be running (npm run dev:all)');
  console.log('   • Check your firewall settings if connection fails');
  console.log('');
  
  console.log('═════════════════════════════════════════════════════════════════\n');
}

// Run the script
displayUrls();

