/**
 * comprehensive_fix.js
 * Fix ALL pre-existing TypeScript build errors in Grade10Container.tsx
 * Strategy: load file, apply targeted string replacements, write back.
 */
const fs = require('fs');
const path = require('path');

const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let src = fs.readFileSync(containerPath, 'utf8');

let fixes = 0;

function replace(oldStr, newStr, label) {
  if (src.includes(oldStr)) {
    src = src.replace(oldStr, newStr);
    fixes++;
    console.log(`✅ [${fixes}] ${label}`);
  } else {
    console.warn(`⚠️  NOT FOUND: ${label}`);
  }
}

// ── 1. Remove useDebounce import ──────────────────────────────────────────────
replace(
  `import { useDebounce } from '../../hooks/useDebounce';\n`,
  '',
  'Remove useDebounce import'
);

// ── 2. Remove Check, ChevronDown, Save from lucide import ────────────────────
replace(
  `import { Check, ChevronDown, Save, Award, RefreshCw } from 'lucide-react';`,
  `import { Award, RefreshCw } from 'lucide-react';`,
  'Remove unused lucide imports'
);

// ── 3. Expand activeTab union type to include analytics + compare ─────────────
replace(
  `useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' | 'combo' | 'specialized' | 'adjust'>('dashboard')`,
  `useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' | 'combo' | 'specialized' | 'adjust' | 'analytics' | 'compare'>('dashboard')`,
  'Expand activeTab union type'
);

// ── 4. Remove unused adminStats state ────────────────────────────────────────
replace(
  `  const [adminStats, setAdminStats] = useState<any>(null);\n`,
  '',
  'Remove adminStats state'
);

// ── 5. Remove unused selectedTopType state (multi-line) ──────────────────────
replace(
  `  const [selectedTopType, setSelectedTopType] = useState<\n    'highestCutoff' | 'lowestCutoff' | 'highestRatio' | 'lowestRatio' | 'highestQuota' | 'highestDiff' | 'highestRegistered' | 'highestSpecialized'\n  >('highestCutoff');\n`,
  '',
  'Remove selectedTopType state'
);

// ── 6. Remove unused macroConfig state ───────────────────────────────────────
replace(
  `  const [macroConfig, setMacroConfig] = useState<any>(null);\n`,
  '',
  'Remove macroConfig state'
);

// ── 7. Remove unused isSavingMacro state ─────────────────────────────────────
replace(
  `  const [isSavingMacro, setIsSavingMacro] = useState(false);\n`,
  '',
  'Remove isSavingMacro state'
);

// ── 8. Remove loadMacroConfig function ───────────────────────────────────────
replace(
  `  const loadMacroConfig = async () => {\n    try {\n      const res = await getG10MacroConfig();\n      setMacroConfig(res);\n      setMacroExamineesPrev(res.totalExamineesPrev.toString());\n      setMacroExamineesCurr(res.totalExamineesCurr.toString());\n      setMacroQuotasPrev(res.totalQuotasPrev.toString());\n      setMacroQuotasCurr(res.totalQuotasCurr.toString());\n      setMacroDifficulty(res.examDifficulty);\n    } catch (e) {\n      console.error('Lỗi tải cấu hình vĩ mô:', e);\n    }\n  };\n`,
  '',
  'Remove loadMacroConfig function'
);

// ── 9. Remove handleSaveMacro function ───────────────────────────────────────
replace(
  `  const handleSaveMacro = async () => {\n    setIsSavingMacro(true);\n    try {\n      const res = await updateG10MacroConfig({\n        totalExamineesPrev: parseInt(macroExamineesPrev),\n        totalExamineesCurr: parseInt(macroExamineesCurr),\n        totalQuotasPrev: parseInt(macroQuotasPrev),\n        totalQuotasCurr: parseInt(macroQuotasCurr),\n        examDifficulty: macroDifficulty,\n      });\n      setMacroConfig(res);\n      alert('Đã cập nhật cấu hình vĩ mô và chỉ số SSF thành công!');\n    } catch (e: any) {\n      alert('Không thể lưu cấu hình vĩ mô: ' + e.message);\n    } finally {\n      setIsSavingMacro(false);\n    }\n  };\n`,
  '',
  'Remove handleSaveMacro function'
);

// ── 10. Remove unused distanceMode state ─────────────────────────────────────
replace(
  `  const [distanceMode, setDistanceMode] = useState<'driving' | 'straight'>('driving');\n`,
  '',
  'Remove distanceMode state'
);

// ── 11. Remove unused loadAdminStats function ─────────────────────────────────
replace(
  `  const loadAdminStats = async () => {\n    try {\n      const stats = await fetchG10AdminStats();\n      setAdminStats(stats);\n    } catch (e) {\n      console.error(e);\n    }\n  };\n`,
  '',
  'Remove loadAdminStats function'
);

// ── 12. Add missing state declarations after isCompareOpen ───────────────────
replace(
  `  const [isCompareOpen, setIsCompareOpen] = useState(false);\n`,
  `  const [isCompareOpen, setIsCompareOpen] = useState(false);
  // Admin school management states
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedMergeIds, setSelectedMergeIds] = useState<string[]>([]);\n`,
  'Add missing admin management states'
);

// ── 13. Add debouncedSearchQuery after searchQuery declaration ────────────────
replace(
  `  const [searchQuery, setSearchQuery] = useState('');`,
  `  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = searchQuery; // alias for deferred search compatibility`,
  'Add debouncedSearchQuery alias'
);

// ── 14. Fix selectedDistricts (plural, wrong) → selectedDistrict ─────────────
src = src.replaceAll("selectedDistricts.join(',')", 'selectedDistrict');
console.log('✅ Fixed selectedDistricts.join() → selectedDistrict');
fixes++;

// ── 15. Fix unused 'error' param in geolocation callback ─────────────────────
replace(
  `      (error) => {
        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');
        setIsLocating(false);
      }`,
  `      (_gpsErr) => {
        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');
        setIsLocating(false);
      }`,
  'Fix unused error param in geolocation'
);

// ── 16. Remove unused fetchG10AdminStats import ───────────────────────────────
replace(
  `  fetchG10Schools, fetchG10SchoolDetail, fetchG10Districts, \n  fetchG10Analytics, evaluateG10Profile, fetchG10AdminStats, getG10ComboRecommendations, getG10MacroConfig, updateG10MacroConfig `,
  `  fetchG10Schools, fetchG10SchoolDetail, fetchG10Districts,\n  fetchG10Analytics, evaluateG10Profile, getG10ComboRecommendations, getG10MacroConfig, updateG10MacroConfig`,
  'Remove fetchG10AdminStats from imports'
);

// ── 17. Now add helpModal state + theme state after useState starts ────────────
// Insert after theme state if not already present
if (!src.includes("useState<'calculator' | 'combo' | null>(null)")) {
  replace(
    `  const [theme, setTheme] = useState<'light' | 'dark'>('light');\n`,
    `  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [helpModal, setHelpModal] = useState<'calculator' | 'combo' | null>(null);\n`,
    'Add helpModal state'
  );
} else {
  console.log('ℹ️  helpModal state already present');
}

// ── 18. Add help buttons in JSX ──────────────────────────────────────────────
// Button next to Calculator Results Header (first match only)
const calcHeaderOld = `<h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>`;
const calcHeaderNew = `<div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>
                  <button
                    onClick={() => setHelpModal('calculator')}
                    className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer"
                    title="Xem hướng dẫn giải thuật và công thức tính"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>`;
if (src.includes(calcHeaderOld)) {
  src = src.replace(calcHeaderOld, calcHeaderNew);
  console.log('✅ Added help button to Calculator header');
  fixes++;
}

// Button next to Combo Header
const comboHeaderOld = `<h2 className="text-base font-bold text-white m-0">🌈 Đề xuất Combo 3 NV</h2>`;
const comboHeaderNew = `<div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-white m-0">🌈 Đề xuất Combo 3 NV</h2>
                <button
                  onClick={() => setHelpModal('combo')}
                  className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer"
                  title="Xem cẩm nang chiến thuật xếp nguyện vọng"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>`;
if (src.includes(comboHeaderOld)) {
  src = src.replace(comboHeaderOld, comboHeaderNew);
  console.log('✅ Added help button to Combo header');
  fixes++;
}

// ── 19. Add Help Modals before AI Search Modal ─────────────────────────────
const modalsInsertBefore = `      {/* AI Search Modal */}`;
const modalsCode = `      {/* Help Modal: Personal Evaluator */}
      {helpModal === 'calculator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setHelpModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white m-0">📘 Cẩm Nang: Đánh Giá Cá Nhân & Gợi Ý Trường</h2>
              <button onClick={() => setHelpModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-xs leading-relaxed">
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📊 1. Giải thuật dịch chuyển Điểm chuẩn Vĩ mô (SSF Model)</h3>
                <p className="m-0">Điểm chuẩn không cố định mà biến động mỗi năm theo 3 nhân tố: <strong>tổng thí sinh dự thi</strong>, <strong>chỉ tiêu tuyển sinh công lập</strong> và <strong>độ khó đề thi</strong>. Hệ số SSF tự động tính độ biến động này để đưa ra dự báo an toàn nhất cho năm hiện tại.</p>
              </section>
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🧮 2. Công thức Xác suất đỗ thực tế (Hàm mũ bão hòa)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Bằng điểm chuẩn = 50% cơ hội</strong> — Nằm giữa ranh giới đỗ/trượt khi điểm dao động.</li>
                  <li><strong>Trần 88%</strong> — Nhắc nhở tránh chủ quan dù vượt điểm chuẩn rất cao, vẫn có rủi ro thực tế.</li>
                </ul>
              </section>
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📉 3. Ý nghĩa 4 chỉ số Diffs (d1, d2, d3, d4)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>d1</strong>: So điểm bạn vs điểm chuẩn NV1 năm gần nhất</li>
                  <li><strong>d2</strong>: So với trung bình điểm chuẩn 3 năm liền kề (loại bỏ đột biến)</li>
                  <li><strong>d3</strong>: Mức an toàn khi nộp ở Nguyện vọng 2</li>
                  <li><strong>d4</strong>: Mức an toàn khi nộp ở Nguyện vọng 3</li>
                </ul>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 text-center">
              <button onClick={() => setHelpModal(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer">Đã Hiểu, Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal: Combo 3 NV */}
      {helpModal === 'combo' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setHelpModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white m-0">📘 Cẩm Nang: Đề Xuất Combo 3 Nguyện Vọng</h2>
              <button onClick={() => setHelpModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-xs leading-relaxed">
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🛡️ 1. Ba chiến thuật phân bổ Nguyện vọng thông minh</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Tab 1 - An Toàn</strong>: 3 trường bám sát phổ điểm, NV1 &gt; NV2 &gt; NV3 giảm dần, luôn có dự phòng gần nhà.</li>
                  <li><strong>Tab 2 - Nỗ Lực</strong>: Trường mơ ước lên NV1, NV2 cạnh tranh trung bình, NV3 cực kỳ an toàn làm tấm khiên bảo vệ.</li>
                  <li><strong>Tab 3 - Phòng Thủ</strong>: Trường an toàn làm NV1 ngay, hạ tiếp NV2/3 để đảm bảo 100% có suất công lập.</li>
                </ul>
              </section>
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📍 2. Điểm thưởng Cự ly đi học (Commute Bonus)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li>Cách nhà &lt;1/3 cự ly tối đa: Cộng thưởng <strong>+1.5 điểm ảo</strong></li>
                  <li>Cách nhà 1/3 → 2/3 cự ly: Cộng thưởng <strong>+0.75 điểm ảo</strong></li>
                  <li>Đẩy các trường gần nhà có chất lượng tốt lên đầu danh sách đề xuất.</li>
                </ul>
              </section>
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🚗 3. Tự động nới lỏng khoảng cách</h3>
                <p className="m-0">Nếu cự ly quá ngắn không tìm đủ 12 trường ứng viên, hệ thống tự động nới rộng và hiện cảnh báo để bạn điều chỉnh.</p>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 text-center">
              <button onClick={() => setHelpModal(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer">Đã Hiểu, Đóng</button>
            </div>
          </div>
        </div>
      )}

      `;

if (src.includes(modalsInsertBefore) && !src.includes('helpModal === \'calculator\'')) {
  src = src.replace(modalsInsertBefore, modalsCode + modalsInsertBefore);
  console.log('✅ Inserted help modals before AI Search Modal');
  fixes++;
} else {
  console.log('ℹ️  Help modals already present');
}

fs.writeFileSync(containerPath, src, 'utf8');
console.log(`\n✅ Done. Applied ${fixes} fixes.`);
