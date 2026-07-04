const fs = require('fs');
const path = require('path');

// 1. Patch api.ts to add getG10MacroConfig and updateG10MacroConfig
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

const macroApis = `
export const getG10MacroConfig = async (): Promise<any> => {
  const res = await apiFetch(\`\${API_BASE_URL}/grade10-hcm/recommendation/macro-config\`);
  if (!res.ok) throw new Error('Không thể tải cấu hình vĩ mô');
  return res.json();
};

export const updateG10MacroConfig = async (payload: any): Promise<any> => {
  const res = await apiFetch(\`\${API_BASE_URL}/grade10-hcm/recommendation/macro-config\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Không thể cập nhật cấu hình vĩ mô');
  return res.json();
};
`;

if (!apiContent.includes('getG10MacroConfig')) {
  apiContent = apiContent.replace(
    "export const evaluateG10Profile = async",
    macroApis + "\nexport const evaluateG10Profile = async"
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// 2. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// Add imports
containerContent = containerContent.replace(
  "import { Search as SearchIcon, MapPin, School, HelpCircle, BarChart2, Sparkles, TrendingUp, BadgeCheck } from 'lucide-react';",
  "import { Search as SearchIcon, MapPin, School, HelpCircle, BarChart2, Sparkles, TrendingUp, BadgeCheck, Award, RefreshCw } from 'lucide-react';"
);

containerContent = containerContent.replace(
  "getG10ComboRecommendations",
  "getG10ComboRecommendations, getG10MacroConfig, updateG10MacroConfig"
);

// Add new activeTab type
containerContent = containerContent.replace(
  "useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' | 'combo'>('dashboard');",
  "useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' | 'combo' | 'specialized' | 'adjust'>('dashboard');"
);

// Add macro configuration states
const macroStates = `
  // Macro configuration states
  const [macroConfig, setMacroConfig] = useState<any>(null);
  const [macroExamineesPrev, setMacroExamineesPrev] = useState('');
  const [macroExamineesCurr, setMacroExamineesCurr] = useState('');
  const [macroQuotasPrev, setMacroQuotasPrev] = useState('');
  const [macroQuotasCurr, setMacroQuotasCurr] = useState('');
  const [macroDifficulty, setMacroDifficulty] = useState('medium');
  const [isSavingMacro, setIsSavingMacro] = useState(false);

  const loadMacroConfig = async () => {
    try {
      const res = await getG10MacroConfig();
      setMacroConfig(res);
      setMacroExamineesPrev(res.totalExamineesPrev.toString());
      setMacroExamineesCurr(res.totalExamineesCurr.toString());
      setMacroQuotasPrev(res.totalQuotasPrev.toString());
      setMacroQuotasCurr(res.totalQuotasCurr.toString());
      setMacroDifficulty(res.examDifficulty);
    } catch (e) {
      console.error('Lỗi tải cấu hình vĩ mô:', e);
    }
  };

  const handleSaveMacro = async () => {
    setIsSavingMacro(true);
    try {
      const res = await updateG10MacroConfig({
        totalExamineesPrev: parseInt(macroExamineesPrev),
        totalExamineesCurr: parseInt(macroExamineesCurr),
        totalQuotasPrev: parseInt(macroQuotasPrev),
        totalQuotasCurr: parseInt(macroQuotasCurr),
        examDifficulty: macroDifficulty,
      });
      setMacroConfig(res);
      alert('Đã cập nhật cấu hình vĩ mô và chỉ số SSF thành công!');
    } catch (e: any) {
      alert('Không thể lưu cấu hình vĩ mô: ' + e.message);
    } finally {
      setIsSavingMacro(false);
    }
  };
`;

containerContent = containerContent.replace(
  "const [selectedStrategy, setSelectedStrategy] = useState<'safe' | 'effort' | 'defense'>('safe');",
  "const [selectedStrategy, setSelectedStrategy] = useState<'safe' | 'effort' | 'defense'>('safe');\n  const [maxCommuteDistance, setMaxCommuteDistance] = useState('10');" + macroStates
);

// Load macro config in useEffect
containerContent = containerContent.replace(
  "loadSchools(searchQuery, selectedDistrict);\n    loadAnalytics();",
  "loadSchools(searchQuery, selectedDistrict);\n    loadAnalytics();\n    loadMacroConfig();"
);

// Add Tab Buttons for specialized and adjust in navigation bar
const oldNavButtons = `          {hasPermission('GRADE10', 'view_recommendation', 'view') && (
            <button
              onClick={() => setActiveTab('combo')}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
                activeTab === 'combo'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }\`}
            >
              <Sparkles className="h-4 w-4" />
              Đề xuất Combo 3 NV
            </button>
          )}`;

const newNavButtons = oldNavButtons + `

          {hasPermission('GRADE10', 'view_recommendation', 'view') && (
            <button
              onClick={() => setActiveTab('specialized')}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
                activeTab === 'specialized'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }\`}
            >
              <Award className="h-4 w-4" />
              Chuyên & Tích hợp (Sắp có)
            </button>
          )}

          {hasPermission('GRADE10', 'view_recommendation', 'view') && (
            <button
              onClick={() => setActiveTab('adjust')}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
                activeTab === 'adjust'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }\`}
            >
              <RefreshCw className="h-4 w-4" />
              Mô phỏng đợt chỉnh NV (Sắp có)
            </button>
          )}`;

containerContent = containerContent.replace(oldNavButtons, newNavButtons);

// Render Placeholder tabs for specialized and adjust
const placeholderTabs = `        {/* Tab: Specialized Placeholder */}
        {activeTab === 'specialized' && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-850 rounded-2xl gap-4 max-w-2xl mx-auto text-center p-8 shadow-xl">
            <div className="bg-indigo-600/10 p-4 rounded-full text-indigo-400">
              <Award className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-lg font-bold text-white m-0">Tư Vấn Nguyện Vọng Chuyên & Tích Hợp</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Tính năng đang trong quá trình phát triển. Hệ thống dự kiến sẽ phân tích điểm thi chuyên môn tự chọn, áp dụng công thức đặc thù <strong>Toán + Văn + Anh + Môn chuyên * 2</strong> và đề xuất 2 trường chuyên tối ưu tại TP.HCM.
            </p>
            <div className="px-3 py-1 bg-slate-800 text-[10px] text-slate-400 rounded-full font-bold uppercase">
              ⚙️ Sẽ ra mắt trong đợt thảo luận tiếp theo
            </div>
          </div>
        )}

        {/* Tab: Adjust Placeholder */}
        {activeTab === 'adjust' && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-850 rounded-2xl gap-4 max-w-2xl mx-auto text-center p-8 shadow-xl">
            <div className="bg-emerald-600/10 p-4 rounded-full text-emerald-400">
              <RefreshCw className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-white m-0">Mô Phỏng Đợt Điều Chỉnh Nguyện Vọng Lớp 10</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Tính năng đang được phát triển. Khi Sở GD&ĐT TP.HCM công bố số liệu hồ sơ ban đầu, hệ thống sẽ tự động tính toán lại tỷ lệ chọi đột biến và khuyên phụ huynh dịch chuyển nguyện vọng để tối ưu hóa an toàn.
            </p>
            <div className="px-3 py-1 bg-slate-800 text-[10px] text-slate-400 rounded-full font-bold uppercase">
              ⏳ Sẽ ra mắt trong đợt thảo luận tiếp theo
            </div>
          </div>
        )}
`;

containerContent = containerContent.replace(
  `        {/* Tab 3: Search Schools */}`,
  placeholderTabs + `\n        {/* Tab 3: Search Schools */}`
);

// Display SSF Score indicator on Calculator result panel
containerContent = containerContent.replace(
  `                  <div className="bg-indigo-950/25 border border-indigo-500/10 p-3 rounded-xl text-xs text-slate-300">
                    💡 Điểm xét tuyển của bạn: <strong className="text-indigo-400 text-sm">{evaluationResult.candidateScore}đ</strong> (Toán: {evaluationResult.details.math} | Văn: {evaluationResult.details.literature} | Anh: {evaluationResult.details.english} | Điểm cộng: {Number(evaluationResult.details.priority) + Number(evaluationResult.details.bonus)})
                  </div>`,
  `                  <div className="bg-indigo-950/25 border border-indigo-500/10 p-3.5 rounded-xl text-xs text-slate-300 flex flex-col md:flex-row justify-between gap-3">
                    <div>
                      💡 Điểm xét tuyển của bạn: <strong className="text-indigo-400 text-sm">{evaluationResult.candidateScore}đ</strong> (Toán: {evaluationResult.details.math} | Văn: {evaluationResult.details.literature} | Anh: {evaluationResult.details.english} | Điểm cộng: {Number(evaluationResult.details.priority) + Number(evaluationResult.details.bonus)})
                    </div>
                    {evaluationResult.ssf !== undefined && (
                      <div className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0 font-medium text-slate-400">
                        ⚡ Biến động vĩ mô (SSF): <span className={\`font-bold \${evaluationResult.ssf >= 0 ? 'text-rose-400' : 'text-emerald-400'}\`}>{evaluationResult.ssf > 0 ? \`+\${evaluationResult.ssf}\` : evaluationResult.ssf}đ</span>
                      </div>
                    )}
                  </div>`
);

// Display SSF on Combo result summary
containerContent = containerContent.replace(
  `                  <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-2xl text-xs text-slate-350 flex justify-between items-center">
                    <div>
                      Điểm thi dự kiến: <strong className="text-indigo-400 text-sm">{comboResult.minScore}đ - {comboResult.maxScore}đ</strong>
                      <span className="text-slate-500 ml-2">(Trung bình xét: {comboResult.avgScore}đ)</span>
                    </div>
                  </div>`,
  `                  <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-2xl text-xs text-slate-350 flex justify-between items-center">
                    <div>
                      Điểm thi dự kiến: <strong className="text-indigo-400 text-sm">{comboResult.minScore}đ - {comboResult.maxScore}đ</strong>
                      <span className="text-slate-500 ml-2">(Trung bình xét: {comboResult.avgScore}đ)</span>
                    </div>
                    {comboResult.ssf !== undefined && (
                      <div className="bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800 font-semibold text-slate-400 text-[10px]">
                        ⚡ Hệ số SSF toàn thành phố: <span className={\`font-bold \${comboResult.ssf >= 0 ? 'text-rose-400' : 'text-emerald-400'}\`}>{comboResult.ssf > 0 ? \`+\${comboResult.ssf}\` : comboResult.ssf}đ</span>
                      </div>
                    )}
                  </div>`
);

// Add the Admin Macro-Config editor form under activeTab === 'admin'
// Let's find admin panel in containerContent
const adminForm = `
            {/* Cấu hình vĩ mô SSF */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <TrendingUp className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white m-0">Cấu hình Vĩ mô Tuyển sinh & Giải thuật SSF</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Số thí sinh đăng ký Q10 năm trước</label>
                    <input type="number" value={macroExamineesPrev} onChange={e => setMacroExamineesPrev(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Số thí sinh đăng ký Q10 năm nay</label>
                    <input type="number" value={macroExamineesCurr} onChange={e => setMacroExamineesCurr(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Tổng chỉ tiêu công lập năm trước</label>
                    <input type="number" value={macroQuotasPrev} onChange={e => setMacroQuotasPrev(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Tổng chỉ tiêu công lập năm nay</label>
                    <input type="number" value={macroQuotasCurr} onChange={e => setMacroQuotasCurr(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Đánh giá độ khó đề thi năm nay</label>
                  <select value={macroDifficulty} onChange={e => setMacroDifficulty(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none">
                    <option value="easy">Dễ (Điểm chuẩn sẽ tăng nhẹ)</option>
                    <option value="medium">Bình thường</option>
                    <option value="hard">Khó (Điểm chuẩn sẽ hạ nhẹ)</option>
                  </select>
                </div>

                <button onClick={handleSaveMacro} disabled={isSavingMacro} className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition">
                  {isSavingMacro ? 'Đang lưu...' : '💾 Lưu & Cập nhật Giải thuật SSF'}
                </button>
              </div>

              {macroConfig && (
                <div className="mt-2 bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-xl text-xs text-indigo-300 flex justify-between items-center">
                  <span>⚡ Chỉ số biến động điểm chuẩn toàn thành phố dự kiến (SSF):</span>
                  <strong className="text-indigo-400 text-sm">{macroConfig.ssf > 0 ? '+' : ''}{macroConfig.ssf}đ</strong>
                </div>
              )}
            </div>
`;

// Insert adminForm at the end of activeTab === 'admin' dashboard container panel
// Let's locate the import preset card inside the admin tab
const presetImportBlock = `<button
                    onClick={() => handleRunPreset(preset)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition"
                  >
                    Run Import
                  </button>
                </div>
              ))}
            </div>
          </div>`;

if (containerContent.includes(presetImportBlock)) {
  containerContent = containerContent.replace(presetImportBlock, presetImportBlock + '\n' + adminForm);
} else {
  console.log("Could not find presetImportBlock, searching for run preset text");
  containerContent = containerContent.replace(
    /<\/div>\s*<\/div>\s*<\/div>\s*\}\s*\{\/\* School Detail Modal \*\/\}/,
    `</div>\n</div>\n` + adminForm + `\n</div>\n}\n{/* School Detail Modal */}`
  );
}

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched successfully with placeholders and macro configs');
