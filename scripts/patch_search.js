const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  "import { useAuth } from '../../context/AuthContext';",
  "import { useAuth } from '../../context/AuthContext';\nimport { useDebounce } from '../../hooks/useDebounce';\nimport { Check, ChevronDown } from 'lucide-react';"
);

// 2. States
content = content.replace(
  "const [searchQuery, setSearchQuery] = useState('');\n  const [selectedDistrict, setSelectedDistrict] = useState('');",
  "const [searchQuery, setSearchQuery] = useState('');\n  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);\n  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);\n  const [isSuggestOpen, setIsSuggestOpen] = useState(false);\n  const debouncedSearchQuery = useDebounce(searchQuery, 300);"
);

// 3. useEffect
content = content.replace(
  "  useEffect(() => {\n    loadDistricts();\n    loadSchools();\n    loadAnalytics();\n  }, []);",
  "  useEffect(() => {\n    loadDistricts();\n    loadAnalytics();\n  }, []);\n\n  useEffect(() => {\n    if (activeTab === 'search') {\n      loadSchools(debouncedSearchQuery, selectedDistricts.join(','));\n    }\n  }, [debouncedSearchQuery, selectedDistricts, activeTab]);"
);

// 4. Handlers
content = content.replace(
  "  const handleSearch = (val: string) => {\n    setSearchQuery(val);\n    loadSchools(val, selectedDistrict);\n  };\n\n  const handleDistrictChange = (val: string) => {\n    setSelectedDistrict(val);\n    loadSchools(searchQuery, val);\n  };",
  "  const handleSearch = (val: string) => {\n    setSearchQuery(val);\n    if (val.trim().length > 0) {\n      setIsSuggestOpen(true);\n    } else {\n      setIsSuggestOpen(false);\n    }\n  };\n\n  const toggleDistrict = (distId: string) => {\n    setSelectedDistricts(prev => \n      prev.includes(distId) ? prev.filter(id => id !== distId) : [...prev, distId]\n    );\n  };"
);

// 5. Search UI
content = content.replace(
  '<div className="relative w-full md:max-w-md">\n                <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />\n                <input \n                  type="text"\n                  placeholder="Tìm trường theo tên hoặc mã trường (e.g. Bùi Thị Xuân)..."\n                  value={searchQuery}\n                  onChange={(e) => handleSearch(e.target.value)}\n                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition"\n                />\n              </div>',
  `<div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm trường theo tên hoặc mã trường (e.g. Bùi Thị Xuân)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if (searchQuery.trim().length > 0) setIsSuggestOpen(true); }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition"
                />
                
                {/* Auto-suggest Dropdown */}
                {isSuggestOpen && schools.length > 0 && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    {schools.map(school => (
                      <div 
                        key={school.id} 
                        className="flex flex-col px-4 py-2 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0"
                        onMouseDown={(e) => {
                          // Prevent input blur before click registers
                          e.preventDefault(); 
                        }}
                        onClick={() => {
                          setSearchQuery(school.name);
                          setIsSuggestOpen(false);
                          openSchoolDetail(school.id);
                        }}
                      >
                        <div className="text-sm font-medium text-slate-200">{school.name}</div>
                        <div className="text-xs text-slate-400">{school.code}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>`
);

// 6. District UI
content = content.replace(
  '<select\n                  value={selectedDistrict}\n                  onChange={(e) => handleDistrictChange(e.target.value)}\n                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none"\n                >\n                  <option value="">Tất cả Quận/Huyện</option>\n                  {districts.map(d => (\n                    <option key={d.id} value={d.id}>{d.name}</option>\n                  ))}\n                </select>',
  `{/* Multi-select District Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none hover:border-indigo-500 transition"
                  >
                    <span>{selectedDistricts.length > 0 ? \`Đã chọn (\${selectedDistricts.length})\` : 'Quận/Huyện'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isDistrictDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto p-2">
                      <div 
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer"
                        onClick={() => setSelectedDistricts([])}
                      >
                        <div className={\`w-4 h-4 rounded border flex items-center justify-center \${selectedDistricts.length === 0 ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}\`}>
                          {selectedDistricts.length === 0 && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-300">Tất cả</span>
                      </div>
                      <div className="h-px bg-slate-800 my-1"></div>
                      {districts.map(d => {
                        const isSelected = selectedDistricts.includes(d.id);
                        return (
                          <div 
                            key={d.id}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer"
                            onClick={() => toggleDistrict(d.id)}
                          >
                            <div className={\`w-4 h-4 rounded border flex items-center justify-center \${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}\`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-slate-300">{d.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Grade10Container.tsx');
