const fs = require('fs');
const path = require('path');

// 1. Patch api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
if (!apiContent.includes('isVerified?: boolean;')) {
  apiContent = apiContent.replace(
    "isActive: boolean;",
    "isActive: boolean;\n  isVerified?: boolean;"
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// 2. Patch EditSchoolModal.tsx
const modalPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/EditSchoolModal.tsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

// Add BadgeCheck import
if (!modalContent.includes('BadgeCheck')) {
  modalContent = modalContent.replace(
    "import { X, Save, Calculator, Sparkles } from 'lucide-react';",
    "import { X, Save, Calculator, Sparkles, BadgeCheck } from 'lucide-react';"
  );
}

// Fix import
if (modalContent.includes('../../../types')) {
  modalContent = modalContent.replace(
    "import { G10SchoolItem } from '../../../types';",
    "import { G10SchoolItem } from '../../../services/api';"
  );
}

// Add state to formData
if (!modalContent.includes('isVerified: data.isVerified === true,')) {
  modalContent = modalContent.replace(
    "isActive: data.isActive !== false,",
    "isActive: data.isActive !== false,\n        isVerified: data.isVerified === true,"
  );
}

// Hide AI button if verified
if (modalContent.includes('{onAiPrefill && (')) {
  modalContent = modalContent.replace(
    "{onAiPrefill && (",
    "{onAiPrefill && !formData.isVerified && ("
  );
}

// Add checkbox for isVerified
if (!modalContent.includes('name="isVerified"')) {
  modalContent = modalContent.replace(
    '<label htmlFor="isActive" className="text-sm font-medium text-slate-300">Đang hoạt động (Hiển thị cho User)</label>\n                  </div>',
    '<label htmlFor="isActive" className="text-sm font-medium text-slate-300">Đang hoạt động (Hiển thị cho User)</label>\n                  </div>\n\n                  <div className="flex items-center gap-2 mt-2 bg-indigo-950/20 p-2 rounded-lg border border-indigo-900/30 w-max">\n                    <input type="checkbox" id="isVerified" name="isVerified" checked={formData.isVerified} onChange={handleBasicChange} className="w-4 h-4 accent-indigo-500" />\n                    <label htmlFor="isVerified" className="text-sm font-medium text-indigo-300 flex items-center gap-1"><BadgeCheck className="w-4 h-4" /> Xác thực Trường (Khóa auto update AI)</label>\n                  </div>'
  );
}
fs.writeFileSync(modalPath, modalContent, 'utf8');

// Fix MergeSchoolModal import
const mergeModalPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/MergeSchoolModal.tsx');
let mergeModalContent = fs.readFileSync(mergeModalPath, 'utf8');
if (mergeModalContent.includes('../../../types')) {
  mergeModalContent = mergeModalContent.replace(
    "import { G10SchoolItem } from '../../../types';",
    "import { G10SchoolItem } from '../../../services/api';"
  );
  fs.writeFileSync(mergeModalPath, mergeModalContent, 'utf8');
}


// 3. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

if (!containerContent.includes('BadgeCheck')) {
  containerContent = containerContent.replace(
    "MapPin,",
    "MapPin,\n  BadgeCheck,"
  );
}

// Render blue tick in School Cards
if (!containerContent.includes('<BadgeCheck className="w-3.5 h-3.5 text-blue-500" title="Trường đã xác thực" />') && !containerContent.includes('<BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" title="Trường đã xác thực" />')) {
  containerContent = containerContent.replace(
    '<h3 className="text-sm font-bold text-white mb-2 hover:text-indigo-400 cursor-pointer" onClick={() => openSchoolDetail(school.id)}>{school.name}</h3>',
    '<h3 className="text-sm font-bold text-white mb-2 hover:text-indigo-400 cursor-pointer flex items-center gap-1.5" onClick={() => openSchoolDetail(school.id)}>{school.name} {school.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" title="Trường đã xác thực" />}</h3>'
  );
}

// Render blue tick in Modal
if (!containerContent.includes('{schoolDetail.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" title="Đã xác thực" />}')) {
  containerContent = containerContent.replace(
    '<School className="h-5 w-5 text-indigo-400 shrink-0" />\n                {schoolDetail.name}',
    '<School className="h-5 w-5 text-indigo-400 shrink-0" />\n                {schoolDetail.name}\n                {schoolDetail.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" title="Đã xác thực" />}'
  );
}

// Render blue tick in Compare list
if (!containerContent.includes('{school.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" title="Đã xác thực" />}')) {
  containerContent = containerContent.replace(
    '<h3 className="text-base font-bold text-white mb-1 line-clamp-2">{school.name}</h3>',
    '<h3 className="text-base font-bold text-white mb-1 line-clamp-2 flex items-center gap-1">{school.name} {school.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" title="Đã xác thực" />}</h3>'
  );
}

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched with verified flag');
