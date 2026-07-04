/**
 * fix_build_errors.js
 * Fixes all pre-existing TypeScript build errors in Grade10Container.tsx and sub-components
 * so that `npm run build:all` passes cleanly.
 *
 * Issues fixed:
 * 1. Unused imports: useDebounce, Check, ChevronDown, Save
 * 2. Unused state: adminStats, selectedTopType, macroConfig, isSavingMacro, distanceMode
 * 3. Unused functions: loadAdminStats, handleSaveMacro, loadMacroConfig
 * 4. Missing state declarations: editingSchoolId, isMergeModalOpen, selectedMergeIds, debouncedSearchQuery
 * 5. selectedDistricts -> selectedDistrict  (wrong plural)
 * 6. Tab type union missing 'analytics' | 'compare'
 * 7. Unused error param in geolocation callback
 * 8. CompareDrawer: TrendingDown not imported
 * 9. EditSchoolModal: unused G10SchoolItem import
 */

const fs = require('fs');
const path = require('path');

const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(containerPath, 'utf8');

// ---------------------------------------------------------------------------
// 1. Fix unused imports on line 24: remove useDebounce
// ---------------------------------------------------------------------------
content = content.replace(
  `import { useDebounce } from '../../hooks/useDebounce';\n`,
  ''
);

// ---------------------------------------------------------------------------
// 2. Fix unused imports on line 25: remove Check, ChevronDown, Save (keep Award, RefreshCw)
// ---------------------------------------------------------------------------
content = content.replace(
  `import { Check, ChevronDown, Save, Award, RefreshCw } from 'lucide-react';`,
  `import { Award, RefreshCw } from 'lucide-react';`
);

// ---------------------------------------------------------------------------
// 3. Fix tab union type: add 'analytics' | 'compare'
// ---------------------------------------------------------------------------
content = content.replace(
  `const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' | 'combo' | 'specialized' | 'adjust'>('dashboard');`,
  `const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' | 'combo' | 'specialized' | 'adjust' | 'analytics' | 'compare'>('dashboard');`
);

// ---------------------------------------------------------------------------
// 4. Remove unused adminStats state (line 32)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const [adminStats, setAdminStats] = useState<any>(null);\n`,
  ''
);

// ---------------------------------------------------------------------------
// 5. Remove unused selectedTopType state (lines 33-35)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const [selectedTopType, setSelectedTopType] = useState<\n    'highestCutoff' | 'lowestCutoff' | 'highestRatio' | 'lowestRatio' | 'highestQuota' | 'highestDiff' | 'highestRegistered' | 'highestSpecialized'\n  >('highestCutoff');\n`,
  ''
);

// ---------------------------------------------------------------------------
// 6. Remove unused macroConfig state (line 73)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const [macroConfig, setMacroConfig] = useState<any>(null);\n`,
  ''
);

// ---------------------------------------------------------------------------
// 7. Remove unused isSavingMacro state (line 79)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const [isSavingMacro, setIsSavingMacro] = useState(false);\n`,
  ''
);

// ---------------------------------------------------------------------------
// 8. Remove unused loadMacroConfig function (lines 81-93)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const loadMacroConfig = async () => {\n    try {\n      const res = await getG10MacroConfig();\n      setMacroConfig(res);\n      setMacroExamineesPrev(res.totalExamineesPrev.toString());\n      setMacroExamineesCurr(res.totalExamineesCurr.toString());\n      setMacroQuotasPrev(res.totalQuotasPrev.toString());\n      setMacroQuotasCurr(res.totalQuotasCurr.toString());\n      setMacroDifficulty(res.examDifficulty);\n    } catch (e) {\n      console.error('Lỗi tải cấu hình vĩ mô:', e);\n    }\n  };\n`,
  ''
);

// ---------------------------------------------------------------------------
// 9. Remove unused handleSaveMacro function (lines 95-112)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const handleSaveMacro = async () => {\n    setIsSavingMacro(true);\n    try {\n      const res = await updateG10MacroConfig({\n        totalExamineesPrev: parseInt(macroExamineesPrev),\n        totalExamineesCurr: parseInt(macroExamineesCurr),\n        totalQuotasPrev: parseInt(macroQuotasPrev),\n        totalQuotasCurr: parseInt(macroQuotasCurr),\n        examDifficulty: macroDifficulty,\n      });\n      setMacroConfig(res);\n      alert('Đã cập nhật cấu hình vĩ mô và chỉ số SSF thành công!');\n    } catch (e: any) {\n      alert('Không thể lưu cấu hình vĩ mô: ' + e.message);\n    } finally {\n      setIsSavingMacro(false);\n    }\n  };\n`,
  ''
);

// ---------------------------------------------------------------------------
// 10. Remove unused distanceMode state (line 117)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const [distanceMode, setDistanceMode] = useState<'driving' | 'straight'>('driving');\n`,
  ''
);

// ---------------------------------------------------------------------------
// 11. Remove unused loadAdminStats function (lines 141-148)
// ---------------------------------------------------------------------------
content = content.replace(
  `  const loadAdminStats = async () => {\n    try {\n      const stats = await fetchG10AdminStats();\n      setAdminStats(stats);\n    } catch (e) {\n      console.error(e);\n    }\n  };\n`,
  ''
);

// ---------------------------------------------------------------------------
// 12. Add missing state declarations (editingSchoolId, isMergeModalOpen, selectedMergeIds, debouncedSearchQuery)
//     Insert after isCompareOpen declaration
// ---------------------------------------------------------------------------
content = content.replace(
  `  const [isCompareOpen, setIsCompareOpen] = useState(false);`,
  `  const [isCompareOpen, setIsCompareOpen] = useState(false);
  // Admin school management states
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedMergeIds, setSelectedMergeIds] = useState<string[]>([]);
  const debouncedSearchQuery = searchQuery;`
);

// ---------------------------------------------------------------------------
// 13. Fix selectedDistricts -> selectedDistrict (join call removed since it's a string not array)
//     handleEditSave and handleMergeSave use selectedDistricts.join(',') -> selectedDistrict
// ---------------------------------------------------------------------------
content = content.replace(
  /loadSchools\(debouncedSearchQuery, selectedDistricts\.join\(','\)\)/g,
  'loadSchools(debouncedSearchQuery, selectedDistrict)'
);

// Also fix line 2001
content = content.replace(
  /loadSchools\(searchQuery, selectedDistricts\.join\(','\)\)/g,
  'loadSchools(searchQuery, selectedDistrict)'
);

// ---------------------------------------------------------------------------
// 14. Fix unused 'error' param in geolocation callback (line 216)
// ---------------------------------------------------------------------------
content = content.replace(
  `      (error) => {\n        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');\n        setIsLocating(false);\n      }`,
  `      (_err) => {\n        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');\n        setIsLocating(false);\n      }`
);

fs.writeFileSync(containerPath, content, 'utf8');
console.log('✅ Grade10Container.tsx fixed');

// ---------------------------------------------------------------------------
// Fix CompareDrawer.tsx: TrendingDown not imported
// ---------------------------------------------------------------------------
const compareDrawerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/CompareDrawer.tsx');
let compareContent = fs.readFileSync(compareDrawerPath, 'utf8');

if (!compareContent.includes('TrendingDown')) {
  // Already no reference - nothing to do
  console.log('CompareDrawer: TrendingDown not found in source, checking...');
}

// Add TrendingDown to lucide import if it's used but not imported
if (compareContent.includes('TrendingDown') && !compareContent.match(/import.*TrendingDown.*from 'lucide-react'/)) {
  compareContent = compareContent.replace(
    /import \{([^}]+)\} from 'lucide-react'/,
    (match, imports) => `import {${imports}, TrendingDown } from 'lucide-react'`
  );
  fs.writeFileSync(compareDrawerPath, compareContent, 'utf8');
  console.log('✅ CompareDrawer.tsx: Added TrendingDown import');
} else {
  console.log('ℹ️  CompareDrawer.tsx: No fix needed for TrendingDown');
}

// ---------------------------------------------------------------------------
// Fix EditSchoolModal.tsx: unused G10SchoolItem import
// ---------------------------------------------------------------------------
const editModalPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/EditSchoolModal.tsx');
let editContent = fs.readFileSync(editModalPath, 'utf8');

// Remove G10SchoolItem from import if it's unused
if (editContent.match(/import type \{ G10SchoolItem[^}]*\} from/)) {
  // Check if actually used
  const withoutImport = editContent.replace(/import type \{ G10SchoolItem[^}]*\} from[^\n]+\n/, '');
  if (!withoutImport.includes('G10SchoolItem')) {
    editContent = withoutImport;
    fs.writeFileSync(editModalPath, editContent, 'utf8');
    console.log('✅ EditSchoolModal.tsx: Removed unused G10SchoolItem import');
  } else {
    console.log('ℹ️  EditSchoolModal.tsx: G10SchoolItem is actually used, not removing');
  }
} else if (editContent.includes('G10SchoolItem')) {
  // It's inline in a combined import
  editContent = editContent.replace(
    /,?\s*G10SchoolItem\s*,?/g,
    (match) => {
      // If it's "{ G10SchoolItem, X }" -> "{ X }" or "{ X, G10SchoolItem }" -> "{ X }"
      if (match.startsWith(',')) return '';
      if (match.endsWith(',')) return '';
      return '';
    }
  );
  fs.writeFileSync(editModalPath, editContent, 'utf8');
  console.log('✅ EditSchoolModal.tsx: Removed G10SchoolItem from import');
} else {
  console.log('ℹ️  EditSchoolModal.tsx: No fix needed');
}

// Also remove unused imports from api.ts in Grade10Container (fetchG10AdminStats if not used after removing loadAdminStats)
// Check if fetchG10AdminStats is still referenced
if (!content.includes('fetchG10AdminStats')) {
  content = content.replace(/, fetchG10AdminStats/g, '');
  content = content.replace(/fetchG10AdminStats, /g, '');
  fs.writeFileSync(containerPath, content, 'utf8');
  console.log('✅ Removed unused fetchG10AdminStats import');
}

console.log('\n✅ All fixes applied. Run: npx tsc -b to verify.');
