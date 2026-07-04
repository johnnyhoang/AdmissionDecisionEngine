const fs = require('fs');
const path = require('path');

const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(containerPath, 'utf8');

// 1. Add theme state
if (!content.includes("const [theme, setTheme]")) {
  content = content.replace(
    "export default function Grade10Container() {",
    "export default function Grade10Container() {\n  const [theme, setTheme] = useState<'light' | 'dark'>('light');"
  );
  console.log('Added theme state to Grade10Container.tsx');
}

// 2. Add dynamic light-theme class to root wrapper
content = content.replace(
  'return (\n    <div className="flex-1 flex flex-col">',
  'return (\n    <div className={`flex-1 flex flex-col ${theme === \'light\' ? \'light-theme\' : \'dark-theme\'}`}>\n      {/* Theme selector float for desktop/mobile top right */}'
);

// 3. Add Theme Toggle next to nav items or on right side
const oldNav = `<nav className="bg-slate-900 border-b border-slate-800 px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex flex-row flex-nowrap gap-2 py-2 whitespace-nowrap">`;

const newNav = `<nav className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex flex-row flex-nowrap justify-between items-center py-2 whitespace-nowrap gap-4 w-full">
          <div className="flex flex-row gap-2 overflow-x-auto scrollbar-none py-1">`;

content = content.replace(oldNav, newNav);

// Since we opened a div wrapper, we must close it before closing nav
content = content.replace(
  `          </button>
        </div>
      </nav>`,
  `          </button>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition duration-200 cursor-pointer shadow bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20"
          >
            {theme === 'light' ? '🌸 Giao diện: Đáng yêu' : '✨ Giao diện: Tối giản'}
          </button>
        </div>
      </nav>`
);

// 4. Add cute emojis to tab titles
content = content.replace("Tổng quan tuyển sinh", "🏫 Tổng quan tuyển sinh");
content = content.replace("Đánh giá NV lớp 10", "📝 Đánh giá NV lớp 10");
content = content.replace("Đề xuất Combo 3 NV", "🌈 Đề xuất Combo 3 NV");
content = content.replace("Tìm trường gần bạn", "📍 Tìm trường gần bạn");
content = content.replace("Tra cứu trường THPT", "🔍 Tra cứu trường THPT");
content = content.replace("Lớp Chuyên & Tích hợp (Đang phát triển)", "🎒 Lớp Chuyên (Đang phát triển)");
content = content.replace("Mô phỏng đợt chỉnh NV (Đang phát triển)", "⏳ Mô phỏng chỉnh NV (Đang phát triển)");
content = content.replace("Quản trị", "⚙️ Quản trị");

// 5. Add cute icons/details in cards headers
content = content.replace("Hồ Chí Minh Public High School Admission (Grade 10)", "🏫 Tuyển Sinh Lớp 10 Công Lập TP.HCM 🎒");

fs.writeFileSync(containerPath, content, 'utf8');
console.log('Successfully added theme switcher, light-theme variables, and cute icons');
