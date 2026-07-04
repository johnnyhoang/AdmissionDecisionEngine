const fs = require('fs');
const path = require('path');

// 1. Patch api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
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
drawerContent = drawerContent.replace(
  "import { G10SchoolItem } from '../../../services/api';",
  "import type { G10SchoolItem } from '../../../services/api';"
);
drawerContent = drawerContent.replace(
  "import React from 'react';\nimport { X, BadgeCheck, School, Trash2, Award, TrendingDown, HelpCircle } from 'lucide-react';",
  "import { X, BadgeCheck, School, Trash2, HelpCircle } from 'lucide-react';"
);
drawerContent = drawerContent.replace(
  "compareList.map((school, idx) => (",
  "compareList.map((school) => ("
);
fs.writeFileSync(drawerPath, drawerContent, 'utf8');
console.log('Patched CompareDrawer.tsx');

// 3. Patch MergeSchoolModal.tsx
const mergePath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/MergeSchoolModal.tsx');
let mergeContent = fs.readFileSync(mergePath, 'utf8');
mergeContent = mergeContent.replace(
  "import React, { useState, useEffect } from 'react';",
  "import { useState, useEffect } from 'react';"
);
mergeContent = mergeContent.replace(
  "import { G10SchoolItem } from '../../../services/api';",
  "import type { G10SchoolItem } from '../../../services/api';"
);
fs.writeFileSync(mergePath, mergeContent, 'utf8');
console.log('Patched MergeSchoolModal.tsx');

// 4. Patch EditSchoolModal.tsx
const editPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/components/EditSchoolModal.tsx');
let editContent = fs.readFileSync(editPath, 'utf8');
editContent = editContent.replace(
  "import { G10SchoolItem } from '../../../services/api';",
  "import type { G10SchoolItem } from '../../../services/api';"
);
fs.writeFileSync(editPath, editContent, 'utf8');
console.log('Patched EditSchoolModal.tsx');

// 5. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// Fix lucide-react imports: add Award, RefreshCw to line 25
containerContent = containerContent.replace(
  "import { Check, ChevronDown, Save } from 'lucide-react';",
  "import { Check, ChevronDown, Save, Award, RefreshCw } from 'lucide-react';"
);

// Remove duplicate maxCommuteDistance state declaration
const doubleDecl = "const [maxCommuteDistance, setMaxCommuteDistance] = useState('10');";
const parts = containerContent.split(doubleDecl);
if (parts.length === 3) {
  containerContent = parts[0] + doubleDecl + parts[1] + parts[2];
  console.log('Removed duplicate maxCommuteDistance declaration');
}

// Remove unused seedAllGrade10Schools from API imports
containerContent = containerContent.replace(", seedAllGrade10Schools", "");

// Remove unused getRecentSchoolYears from date imports
containerContent = containerContent.replace(", getRecentSchoolYears", "");

// Replace selectedDistrict select input
containerContent = containerContent.replace(
  `                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}`,
  `                <select
                  value={selectedDistricts[0] || ''}
                  onChange={(e) => setSelectedDistricts(e.target.value ? [e.target.value] : [])}`
);

// Replace loadSchools(searchQuery, selectedDistrict) calls
containerContent = containerContent.replace(/loadSchools\(searchQuery, selectedDistrict\)/g, "loadSchools(searchQuery, selectedDistricts.join(','))");

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

// Delete the analytics block precisely (without deleting the closing div)
const analyticsStartIndex = containerContent.indexOf("{/* Tab 4: Historical Analytics charts */}");
if (analyticsStartIndex !== -1) {
  // Let's find the closing "}" for this tab block
  const analyticsEndIndex = containerContent.indexOf("        {/* School Detail Modal */}", analyticsStartIndex);
  if (analyticsEndIndex !== -1) {
    const originalPart = containerContent.substring(analyticsStartIndex, analyticsEndIndex);
    // Find the last closing "        )}"
    const lastClosingParenthesis = originalPart.lastIndexOf("        )}");
    if (lastClosingParenthesis !== -1) {
      const blockToDelete = originalPart.substring(0, lastClosingParenthesis + 10); // include "        )}"
      containerContent = containerContent.replace(blockToDelete, "");
      console.log('Successfully deleted analytics block precisely');
    }
  }
}

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Grade10Container.tsx patched successfully');
