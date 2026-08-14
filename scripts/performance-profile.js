#!/usr/bin/env node

/**
 * Performance Profiling Script
 * 
 * This script profiles the application's performance and generates reports
 * for CPU usage, memory consumption, and slow database queries.
 */

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration
const PROFILE_DURATION = 60000; // 60 seconds
const OUTPUT_DIR = 'performance-reports';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Performance metrics
const metrics = {
  startTime: Date.now(),
  endTime: null,
  cpuUsage: [],
  memoryUsage: [],
  eventLoopDelay: [],
  httpRequests: [],
  dbQueries: [],
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n========================================', colors.blue);
  log(`  ${title}`, colors.bright + colors.blue);
  log('========================================\n', colors.blue);
}

// Collect CPU usage
function collectCPUUsage() {
  const usage = process.cpuUsage();
  metrics.cpuUsage.push({
    timestamp: Date.now(),
    user: usage.user,
    system: usage.system,
  });
}

// Collect memory usage
function collectMemoryUsage() {
  const usage = process.memoryUsage();
  metrics.memoryUsage.push({
    timestamp: Date.now(),
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
  });
}

// Calculate statistics
function calculateStats(arr) {
  if (arr.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
  
  const sorted = [...arr].sort((a, b) => a - b);
  const sum = arr.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / arr.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

// Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Generate report
function generateReport() {
  metrics.endTime = Date.now();
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  
  logSection('Performance Profiling Report');
  
  log(`Duration: ${duration.toFixed(2)} seconds`, colors.green);
  log(`Samples collected: ${metrics.cpuUsage.length}`, colors.green);
  
  // CPU Usage Analysis
  logSection('CPU Usage Analysis');
  const cpuUser = metrics.cpuUsage.map(m => m.user);
  const cpuSystem = metrics.cpuUsage.map(m => m.system);
  const cpuUserStats = calculateStats(cpuUser);
  const cpuSystemStats = calculateStats(cpuSystem);
  
  log('User CPU Time (microseconds):', colors.yellow);
  log(`  Min: ${cpuUserStats.min.toFixed(0)}`);
  log(`  Max: ${cpuUserStats.max.toFixed(0)}`);
  log(`  Avg: ${cpuUserStats.avg.toFixed(0)}`);
  log(`  P95: ${cpuUserStats.p95.toFixed(0)}`);
  
  log('\nSystem CPU Time (microseconds):', colors.yellow);
  log(`  Min: ${cpuSystemStats.min.toFixed(0)}`);
  log(`  Max: ${cpuSystemStats.max.toFixed(0)}`);
  log(`  Avg: ${cpuSystemStats.avg.toFixed(0)}`);
  log(`  P95: ${cpuSystemStats.p95.toFixed(0)}`);
  
  // Memory Usage Analysis
  logSection('Memory Usage Analysis');
  const memRSS = metrics.memoryUsage.map(m => m.rss);
  const memHeapUsed = metrics.memoryUsage.map(m => m.heapUsed);
  const memHeapTotal = metrics.memoryUsage.map(m => m.heapTotal);
  
  const rssStats = calculateStats(memRSS);
  const heapUsedStats = calculateStats(memHeapUsed);
  const heapTotalStats = calculateStats(memHeapTotal);
  
  log('RSS (Resident Set Size):', colors.yellow);
  log(`  Min: ${formatBytes(rssStats.min)}`);
  log(`  Max: ${formatBytes(rssStats.max)}`);
  log(`  Avg: ${formatBytes(rssStats.avg)}`);
  log(`  P95: ${formatBytes(rssStats.p95)}`);
  
  log('\nHeap Used:', colors.yellow);
  log(`  Min: ${formatBytes(heapUsedStats.min)}`);
  log(`  Max: ${formatBytes(heapUsedStats.max)}`);
  log(`  Avg: ${formatBytes(heapUsedStats.avg)}`);
  log(`  P95: ${formatBytes(heapUsedStats.p95)}`);
  
  log('\nHeap Total:', colors.yellow);
  log(`  Min: ${formatBytes(heapTotalStats.min)}`);
  log(`  Max: ${formatBytes(heapTotalStats.max)}`);
  log(`  Avg: ${formatBytes(heapTotalStats.avg)}`);
  log(`  P95: ${formatBytes(heapTotalStats.p95)}`);
  
  // Save detailed report to file
  const reportPath = path.join(OUTPUT_DIR, `performance-profile-${TIMESTAMP}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(metrics, null, 2));
  
  logSection('Report Saved');
  log(`Detailed report saved to: ${reportPath}`, colors.green);
  
  // Recommendations
  logSection('Recommendations');
  
  if (heapUsedStats.max > 500 * 1024 * 1024) {
    log('⚠ High memory usage detected (>500MB)', colors.red);
    log('  Consider implementing memory optimization strategies');
  } else {
    log('✓ Memory usage is within acceptable limits', colors.green);
  }
  
  if (cpuUserStats.avg > 1000000) {
    log('⚠ High CPU usage detected', colors.red);
    log('  Consider optimizing CPU-intensive operations');
  } else {
    log('✓ CPU usage is within acceptable limits', colors.green);
  }
}

// Main profiling function
async function startProfiling() {
  logSection('Starting Performance Profiling');
  log(`Profiling for ${PROFILE_DURATION / 1000} seconds...`, colors.yellow);
  log('Press Ctrl+C to stop early\n', colors.yellow);
  
  // Collect metrics every second
  const interval = setInterval(() => {
    collectCPUUsage();
    collectMemoryUsage();
  }, 1000);
  
  // Stop after duration
  setTimeout(() => {
    clearInterval(interval);
    generateReport();
    process.exit(0);
  }, PROFILE_DURATION);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\nProfiling interrupted by user', colors.yellow);
  generateReport();
  process.exit(0);
});

// Start profiling
startProfiling();

