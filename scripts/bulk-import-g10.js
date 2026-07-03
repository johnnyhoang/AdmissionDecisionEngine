/**
 * bulk-import-g10.js
 * ==================
 * Tự động tìm kiếm và nạp điểm chuẩn tuyển sinh lớp 10 THPT TP.HCM
 * cho từng trường trong từng quận/huyện, tuần tự, với delay giữa mỗi trường.
 *
 * Cách chạy:
 *   node bulk-import-g10.js                  → chạy tất cả quận
 *   node bulk-import-g10.js "Quận 3"         → chỉ 1 quận
 *   node bulk-import-g10.js "Quận Tân Phú"   → tên quận khớp từ JSON
 *
 * Kết quả được log ra console và ghi vào bulk-import-results.json
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api/v1/ai';
const PASSWORD = 'hahaha';
const DELAY_BETWEEN_SCHOOLS_MS = 12000; // 12 giây – tránh rate limit Gemini/OpenAI
const DELAY_BETWEEN_DISTRICTS_MS = 5000; // 5 giây nghỉ giữa các quận

const schoolsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/imports/g10hcm_all_schools.json'), 'utf-8')
);

const results = [];
const districtFilter = process.argv[2] ? process.argv[2].trim() : null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const urlObj = new URL(url);
    options.hostname = urlObj.hostname;
    options.port = urlObj.port || 3000;
    options.path = urlObj.pathname + urlObj.search;

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Bad JSON response (${res.statusCode}): ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ─── Core logic ─────────────────────────────────────────────────────────────

async function searchAndImportSchool(school, districtName) {
  console.log(`\n  🔍 Đang tìm: ${school.name} (${districtName})`);

  let searchResult;
  try {
    searchResult = await httpPost(`${API_BASE}/search-cutoffs`, {
      password: PASSWORD,
      type: 'GRADE10',
      schoolQuery: school.name
    });
  } catch (e) {
    console.log(`     ❌ Search thất bại: ${e.message.slice(0, 120)}`);
    return { school: school.name, district: districtName, status: 'SEARCH_FAILED', error: e.message.slice(0, 200) };
  }

  const validResults = (searchResult.results || []).filter(r =>
    r.cutoffNV1 !== null && r.cutoffNV1 !== undefined && !isNaN(Number(r.cutoffNV1))
  );

  if (validResults.length === 0) {
    console.log(`     ⚠️  AI không tìm thấy điểm chuẩn hợp lệ nào cho trường này.`);
    return { school: school.name, district: districtName, status: 'NO_DATA', schoolCode: searchResult.schoolCode };
  }

  console.log(`     ✅ Tìm thấy ${validResults.length} năm: ${validResults.map(r => r.year).join(', ')}`);

  // Auto-import tất cả
  const overrides = validResults.map(r => ({
    year: r.year,
    cutoffNV1: r.cutoffNV1,
    cutoffNV2: r.cutoffNV2 || null,
    cutoffNV3: r.cutoffNV3 || null
  }));

  try {
    const importResult = await httpPost(`${API_BASE}/import-cutoffs`, {
      password: PASSWORD,
      type: 'GRADE10',
      schoolCode: searchResult.schoolCode,
      districtName,
      overrides
    });
    console.log(`     💾 Đã lưu ${importResult.importedCount} bản ghi.`);
    return {
      school: school.name,
      district: districtName,
      status: 'SUCCESS',
      schoolCode: searchResult.schoolCode,
      yearsImported: validResults.map(r => r.year),
      importedCount: importResult.importedCount
    };
  } catch (e) {
    console.log(`     ❌ Import thất bại: ${e.message.slice(0, 120)}`);
    return { school: school.name, district: districtName, status: 'IMPORT_FAILED', error: e.message.slice(0, 200) };
  }
}

async function runDistrict(district) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📍 Quận: ${district.name} (${district.schools.length} trường)`);
  console.log(`${'═'.repeat(60)}`);

  const districtResults = [];
  for (let i = 0; i < district.schools.length; i++) {
    const school = district.schools[i];
    const result = await searchAndImportSchool(school, district.name);
    districtResults.push(result);
    results.push(result);

    // Lưu checkpoint sau mỗi trường
    fs.writeFileSync(
      path.join(__dirname, 'bulk-import-results.json'),
      JSON.stringify(results, null, 2),
      'utf-8'
    );

    if (i < district.schools.length - 1) {
      console.log(`     ⏳ Chờ ${DELAY_BETWEEN_SCHOOLS_MS / 1000}s để tránh rate limit...`);
      await sleep(DELAY_BETWEEN_SCHOOLS_MS);
    }
  }

  const success = districtResults.filter(r => r.status === 'SUCCESS').length;
  const noData = districtResults.filter(r => r.status === 'NO_DATA').length;
  const failed = districtResults.filter(r => r.status.includes('FAILED')).length;
  console.log(`\n  📊 Kết quả ${district.name}: ✅ ${success} thành công | ⚠️ ${noData} không có data | ❌ ${failed} lỗi`);

  return districtResults;
}

// ─── Main entry ─────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  Bulk Import G10 THPT TP.HCM - AI Data Seeder           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`Backend: ${API_BASE}`);
  console.log(`Delay giữa trường: ${DELAY_BETWEEN_SCHOOLS_MS / 1000}s`);
  if (districtFilter) {
    console.log(`Chế độ: Chỉ chạy quận "${districtFilter}"`);
  } else {
    console.log(`Chế độ: Chạy TẤT CẢ ${schoolsData.districts.length} quận`);
  }

  const districtsToRun = districtFilter
    ? schoolsData.districts.filter(d => d.name.toLowerCase().includes(districtFilter.toLowerCase()))
    : schoolsData.districts;

  if (districtsToRun.length === 0) {
    console.log(`\n❌ Không tìm thấy quận nào khớp với "${districtFilter}"`);
    console.log('Các quận có sẵn:');
    schoolsData.districts.forEach(d => console.log(`  - ${d.name}`));
    process.exit(1);
  }

  const totalSchools = districtsToRun.reduce((s, d) => s + d.schools.length, 0);
  const estimatedMinutes = Math.ceil(totalSchools * (DELAY_BETWEEN_SCHOOLS_MS + 15000) / 60000);
  console.log(`Tổng trường cần xử lý: ${totalSchools} trường (~${estimatedMinutes} phút)\n`);

  const startTime = Date.now();

  for (let i = 0; i < districtsToRun.length; i++) {
    await runDistrict(districtsToRun[i]);
    if (i < districtsToRun.length - 1) {
      console.log(`\n⏳ Nghỉ ${DELAY_BETWEEN_DISTRICTS_MS / 1000}s trước khi sang quận tiếp theo...`);
      await sleep(DELAY_BETWEEN_DISTRICTS_MS);
    }
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const success = results.filter(r => r.status === 'SUCCESS').length;
  const noData = results.filter(r => r.status === 'NO_DATA').length;
  const failed = results.filter(r => r.status.includes('FAILED')).length;

  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  TỔNG KẾT CUỐI CÙNG                                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`✅ Thành công    : ${success} / ${results.length} trường`);
  console.log(`⚠️  Không có data: ${noData} trường`);
  console.log(`❌ Lỗi           : ${failed} trường`);
  console.log(`⏱️  Thời gian     : ${elapsed}s`);
  console.log(`📄 Chi tiết      : bulk-import-results.json`);

  // Write final report
  const report = {
    runAt: new Date().toISOString(),
    districtFilter: districtFilter || 'ALL',
    totalSchools: results.length,
    success, noData, failed,
    elapsedSeconds: elapsed,
    details: results
  };
  fs.writeFileSync(
    path.join(__dirname, 'bulk-import-results.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
}

main().catch(e => {
  console.error('\n💥 Lỗi nghiêm trọng:', e.message);
  process.exit(1);
});
