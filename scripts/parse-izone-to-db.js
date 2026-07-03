const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\hoa.hoang\\.gemini\\antigravity\\brain\\e53b8097-18ef-4bb7-bc97-f2ae116e2aff\\.system_generated\\steps\\785\\content.md';
const destPath = path.join(__dirname, '..', 'data', 'imports', 'izone_universities.json');

if (!fs.existsSync(srcPath)) {
  console.error('Source file not found:', srcPath);
  process.exit(1);
}

const content = fs.readFileSync(srcPath, 'utf8');

// Split content by toggle elements
const parts = content.split(/<a class="elementor-toggle-title"[^>]*>/i);
// The first part is the header, skip it
const uniParts = parts.slice(1);

const universities = [];

const cityMapping = [
  { keywords: ['TP HCM', 'TP. HCM', 'TP.HCM', 'TPHCM', 'TP Hồ Chí Minh', 'Hồ Chí Minh', 'UIT', 'UEL', 'UFM', 'HUB', 'IUH', 'HCMUE', 'HCMUSSH', 'HCMUT'], city: 'TP. Hồ Chí Minh' },
  { keywords: ['Đà Nẵng', 'DUT', 'DUE', 'UED', 'UFLS', 'UTE', 'VKU', 'DAU'], city: 'Đà Nẵng' },
  { keywords: ['Huế', 'DHKH', 'UEHU', 'HUL', 'HUFLIS', 'YDH', 'HAT'], city: 'Thừa Thiên Huế' }
];

function inferCity(name, code) {
  for (const map of cityMapping) {
    if (map.keywords.some(kw => name.includes(kw) || code.includes(kw))) {
      return map.city;
    }
  }
  return 'Hà Nội'; // Default to Hanoi
}

function cleanHtml(html) {
  return html
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .trim();
}

uniParts.forEach((part, idx) => {
  // Title is everything before </a>
  const titleEnd = part.indexOf('</a>');
  if (titleEnd === -1) return;
  
  const rawTitle = part.substring(0, titleEnd);
  const title = cleanHtml(rawTitle);

  // The rest is the body content
  const rawBody = part.substring(titleEnd + 4);
  
  // Clean name and extract code
  let nameVi = title.replace(/^Đề án tuyển sinh\s+/i, '').trim();
  let code = 'UNKNOWN';
  
  const codeMatch = nameVi.match(/\(([A-Z\-]+)\)/);
  if (codeMatch) {
    code = codeMatch[1];
    nameVi = nameVi.replace(/\s*\(([A-Z\-]+)\)/, '').trim();
  } else {
    // Infer code for Hue schools
    if (nameVi.includes('Đại học Khoa học - Đại học Huế')) code = 'DHKH';
    else if (nameVi.includes('Đại học Kinh tế - Đại học Huế')) code = 'UEHU';
    else if (nameVi.includes('Đại học Luật - Đại học Huế')) code = 'HUL';
    else if (nameVi.includes('Đại học Ngoại ngữ - Đại học Huế')) code = 'HUFLIS';
    else if (nameVi.includes('Đại học Y - Dược - Đại học Huế')) code = 'YDH';
    else if (nameVi.includes('Trường Du lịch - Đại học Huế')) code = 'HAT';
  }

  // Extract website link (first href ending in edu.vn or similar)
  const links = [];
  const linkRegex = /href="([^"]+)"/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(rawBody)) !== null) {
    const url = linkMatch[1];
    if (url.includes('izone.edu.vn')) continue; // Skip internal links
    links.push(url);
  }
  const website = links[0] || null;

  // Extract description (first 300 chars of cleaned body text)
  const cleanBody = cleanHtml(rawBody);
  const description = cleanBody.substring(0, 300) + '...';

  const city = inferCity(nameVi, code);
  
  universities.push({
    code,
    nameVi,
    website: website || undefined,
    description: description,
    isPublic: true,
    campuses: [
      {
        name: `Trụ sở chính - ${nameVi}`,
        city: city
      }
    ],
    programs: [] // Start with empty programs list to seed university info
  });
});

const payload = {
  sourceName: "IZONE Blog - Tổng hợp đề án tuyển sinh 2026",
  sourceUrl: "https://www.izone.edu.vn/blog/de-an-tuyen-sinh-dai-hoc/",
  dataYear: 2026,
  universities
};

// Ensure directory exists
const dir = path.dirname(destPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(destPath, JSON.stringify(payload, null, 2), 'utf8');
console.log(`✅ Extracted ${universities.length} universities to ${destPath}`);
