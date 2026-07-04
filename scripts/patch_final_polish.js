const fs = require('fs');
const path = require('path');

// 1. Patch api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Add properties to G10SchoolItem interface
if (!apiContent.includes('latestQuota?: number;')) {
  apiContent = apiContent.replace(
    "latestYear?: number;",
    "latestYear?: number;\n  latestQuota?: number;\n  latestCompetitionRatio?: number;"
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Patched api.ts with latestQuota and latestCompetitionRatio');
}

// 2. Patch CompareDrawer.tsx
const drawerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/CompareDrawer.tsx');
let drawerContent = fs.readFileSync(drawerPath, 'utf8');

// Use type-only import for G10SchoolItem
drawerContent = drawerContent.replace(
  "import { G10SchoolItem } from '../../../services/api';",
  "import type { G10SchoolItem } from '../../../services/api';"
);

// Remove unused React import and unused icons
drawerContent = drawerContent.replace(
  "import React from 'react';\nimport { X, BadgeCheck, School, Trash2, Award, TrendingDown, HelpCircle } from 'lucide-react';",
  "import { X, BadgeCheck, School, Trash2, HelpCircle } from 'lucide-react';"
);

// Remove unused idx in map
drawerContent = drawerContent.replace(
  "compareList.map((school, idx) => (",
  "compareList.map((school) => ("
);

fs.writeFileSync(drawerPath, drawerContent, 'utf8');
console.log('Patched CompareDrawer.tsx to resolve unused imports/vars');

// 3. Patch MergeSchoolModal.tsx
const mergePath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/MergeSchoolModal.tsx');
let mergeContent = fs.readFileSync(mergePath, 'utf8');

// Use type-only import for G10SchoolItem and remove React import
mergeContent = mergeContent.replace(
  "import React, { useState, useEffect } from 'react';",
  "import { useState, useEffect } from 'react';"
);
mergeContent = mergeContent.replace(
  "import { G10SchoolItem } from '../../../services/api';",
  "import type { G10SchoolItem } from '../../../services/api';"
);

fs.writeFileSync(mergePath, mergeContent, 'utf8');
console.log('Patched MergeSchoolModal.tsx to use type import and clean up React');

// 4. Patch EditSchoolModal.tsx
const editPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/EditSchoolModal.tsx');
let editContent = fs.readFileSync(editPath, 'utf8');

editContent = editContent.replace(
  "import { G10SchoolItem } from '../../../services/api';",
  "import type { G10SchoolItem } from '../../../services/api';"
);

fs.writeFileSync(editPath, editContent, 'utf8');
console.log('Patched EditSchoolModal.tsx to use type import');

// 5. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// Fix lucide-react imports: add Award, RefreshCw to line 25
containerContent = containerContent.replace(
  "import { Check, ChevronDown, Save } from 'lucide-react';",
  "import { Check, ChevronDown, Save, Award, RefreshCw } from 'lucide-react';"
);

// Remove duplicate maxCommuteDistance state declaration
// Line 118: const [maxCommuteDistance, setMaxCommuteDistance] = useState('10');
// We will look for: const [maxCommuteDistance, setMaxCommuteDistance] = useState('10'); and delete the second occurrence.
const firstPart = containerContent.split("const [maxCommuteDistance, setMaxCommuteDistance] = useState('10');");
if (firstPart.length === 3) {
  // It is duplicated, let's reconstruct it with only one declaration
  containerContent = firstPart[0] + "const [maxCommuteDistance, setMaxCommuteDistance] = useState('10');" + firstPart[1] + firstPart[2];
  console.log('Removed duplicate maxCommuteDistance declaration');
}

// Remove unused seedAllGrade10Schools from API imports
containerContent = containerContent.replace(", seedAllGrade10Schools", "");

// Remove unused getRecentSchoolYears from date imports
containerContent = containerContent.replace(", getRecentSchoolYears", "");

// Replace selectedDistrict selector variables
containerContent = containerContent.replace(
  `                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}`,
  `                <select
                  value={selectedDistricts[0] || ''}
                  onChange={(e) => setSelectedDistricts(e.target.value ? [e.target.value] : [])}`
);

// Replace loadSchools(searchQuery, selectedDistrict) calls
// We replace: loadSchools(searchQuery, selectedDistrict);
containerContent = containerContent.replace(/loadSchools\(searchQuery, selectedDistrict\)/g, "loadSchools(searchQuery, selectedDistricts.join(','))");

// Remove activeTab === 'analytics' block completely
// It is between: {/* Tab 4: Historical Analytics charts */} and {/* School Detail Modal */}
const analyticsBlockRegex = /\{\/\* Tab 4: Historical Analytics charts \*\/\}[\s\S]*?\{\/\* School Detail Modal \*\/\}/;
containerContent = containerContent.replace(analyticsBlockRegex, "{/* School Detail Modal */}");
console.log('Removed analytics tab redundant rendering');

// Wrap title attribute of BadgeCheck to resolve type checking errors
containerContent = containerContent.replace(
  `<BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" title="Đã xác thực" />`,
  `<span title="Đã xác thực"><BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" /></span>`
);
containerContent = containerContent.replace(
  `<BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" title="Trường đã xác thực" />`,
  `<span title="Trường đã xác thực"><BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" /></span>`
);

// Clean up unused toggleMergeSelection
containerContent = containerContent.replace(
  /const toggleMergeSelection = [\s\S]*?\n  \};/,
  ""
);

// Clean up unused toggleDistrict
containerContent = containerContent.replace(
  /const toggleDistrict = [\s\S]*?\n  \};/,
  ""
);

// Clean up unused error state
containerContent = containerContent.replace(
  /const \[error, setError\] = useState<string \| null>\(null\);/,
  ""
);

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Grade10Container.tsx patched successfully');
