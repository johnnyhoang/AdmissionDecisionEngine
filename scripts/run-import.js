#!/usr/bin/env node
/**
 * Auto-import script for ADE data
 * Usage: node scripts/run-import.js [--api-url http://localhost:3000]
 * 
 * This script sends data from /data/imports/*.json to the import API endpoint.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const apiUrlArg = args.find(a => a.startsWith('--api-url='))?.split('=')[1] 
               || args[args.indexOf('--api-url') + 1] 
               || 'http://localhost:3000';

const API_URL = `${apiUrlArg}/import`;
const DATA_DIR = path.join(__dirname, '..', 'data', 'imports');

async function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const client = parsedUrl.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch { resolve(responseData); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('⚠️  No JSON files found in data/imports/');
    process.exit(0);
  }

  console.log(`\n🚀 ADE Data Import Tool`);
  console.log(`📡 API: ${API_URL}`);
  console.log(`📁 Found ${files.length} file(s):\n`);

  let totalUniversities = 0;
  let totalPrograms = 0;
  let totalScores = 0;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📄 Processing: ${file}`);

    let payload;
    try {
      payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`  ❌ Failed to parse JSON: ${e.message}`);
      continue;
    }

    console.log(`  📊 Source: ${payload.sourceName} (${payload.dataYear})`);
    console.log(`  🏫 Universities: ${payload.universities?.length ?? 0}`);

    try {
      const result = await postJson(API_URL, payload);
      
      if (result.errors?.length > 0) {
        console.log(`  ⚠️  Completed with ${result.errors.length} error(s):`);
        result.errors.slice(0, 3).forEach(e => console.log(`     • ${e}`));
      }

      console.log(`  ✅ Status: ${result.importId ? 'SUCCESS' : 'ERROR'}`);
      console.log(`     🏫 Universities: +${result.universitiesAdded} added, ~${result.universitiesUpdated} updated`);
      console.log(`     📚 Programs: +${result.programsAdded} added, ~${result.programsUpdated} updated`);
      console.log(`     📈 Benchmark scores: +${result.scoresAdded}`);
      console.log(`     🔁 Duplicates skipped: ${result.duplicatesSkipped}`);
      
      totalUniversities += result.universitiesAdded;
      totalPrograms += result.programsAdded;
      totalScores += result.scoresAdded;
    } catch (e) {
      console.error(`  ❌ Request failed: ${e.message}`);
      console.error(`  💡 Make sure the backend is running at: ${apiUrlArg}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎉 IMPORT COMPLETE`);
  console.log(`   Universities added: ${totalUniversities}`);
  console.log(`   Programs added:     ${totalPrograms}`);
  console.log(`   Scores added:       ${totalScores}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
