const fs = require('fs');
const path = require('path');

// 1. Patch api.ts to include the new fields in G10RecommendationItem
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('d1: number;')) {
  apiContent = apiContent.replace(
    "diff: number;",
    "diff: number;\n  d1: number;\n  d2: number;\n  d3: number;\n  d4: number;\n  nv2Gap: number | null;\n  nv3Gap: number | null;"
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// 2. Patch Grade10Container.tsx cards rendering block
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

const oldDetailsRow = `                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
                            <div>Chỉ tiêu \${formatSchoolYear(getCurrentSchoolYear())}: <span className="font-semibold text-slate-300">N/A</span></div>
                            <div>Điểm chuẩn NV1 \${formatSchoolYear(getCurrentSchoolYear())}: <span className="font-semibold text-slate-300">{rec.cutoffNV1}đ</span></div>
                            <div>TB 3 năm: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span></div>
                            <div>Mức chênh lệch: <span className={\`font-bold \${rec.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.diff > 0 ? \`+\${rec.diff}\` : rec.diff}đ</span></div>
                          </div>`;

const newDetailsRow = `                          {/* NV Gaps / Chênh lệch NV */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {rec.nv2Gap !== null ? (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold">
                                NV2 Chênh lệch: +{rec.nv2Gap}đ
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full font-semibold">
                                Không tuyển NV2
                              </span>
                            )}
                            {rec.nv3Gap !== null ? (
                              <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full font-semibold">
                                NV3 Chênh lệch: +{rec.nv3Gap}đ
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full font-semibold">
                                Không tuyển NV3
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-400 mb-2">
                            <div>Điểm chuẩn NV1: <span className="font-semibold text-slate-300">{rec.cutoffNV1}đ</span></div>
                            <div>TB NV1 3 năm: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span></div>
                          </div>

                          {/* 4 Diffs Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                            <div>d1 (NV1): <span className={\`font-bold \${rec.d1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d1 > 0 ? \`+\${rec.d1}\` : rec.d1}đ</span></div>
                            <div>d2 (TB): <span className={\`font-bold \${rec.d2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d2 > 0 ? \`+\${rec.d2}\` : rec.d2}đ</span></div>
                            <div>d3 (NV2): <span className={\`font-bold \${rec.d3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d3 > 0 ? \`+\${rec.d3}\` : rec.d3}đ</span></div>
                            <div>d4 (NV3): <span className={\`font-bold \${rec.d4 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d4 > 0 ? \`+\${rec.d4}\` : rec.d4}đ</span></div>
                          </div>`;

if (containerContent.includes(oldDetailsRow)) {
  containerContent = containerContent.replace(oldDetailsRow, newDetailsRow);
} else {
  // Let's do a more generic replace if formatting is slightly different
  containerContent = containerContent.replace(
    /<div>TB 3 năm:[\s\S]*?<\/div>\s*<\/div>/,
    `<div>TB 3 năm: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span></div>\n                          </div>\n` + newDetailsRow
  );
}

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched with updated 4 diffs recommendation UI');
