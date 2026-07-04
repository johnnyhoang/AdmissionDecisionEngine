const fs = require('fs');
const path = require('path');

const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// 1. Add Import
if (!containerContent.includes('getCurrentSchoolYear')) {
  containerContent = containerContent.replace(
    "import { mergeG10Schools } from '../../services/api';",
    "import { mergeG10Schools } from '../../services/api';\nimport { getCurrentSchoolYear, formatSchoolYear, getRecentSchoolYears } from '../../utils/date';"
  );
}

// 2. Replace hardcoded 2025 and 10 năm texts
const currentYearStr = "{formatSchoolYear(getCurrentSchoolYear())}";

containerContent = containerContent.replace(
  "tỉ lệ chọi từ năm 2016 đến 2025",
  "tỉ lệ chọi 4 năm gần nhất"
);

containerContent = containerContent.replace(
  "Top Trường Điểm Cao Nhất (2025)",
  `Top Trường Điểm Cao Nhất (\${formatSchoolYear(getCurrentSchoolYear())})` // This is inside jsx {}
).replace(
  "Top Trường Điểm Cao Nhất (${formatSchoolYear(getCurrentSchoolYear())})",
  "Top Trường Điểm Cao Nhất ({formatSchoolYear(getCurrentSchoolYear())})"
);

containerContent = containerContent.replace(
  "Chỉ tiêu 2025:",
  `Chỉ tiêu {formatSchoolYear(getCurrentSchoolYear())}:`
);

containerContent = containerContent.replace(
  "Điểm chuẩn NV1 2025",
  `Điểm chuẩn NV1 {formatSchoolYear(getCurrentSchoolYear())}`
).replace(
  "Điểm NV1 2025",
  `Điểm NV1 {formatSchoolYear(getCurrentSchoolYear())}`
);

containerContent = containerContent.replace(
  "Điểm chuẩn NV2 2025",
  `Điểm chuẩn NV2 {formatSchoolYear(getCurrentSchoolYear())}`
).replace(
  "Điểm NV2 2025",
  `Điểm NV2 {formatSchoolYear(getCurrentSchoolYear())}`
);

containerContent = containerContent.replace(
  "Điểm chuẩn NV3 2025",
  `Điểm chuẩn NV3 {formatSchoolYear(getCurrentSchoolYear())}`
);

containerContent = containerContent.replace(
  "10 năm gần đây (2016-2025)",
  "4 năm gần đây"
);

// Format year in Cutoff table
// Find where cutoff.year is rendered
containerContent = containerContent.replace(
  /<td className="p-3 text-slate-300 font-medium">\{cutoff\.year\}<\/td>/g,
  '<td className="p-3 text-slate-300 font-medium">{formatSchoolYear(cutoff.year)}</td>'
);

containerContent = containerContent.replace(
  /<td className="p-3 font-medium text-slate-300">\{quota\.year\}<\/td>/g,
  '<td className="p-3 font-medium text-slate-300">{formatSchoolYear(quota.year)}</td>'
);

// Also handle the XAxis format for charts if needed, or we just leave it for now.
// For LineChart in tab 4 and tab 5
containerContent = containerContent.replace(
  /<XAxis dataKey="year" stroke="#94a3b8" \/>/g,
  '<XAxis dataKey="year" stroke="#94a3b8" tickFormatter={formatSchoolYear} />'
);

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched with date utils');
