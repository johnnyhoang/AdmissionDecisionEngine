import { useState, useEffect } from 'react';
import { 
  Search as SearchIcon, TrendingUp, Calculator as CalcIcon, MapPin, 
  School, HelpCircle, Sparkles, ArrowUpDown, 
  BarChart2, BookOpen, Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  fetchG10Schools, fetchG10SchoolDetail, fetchG10Districts, 
  fetchG10Analytics, evaluateG10Profile 
} from '../../services/api';
import type { G10SchoolItem, G10RecommendationItem } from '../../services/api';
import AiSearchModal from '../../components/AiSearchModal';

export default function Grade10Container() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'search' | 'analytics' | 'compare'>('dashboard');
  
  // States
  const [schools, setSchools] = useState<G10SchoolItem[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<any>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrefillSchool, setAiPrefillSchool] = useState<string | undefined>(undefined);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'cutoff' | 'quota'>('info');

  // Calculator form
  const [mathScore, setMathScore] = useState('8.5');
  const [literatureScore, setLiteratureScore] = useState('8.0');
  const [englishScore, setEnglishScore] = useState('8.5');
  const [priorityScore, setPriorityScore] = useState('0');
  const [bonusScore, setBonusScore] = useState('0');
  const [preferredDistrict, setPreferredDistrict] = useState('');
  const [targetNV, setTargetNV] = useState('NV1');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Compare List
  const [compareList, setCompareList] = useState<G10SchoolItem[]>([]);

  useEffect(() => {
    loadDistricts();
    loadSchools();
    loadAnalytics();
  }, []);

  const loadDistricts = async () => {
    try {
      const data = await fetchG10Districts();
      setDistricts(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const loadSchools = async (search = '', distId = '') => {
    setLoading(true);
    try {
      const data = await fetchG10Schools(search, distId);
      setSchools(data.items);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await fetchG10Analytics();
      setAnalytics(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    loadSchools(val, selectedDistrict);
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    loadSchools(searchQuery, val);
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await evaluateG10Profile({
        math: parseFloat(mathScore) || 0,
        literature: parseFloat(literatureScore) || 0,
        english: parseFloat(englishScore) || 0,
        priority: parseFloat(priorityScore) || 0,
        bonus: parseFloat(bonusScore) || 0,
        preferredDistrict: preferredDistrict || undefined,
        targetNV,
      });
      setEvaluationResult(res);
    } catch (e: any) {
      alert('Đánh giá cơ hội thất bại: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const openSchoolDetail = async (id: string) => {
    setSelectedSchoolId(id);
    try {
      const data = await fetchG10SchoolDetail(id);
      setSchoolDetail(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const toggleCompare = (school: G10SchoolItem) => {
    if (compareList.some(item => item.id === school.id)) {
      setCompareList(compareList.filter(item => item.id !== school.id));
    } else {
      if (compareList.length >= 3) {
        alert('Chỉ có thể so sánh tối đa 3 trường THPT cùng lúc.');
        return;
      }
      setCompareList([...compareList, school]);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Navigation tabs */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 py-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Tổng quan tuyển sinh
          </button>
          
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'calculator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <CalcIcon className="h-4 w-4" />
            Đánh giá NV lớp 10
          </button>
          
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <School className="h-4 w-4" />
            Tra cứu trường THPT
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Phân tích thống kê 10 năm
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition relative ${
              activeTab === 'compare'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ArrowUpDown className="h-4 w-4" />
            So sánh trường ({compareList.length})
            {compareList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {compareList.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
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
                  <h3 className="text-xs text-slate-400 font-semibold uppercase">Lịch sử điểm chuẩn</h3>
                  <p className="text-2xl font-black text-white m-0">10 năm liên tục</p>
                </div>
              </div>
            </div>

            {/* Top schools list & basic introduction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Hồ Chí Minh Public High School Admission (Grade 10)
                </h2>
                <div className="text-xs text-slate-300 leading-relaxed flex flex-col gap-3">
                  <p>
                    Chào mừng bạn đến với mô-đun tư vấn và gợi ý nguyện vọng tuyển sinh Lớp 10 các trường THPT Công lập tại TP. Hồ Chí Minh.
                  </p>
                  <p>
                    Hệ thống lưu trữ lịch sử điểm chuẩn, chỉ tiêu tuyển sinh, số lượng thí sinh đăng ký và tỉ lệ chọi từ năm 2016 đến 2025 giúp học sinh và phụ huynh đưa ra quyết định đăng ký nguyện vọng tối ưu nhất.
                  </p>
                  <p className="bg-slate-950/45 p-3 border border-slate-800 rounded-xl">
                    💡 <strong>Mẹo nhỏ:</strong> Hãy nhập điểm thử của 3 môn (Toán, Văn, Anh) và điểm ưu tiên vào tab <strong>"Đánh giá NV lớp 10"</strong> để nhận đề xuất trường công lập phù hợp nhất dựa trên tỉ lệ đỗ lịch sử!
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Top Trường Điểm Cao Nhất (2025)</h3>
                <div className="flex flex-col gap-3">
                  {analytics?.topSchools?.slice(0, 5).map((t: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-semibold text-slate-200 block">{t.schoolName}</span>
                        <span className="text-[10px] text-slate-500">{t.districtName}</span>
                      </div>
                      <span className="font-bold text-indigo-400 text-sm">{t.cutoffNV1}đ</span>
                    </div>
                  )) || (
                    <div className="text-slate-400 text-xs py-4 text-center">Đang tải thống kê...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Calculator & Recommendations */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input student scores panel */}
            <section className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-1">
                <Sliders className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white m-0">Điểm Thi Thử Lớp 9</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Môn Toán</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={mathScore}
                    onChange={(e) => setMathScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Môn Ngữ Văn</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={literatureScore}
                    onChange={(e) => setLiteratureScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Môn Tiếng Anh</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={englishScore}
                    onChange={(e) => setEnglishScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Điểm Ưu Tiên (0-2đ)</label>
                  <input 
                    type="number" step="0.5" max="2" min="0"
                    value={priorityScore}
                    onChange={(e) => setPriorityScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Điểm Khuyến Khích</label>
                  <input 
                    type="number" step="0.5" max="2" min="0"
                    value={bonusScore}
                    onChange={(e) => setBonusScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nguyện Vọng Xét</label>
                  <select 
                    value={targetNV}
                    onChange={(e) => setTargetNV(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="NV1">Nguyện vọng 1</option>
                    <option value="NV2">Nguyện vọng 2</option>
                    <option value="NV3">Nguyện vọng 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Quận Ưu Tiên</label>
                  <select 
                    value={preferredDistrict}
                    onChange={(e) => setPreferredDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="">Tất cả Quận/Huyện</option>
                    {districts.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2 text-xs"
              >
                {loading ? 'Đang phân tích...' : '📊 Phân Tích & Gợi Ý Trường Lớp 10'}
              </button>
            </section>

            {/* Recommendations Results Panel */}
            <section className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                <div>
                  <h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>
                  <p className="text-xs text-slate-400 m-0">Danh sách các trường được xếp loại theo xác suất trúng tuyển an toàn</p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">RẤT AN TOÀN</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">THỬ THÁCH</span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                  <span className="text-xs text-slate-400">Đang phân tích xác suất từ điểm chuẩn 10 năm của Sở GD&ĐT...</span>
                </div>
              ) : !evaluationResult ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                  <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Vui lòng điền điểm thi thử của bạn và bấm "Phân Tích & Gợi Ý".</p>
                </div>
              ) : evaluationResult.recommendations?.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                  <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Không tìm thấy trường nào phù hợp với bộ lọc và mức điểm hiện tại.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="bg-indigo-950/25 border border-indigo-500/10 p-3 rounded-xl text-xs text-slate-300">
                    💡 Điểm xét tuyển của bạn: <strong className="text-indigo-400 text-sm">{evaluationResult.candidateScore}đ</strong> (Toán: {evaluationResult.details.math} | Văn: {evaluationResult.details.literature} | Anh: {evaluationResult.details.english} | Điểm cộng: {Number(evaluationResult.details.priority) + Number(evaluationResult.details.bonus)})
                  </div>

                  {evaluationResult.recommendations.map((rec: G10RecommendationItem, index: number) => {
                    const probColor = 
                      rec.safetyCategory === 'VERY_SAFE' || rec.safetyCategory === 'SAFE' ? 'emerald' : 
                      rec.safetyCategory === 'COMPETITIVE' ? 'blue' : 
                      rec.safetyCategory === 'RISKY' ? 'amber' : 'rose';
                    
                    return (
                      <div 
                        key={index} 
                        className={`bg-slate-900/50 hover:bg-slate-900 border rounded-xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          probColor === 'emerald' ? 'border-emerald-500/20 hover:border-emerald-500/40' :
                          probColor === 'blue' ? 'border-blue-500/20 hover:border-blue-500/40' :
                          probColor === 'amber' ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-rose-500/20 hover:border-rose-500/40'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                              {rec.schoolCode}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {rec.districtName}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-bold text-white mb-1.5">{rec.schoolName}</h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
                            <div>Chỉ tiêu 2025: <span className="font-semibold text-slate-300">N/A</span></div>
                            <div>Điểm chuẩn NV1 2025: <span className="font-semibold text-slate-300">{rec.cutoffNV1}đ</span></div>
                            <div>TB 3 năm: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span></div>
                            <div>Mức chênh lệch: <span className={`font-bold ${rec.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rec.diff > 0 ? `+${rec.diff}` : rec.diff}đ</span></div>
                          </div>
                        </div>

                        {/* Right Gauge */}
                        <div className="md:w-44 shrink-0 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 gap-2">
                          <div>
                            <div className={`text-2xl font-black ${
                              probColor === 'emerald' ? 'text-emerald-400' :
                              probColor === 'blue' ? 'text-blue-400' :
                              probColor === 'amber' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {rec.probability}%
                            </div>
                            <span className={`text-[10px] font-bold uppercase mt-1 px-2.5 py-0.5 rounded-full whitespace-nowrap block ${
                              probColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              probColor === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              probColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {rec.safetyCategory === 'VERY_SAFE' ? 'Rất an toàn' :
                               rec.safetyCategory === 'SAFE' ? 'An toàn' :
                               rec.safetyCategory === 'COMPETITIVE' ? 'Tỉ lệ chọi cao' :
                               rec.safetyCategory === 'RISKY' ? 'Rủi ro' : 'Rất rủi ro'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => openSchoolDetail(rec.schoolId)}
                            className="w-full py-1 px-3 bg-slate-850 border border-slate-700 hover:border-indigo-500 text-[10px] font-semibold text-slate-300 hover:text-white rounded transition"
                          >
                            Chi tiết lịch sử
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab 3: Search Schools */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm trường theo tên hoặc mã trường (e.g. Bùi Thị Xuân)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tìm dữ liệu trường (AI)
                </button>

                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none"
                >
                  <option value="">Tất cả Quận/Huyện</option>
                  {districts.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  Tổng số: <span className="font-semibold text-slate-200">{schools.length}</span> trường
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => {
                const isCompared = compareList.some(item => item.id === school.id);
                return (
                  <div key={school.id} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all duration-200">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-md">
                          {school.code}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleCompare(school)}
                            className={`text-[10px] px-2 py-0.5 rounded transition border ${
                              isCompared 
                                ? 'bg-rose-600 border-rose-500 text-white' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isCompared ? 'Bỏ so sánh' : 'So sánh'}
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2 hover:text-indigo-400 cursor-pointer" onClick={() => openSchoolDetail(school.id)}>{school.name}</h3>
                      <p className="text-xs text-slate-400 flex items-start gap-1 leading-normal">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{school.address || 'Hồ Chí Minh'}</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-4 flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Điểm NV1 2025:</span>
                        <span className="font-bold text-indigo-400">{school.latestCutoffNV1 || 'N/A'}đ</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Điểm NV2 2025:</span>
                        <span className="font-semibold text-slate-200">{school.latestCutoffNV2 || 'N/A'}đ</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Quận/Huyện:</span>
                        <span className="font-semibold text-slate-200">{school.district?.name || 'N/A'}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAiPrefillSchool(school.name);
                          setIsAiModalOpen(true);
                        }}
                        className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 text-[10px] font-bold transition"
                      >
                        <Sparkles className="h-3 w-3" />
                        Tìm dữ liệu với AI
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Historical Analytics charts */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <h2 className="text-base font-bold text-white m-0">Biểu đồ & Phân Tích Thống Kê Tuyển Sinh Lớp 10</h2>
              <p className="text-xs text-slate-400 m-0">Tổng quan chỉ tiêu, số đăng ký và biến động điểm chuẩn qua các năm học.</p>
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
                        <XAxis dataKey="year" stroke="#94a3b8" />
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
        )}

        {/* Tab 5: Compare schools */}
        {activeTab === 'compare' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <h2 className="text-base font-bold text-white m-0">Bảng So Sánh Chỉ Số Điểm Chuẩn</h2>
              <p className="text-xs text-slate-400 m-0">So sánh trực quan biến động chỉ tiêu tuyển sinh và phổ điểm chuẩn NV1, NV2, NV3.</p>
            </div>

            {compareList.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                <School className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Vui lòng chọn các trường THPT từ danh sách <strong>"Tra cứu trường"</strong> để thêm vào bảng so sánh.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {compareList.map((school) => (
                  <div key={school.id} className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-6">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                          {school.code}
                        </span>
                        <button
                          onClick={() => toggleCompare(school)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Xóa
                        </button>
                      </div>
                      <h3 className="text-base font-extrabold text-white mb-4 border-b border-slate-800 pb-3">{school.name}</h3>

                      <div className="flex flex-col gap-4 text-xs">
                        <div>
                          <div className="text-slate-400 mb-0.5">Điểm chuẩn NV1 2025</div>
                          <div className="font-bold text-indigo-400 text-sm">{school.latestCutoffNV1 || 'N/A'}đ</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Điểm chuẩn NV2 2025</div>
                          <div className="font-semibold text-slate-200">{school.latestCutoffNV2 || 'N/A'}đ</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Điểm chuẩn NV3 2025</div>
                          <div className="font-semibold text-slate-200">{school.latestCutoffNV3 || 'N/A'}đ</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Quận / Huyện</div>
                          <div className="font-semibold text-slate-200">{school.district?.name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 mb-0.5">Website</div>
                          <a href={school.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate block">
                            {school.website || 'N/A'}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* School Detail Modal */}
      {selectedSchoolId && schoolDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative flex flex-col gap-4 max-h-[90vh]">
            <button
              onClick={() => setSelectedSchoolId(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-650/15 border border-indigo-500/30 text-indigo-400 rounded-md">
                  {schoolDetail.code}
                </span>
                <span className="text-xs text-slate-400">{schoolDetail.district?.name || 'Chưa rõ quận'}</span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <School className="h-5 w-5 text-indigo-400 shrink-0" />
                {schoolDetail.name}
              </h2>
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveDetailTab('info')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'info'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Tổng quan & Bản đồ
              </button>
              <button
                onClick={() => setActiveDetailTab('cutoff')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'cutoff'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Lịch sử Điểm chuẩn (3 NV)
              </button>
              <button
                onClick={() => setActiveDetailTab('quota')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'quota'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Chỉ tiêu & Tỷ lệ chọi
              </button>
            </div>

            {/* Tab Contents */}
            <div className="overflow-y-auto pr-1 flex-1 min-h-0 text-xs text-slate-350">
              {activeDetailTab === 'info' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">🏫 Địa chỉ</span>
                        <div className="font-semibold text-slate-200">{schoolDetail.address || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">🌐 Website</span>
                        <a href={schoolDetail.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate block font-medium">
                          {schoolDetail.website || 'N/A'}
                        </a>
                      </div>
                      <div className="space-y-1 mt-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">📝 Giới thiệu chung</span>
                        <p className="text-slate-400 leading-relaxed font-normal">
                          {schoolDetail.description || 'Chưa có thông tin giới thiệu chi tiết cho trường THPT này.'}
                        </p>
                      </div>
                    </div>

                    {/* Position Map Card */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                      <div className="bg-indigo-500/10 p-3 rounded-full text-indigo-400">
                        <MapPin className="h-7 w-7" />
                      </div>
                      <span className="font-bold text-slate-200 text-xs mt-1">Bản đồ vị trí cơ sở</span>
                      <p className="text-[10px] text-slate-500 max-w-xs">{schoolDetail.address || 'Hồ Chí Minh, Việt Nam'}</p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolDetail.name + ' ' + (schoolDetail.address || ''))}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-755 text-[10px] text-slate-350 font-bold rounded-lg border border-slate-700 transition"
                      >
                        Mở Google Maps
                      </a>
                    </div>
                  </div>

                  {/* Summary Indicators */}
                  {schoolDetail.cutoffs.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl mt-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Điểm NV1 gần nhất ({schoolDetail.cutoffs[0]?.year})</span>
                        <strong className="text-base text-indigo-400">{schoolDetail.cutoffs[0]?.cutoffNV1}đ</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Chỉ tiêu tuyển ({schoolDetail.quotas[0]?.year || 'N/A'})</span>
                        <strong className="text-base text-blue-400">{schoolDetail.quotas[0]?.quota || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Tỷ lệ chọi ({schoolDetail.quotas[0]?.year || 'N/A'})</span>
                        <strong className="text-base text-rose-400">1 chọi {schoolDetail.quotas[0]?.competitionRatio || 'N/A'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'cutoff' && (
                <div className="flex flex-col gap-5">
                  {/* Multi-line Cutoff Chart */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Đồ thị biến động điểm chuẩn 10 năm gần đây (2016-2025)
                    </h4>
                    <div className="h-48 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      {schoolDetail.cutoffs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 italic">Chưa có dữ liệu điểm chuẩn</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...schoolDetail.cutoffs].reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Line type="monotone" dataKey="cutoffNV1" stroke="#6366f1" name="Nguyện vọng 1" strokeWidth={2.5} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="cutoffNV2" stroke="#10b981" name="Nguyện vọng 2" strokeWidth={2} />
                            <Line type="monotone" dataKey="cutoffNV3" stroke="#f59e0b" name="Nguyện vọng 3" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Cutoff Table */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400">Bảng chi tiết điểm chuẩn qua các năm</h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px]">
                            <th className="p-2.5">Năm học</th>
                            <th className="p-2.5">Nguyện vọng 1</th>
                            <th className="p-2.5">Nguyện vọng 2</th>
                            <th className="p-2.5">Nguyện vọng 3</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-350 bg-slate-900/20">
                          {schoolDetail.cutoffs.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-850/10">
                              <td className="p-2.5 font-bold text-white">{item.year}</td>
                              <td className="p-2.5 font-semibold text-indigo-400">{item.cutoffNV1 ? `${item.cutoffNV1}đ` : '—'}</td>
                              <td className="p-2.5 text-emerald-400">{item.cutoffNV2 ? `${item.cutoffNV2}đ` : '—'}</td>
                              <td className="p-2.5 text-amber-400">{item.cutoffNV3 ? `${item.cutoffNV3}đ` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'quota' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quota vs Registered candidates */}
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[11px] font-bold text-slate-400">Đồ thị Chỉ tiêu vs Số lượng đăng ký</h4>
                      <div className="h-44 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        {schoolDetail.quotas.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-500 italic">Chưa có dữ liệu chỉ tiêu</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...schoolDetail.quotas].reverse()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                              <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                              <Bar dataKey="quota" fill="#3b82f6" name="Chỉ tiêu" radius={[3, 3, 0, 0]} />
                              <Bar dataKey="registeredCount" fill="#ec4899" name="Đăng ký NV1" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Competition ratio line chart */}
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[11px] font-bold text-slate-400">Biến động Tỷ lệ chọi</h4>
                      <div className="h-44 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        {schoolDetail.quotas.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-500 italic">Chưa có dữ liệu tỷ lệ chọi</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...schoolDetail.quotas].reverse()}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                              <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                              <Line type="monotone" dataKey="competitionRatio" stroke="#f43f5e" name="Tỷ lệ chọi" strokeWidth={2.5} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quotas table */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400">Bảng thống kê số liệu tuyển sinh</h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px]">
                            <th className="p-2.5">Năm học</th>
                            <th className="p-2.5">Chỉ tiêu</th>
                            <th className="p-2.5">Số lượng đăng ký NV1</th>
                            <th className="p-2.5">Tỷ lệ chọi (1 chọi x)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-350 bg-slate-900/20">
                          {schoolDetail.quotas.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-850/10">
                              <td className="p-2.5 font-bold text-white">{item.year}</td>
                              <td className="p-2.5 text-blue-400 font-semibold">{item.quota || '—'}</td>
                              <td className="p-2.5 text-pink-400">{item.registeredCount ? item.registeredCount.toLocaleString() : '—'}</td>
                              <td className="p-2.5 text-rose-400 font-bold">{item.competitionRatio ? `${item.competitionRatio}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* AI Search Modal */}
      <AiSearchModal 
        isOpen={isAiModalOpen}
        onClose={() => { setIsAiModalOpen(false); setAiPrefillSchool(undefined); }}
        type="GRADE10"
        prefillSchoolName={aiPrefillSchool}
        onImportSuccess={() => {
          loadSchools(searchQuery, selectedDistrict);
          loadAnalytics();
        }}
      />
    </div>
  );
}
