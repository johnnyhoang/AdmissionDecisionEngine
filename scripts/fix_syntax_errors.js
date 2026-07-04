const fs = require('fs');
const path = require('path');

// 1. Fix date.ts
const datePath = path.join(__dirname, '../apps/frontend/src/utils/date.ts');
let dateContent = fs.readFileSync(datePath, 'utf8');
dateContent = dateContent.replace(/\\`\\\${y}-\\\${y \+ 1}\\`/g, "`${y}-${y + 1}`");
fs.writeFileSync(datePath, dateContent, 'utf8');
console.log('Fixed date.ts syntax errors');

// 2. Fix MergeSchoolModal.tsx
const modalPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/MergeSchoolModal.tsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

// Replace all instances of {\`...\`} containing backslashes
modalContent = modalContent.replace(/\{\\`grid grid-cols-12 gap-4 items-start p-3 rounded-xl border \\\${isDiff \? 'bg-amber-950\/20 border-amber-900\/30' : 'border-transparent'}\\\`\}/g, "{`grid grid-cols-12 gap-4 items-start p-3 rounded-xl border ${isDiff ? 'bg-amber-950/20 border-amber-900/30' : 'border-transparent'}`}");
modalContent = modalContent.replace(/\{\\`col-span-3 p-2 rounded-lg border cursor-pointer hover:border-indigo-500 transition \\\${isDiff \? 'border-slate-700 bg-slate-900\/50' : 'border-slate-800'}\\\`\}/g, "{`col-span-3 p-2 rounded-lg border cursor-pointer hover:border-indigo-500 transition ${isDiff ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800'}`}");
modalContent = modalContent.replace(/\{\\`text-sm line-clamp-4 whitespace-pre-wrap \\\${!val1 \? 'text-slate-600 italic' : 'text-slate-300'}\\\`\}/g, "{`text-sm line-clamp-4 whitespace-pre-wrap ${!val1 ? 'text-slate-600 italic' : 'text-slate-300'}`}");
modalContent = modalContent.replace(/\{\\`col-span-3 p-2 rounded-lg border cursor-pointer hover:border-purple-500 transition \\\${isDiff \? 'border-slate-700 bg-slate-900\/50' : 'border-slate-800'}\\\`\}/g, "{`col-span-3 p-2 rounded-lg border cursor-pointer hover:border-purple-500 transition ${isDiff ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800'}`}");
modalContent = modalContent.replace(/\{\\`text-sm line-clamp-4 whitespace-pre-wrap \\\${!val2 \? 'text-slate-600 italic' : 'text-slate-300'}\\\`\}/g, "{`text-sm line-clamp-4 whitespace-pre-wrap ${!val2 ? 'text-slate-600 italic' : 'text-slate-300'}`}");

// Check if any other escaped backticks remain and clean them
modalContent = modalContent.replace(/\\`/g, "`").replace(/\\\$/g, "$");

fs.writeFileSync(modalPath, modalContent, 'utf8');
console.log('Fixed MergeSchoolModal.tsx syntax errors');

// 3. Fix grade10-school.service.ts implicit any errors
const schoolServicePath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/services/grade10-school.service.ts');
let serviceContent = fs.readFileSync(schoolServicePath, 'utf8');
serviceContent = serviceContent.replace('map(c => this.cutoffRepo.create', 'map((c: any) => this.cutoffRepo.create');
serviceContent = serviceContent.replace('map(q => this.quotaRepo.create', 'map((q: any) => this.quotaRepo.create');
fs.writeFileSync(schoolServicePath, serviceContent, 'utf8');
console.log('Fixed grade10-school.service.ts type errors');

// 4. Fix grade10-calc.controller.ts permission value error
const controllerPath = path.join(__dirname, '../apps/backend/src/modules/grade10-hcm/controllers/grade10-calc.controller.ts');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');
controllerContent = controllerContent.replace("RequirePermission('GRADE10', 'manage_schools', 'write')", "RequirePermission('GRADE10', 'manage_schools', 'edit')");
fs.writeFileSync(controllerPath, controllerContent, 'utf8');
console.log('Fixed grade10-calc.controller.ts permission error');
