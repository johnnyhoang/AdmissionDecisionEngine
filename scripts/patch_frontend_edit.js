const fs = require('fs');
const path = require('path');

// 1. Patch api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('updateG10School')) {
  const updateApi = `
export const updateG10School = async (id: string, data: any): Promise<any> => {
  const res = await apiFetch(\`\${API_BASE_URL}/grade10-hcm/schools/\${id}\`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Không thể cập nhật trường');
  return res.json();
};
`;
  apiContent = apiContent + updateApi;
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// 2. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// Imports
if (!containerContent.includes('EditSchoolModal')) {
  containerContent = containerContent.replace(
    "import MergeSchoolModal from './components/MergeSchoolModal';",
    "import MergeSchoolModal from './components/MergeSchoolModal';\nimport EditSchoolModal from './components/EditSchoolModal';\nimport { updateG10School } from '../../services/api';"
  );
}

// States
if (!containerContent.includes('editingSchoolId')) {
  containerContent = containerContent.replace(
    "const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);",
    "const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);\n  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);"
  );
}

// Handler
if (!containerContent.includes('handleEditSave')) {
  const handlers = `
  const handleEditSave = async (id: string, payload: any) => {
    await updateG10School(id, payload);
    setEditingSchoolId(null);
    loadSchools(debouncedSearchQuery, selectedDistricts.join(','));
  };
`;
  containerContent = containerContent.replace(
    "const handleMergeSave = async (",
    handlers + "\n  const handleMergeSave = async ("
  );
}

// Render Edit button in detail modal header
if (!containerContent.includes('setEditingSchoolId(schoolDetail.id)')) {
  containerContent = containerContent.replace(
    "{schoolDetail.name}\n              </h2>",
    `{schoolDetail.name}\n              </h2>\n              {user?.role === 'ADMIN' && (\n                <button onClick={() => { setSelectedSchoolId(null); setEditingSchoolId(schoolDetail.id); }} className="mt-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 w-max">\n                  Sửa toàn diện thông tin trường\n                </button>\n              )}`
  );
}

// Render Modal component
if (!containerContent.includes('<EditSchoolModal')) {
  containerContent = containerContent.replace(
    "{/* AI Search Modal */}",
    `<EditSchoolModal 
        isOpen={!!editingSchoolId}
        onClose={() => setEditingSchoolId(null)}
        schoolId={editingSchoolId || ''}
        onSave={handleEditSave}
        onAiPrefill={(name, code) => { setAiPrefillSchool({name, code}); setIsAiModalOpen(true); }}
      />
      {/* AI Search Modal */}`
  );
}

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched with Edit School feature');
