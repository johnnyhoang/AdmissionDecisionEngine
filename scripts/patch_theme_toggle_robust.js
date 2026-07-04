const fs = require('fs');
const path = require('path');

const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(containerPath, 'utf8');

// 1. Replace the root div className
// We search for return ( followed by any whitespace and <div className="flex-1 flex flex-col">
const rootDivPattern = /return\s*\(\s*<div\s+className="flex-1\s+flex\s+flex-col">/;
if (rootDivPattern.test(content)) {
  content = content.replace(rootDivPattern, 'return (\n    <div className={`flex-1 flex flex-col ${theme === \'light\' ? \'light-theme\' : \'dark-theme\'}`}>');
  console.log('Successfully patched root div className to be dynamic');
} else {
  // Try another pattern
  content = content.replace(
    'return (\n    <div className="flex-1 flex flex-col">',
    'return (\n    <div className={`flex-1 flex flex-col ${theme === \'light\' ? \'light-theme\' : \'dark-theme\'}`}>\n      {/* Theme selector float for desktop/mobile top right */}'
  );
  console.log('Fallback root div replace applied');
}

// 2. Find the navigation tabs block and place the theme switcher before </nav>
const navIndex = content.indexOf('{/* Navigation tabs */}');
if (navIndex !== -1) {
  const closeNavIndex = content.indexOf('</nav>', navIndex);
  if (closeNavIndex !== -1) {
    const toggleButton = `
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="absolute top-2 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer shadow bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20"
          >
            {theme === 'light' ? '🌸 Giao diện: Đáng yêu' : '✨ Giao diện: Tối giản'}
          </button>
    `;
    // Let's modify the nav element to have relative position so absolute button works
    content = content.replace(
      '<nav className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto scrollbar-none">',
      '<nav className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto scrollbar-none relative">'
    );
    
    // Insert toggle button before </nav>
    const navStart = content.substring(0, closeNavIndex);
    const navEnd = content.substring(closeNavIndex);
    content = navStart + toggleButton + navEnd;
    console.log('Successfully added theme toggle button to navigation bar');
  }
}

// 3. Fix duplicate maxCommuteDistance in api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

// We search for duplicate:
// maxCommuteDistance?: number;
// maxCommuteDistance?: number;
const doubleDistance = 'maxCommuteDistance?: number;\n  maxCommuteDistance?: number;';
if (apiContent.includes(doubleDistance)) {
  apiContent = apiContent.replace(doubleDistance, 'maxCommuteDistance?: number;');
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Fixed duplicate maxCommuteDistance in api.ts');
}

fs.writeFileSync(containerPath, content, 'utf8');
console.log('Theme toggle patch run completed.');
