/**
 * inject_features.js
 * Final injection script:
 * 1. Remove unused macro states from new top section
 * 2. Inject help (?) buttons next to two module headers
 * 3. Inject help modals before AI Search Modal
 * 4. Fix selectedDistricts references
 */
const fs = require('fs');
const p = '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx';
let s = fs.readFileSync(p, 'utf8');

// ── 1. Remove unused macro states and functions ───────────────────────────────
// These were in the admin tab UI which no longer has a macro config panel
const macroBlock = `  // ── Macro configuration states (admin SSF config) ─────────────────────────
  const [macroConfig, setMacroConfig] = useState<any>(null);
  const [macroExamineesPrev, setMacroExamineesPrev] = useState('');
  const [macroExamineesCurr, setMacroExamineesCurr] = useState('');
  const [macroQuotasPrev, setMacroQuotasPrev] = useState('');
  const [macroQuotasCurr, setMacroQuotasCurr] = useState('');
  const [macroDifficulty, setMacroDifficulty] = useState('medium');
  const [isSavingMacro, setIsSavingMacro] = useState(false);

`;
if (s.includes(macroBlock)) {
  s = s.replace(macroBlock, '');
  console.log('✅ Removed unused macro states block');
} else {
  console.warn('⚠️ Macro block not found - checking alternate format...');
}

// ── 2. Remove getG10MacroConfig and updateG10MacroConfig from imports ─────────
s = s.replace(
  `  getG10MacroConfig, updateG10MacroConfig\n} from '../../services/api';`,
  `} from '../../services/api';`
);
s = s.replace(
  `  getG10MacroConfig, updateG10MacroConfig\r\n} from '../../services/api';`,
  `} from '../../services/api';`
);
// Also try single-line variant
s = s.replace(', getG10MacroConfig, updateG10MacroConfig', '');
console.log('✅ Cleaned up macro config API imports');

// ── 3. Inject (?) help button next to Calculator Results Header ───────────────
const calcOld = `<h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>`;
const calcNew = `<div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>
                  <button onClick={() => setHelpModal('calculator')} className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer" title="Xem hướng dẫn giải thuật">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>`;
if (s.includes(calcOld)) {
  s = s.replace(calcOld, calcNew);
  console.log('✅ Injected (?) button next to Calculator header');
} else { console.warn('⚠️ Calculator header not found'); }

// ── 4. Inject (?) help button next to Combo Header ────────────────────────────
const comboOld = `<h2 className="text-base font-bold text-white m-0">🌈 Đề xuất Combo 3 NV</h2>`;
const comboNew = `<div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-white m-0">🌈 Đề xuất Combo 3 NV</h2>
                <button onClick={() => setHelpModal('combo')} className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer" title="Xem cẩm nang chiến thuật">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>`;
if (s.includes(comboOld)) {
  s = s.replace(comboOld, comboNew);
  console.log('✅ Injected (?) button next to Combo header');
} else { console.warn('⚠️ Combo header not found'); }

// ── 5. Inject help modals before AI Search Modal ──────────────────────────────
const insertBefore = `      {/* AI Search Modal */}`;
const modals = `      {/* ── Help Modal: Đánh Giá Cá Nhân ───────────────────────────────────── */}
      {helpModal === 'calculator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setHelpModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white m-0">📘 Cẩm Nang: Đánh Giá Cá Nhân & Gợi Ý Trường</h2>
              <button onClick={() => setHelpModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-xs leading-relaxed">
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📊 1. Giải thuật SSF — Dịch chuyển điểm chuẩn vĩ mô</h3>
                <p className="m-0">Điểm chuẩn biến động mỗi năm theo 3 nhân tố: <strong>tổng thí sinh</strong>, <strong>chỉ tiêu công lập</strong>, <strong>độ khó đề</strong>. SSF tự tính độ dịch chuyển để dự báo an toàn nhất cho năm hiện tại — tránh nộp trường bằng điểm chuẩn năm cũ nhưng vẫn trượt vì điểm chuẩn năm mới tăng.</p>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🧮 2. Công thức Xác suất đỗ (Hàm mũ bão hòa)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Bằng điểm chuẩn = 50% cơ hội</strong> — Nằm đúng ranh giới đỗ/trượt.</li>
                  <li><strong>Trần 88%</strong> — Dù điểm cao hơn nhiều, xác suất tối đa cũng chỉ 88% để nhắc nhở rủi ro phòng thi thực tế.</li>
                  <li>Công thức: nếu điểm dưới chuẩn → <code>50×e^(diff)</code>; nếu trên chuẩn → <code>50+38×(1−e^(−0.5×diff))</code></li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📉 3. Ý nghĩa 4 chỉ số Diffs (d1→d4)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>d1</strong>: Điểm bạn trừ điểm chuẩn NV1 năm gần nhất (có điều chỉnh SSF)</li>
                  <li><strong>d2</strong>: So với trung bình 3 năm gần nhất (loại bỏ đột biến)</li>
                  <li><strong>d3</strong>: Mức an toàn khi nộp ở Nguyện vọng 2</li>
                  <li><strong>d4</strong>: Mức an toàn khi nộp ở Nguyện vọng 3</li>
                </ul>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 text-center">
              <button onClick={() => setHelpModal(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition cursor-pointer">Đã Hiểu, Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Help Modal: Combo 3 Nguyện Vọng ──────────────────────────────────── */}
      {helpModal === 'combo' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setHelpModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white m-0">📘 Cẩm Nang: Đề Xuất Combo 3 Nguyện Vọng Thông Minh</h2>
              <button onClick={() => setHelpModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-xs leading-relaxed">
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🛡️ 1. Ba chiến thuật phân bổ Nguyện vọng</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Tab 1 — An Toàn</strong>: 3 trường bám sát phổ điểm, NV1&gt;NV2&gt;NV3 giảm dần. Luôn có trường dự phòng gần nhà.</li>
                  <li><strong>Tab 2 — Nỗ Lực</strong>: Trường mơ ước lên NV1 bất kể tỉ lệ chọi. NV2 cạnh tranh vừa, NV3 siêu an toàn làm tấm khiên.</li>
                  <li><strong>Tab 3 — Phòng Thủ</strong>: Hạ chỉ tiêu ngay từ NV1, đảm bảo 100% có suất công lập gần nhà.</li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📍 2. Điểm thưởng Cự ly đi học (Commute Bonus)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li>Cách nhà &lt;⅓ cự ly tối đa → cộng thưởng <strong>+1.5 điểm ảo</strong></li>
                  <li>Cách nhà ⅓→⅔ cự ly → cộng thưởng <strong>+0.75 điểm ảo</strong></li>
                  <li>Điểm thưởng giúp ưu tiên trường gần nhà chất lượng tốt lên đầu danh sách.</li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🚗 3. Tự động nới lỏng khoảng cách</h3>
                <p className="m-0">Nếu cự ly quá ngắn không đủ 12 trường ứng viên, hệ thống tự nới rộng và hiện cảnh báo rõ ràng để bạn điều chỉnh lại.</p>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 text-center">
              <button onClick={() => setHelpModal(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition cursor-pointer">Đã Hiểu, Đóng</button>
            </div>
          </div>
        </div>
      )}

      `;

if (s.includes(insertBefore) && !s.includes("helpModal === 'calculator'")) {
  s = s.replace(insertBefore, modals + insertBefore);
  console.log('✅ Injected help modals');
} else {
  console.log('ℹ️ Help modals already present or anchor not found');
}

// ── 6. Fix selectedDistricts.join → selectedDistrict ─────────────────────────
const before = (s.match(/selectedDistricts\.join\(','\)/g) || []).length;
s = s.replaceAll("selectedDistricts.join(',')", 'selectedDistrict');
console.log(`✅ Fixed ${before} selectedDistricts references`);

fs.writeFileSync(p, s, 'utf8');
console.log('\n✅ All injections complete.');
