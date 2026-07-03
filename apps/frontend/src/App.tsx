import { useState, useEffect } from 'react';
import { 
  Search, TrendingUp, Calculator, Sliders, MapPin, 
  School, HelpCircle, Info, Sparkles, Layers, ArrowUpDown, MessageSquare, X, Send, Trash2, ArrowUp, ArrowDown, AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { 
  fetchUniversities, fetchMajors, fetchMajorAnalytics, evaluateProfile, triggerSeedData,
  optimizePreferences, chatWithAi
} from './services/api';
import type { UniversityItem, RecommendationResult, MajorItem } from './services/api';
import './App.css';

interface PreferenceItem {
  programId: string;
  programCode: string;
  programName: string;
  universityCode: string;
  admissionMethodCode: string;
  admissionMethodName: string;
  order: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<'evaluate' | 'search' | 'analytics' | 'compare' | 'optimize'>('evaluate');
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [majors, setMajors] = useState<MajorItem[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('7480101'); // CS default
  const [majorAnalytics, setMajorAnalytics] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Form State for Profile Evaluation
  const [fullName, setFullName] = useState('Nguyễn Văn A');
  const [region, setRegion] = useState('KV2-NT');
  const [priorityGroup, setPriorityGroup] = useState('UT2');
  const [mathScore, setMathScore] = useState('9.0');
  const [physicsScore, setPhysicsScore] = useState('8.5');
  const [chemistryScore, setChemistryScore] = useState('8.0');
  const [englishScore, setEnglishScore] = useState('8.5');
  const [ieltsScore, setIeltsScore] = useState('6.5');
  const [dgnlScore, setDgnlScore] = useState('850');

  // Compare List State
  const [compareList, setCompareList] = useState<UniversityItem[]>([]);

  // AI Chat Assistant State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Xin chào! Tôi là Trợ lý Tuyển sinh AI. Bạn có thể hỏi tôi về học phí (ví dụ: "học phí dưới 35 triệu") hoặc điểm chuẩn (ví dụ: "điểm chuẩn khoa học máy tính")!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Preference List State (Nguyện Vọng)
  const [preferenceList, setPreferenceList] = useState<PreferenceItem[]>([]);
  const [optimizedResult, setOptimizedResult] = useState<{ optimizedList: any[]; warnings: string[] } | null>(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadMajorAnalytics(selectedMajor);
    }
  }, [activeTab, selectedMajor]);

  const loadInitialData = async () => {
    try {
      const uRes = await fetchUniversities();
      setUniversities(uRes.items);
      const mRes = await fetchMajors();
      setMajors(mRes);
      handleEvaluate();
    } catch (err) {
      console.error('Lỗi tải dữ liệu khởi tạo', err);
    }
  };

  const loadMajorAnalytics = async (code: string) => {
    try {
      const data = await fetchMajorAnalytics(code);
      setMajorAnalytics(data);
    } catch (err) {
      console.error('Lỗi tải phân tích ngành', err);
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const payload = {
        fullName,
        region,
        priorityGroup,
        examScores: {
          THPT: {
            Math: parseFloat(mathScore) || 0,
            Physics: parseFloat(physicsScore) || 0,
            Chemistry: parseFloat(chemistryScore) || 0,
            English: parseFloat(englishScore) || 0,
          },
          DGNL_HCM: parseFloat(dgnlScore) || 0
        },
        certificates: {
          IELTS: parseFloat(ieltsScore) || 0
        }
      };

      const res = await evaluateProfile(payload);
      setRecommendations(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await triggerSeedData();
      alert('Đã đồng bộ và làm mới dữ liệu thành công!');
      loadInitialData();
    } catch (err) {
      alert('Lỗi seeding dữ liệu');
    } finally {
      setSeeding(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const res = await fetchUniversities(query);
      setUniversities(res.items);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCompare = (univ: UniversityItem) => {
    if (compareList.some(item => item.id === univ.id)) {
      setCompareList(compareList.filter(item => item.id !== univ.id));
    } else {
      if (compareList.length >= 3) {
        alert('Chỉ có thể so sánh tối đa 3 trường cùng lúc.');
        return;
      }
      setCompareList([...compareList, univ]);
    }
  };

  // AI Chat Handlers
  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await chatWithAi(userText);
      setChatMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Xin lỗi, tôi đã gặp lỗi khi kết nối với máy chủ.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Preference List Handlers
  const handleAddToPreferences = (rec: RecommendationResult) => {
    if (preferenceList.some(item => item.programId === rec.programId && item.admissionMethodCode === (rec.admissionMethod === 'Xét tuyển kết hợp (IELTS/SAT)' ? 'COMBINED' : rec.admissionMethod.includes('THPT') ? 'THPT' : 'DGNL_HCM'))) {
      alert('Nguyện vọng này đã tồn tại trong danh sách.');
      return;
    }

    const methodCode = rec.admissionMethod === 'Xét tuyển kết hợp (IELTS/SAT)' ? 'COMBINED' : rec.admissionMethod.includes('THPT') ? 'THPT' : 'DGNL_HCM';

    const newItem: PreferenceItem = {
      programId: rec.programId,
      programCode: rec.programCode,
      programName: rec.programName,
      universityCode: rec.universityCode,
      admissionMethodCode: methodCode,
      admissionMethodName: rec.admissionMethod,
      order: preferenceList.length + 1
    };

    setPreferenceList(prev => [...prev, newItem]);
    setOptimizedResult(null); // Reset optimization suggestion
  };

  const handleRemovePreference = (programId: string) => {
    const updated = preferenceList
      .filter(item => item.programId !== programId)
      .map((item, index) => ({ ...item, order: index + 1 }));
    setPreferenceList(updated);
    setOptimizedResult(null);
  };

  const movePreference = (index: number, direction: 'up' | 'down') => {
    const updated = [...preferenceList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate orders
    const final = updated.map((item, idx) => ({ ...item, order: idx + 1 }));
    setPreferenceList(final);
    setOptimizedResult(null);
  };

  const handleOptimize = async () => {
    if (preferenceList.length === 0) {
      alert('Vui lòng thêm ít nhất một nguyện vọng để tối ưu.');
      return;
    }
    setOptimizing(true);
    try {
      const profilePayload = {
        fullName,
        region,
        priorityGroup,
        examScores: {
          THPT: {
            Math: parseFloat(mathScore) || 0,
            Physics: parseFloat(physicsScore) || 0,
            Chemistry: parseFloat(chemistryScore) || 0,
            English: parseFloat(englishScore) || 0,
          },
          DGNL_HCM: parseFloat(dgnlScore) || 0
        },
        certificates: {
          IELTS: parseFloat(ieltsScore) || 0
        }
      };

      const payloadPrefs = preferenceList.map(item => ({
        programId: item.programId,
        methodCode: item.admissionMethodCode,
        order: item.order
      }));

      const res = await optimizePreferences(profilePayload, payloadPrefs);
      setOptimizedResult(res);
    } catch (err) {
      alert('Tối ưu hóa thất bại.');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white m-0">VNU-Admission Platform</h1>
              <p className="text-xs text-slate-400 m-0">Hệ Thống Đánh Giá Cơ Hội & Gợi Ý Nguyện Vọng Đại Học Thông Minh</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-300 rounded-lg transition"
            >
              {seeding ? 'Đang đồng bộ...' : '🔄 Làm mới dữ liệu VNU-HCM'}
            </button>
            <div className="h-4 w-px bg-slate-700"></div>
            <span className="text-xs font-medium px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full">
              Phiên Bản 2026
            </span>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 py-2">
          <button
            onClick={() => setActiveTab('evaluate')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'evaluate'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Đánh giá cơ hội
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
            Tra cứu trường ĐHQG
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
            Phân tích điểm chuẩn lịch sử
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

          <button
            onClick={() => setActiveTab('optimize')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition relative ${
              activeTab === 'optimize'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            Tối ưu Nguyện vọng ({preferenceList.length})
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {/* Tab 1: Evaluate Opportunity */}
        {activeTab === 'evaluate' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Student Profile Panel */}
            <section className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-1">
                <Sliders className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white m-0">Hồ Sơ Thí Sinh</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Họ và Tên</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Khu Vực Ưu Tiên</label>
                  <select 
                    value={region} 
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition"
                  >
                    <option value="KV1">KV1 (+0.75đ)</option>
                    <option value="KV2-NT">KV2-NT (+0.5đ)</option>
                    <option value="KV2">KV2 (+0.25đ)</option>
                    <option value="KV3">KV3 (0đ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Đối Tượng Chính Sách</label>
                  <select 
                    value={priorityGroup} 
                    onChange={(e) => setPriorityGroup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition"
                  >
                    <option value="">Không có ưu tiên</option>
                    <option value="UT1">UT1 (+2.0đ)</option>
                    <option value="UT2">UT2 (+1.0đ)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Điểm Thi THPT (Xét tổ hợp môn)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Toán</label>
                    <input 
                      type="number" step="0.1" max="10"
                      value={mathScore}
                      onChange={(e) => setMathScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Vật Lý</label>
                    <input 
                      type="number" step="0.1" max="10"
                      value={physicsScore}
                      onChange={(e) => setPhysicsScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Hóa Học</label>
                    <input 
                      type="number" step="0.1" max="10"
                      value={chemistryScore}
                      onChange={(e) => setChemistryScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Tiếng Anh</label>
                    <input 
                      type="number" step="0.1" max="10"
                      value={englishScore}
                      onChange={(e) => setEnglishScore(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200" 
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Chứng Chỉ Ngoại Ngữ</h3>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Điểm IELTS</label>
                  <input 
                    type="number" step="0.5" max="9.0"
                    value={ieltsScore}
                    onChange={(e) => setIeltsScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200" 
                    placeholder="e.g. 6.5"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Điểm Kỳ Thi ĐGNL ĐHQG</h3>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Điểm ĐGNL (Thang 1200)</label>
                  <input 
                    type="number" max="1200"
                    value={dgnlScore}
                    onChange={(e) => setDgnlScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-200" 
                    placeholder="e.g. 850"
                  />
                </div>
              </div>

              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Đang phân tích...' : '📊 Đánh Giá & Gợi Ý Nguyện Vọng'}
              </button>
            </section>

            {/* Recommendation Results Panel */}
            <section className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                <div>
                  <h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý NGUYỆN VỌNG</h2>
                  <p className="text-xs text-slate-400 m-0">Danh sách các ngành được sắp xếp tối ưu theo cơ hội trúng tuyển</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">AN TOÀN</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">THÍCH HỢP</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded">THỬ THÁCH</span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                  <span className="text-xs text-slate-400">Đang chạy thuật toán so khớp điểm sàn và lịch sử điểm chuẩn...</span>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                  <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Không tìm thấy ngành học phù hợp. Vui lòng tăng điểm thi hoặc thay đổi bộ lọc.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recommendations.map((rec, index) => {
                    const probColor = 
                      rec.probabilityCategory === 'SAFE' ? 'emerald' : 
                      rec.probabilityCategory === 'MATCH' ? 'blue' : 
                      rec.probabilityCategory === 'REACH' ? 'amber' : 'rose';
                    
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
                              {rec.universityCode}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {rec.campusName}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-bold text-white mb-1.5">{rec.programName}</h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-400">
                            <div>Phương thức: <span className="font-semibold text-slate-300">{rec.admissionMethod}</span></div>
                            <div>Ngôn ngữ: <span className="font-semibold text-slate-300">{rec.language}</span></div>
                            <div>Học phí dự kiến: <span className="font-semibold text-indigo-400">~{(rec.tuitionFee/1000000).toFixed(0)}tr/năm</span></div>
                            <div>Điểm chuẩn 2025: <span className="font-semibold text-slate-300">{rec.benchmarkScoreLastYear || 'N/A'}</span></div>
                          </div>

                          <div className="mt-3 flex items-start gap-1.5 bg-slate-950/40 p-2 rounded-lg text-[11px] text-slate-400">
                            <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              {rec.explanation} <span className="text-slate-500">(Điểm của bạn: {rec.candidateScore}đ. Thi gốc {rec.breakdown.rawScore}đ + Ưu tiên {rec.breakdown.priorityBonus}đ).</span>
                            </div>
                          </div>
                        </div>

                        {/* Right Actions & Prob Gauge */}
                        <div className="md:w-44 shrink-0 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 gap-2.5">
                          <div>
                            <div className={`text-2xl font-black ${
                              probColor === 'emerald' ? 'text-emerald-400' :
                              probColor === 'blue' ? 'text-blue-400' :
                              probColor === 'amber' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {rec.admissionProbability}%
                            </div>
                            <span className={`text-[10px] font-bold uppercase mt-1 px-2.5 py-0.5 rounded-full ${
                              probColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              probColor === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              probColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {rec.probabilityCategory === 'SAFE' ? 'An toàn' :
                               rec.probabilityCategory === 'MATCH' ? 'Thích hợp' :
                               rec.probabilityCategory === 'REACH' ? 'Thử thách' : 'Nguy cơ'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleAddToPreferences(rec)}
                            className="w-full py-1.5 px-3 bg-slate-850 hover:bg-slate-850 border border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition"
                          >
                            ➕ Thêm nguyện vọng
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

        {/* Tab 2: Search Universities */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm trường theo tên hoặc mã trường (e.g. UIT, QST)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition"
                />
              </div>
              <div className="text-xs text-slate-400">
                Hiển thị: <span className="font-semibold text-slate-200">{universities.length}</span> trường ĐHQG
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {universities.map((univ) => {
                const isCompared = compareList.some(item => item.id === univ.id);
                return (
                  <div key={univ.id} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all duration-200">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-xs font-extrabold px-2.5 py-1 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
                          {univ.code}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleCompare(univ)}
                            className={`text-xs px-2.5 py-1 rounded transition border ${
                              isCompared 
                                ? 'bg-rose-600 border-rose-500 text-white' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isCompared ? 'Bỏ so sánh' : '➕ So sánh'}
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">{univ.nameVi}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">{univ.description || 'Không có mô tả chi tiết.'}</p>
                    </div>

                    <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Học phí trung bình:</span>
                        <span className="font-bold text-slate-200">~{(univ.averageTuition/1000000).toFixed(0)} triệu VNĐ/năm</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Xếp hạng nội địa:</span>
                        <span className="font-bold text-slate-200">#{univ.localRanking || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Loại hình:</span>
                        <span className="font-semibold text-slate-200">{univ.isPublic ? 'Công lập' : 'Tư thục'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Historical Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Major selector */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-2">
              <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 mb-1">Chọn Ngành Khảo Sát</h2>
              <div className="flex flex-col gap-2">
                {majors.map((major) => (
                  <button
                    key={major.code}
                    onClick={() => setSelectedMajor(major.code)}
                    className={`text-left px-4 py-3 rounded-xl text-xs font-semibold transition border ${
                      selectedMajor === major.code
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>{major.nameVi}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Mã ngành: {major.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts chart */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white m-0">Biểu đồ Xu hướng Điểm chuẩn</h2>
                <p className="text-xs text-slate-400 mt-0.5">Điểm chuẩn trung bình tổ hợp THPT qua các năm gần đây</p>
              </div>

              {majorAnalytics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-xs">
                  <Layers className="h-10 w-10 text-slate-500 mb-2" />
                  <span>Không tìm thấy dữ liệu điểm chuẩn cho ngành này. Hãy nhấp "Làm mới dữ liệu" ở góc phải để tạo mẫu.</span>
                </div>
              ) : (
                <div className="h-80 w-full mt-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={majorAnalytics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="year" stroke="#94a3b8" />
                      <YAxis domain={[15, 30]} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Legend />
                      <Line 
                        name="Điểm chuẩn trung bình THPT" 
                        type="monotone" 
                        dataKey="avgBenchmark" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Compare Schools */}
        {activeTab === 'compare' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <h2 className="text-base font-bold text-white m-0">BẢNG SO SÁNH TRƯỜNG ĐẠI HỌC</h2>
              <p className="text-xs text-slate-400 m-0">So sánh các tiêu chí học phí, vị trí địa lý, xếp hạng học thuật và chất lượng đầu ra.</p>
            </div>

            {compareList.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                <School className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Vui lòng chọn các trường đại học từ tab <strong>"Tra cứu trường"</strong> để thêm vào danh sách so sánh.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {compareList.map((univ) => (
                  <div key={univ.id} className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-6">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded">
                          {univ.code}
                        </span>
                        <button
                          onClick={() => toggleCompare(univ)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Xóa khỏi bảng
                        </button>
                      </div>
                      <h3 className="text-base font-extrabold text-white mb-4 border-b border-slate-800 pb-3">{univ.nameVi}</h3>

                      <div className="flex flex-col gap-4 text-sm">
                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Học Phí Bình Quân</div>
                          <div className="font-bold text-indigo-400">~{(univ.averageTuition/1000000).toFixed(0)} triệu VNĐ/năm</div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Địa Chỉ</div>
                          <div className="font-semibold text-slate-200 flex items-start gap-1">
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <span>{univ.campuses[0]?.address || 'Chưa cập nhật'}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Xếp Hạng Nội Địa</div>
                          <div className="font-bold text-amber-400">Top #{univ.localRanking || 'N/A'} toàn quốc</div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Chương Trình Đào Tạo</div>
                          <div className="font-semibold text-slate-200">
                            {univ.isPublic ? 'Công lập chất lượng cao' : 'Tư thục quốc tế'}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-400 mb-0.5">Trang web liên kết</div>
                          <a 
                            href={univ.website} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-indigo-400 hover:underline"
                          >
                            {univ.website}
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

        {/* Tab 5: Optimize Preferences (Nguyện Vọng) */}
        {activeTab === 'optimize' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Preference list reordering */}
            <section className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
              <div>
                <h2 className="text-base font-bold text-white m-0">Thứ tự Nguyện vọng Đăng ký</h2>
                <p className="text-xs text-slate-400">Di chuyển các nguyện vọng lên xuống và bấm Tối ưu hóa để phân tích rủi ro.</p>
              </div>

              {preferenceList.length === 0 ? (
                <div className="text-center py-12 bg-slate-950 rounded-xl border border-slate-800">
                  <Layers className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Danh sách nguyện vọng trống.<br />Vui lòng thêm nguyện vọng từ kết quả tại tab <strong>"Đánh giá cơ hội"</strong>.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {preferenceList.map((pref, idx) => (
                    <div key={pref.programId} className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 flex items-center justify-center rounded-full text-[10px]">
                          {pref.order}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">{pref.programName}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{pref.universityCode} | Phương thức: {pref.admissionMethodName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => movePreference(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => movePreference(idx, 'down')}
                          disabled={idx === preferenceList.length - 1}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 rounded"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleRemovePreference(pref.programId)}
                          className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition mt-3 text-xs"
                  >
                    {optimizing ? 'Đang phân tích hệ thống...' : '⚡ Khởi chạy Thuật toán Tối ưu'}
                  </button>
                </div>
              )}
            </section>

            {/* Right Column: Suggested optimized order and analysis warnings */}
            <section className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <h2 className="text-base font-bold text-white m-0">Kết quả Phân tích Tối ưu hóa</h2>
                <p className="text-xs text-slate-400 m-0">Gợi ý cách sắp xếp khoa học dựa trên thuật toán phòng vệ rủi ro của MOET.</p>
              </div>

              {!optimizedResult ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                  <Sparkles className="h-8 w-8 text-indigo-500 mb-2 animate-bounce" />
                  <span>Hãy click "Khởi chạy Thuật toán Tối ưu" để nhận kết quả phân tích!</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Warnings panel */}
                  {optimizedResult.warnings.length > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Cảnh báo cấu trúc nguyện vọng
                      </div>
                      <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                        {optimizedResult.warnings.map((w, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 pl-1.5 border-l border-rose-500">
                            {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation suggest order list */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Đề xuất sắp xếp tối ưu (Từ cao xuống thấp)</h3>
                    <div className="flex flex-col gap-2.5">
                      {optimizedResult.optimizedList.map((item) => {
                        const probColor = 
                          item.probabilityCategory === 'SAFE' ? 'emerald' : 
                          item.probabilityCategory === 'MATCH' ? 'blue' : 
                          item.probabilityCategory === 'REACH' ? 'amber' : 'rose';
                        return (
                          <div key={item.programId} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 bg-indigo-500 text-white font-bold flex items-center justify-center rounded-full text-[10px]">
                                {item.suggestedOrder}
                              </span>
                              <div>
                                <div className="font-bold text-slate-200">{item.programName}</div>
                                <div className="text-[10px] text-slate-400 font-medium">Mã: {item.programCode} | Điểm của bạn: <span className="font-semibold text-slate-200">{item.candidateScore}đ</span> (Benchmark 2025: {item.benchmarkScoreLastYear}đ)</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              probColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                              probColor === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                              probColor === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {item.probabilityCategory === 'SAFE' ? 'An toàn' :
                               item.probabilityCategory === 'MATCH' ? 'Thích hợp' :
                               item.probabilityCategory === 'REACH' ? 'Thử thách' : 'Nguy cơ'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

      </main>

      {/* Floating AI Assistant Chatbox */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="bg-slate-900 border border-slate-800 w-80 md:w-96 h-[450px] rounded-2xl shadow-2xl flex flex-col justify-between mb-3 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
            {/* Chat header */}
            <div className="bg-slate-850 p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white">Trợ Lý Tuyển Sinh AI (RAG)</span>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs leading-relaxed">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex flex-col max-w-[85%] rounded-2xl p-3 ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white self-end rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 self-start rounded-tl-none border border-slate-705'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
              ))}
              {chatLoading && (
                <div className="bg-slate-800 text-slate-400 self-start rounded-2xl rounded-tl-none p-3 max-w-[85%] border border-slate-800 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2">
              <input 
                type="text"
                placeholder="Nhập câu hỏi tra cứu..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none outline-0"
              />
              <button
                onClick={handleSendMessage}
                disabled={chatLoading}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Toggle bubble button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center"
        >
          {chatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500 mt-auto">
        <p className="m-0">© 2026 Admission Recommendation Engine. Phát triển cho Kỳ thi Đại học Việt Nam.</p>
        <p className="m-0 mt-1">Cơ sở dữ liệu tích hợp chính thức từ VNU-HCM và MOET Việt Nam.</p>
      </footer>
    </div>
  );
}

export default App;
