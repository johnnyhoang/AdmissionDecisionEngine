import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, ShieldAlert, AlertTriangle, CheckCircle, 
  ArrowRight, Save, Search, X
} from 'lucide-react';
import { searchAiCutoffs, importAiCutoffs, fetchGrade10SchoolNames } from '../services/api';
import { formatSchoolYear } from '../utils/date';

interface SchoolSuggestion {
  id: string;
  name: string;
  code: string;
  districtName?: string;
  districtCode?: string;
}

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'GRADE10' | 'UNIVERSITY';
  onImportSuccess?: () => void;
  prefillSchool?: {
    name: string;
    code: string;
    districtName?: string;
    districtCode?: string;
  };
}

export default function AiSearchModal({ isOpen, onClose, type, onImportSuccess, prefillSchool }: AiSearchModalProps) {
  const [schoolQuery, setSchoolQuery] = useState('');
  const [majorQuery, setMajorQuery] = useState('');
  const [step, setStep] = useState<'input' | 'searching' | 'preview' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);

  // Selected school to store metadata (code, district)
  const [selectedSchool, setSelectedSchool] = useState<{
    name: string;
    code: string;
    districtName?: string;
    districtCode?: string;
  } | null>(null);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<SchoolSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  
  // Results states
  const [aiData, setAiData] = useState<any>(null);
  const [decisions, setDecisions] = useState<{ [year: number]: 'OVERWRITE' | 'SKIP' }>({});
  const [importing, setImporting] = useState(false);

  // Pre-fill school name when opened from a card button
  useEffect(() => {
    if (isOpen && prefillSchool) {
      setSchoolQuery(prefillSchool.name);
      setSelectedSchool(prefillSchool);
      setShowSuggestions(false);
    }
  }, [isOpen, prefillSchool]);


  // Load initial suggestions when modal opens (Grade10 only)
  useEffect(() => {
    if (isOpen && type === 'GRADE10') {
      fetchGrade10SchoolNames().then(setSuggestions).catch(() => {});
    }
  }, [isOpen, type]);

  // Debounced autocomplete for Grade10
  useEffect(() => {
    if (type !== 'GRADE10') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!schoolQuery.trim()) {
      // Show full initial list when query is empty
      setSuggestionsLoading(true);
      fetchGrade10SchoolNames().then(data => {
        setSuggestions(data);
        setSuggestionsLoading(false);
      }).catch(() => setSuggestionsLoading(false));
      return;
    }

    setSuggestionsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchGrade10SchoolNames(schoolQuery);
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
  }, [schoolQuery, type]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionBoxRef.current && !suggestionBoxRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolQuery.trim()) {
      setError('Vui lòng nhập tên trường.');
      return;
    }
    if (type === 'UNIVERSITY' && !majorQuery.trim()) {
      setError('Vui lòng nhập tên ngành.');
      return;
    }

    setError(null);
    setStep('searching');
    setShowSuggestions(false);

    try {
      const res = await searchAiCutoffs({
        type,
        schoolQuery,
        schoolCode: selectedSchool?.code,
        districtName: selectedSchool?.districtName,
        districtCode: selectedSchool?.districtCode,
        majorQuery: type === 'UNIVERSITY' ? majorQuery : undefined
      });
      setAiData(res);
      
      // Initialize decisions: default to SKIP for existing data to prevent overwrite, OVERWRITE for new
      const initialDecisions: { [year: number]: 'OVERWRITE' | 'SKIP' } = {};
      res.results.forEach((item: any) => {
        initialDecisions[item.year] = item.exists ? 'SKIP' : 'OVERWRITE';
      });
      setDecisions(initialDecisions);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình tìm kiếm.');
      setStep('input');
    }
  };

  const handleToggleDecision = (year: number, action: 'OVERWRITE' | 'SKIP') => {
    setDecisions({ ...decisions, [year]: action });
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    const overrides = aiData.results
      .filter((item: any) => decisions[item.year] === 'OVERWRITE')
      .map((item: any) => ({
        year: item.year,
        cutoffNV1: item.cutoffNV1,
        cutoffNV2: item.cutoffNV2,
        cutoffNV3: item.cutoffNV3,
        quota: item.quota,
        registeredCount: item.registeredCount,
        competitionRatio: item.competitionRatio
      }));

    if (overrides.length === 0) {
      alert('Không có dữ liệu nào được chọn để cập nhật.');
      setImporting(false);
      return;
    }

    try {
      await importAiCutoffs({
        type,
        schoolCode: aiData.schoolCode,
        districtName: selectedSchool?.districtName,
        majorCode: type === 'UNIVERSITY' ? aiData.majorCode : undefined,
        overrides,
        address: aiData.address || undefined,
        website: aiData.website || undefined,
        description: aiData.description || undefined,
        mapUrl: aiData.mapUrl || undefined,
        latitude: aiData.latitude || undefined,
        longitude: aiData.longitude || undefined,
      });
      setStep('success');
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu dữ liệu vào cơ sở dữ liệu.');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setSchoolQuery('');
    setMajorQuery('');
    setSelectedSchool(null);
    setStep('input');
    setError(null);
    setAiData(null);
    setShowSuggestions(false);
  };

  const selectSuggestion = (s: SchoolSuggestion) => {
    setSchoolQuery(s.name);
    setSelectedSchool(s);
    setShowSuggestions(false);
  };


  // Group suggestions by district for display
  const groupedSuggestions = suggestions.reduce<Record<string, SchoolSuggestion[]>>((acc, s) => {
    const key = s.districtName || 'Khác';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            <h2 className="text-base font-bold text-white">
              AI Tìm Kiếm & Nạp Điểm Chuẩn ({type === 'GRADE10' ? 'Lớp 10 TP.HCM' : 'Đại Học'})
            </h2>
          </div>
          <button 
            onClick={() => { resetModal(); onClose(); }}
            className="text-slate-400 hover:text-white font-bold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Errors display */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Inputs */}
        {step === 'input' && (
          <form onSubmit={handleSearch} className="flex flex-col gap-4 text-xs">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[11px] mb-0.5">Lưu ý tính năng:</strong>
                Tính năng này sử dụng AI với Google Search Grounding để tra cứu thông tin trực tiếp từ internet và có tính phí API.
              </div>
            </div>

            {/* School query with autocomplete */}
            <div className="relative">
              <label className="block text-slate-400 font-semibold mb-1">
                {type === 'GRADE10' ? 'Tên trường THPT' : 'Tên trường Đại Học'}
              </label>
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={type === 'GRADE10' ? 'e.g. Trần Phú, Gia Định, Bùi Thị Xuân...' : 'e.g. Đại học Bách Khoa...'}
                  value={schoolQuery}
                  onChange={(e) => { setSchoolQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
                {schoolQuery && (
                  <button type="button" onClick={() => { setSchoolQuery(''); setShowSuggestions(true); }} className="absolute right-2 text-slate-500 hover:text-slate-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown — Grade10 only */}
              {type === 'GRADE10' && showSuggestions && (
                <div
                  ref={suggestionBoxRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto"
                >
                  {suggestionsLoading ? (
                    <div className="p-3 text-slate-500 text-[11px] text-center">Đang tải danh sách trường...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="p-3 text-slate-500 text-[11px] text-center">Không tìm thấy trường nào phù hợp</div>
                  ) : (
                    Object.entries(groupedSuggestions).map(([district, schools]) => (
                      <div key={district}>
                        <div className="px-3 py-1.5 text-[10px] font-bold text-indigo-400 bg-slate-900/60 sticky top-0">
                          {district}
                        </div>
                        {schools.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                            className={`w-full text-left px-3 py-2 text-[11px] transition hover:bg-indigo-600/20 ${
                              schoolQuery === s.name ? 'bg-indigo-600/10 text-indigo-300' : 'text-slate-300'
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Major query — University only */}
            {type === 'UNIVERSITY' && (
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tên ngành học cần tìm kiếm</label>
                <input 
                  type="text"
                  placeholder="e.g. Khoa học máy tính, Công nghệ thông tin..."
                  value={majorQuery}
                  onChange={(e) => setMajorQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 mt-2">
              <button 
                type="button"
                onClick={() => { resetModal(); onClose(); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                Tiếp tục tra cứu
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Searching */}
        {step === 'searching' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-indigo-500"></div>
            <span className="text-xs text-indigo-400 font-semibold animate-pulse">
              AI đang tìm kiếm dữ liệu internet của trường "{schoolQuery}"...
            </span>
            <span className="text-[10px] text-slate-500 max-w-sm text-center">
              Quá trình này có thể tốn từ 5-20 giây để tìm kiếm và định dạng cấu trúc kết quả.
            </span>
          </div>
        )}

        {/* STEP 3: Preview conflicts resolution */}
        {step === 'preview' && aiData && (() => {
          const overwriteCount = Object.values(decisions).filter(d => d === 'OVERWRITE').length;
          const skipCount = Object.values(decisions).filter(d => d === 'SKIP').length;
          const totalItems = aiData.results.length;
          return (
          <div className="flex flex-col gap-4 text-xs">
            <div className="bg-indigo-950/25 border border-indigo-500/10 p-3.5 rounded-xl flex justify-between items-center flex-wrap gap-2">
              <div>
                🔍 Kết quả tìm thấy cho: <strong className="text-white">{aiData.schoolName}</strong> ({aiData.schoolCode})
                {type === 'UNIVERSITY' && <span> - Ngành: <strong className="text-indigo-400">{aiData.majorName}</strong></span>}
              </div>
              <div className="text-[10px] text-slate-400">
                Mặc định giữ lại dữ liệu cũ nếu đã tồn tại để tránh ghi đè ngoài ý muốn.
              </div>
            </div>

            {type === 'GRADE10' && (aiData.address || aiData.website || aiData.description) && (
              <div className="bg-slate-950/40 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2">
                <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Thông tin trường bổ sung tìm thấy</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
                  {aiData.address && (
                    <div>
                      📍 <strong>Địa chỉ:</strong> {aiData.address}
                    </div>
                  )}
                  {aiData.website && (
                    <div>
                      🌐 <strong>Website:</strong> <a href={aiData.website.startsWith('http') ? aiData.website : `https://${aiData.website}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">{aiData.website}</a>
                    </div>
                  )}
                  {aiData.mapUrl && (
                    <div className="md:col-span-2">
                      🗺️ <strong>Bản đồ:</strong> <a href={aiData.mapUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">{aiData.mapUrl}</a>
                    </div>
                  )}
                  {aiData.description && (
                    <div className="md:col-span-2 border-t border-slate-800/60 pt-2">
                      📝 <strong>Giới thiệu chung:</strong>
                      <p className="text-slate-400 mt-1 line-clamp-3 leading-relaxed whitespace-pre-line">{aiData.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bulk action bar */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">Tổng <strong className="text-white">{totalItems}</strong> năm:</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold">
                  {overwriteCount} sẽ cập nhật
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 font-bold">
                  {skipCount} giữ cũ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all: { [year: number]: 'OVERWRITE' | 'SKIP' } = {};
                    aiData.results.forEach((item: any) => { all[item.year] = 'OVERWRITE'; });
                    setDecisions(all);
                  }}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold border border-indigo-500/30 bg-indigo-600/15 text-indigo-400 hover:bg-indigo-600/30 transition"
                >
                  ✅ Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const all: { [year: number]: 'OVERWRITE' | 'SKIP' } = {};
                    aiData.results.forEach((item: any) => { all[item.year] = 'SKIP'; });
                    setDecisions(all);
                  }}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 transition"
                >
                  🔒 Bỏ chọn tất cả
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px] uppercase">
                    <th className="p-3 w-24">Năm học</th>
                    <th className="p-3">Dữ liệu AI Tìm thấy</th>
                    <th className="p-3">Dữ liệu trong Database</th>
                    <th className="p-3 text-center w-48">Quyết định hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {aiData.results.map((item: any, idx: number) => {
                    const hasConflict = item.exists;
                    
                    // Check if values actually differ
                    const isScoreDifferent = hasConflict && item.existingScore && (
                      item.existingScore.cutoffNV1 !== item.cutoffNV1 ||
                      (item.existingScore.cutoffNV2 !== item.cutoffNV2 && item.cutoffNV2 !== null) ||
                      (item.existingScore.cutoffNV3 !== item.cutoffNV3 && item.cutoffNV3 !== null)
                    );
                    const isQuotaDifferent = hasConflict && item.existingQuota && item.quota !== null && (
                      item.existingQuota.quota !== item.quota ||
                      item.existingQuota.registeredCount !== item.registeredCount
                    );
                    const isConflicting = isScoreDifferent || isQuotaDifferent;

                    const choice = decisions[item.year] || 'SKIP';

                    return (
                      <tr key={idx} className={`hover:bg-slate-800/20 transition ${
                        isConflicting ? 'bg-amber-500/5' : ''
                      }`}>
                        <td className="p-3 font-bold text-white">
                          <div className="flex flex-col gap-1 items-start">
                            <span>{formatSchoolYear(item.year)}</span>
                            {isConflicting && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase tracking-wider">
                                ⚡ Khác biệt
                              </span>
                            )}
                            {!hasConflict && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                                ✨ Mới
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {type === 'GRADE10' ? (
                            <div className="flex flex-col gap-1">
                              <span>
                                NV1: <strong className="text-indigo-400">{item.cutoffNV1}đ</strong>
                                {item.cutoffNV2 ? ` | NV2: ${item.cutoffNV2}đ | NV3: ${item.cutoffNV3}đ` : ''}
                              </span>
                              {item.quota !== null && item.quota !== undefined && (
                                <span className="text-[10px] text-slate-400">
                                  Chỉ tiêu: <strong className="text-slate-300">{item.quota}</strong>
                                  {item.registeredCount ? ` | Đăng ký: ${item.registeredCount}` : ''}
                                  {item.competitionRatio ? ` | Tỷ lệ chọi: ${item.competitionRatio}` : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span>Điểm chuẩn: <strong className="text-indigo-400">{item.cutoffNV1}đ</strong></span>
                          )}
                        </td>
                        <td className="p-3">
                          {hasConflict ? (
                            type === 'GRADE10' ? (
                              <div className="flex flex-col gap-1 text-slate-500">
                                {item.existingScore ? (
                                  <span className={isScoreDifferent ? 'text-amber-400/80 font-medium' : ''}>
                                    NV1: {item.existingScore.cutoffNV1}đ
                                    {item.existingScore.cutoffNV2 ? ` | NV2: ${item.existingScore.cutoffNV2}đ | NV3: ${item.existingScore.cutoffNV3}đ` : ''}
                                  </span>
                                ) : (
                                  <span className="italic">Chưa có điểm</span>
                                )}
                                {item.existingQuota ? (
                                  <span className={`text-[10px] ${isQuotaDifferent ? 'text-amber-400/60 font-medium' : ''}`}>
                                    Chỉ tiêu: {item.existingQuota.quota}
                                    {item.existingQuota.registeredCount ? ` | Đăng ký: ${item.existingQuota.registeredCount}` : ''}
                                    {item.existingQuota.competitionRatio ? ` | Tỷ lệ chọi: ${item.existingQuota.competitionRatio}` : ''}
                                  </span>
                                ) : (
                                  <span className="text-[10px] italic">Chưa có chỉ tiêu</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500">Điểm chuẩn: {item.existingScore.cutoffNV1}đ</span>
                            )
                          ) : (
                            <span className="text-slate-600 italic">Trống (Chưa có)</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button
                              type="button"
                              onClick={() => handleToggleDecision(item.year, 'OVERWRITE')}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                choice === 'OVERWRITE'
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                                  : 'bg-transparent border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Lấy thông tin mới
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleDecision(item.year, 'SKIP')}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                                choice === 'SKIP'
                                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                                  : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              Giữ dữ liệu cũ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 mt-2">
              <button 
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
              >
                Quay lại
              </button>
              <button 
                type="button"
                onClick={handleImport}
                disabled={importing || overwriteCount === 0}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Save className="h-3.5 w-3.5" />
                {importing ? 'Đang lưu...' : `Xác nhận cập nhật (${overwriteCount})`}
              </button>
            </div>
          </div>
          );
        })()}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-full text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nạp Dữ Liệu Thành Công!</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Điểm chuẩn và chỉ tiêu tuyển sinh đã được nạp thành công vào cơ sở dữ liệu.
              </p>
            </div>
            <button
              onClick={() => { resetModal(); onClose(); }}
              className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
            >
              Đóng Modal
            </button>
          </div>
        )}


      </div>
    </div>
  );
}
