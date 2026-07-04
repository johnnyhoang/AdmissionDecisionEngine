const fs = require('fs');
const path = require('path');

// Patch api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('mergeG10Schools')) {
  const mergeApi = `
export const mergeG10Schools = async (primaryId: string, secondaryId: string, mergedData: any): Promise<any> => {
  const res = await apiFetch(\`\${API_BASE_URL}/grade10-hcm/schools/merge\`, {
    method: 'POST',
    body: JSON.stringify({ primaryId, secondaryId, mergedData }),
  });
  if (!res.ok) throw new Error('Không thể merge trường');
  return res.json();
};
`;
  apiContent = apiContent + mergeApi;
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// 1. Imports
if (!containerContent.includes('MergeSchoolModal')) {
  containerContent = containerContent.replace(
    "import AiSearchModal from '../../components/AiSearchModal';",
    "import AiSearchModal from '../../components/AiSearchModal';\nimport MergeSchoolModal from './components/MergeSchoolModal';\nimport { mergeG10Schools } from '../../services/api';"
  );
}

// 2. States
if (!containerContent.includes('selectedMergeIds')) {
  containerContent = containerContent.replace(
    "const debouncedSearchQuery = useDebounce(searchQuery, 300);",
    "const debouncedSearchQuery = useDebounce(searchQuery, 300);\n  const [selectedMergeIds, setSelectedMergeIds] = useState<string[]>([]);\n  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);"
  );
}

// 3. Handlers
if (!containerContent.includes('handleMergeSave')) {
  const handlers = `
  const toggleMergeSelection = (id: string) => {
    setSelectedMergeIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleMergeSave = async (primaryId: string, secondaryId: string, mergedData: any) => {
    await mergeG10Schools(primaryId, secondaryId, mergedData);
    setSelectedMergeIds([]);
    loadSchools(debouncedSearchQuery, selectedDistricts.join(','));
  };
`;
  containerContent = containerContent.replace(
    "const handleEvaluate = async () => {",
    handlers + "\n  const handleEvaluate = async () => {"
  );
}

// 4. Merge Button
if (!containerContent.includes('Merge 2 Trường Đã Chọn')) {
  containerContent = containerContent.replace(
    "{user?.role === 'ADMIN' && (",
    `{user?.role === 'ADMIN' && selectedMergeIds.length === 2 && (
                  <button
                    onClick={() => setIsMergeModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Merge 2 Trường Đã Chọn
                  </button>
                )}

                {user?.role === 'ADMIN' && (`
  );
}

// 5. Checkbox in Cards
if (!containerContent.includes('toggleMergeSelection')) {
  containerContent = containerContent.replace(
    '<div className="flex gap-2">',
    `<div className="flex items-center gap-2">
                          {user?.role === 'ADMIN' && (
                            <input 
                              type="checkbox" 
                              checked={selectedMergeIds.includes(school.id)}
                              onChange={() => toggleMergeSelection(school.id)}
                              className="w-3.5 h-3.5 cursor-pointer accent-indigo-500"
                              title="Chọn để Merge"
                            />
                          )}`
  );
}

// 6. Modal Component
if (!containerContent.includes('<MergeSchoolModal')) {
  containerContent = containerContent.replace(
    "{/* AI Search Modal */}",
    `<MergeSchoolModal 
        isOpen={isMergeModalOpen} 
        onClose={() => setIsMergeModalOpen(false)} 
        school1={schools.find(s => s.id === selectedMergeIds[0]) || null}
        school2={schools.find(s => s.id === selectedMergeIds[1]) || null}
        onMerge={handleMergeSave}
      />
      {/* AI Search Modal */}`
  );
}

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched successfully');
