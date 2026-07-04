const fs = require('fs');
const path = require('path');

const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(containerPath, 'utf8');

// 1. Simplify SSF display in calculator results
const oldCalcSsf = `                    {evaluationResult.ssf !== undefined && (
                      <div className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0 font-medium text-slate-400">
                        ⚡ Biến động vĩ mô (SSF): <span className={\`font-bold \${evaluationResult.ssf >= 0 ? 'text-rose-400' : 'text-emerald-400'}\`}>{evaluationResult.ssf > 0 ? \`+\${evaluationResult.ssf}\` : evaluationResult.ssf}đ</span>
                      </div>
                    )}`;

const newCalcSsf = `                    {evaluationResult.ssf !== undefined && evaluationResult.ssf !== 0 && (
                      <div className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0 \${
                        evaluationResult.ssf > 0
                          ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                          : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                      }\`}>
                        {evaluationResult.ssf > 0 ? '⚠️ Cạnh tranh tăng nhẹ năm nay' : '✨ Điểm chuẩn dự kiến hạ nhẹ'} ({evaluationResult.ssf > 0 ? \`+\${evaluationResult.ssf}\` : evaluationResult.ssf}đ)
                      </div>
                    )}`;

content = content.replace(oldCalcSsf, newCalcSsf);

// 2. Simplify SSF display in combo results
const oldComboSsf = `                    {comboResult.ssf !== undefined && (
                      <div className="bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800 font-semibold text-slate-400 text-[10px]">
                        ⚡ Hệ số SSF toàn thành phố: <span className={\`font-bold \${comboResult.ssf >= 0 ? 'text-rose-400' : 'text-emerald-400'}\`}>{comboResult.ssf > 0 ? \`+\${comboResult.ssf}\` : comboResult.ssf}đ</span>
                      </div>
                    )}`;

const newComboSsf = `                    {comboResult.ssf !== undefined && comboResult.ssf !== 0 && (
                      <div className={\`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 \${
                        comboResult.ssf > 0
                          ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                          : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                      }\`}>
                        {comboResult.ssf > 0 ? '⚠️ Cạnh tranh tăng nhẹ năm nay' : '✨ Điểm chuẩn dự kiến hạ nhẹ'} ({comboResult.ssf > 0 ? \`+\${comboResult.ssf}\` : comboResult.ssf}đ)
                      </div>
                    )}`;

content = content.replace(oldComboSsf, newComboSsf);

// 3. Hide 4 Diffs Grid behind details in Calculator Card
const oldCalcGrid = `                          {/* 4 Diffs Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                            <div>d1 (NV1): <span className={\`font-bold \${rec.d1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d1 > 0 ? \`+\${rec.d1}\` : rec.d1}đ</span></div>
                            <div>d2 (TB): <span className={\`font-bold \${rec.d2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d2 > 0 ? \`+\${rec.d2}\` : rec.d2}đ</span></div>
                            <div>d3 (NV2): <span className={\`font-bold \${rec.d3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d3 > 0 ? \`+\${rec.d3}\` : rec.d3}đ</span></div>
                            <div>d4 (NV3): <span className={\`font-bold \${rec.d4 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d4 > 0 ? \`+\${rec.d4}\` : rec.d4}đ</span></div>
                          </div>`;

const newCalcGrid = `                          {/* 4 Diffs Expandable details */}
                          <details className="mt-2 group">
                            <summary className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer list-none flex items-center gap-1 font-semibold select-none">
                              <span>📊 Xem thông số kỹ thuật (d1, d2, d3, d4)</span>
                              <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 mt-1.5">
                              <div>d1 (NV1): <span className={\`font-bold \${rec.d1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d1 > 0 ? \`+\${rec.d1}\` : rec.d1}đ</span></div>
                              <div>d2 (TB): <span className={\`font-bold \${rec.d2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d2 > 0 ? \`+\${rec.d2}\` : rec.d2}đ</span></div>
                              <div>d3 (NV2): <span className={\`font-bold \${rec.d3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d3 > 0 ? \`+\${rec.d3}\` : rec.d3}đ</span></div>
                              <div>d4 (NV3): <span className={\`font-bold \${rec.d4 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{rec.d4 > 0 ? \`+\${rec.d4}\` : rec.d4}đ</span></div>
                            </div>
                          </details>`;

content = content.replace(oldCalcGrid, newCalcGrid);

// 4. Add expandable details in Combo Card
const oldComboCardRow = `                              {school.commuteBonus > 0 && (
                                <div className="text-emerald-400 font-semibold">
                                  Điểm thưởng cự ly: +{school.commuteBonus}đ
                                </div>
                              )}
                            </div>`;

const newComboCardRow = oldComboCardRow + `\n
                            <details className="mt-2.5 group">
                              <summary className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer list-none flex items-center gap-1 font-semibold select-none">
                                <span>📊 Xem thông số kỹ thuật (d1, d2, d3, d4)</span>
                                <span className="transition-transform group-open:rotate-180">▼</span>
                              </summary>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 mt-1.5">
                                <div>d1 (NV1): <span className={\`font-bold \${school.d1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{school.d1 > 0 ? \`+\${school.d1}\` : school.d1}đ</span></div>
                                <div>d2 (TB): <span className={\`font-bold \${school.d2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{school.d2 > 0 ? \`+\${school.d2}\` : school.d2}đ</span></div>
                                <div>d3 (NV2): <span className={\`font-bold \${school.d3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{school.d3 > 0 ? \`+\${school.d3}\` : school.d3}đ</span></div>
                                <div>d4 (NV3): <span className={\`font-bold \${school.d4 >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>{school.d4 > 0 ? \`+\${school.d4}\` : school.d4}đ</span></div>
                              </div>
                            </details>`;

content = content.replace(oldComboCardRow, newComboCardRow);

fs.writeFileSync(containerPath, content, 'utf8');
console.log('Frontend Grade10Container.tsx simplified successfully');
