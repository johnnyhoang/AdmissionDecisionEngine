const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports to include fetchG10AdminStats and seedAllGrade10Schools
content = content.replace(
  "fetchG10Analytics, evaluateG10Profile",
  "fetchG10Analytics, evaluateG10Profile, fetchG10AdminStats, seedAllGrade10Schools"
);

// 2. Update activeTab type and add adminStats / selectedTopType state
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'search' | 'analytics'>('dashboard');",
  `const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'search' | 'admin'>('dashboard');
  const [adminStats, setAdminStats] = useState<any>(null);
  const [selectedTopType, setSelectedTopType] = useState<
    'highestCutoff' | 'lowestCutoff' | 'highestRatio' | 'lowestRatio' | 'highestQuota' | 'highestDiff' | 'highestRegistered' | 'highestSpecialized'
  >('highestCutoff');`
);

// 3. Add function to load admin stats
const loadAdminStatsFn = `
  const loadAdminStats = async () => {
    try {
      const stats = await fetchG10AdminStats();
      setAdminStats(stats);
    } catch (e) {
      console.error(e);
    }
  };
`;

content = content.replace(
  "const loadDistricts = async () => {",
  loadAdminStatsFn + "\n  const loadDistricts = async () => {"
);

// Trigger loading admin stats when activeTab changes to 'admin'
content = content.replace(
  "useEffect(() => {\n    if (activeTab === 'search') {",
  `useEffect(() => {
    if (activeTab === 'admin') {
      loadAdminStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'search') {`
);

// 4. Update Navigation Tabs: Remove analytics button, add admin button (only for ADMIN role)
const oldNavBlock = `          <button
            onClick={() => setActiveTab('analytics')}
            className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }\`}
          >
            <TrendingUp className="h-4 w-4" />
            Phân tích thống kê 10 năm
          </button>`;

const newNavBlock = `          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }\`}
            >
              <Sliders className="h-4 w-4" />
              Quản trị (Admin)
            </button>
          )}`;

content = content.replace(oldNavBlock, newNavBlock);

// 5. Update Tab 1 (Dashboard) content: Add Charts (analytics) at the bottom, expand leaderboards
// Let's first inspect how Dashboard handles Top list and layout
// We will replace Tab 1 rendering block: lines 270 to 346.
// Let's prepare a clean Tab 1 rendering with multi-leaderboards select and charts at the bottom.
const dashboardContent = `        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Top stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex items-center gap-4">
                <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 p-3 rounded-xl">
                  <School className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 font-semibold uppercase">Trường THPT Công Lập</h3>
                  <p className="text-2xl font-black text-white m-0">{schools.length || 7}</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex items-center gap-4">
                <div className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 font-semibold uppercase">Quận / Huyện Hỗ Trợ</h3>
                  <p className="text-2xl font-black text-white m-0">{districts.length || 6}</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex items-center gap-4">
                <div className="bg-amber-600/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 font-semibold uppercase">Dữ liệu tuyển sinh</h3>
                  <p className="text-2xl font-black text-white m-0">4 năm gần nhất</p>
                </div>
              </div>
            </div>

            {/* Top schools list & basic introduction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Hồ Chí Minh Public High School Admission (Grade 10)
                </h2>
                <div className="text-xs text-slate-300 leading-relaxed flex flex-col gap-3">
                  <p>
                    Chào mừng bạn đến với mô-đun tư vấn và gợi ý nguyện vọng tuyển sinh Lớp 10 các trường THPT Công lập tại TP. Hồ Chí Minh.
                  </p>
                  <p>
                    Hệ thống lưu trữ lịch sử điểm chuẩn, chỉ tiêu tuyển sinh, số lượng thí sinh đăng ký và tỉ lệ chọi 4 năm gần nhất giúp học sinh và phụ huynh đưa ra quyết định đăng ký nguyện vọng tối ưu nhất.
                  </p>
                  <p className="bg-slate-950/45 p-3 border border-slate-800 rounded-xl">
                    💡 <strong>Mẹo nhỏ:</strong> Hãy nhập điểm thử của 3 môn (Toán, Văn, Anh) và điểm ưu tiên vào tab <strong>"Đánh giá NV lớp 10"</strong> để nhận đề xuất trường công lập phù hợp nhất dựa trên tỉ lệ đỗ lịch sử!
                  </p>
                </div>
              </div>

              {/* Smart Leaderboard Box */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Bảng Xếp Hạng Tuyển Sinh ({formatSchoolYear(getCurrentSchoolYear())})</h3>
                  <select 
                    value={selectedTopType} 
                    onChange={(e) => setSelectedTopType(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-2 py-1.5 text-slate-300 outline-none"
                  >
                    <option value="highestCutoff">🏆 Top điểm chuẩn cao nhất</option>
                    <option value="lowestCutoff">📉 Top điểm chuẩn thấp nhất (Dễ thở)</option>
                    <option value="highestRatio">🔥 Top tỉ lệ chọi cao nhất</option>
                    <option value="lowestRatio">🍀 Top tỉ lệ chọi thấp nhất</option>
                    <option value="highestQuota">🏢 Top chỉ tiêu lớn nhất</option>
                    <option value="highestDiff">📈 Top tăng điểm mạnh nhất (so với năm trước)</option>
                    <option value="highestRegistered">📑 Top số lượng hồ sơ nộp nhiều nhất</option>
                    <option value="highestSpecialized">⚡ Top trường chuyên xuất sắc nhất</option>
                  </select>
                </div>

                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {(() => {
                    let list: any[] = [];
                    let valueKey = '';
                    let label = '';

                    if (selectedTopType === 'highestCutoff') {
                      list = analytics?.topSchools || [];
                      valueKey = 'cutoffNV1';
                      label = 'đ';
                    } else if (selectedTopType === 'lowestCutoff') {
                      list = analytics?.bottomSchools || [];
                      valueKey = 'cutoffNV1';
                      label = 'đ';
                    } else if (selectedTopType === 'highestRatio') {
                      list = analytics?.topRatio || [];
                      valueKey = 'ratio';
                      label = ' chọi 1';
                    } else if (selectedTopType === 'lowestRatio') {
                      list = analytics?.bottomRatio || [];
                      valueKey = 'ratio';
                      label = ' chọi 1';
                    } else if (selectedTopType === 'highestQuota') {
                      list = analytics?.topQuota || [];
                      valueKey = 'quota';
                      label = ' HS';
                    } else if (selectedTopType === 'highestDiff') {
                      list = analytics?.topIncrease || [];
                      valueKey = 'diff';
                      label = 'đ';
                    } else if (selectedTopType === 'highestRegistered') {
                      list = analytics?.topRegistered || [];
                      valueKey = 'registeredCount';
                      label = ' hồ sơ';
                    } else if (selectedTopType === 'highestSpecialized') {
                      list = analytics?.topSpecialized || [];
                      valueKey = 'cutoffNV1';
                      label = 'đ';
                    }

                    if (list.length === 0) {
                      return <div className="text-slate-400 text-xs py-4 text-center">Đang tải thống kê hoặc không có dữ liệu...</div>;
                    }

                    return list.slice(0, 7).map((t: any, idx: number) => {
                      const val = t[valueKey];
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-800 pb-2 hover:bg-slate-850/10 px-1 rounded transition">
                          <div className="max-w-[70%]">
                            <span className="font-semibold text-slate-200 block truncate">{t.schoolName}</span>
                            <span className="text-[10px] text-slate-500">{t.districtName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-indigo-400 text-xs">
                              {selectedTopType === 'highestDiff' && val > 0 ? '+' : ''}{val}{label}
                            </span>
                            {selectedTopType === 'highestDiff' && (
                              <span className="text-[9px] text-slate-500 block">({t.cutoffOld}đ → {t.cutoffNew}đ)</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Embedded Analytics Charts */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Biểu Đồ & Phân Tích Thống Kê Tuyển Sinh Lớp 10
                </h3>
                <p className="text-xs text-slate-400 mt-1">Tổng quan chỉ tiêu, số đăng ký và biến động điểm chuẩn qua các năm học.</p>
              </div>

              {analytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 1. District statistics */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Điểm Chuẩn Trung Bình Theo Quận/Huyện</h3>
                    <div className="h-80 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.districtAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="districtName" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                          <YAxis domain={[12, 25]} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                          <Bar dataKey="avgCutoff" fill="#6366f1" radius={[4, 4, 0, 0]} name="Điểm chuẩn TB" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 2. Quota registration trend */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Biến Động Tỉ Lệ Chọi và Chỉ Tiêu Tuyển Sinh</h3>
                    <div className="h-80 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.trends} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="year" stroke="#94a3b8" tickFormatter={formatSchoolYear} />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                          <Legend />
                          <Line type="monotone" dataKey="totalQuota" stroke="#10b981" name="Chỉ tiêu" strokeWidth={2} />
                          <Line type="monotone" dataKey="totalRegistered" stroke="#f59e0b" name="Số đăng ký" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  Không có dữ liệu phân tích. Vui lòng import dữ liệu preset lớp 10 để hiển thị biểu đồ.
                </div>
              )}
            </div>

          </div>
        )}`;

// We need to find the old dashboard block
content = content.replace(/\{activeTab === 'dashboard' && \([\s\S]*?\}\s*\}\s*\n\s*\}\s*\n\s*\)\}/, dashboardContent);

// Let's replace the old Tab 4 (analytics) block with the new Tab 5 (admin) block
// Let's find: {activeTab === 'analytics' && ( ... )} block in file
const adminTabContent = `        {/* Tab 5: Admin Panel */}
        {activeTab === 'admin' && user?.role === 'ADMIN' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow">
              <h2 className="text-base font-bold text-white flex items-center gap-2 m-0">
                <Sliders className="h-5 w-5 text-indigo-400" />
                Hệ thống Quản trị & Điều hành Tuyển sinh Lớp 10
              </h2>
              <p className="text-xs text-slate-400 mt-1 m-0">Công cụ bảo trì dữ liệu, thống kê thực thể và tích hợp AI.</p>
            </div>

            {/* Admin Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">TỔNG SỐ TRƯỜNG</span>
                <span className="text-2xl font-black text-indigo-400">{adminStats?.schools || '...'}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">QUẬN / HUYỆN</span>
                <span className="text-2xl font-black text-emerald-400">{adminStats?.districts || '...'}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">BẢN GHI ĐIỂM CHUẨN</span>
                <span className="text-2xl font-black text-amber-400">{adminStats?.cutoffs || '...'}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-400">BẢN GHI CHỈ TIÊU</span>
                <span className="text-2xl font-black text-rose-400">{adminStats?.quotas || '...'}</span>
              </div>
            </div>

            {/* Admin Tools Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Tool 1: AI Integration */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Tích hợp Trợ lý AI
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tính năng cho phép bạn tìm kiếm và bổ sung dữ liệu điểm chuẩn/chỉ tiêu tuyển sinh của một trường mới từ internet thông qua Mô hình ngôn ngữ lớn (LLM). Dữ liệu sau khi thu thập có thể được kiểm duyệt lại thủ công trước khi lưu.
                </p>
                <button
                  onClick={() => {
                    setAiPrefillSchool(undefined);
                    setIsAiModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer self-start"
                >
                  <Sparkles className="h-4 w-4" />
                  Mở Trợ lý Tìm kiếm AI
                </button>
              </div>

              {/* Tool 2: Master Seeding & Initialization */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-400" /> Khởi tạo Dữ liệu Gốc (Seed)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nạp nhanh danh sách các trường THPT công lập chuẩn tại TP.HCM kèm theo mã trường từ cơ sở dữ liệu gốc (Preset Master JSON). Tính năng này sẽ kiểm tra và bổ sung các bản ghi còn thiếu mà không xóa đi dữ liệu hiện có.
                </p>
                <button
                  onClick={async () => {
                    if (confirm('Khởi chạy tiến trình khởi tạo dữ liệu mẫu gốc?')) {
                      try {
                        const result = await seedAllGrade10Schools();
                        alert(\`Thành công: Đã tạo mới \${result.created} trường, bỏ qua \${result.skipped} trường đã tồn tại.\`);
                        loadAdminStats();
                      } catch (err: any) {
                        alert('Khởi tạo thất bại: ' + err.message);
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-650 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer self-start"
                >
                  <Save className="h-4 w-4" />
                  Khởi tạo dữ liệu Preset Master
                </button>
              </div>

            </div>
          </div>
        )}`;

// Replace Tab 4 (analytics) block with the new Tab 5 admin panel
content = content.replace(/\{activeTab === 'analytics' && \([\s\S]*?\}\s*\}\s*\n\s*\}\s*\n\s*\)\}/, adminTabContent);

// Wait, the new adminTabContent references `Save` from lucide-react but it's not imported in Grade10Container.tsx! Let's check imports.
// It has CalcIcon, MapPin, BadgeCheck, School, Sparkles, Sliders. Let's make sure it imports `Save` from lucide-react.
// Yes, line 24 has `Check, ChevronDown` from lucide-react, but we can also import `Save` from lucide-react at the top. Let's replace the import list.
content = content.replace(
  "Check, ChevronDown",
  "Check, ChevronDown, Save"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Grade10Container.tsx refactored with merged analytics and admin tab');
