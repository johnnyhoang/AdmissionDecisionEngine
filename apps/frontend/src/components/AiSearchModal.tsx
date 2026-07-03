import React, { useState } from 'react';
import { 
  Sparkles, ShieldAlert, AlertTriangle, CheckCircle, 
  ArrowRight, Save
} from 'lucide-react';
import { searchAiCutoffs, importAiCutoffs } from '../services/api';

interface AiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'GRADE10' | 'UNIVERSITY';
  onImportSuccess?: () => void;
}

export default function AiSearchModal({ isOpen, onClose, type, onImportSuccess }: AiSearchModalProps) {
  const [password, setPassword] = useState('');
  const [schoolQuery, setSchoolQuery] = useState('');
  const [majorQuery, setMajorQuery] = useState('');
  const [step, setStep] = useState<'input' | 'searching' | 'preview' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  
  // Results states
  const [aiData, setAiData] = useState<any>(null);
  const [decisions, setDecisions] = useState<{ [year: number]: 'OVERWRITE' | 'SKIP' }>({});
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu xác nhận.');
      return;
    }
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

    try {
      const res = await searchAiCutoffs({
        password,
        type,
        schoolQuery,
        majorQuery: type === 'UNIVERSITY' ? majorQuery : undefined
      });
      setAiData(res);
      
      // Initialize decisions: default to OVERWRITE if exists in DB, or SKIP
      const initialDecisions: { [year: number]: 'OVERWRITE' | 'SKIP' } = {};
      res.results.forEach((item: any) => {
        initialDecisions[item.year] = item.exists ? 'OVERWRITE' : 'OVERWRITE';
      });
      setDecisions(initialDecisions);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra trong quá trình tìm kiếm.');
      setStep('input');
    }
  };

  const handleToggleDecision = (year: number, action: 'OVERWRITE' | 'SKIP') => {
    setDecisions({
      ...decisions,
      [year]: action
    });
  };

  const handleImport = async () => {
    setImporting(true);
    setError(null);

    // Filter only items marked as OVERWRITE
    const overrides = aiData.results
      .filter((item: any) => decisions[item.year] === 'OVERWRITE')
      .map((item: any) => ({
        year: item.year,
        cutoffNV1: item.cutoffNV1,
        cutoffNV2: item.cutoffNV2,
        cutoffNV3: item.cutoffNV3
      }));

    if (overrides.length === 0) {
      alert('Không có dữ liệu nào được chọn để cập nhật.');
      setImporting(false);
      return;
    }

    try {
      await importAiCutoffs({
        password,
        type,
        schoolCode: aiData.schoolCode,
        majorCode: type === 'UNIVERSITY' ? aiData.majorCode : undefined,
        overrides
      });
      setStep('success');
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu dữ liệu vào cơ sở dữ liệu.');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setPassword('');
    setSchoolQuery('');
    setMajorQuery('');
    setStep('input');
    setError(null);
    setAiData(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-4">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-850 pb-3">
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
            ✕
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
                Tính năng này sử dụng AI (Gemini Pro) có kích hoạt Google Search Grounding để tra cứu thông tin trực tiếp từ internet và có tính phí API. Vui lòng nhập đúng mật khẩu ủy quyền để tiếp tục.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Mật khẩu xác nhận</label>
                <input 
                  type="password"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tên trường cần tìm kiếm</label>
                <input 
                  type="text"
                  placeholder={type === 'GRADE10' ? 'e.g. THPT Bùi Thị Xuân...' : 'e.g. Đại học Bách Khoa...'}
                  value={schoolQuery}
                  onChange={(e) => setSchoolQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

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

            <div className="flex justify-end gap-2 border-t border-slate-850 pt-4 mt-2">
              <button 
                type="button"
                onClick={() => { resetModal(); onClose(); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-lg font-bold"
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
              Quá trình này có thể tốn từ 5-15 giây để Google Search và định dạng cấu trúc kết quả.
            </span>
          </div>
        )}

        {/* STEP 3: Preview conflicts resolution */}
        {step === 'preview' && aiData && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="bg-indigo-950/25 border border-indigo-500/10 p-3 rounded-xl">
              🔍 Kết quả tìm thấy cho: <strong className="text-white">{aiData.schoolName}</strong> ({aiData.schoolCode})
              {type === 'UNIVERSITY' && <span> - Ngành: <strong className="text-indigo-400">{aiData.majorName}</strong></span>}
            </div>

            <div className="overflow-x-auto max-h-60 border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-850 font-semibold text-[10px]">
                    <th className="p-3">Năm học</th>
                    <th className="p-3">Dữ liệu AI Tìm thấy</th>
                    <th className="p-3">Dữ liệu trong Database</th>
                    <th className="p-3 text-center">Quyết định hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350">
                  {aiData.results.map((item: any, idx: number) => {
                    const hasConflict = item.exists;
                    const choice = decisions[item.year] || 'OVERWRITE';

                    return (
                      <tr key={idx} className="hover:bg-slate-850/10">
                        <td className="p-3 font-bold text-white">{item.year}</td>
                        <td className="p-3">
                          {type === 'GRADE10' ? (
                            <div className="flex flex-col">
                              <span>NV1: <strong className="text-indigo-400">{item.cutoffNV1}đ</strong></span>
                              {item.cutoffNV2 && <span className="text-[10px] text-slate-450">NV2: {item.cutoffNV2}đ | NV3: {item.cutoffNV3}đ</span>}
                            </div>
                          ) : (
                            <span>Điểm chuẩn: <strong className="text-indigo-400">{item.cutoffNV1}đ</strong></span>
                          )}
                        </td>
                        <td className="p-3">
                          {hasConflict ? (
                            type === 'GRADE10' ? (
                              <div className="flex flex-col text-slate-500">
                                <span>NV1: {item.existingScore.cutoffNV1}đ</span>
                                <span>NV2: {item.existingScore.cutoffNV2 || 'N/A'}đ | NV3: {item.existingScore.cutoffNV3 || 'N/A'}đ</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Điểm chuẩn: {item.existingScore.cutoffNV1}đ</span>
                            )
                          ) : (
                            <span className="text-slate-600 italic">Trống (Không có sẵn)</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => handleToggleDecision(item.year, 'OVERWRITE')}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                choice === 'OVERWRITE'
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                                  : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Lấy thông tin mới
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleDecision(item.year, 'SKIP')}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                choice === 'SKIP'
                                  ? 'bg-rose-950/40 border-rose-900/60 text-rose-400'
                                  : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Bỏ qua
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-850 pt-4 mt-2">
              <button 
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-350 rounded-lg font-bold"
              >
                Quay lại
              </button>
              <button 
                type="button"
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-650/20"
              >
                <Save className="h-3.5 w-3.5" />
                {importing ? 'Đang lưu...' : 'Xác nhận cập nhật'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-full text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle className="h-10 w-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nạp Dữ Liệu Thành Công!</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Điểm chuẩn đã được nạp thành công vào cơ sở dữ liệu. Cổng thông tin điểm chuẩn sẽ hiển thị các cập nhật mới ngay lập tức.
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
