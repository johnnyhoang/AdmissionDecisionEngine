const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import CompareDrawer
if (!content.includes("import CompareDrawer from './components/CompareDrawer';")) {
  content = content.replace(
    "import EditSchoolModal from './components/EditSchoolModal';",
    "import EditSchoolModal from './components/EditSchoolModal';\nimport CompareDrawer from './components/CompareDrawer';"
  );
}

// 2. Adjust activeTab type & add isCompareOpen state
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'search' | 'analytics' | 'compare'>('dashboard');",
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'search' | 'analytics'>('dashboard');\n  const [isCompareOpen, setIsCompareOpen] = useState(false);"
);

// 3. Update the So Sánh button click handler and state highlights
content = content.replace(
  `          <button
            onClick={() => setActiveTab('compare')}
            className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition relative \${
              activeTab === 'compare'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }\`}
          >`,
  `          <button
            onClick={() => setIsCompareOpen(true)}
            className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition relative \${
              isCompareOpen
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }\`}
          >`
);

// 4. Remove Tab 5 rendering block
const targetTab5 = `        {/* Tab 5: Compare schools */}
        {activeTab === 'compare' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <h2 className="text-base font-bold text-white m-0">Bảng So Sánh Chỉ Số Điểm Chuẩn</h2>
              <p className="text-xs text-slate-400 m-0">So sánh trực quan biến động chỉ tiêu tuyển sinh và phổ điểm chuẩn NV1, NV2, NV3.</p>
            </div>

            {compareList.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                <School className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Vui lòng chọn các trường THPT từ danh sách <strong>"Tra cứu trường"</strong> để thêm vào bảng so sánh.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {compareList.map((school) => (
                  <div key={school.id} className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-6">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                          {school.code}
                        </span>
                        <button
                          onClick={() => toggleCompare(school)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Xóa
                        </button>
                      </div>
                      <h3 className="text-base font-extrabold text-white mb-4 border-b border-slate-800 pb-3">{school.name}</h3>

                      <div className="flex flex-col gap-4 text-xs">
                        <div>
                          <div className="text-slate-400 mb-0.5">Điểm chuẩn NV1 2025</div>
                          <div className="font-bold text-indigo-400 text-sm">{school.latestCutoffNV1 || 'N/A'}đ</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Điểm chuẩn NV2 {formatSchoolYear(getCurrentSchoolYear())}</div>
                          <div className="font-semibold text-slate-200">{school.latestCutoffNV2 || 'N/A'}đ</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Điểm chuẩn NV3 {formatSchoolYear(getCurrentSchoolYear())}</div>
                          <div className="font-semibold text-slate-200">{school.latestCutoffNV3 || 'N/A'}đ</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Quận / Huyện</div>
                          <div className="font-semibold text-slate-200">{school.district?.name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Website</div>
                          <a href={school.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate block">
                            {school.website || 'N/A'}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}`;

if (content.includes(targetTab5)) {
  content = content.replace(targetTab5, '');
} else {
  // Try dynamic replace if whitespace is different
  const lines = content.split('\n');
  let startIdx = -1;
  let endIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Tab 5: Compare schools")) {
      startIdx = i;
    }
    if (startIdx !== -1 && lines[i].trim() === ')}' && lines[i-1].includes('activeTab === \'compare\'')) {
      // Find matching bracket or end index
    }
  }
  // Let's do regex replace for activeTab === 'compare'
  content = content.replace(/\{\/\* Tab 5: Compare schools \*\/\}[\s\S]*?activeTab === 'compare'[\s\S]*?\n\s*\}\s*\n\s*\)\}/, '');
}

// 5. Add CompareDrawer rendering at the bottom before AI Search Modal
content = content.replace(
  `<EditSchoolModal 
        isOpen={!!editingSchoolId}
        onClose={() => setEditingSchoolId(null)}
        schoolId={editingSchoolId || ''}
        onSave={handleEditSave}
        onAiPrefill={(name, code) => { setAiPrefillSchool({name, code}); setIsAiModalOpen(true); }}
      />`,
  `<EditSchoolModal 
        isOpen={!!editingSchoolId}
        onClose={() => setEditingSchoolId(null)}
        schoolId={editingSchoolId || ''}
        onSave={handleEditSave}
        onAiPrefill={(name, code) => { setAiPrefillSchool({name, code}); setIsAiModalOpen(true); }}
      />
      <CompareDrawer
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareList={compareList}
        onRemove={toggleCompare}
        onClear={() => setCompareList([])}
      />`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Grade10Container.tsx patched successfully');
