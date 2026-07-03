import { useState, useEffect } from 'react';
import { 
  Database, UploadCloud, History, Sliders, TrendingUp 
} from 'lucide-react';
import { 
  fetchG10AdminStats, fetchG10ImportPresets, runG10ImportPreset, 
  fetchG10ImportHistory, triggerG10ImportPayload 
} from '../../../services/api';

export default function Grade10AdminContainer() {
  const [adminTab, setAdminTab] = useState<'dashboard' | 'presets' | 'history'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [syncingPreset, setSyncingPreset] = useState<string | null>(null);
  const [customJsonPayload, setCustomJsonPayload] = useState('');
  const [importingPayload, setImportingPayload] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetchG10AdminStats();
      setStats(statsRes);
      const presetsRes = await fetchG10ImportPresets();
      setPresets(presetsRes);
      const histRes = await fetchG10ImportHistory();
      setHistory(histRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPreset = async (filename: string) => {
    setSyncingPreset(filename);
    try {
      const res = await runG10ImportPreset(filename);
      alert(`Đồng bộ Lớp 10 thành công! Đã thêm/cập nhật ${res.schoolsAdded + res.schoolsUpdated} trường, ${res.quotasAdded} chỉ tiêu, ${res.cutoffsAdded} điểm chuẩn.`);
      await loadData();
    } catch (e: any) {
      alert(`Đồng bộ thất bại: ${e.message}`);
    } finally {
      setSyncingPreset(null);
    }
  };

  const handleImportCustomJson = async () => {
    if (!customJsonPayload.trim()) return;
    setImportingPayload(true);
    try {
      const parsed = JSON.parse(customJsonPayload);
      const res = await triggerG10ImportPayload(parsed);
      alert(`Import thành công! Đã thêm/cập nhật ${res.schoolsAdded + res.schoolsUpdated} trường, ${res.quotasAdded} chỉ tiêu, ${res.cutoffsAdded} điểm chuẩn.`);
      setCustomJsonPayload('');
      await loadData();
    } catch (e: any) {
      alert(`Import thất bại: ${e.message}`);
    } finally {
      setImportingPayload(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white m-0">Grade 10 HCMC Admin Portal</h1>
              <p className="text-xs text-slate-400 m-0">Quản trị Dữ liệu Tuyển sinh Lớp 10 TP.HCM</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href="/grade10-hcm"
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-slate-300 rounded-lg transition"
            >
              Cổng Thí Sinh Lớp 10
            </a>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex gap-2 py-2">
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              adminTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Thống kê dữ liệu
          </button>
          
          <button
            onClick={() => setAdminTab('presets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              adminTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Database className="h-4 w-4" />
            Đồng bộ Presets ({presets.length})
          </button>

          <button
            onClick={() => setAdminTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              adminTab === 'history'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            Lịch sử Import ({history.length})
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            <span className="text-xs text-slate-400">Đang truy vấn dữ liệu tuyển sinh Lớp 10...</span>
          </div>
        ) : adminTab === 'dashboard' ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Trường THPT</span>
                <span className="text-3xl font-black text-white">{stats?.schools || 0}</span>
                <span className="text-[10px] text-indigo-400 font-medium">Trường công lập TP.HCM</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Quận / Huyện</span>
                <span className="text-3xl font-black text-white">{stats?.districts || 0}</span>
                <span className="text-[10px] text-indigo-400 font-medium">Phân chia hành chính</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Chỉ tiêu (Quotas)</span>
                <span className="text-3xl font-black text-white">{stats?.quotas || 0}</span>
                <span className="text-[10px] text-indigo-400 font-medium">Bản ghi qua các năm</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                <span className="text-xs text-slate-400 font-semibold uppercase">Điểm Chuẩn</span>
                <span className="text-3xl font-black text-white">{stats?.cutoffs || 0}</span>
                <span className="text-[10px] text-indigo-400 font-medium">Bản ghi điểm chuẩn</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Đánh giá chất lượng dữ liệu Lớp 10</h3>
              <div className="text-xs text-slate-300 leading-relaxed flex flex-col gap-2">
                <p>
                  🔹 Hệ thống đã nạp thành công <strong>{stats?.cutoffs || 0}</strong> bản ghi điểm chuẩn và chỉ tiêu tuyển sinh từ tệp cấu trúc preset.
                </p>
                <p>
                  🔹 Để dữ liệu được cập nhật đầy đủ và chính xác nhất, khuyến khích đồng bộ từ tệp preset <strong>"g10hcm_2016_2025.json"</strong> trong tab Đồng bộ Presets.
                </p>
              </div>
            </div>
          </div>
        ) : adminTab === 'presets' ? (
          <div className="flex flex-col gap-6">
            {/* Presets List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-400" />
                  📦 Presets Lớp 10 Có Sẵn
                </h3>
                <p className="text-xs text-slate-400 mt-1">Các tệp cấu hình chứa dữ liệu điểm chuẩn lớp 10 của Sở GD&ĐT TP.HCM.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <div key={preset.filename} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full">
                          Dữ liệu {preset.dataYear}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{preset.filename}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white mt-2">{preset.sourceName}</h4>
                      <div className="flex gap-4 mt-3 text-[11px] text-slate-400">
                        <span>🏫 Trường: <strong>{preset.schoolsCount}</strong></span>
                        <span>📈 Điểm chuẩn: <strong>{preset.cutoffsCount}</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSyncPreset(preset.filename)}
                      disabled={syncingPreset !== null}
                      className="w-full mt-2 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg transition"
                    >
                      {syncingPreset === preset.filename ? '⏳ Đang đồng bộ...' : '📥 Đồng bộ & Import vào DB'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload payload manual */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-indigo-400" />
                  ➕ Nhập Dữ Liệu Thủ Công (Grade 10 JSON)
                </h3>
              </div>

              <textarea
                value={customJsonPayload}
                onChange={(e) => setCustomJsonPayload(e.target.value)}
                placeholder={`{\n  "sourceName": "Sở GD&ĐT TP.HCM 2026",\n  "dataYear": 2026,\n  "districts": [...]\n}`}
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleImportCustomJson}
                  disabled={importingPayload || !customJsonPayload.trim()}
                  className="px-6 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg transition"
                >
                  {importingPayload ? '⏳ Đang import...' : 'Import Payload'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-400" />
                📜 Nhật Ký Lịch Sử Import Lớp 10
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Nguồn dữ liệu</th>
                    <th className="p-4 text-center">Bản ghi đã nạp</th>
                    <th className="p-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">Chưa có lượt import nào được ghi nhận.</td>
                    </tr>
                  ) : (
                    history.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/20">
                        <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{log.sourceName}</div>
                          {log.sourceUrl && <span className="text-[10px] text-slate-500 break-all">{log.sourceUrl}</span>}
                        </td>
                        <td className="p-4 text-center font-semibold text-indigo-400">+{log.rowsCount}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                            log.status === 'SUCCESS' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500 mt-auto">
        <p className="m-0">© 2026 Grade 10 HCMC Admission Engine Admin. Phát triển cho Kỳ thi vào Lớp 10.</p>
      </footer>
    </div>
  );
}
