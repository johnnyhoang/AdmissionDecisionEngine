import { useState, useEffect } from 'react';
import { 
  Database, History, Sliders, TrendingUp, 
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2, ClipboardPaste, ShieldAlert
} from 'lucide-react';
import { 
  fetchG10AdminStats, fetchG10ImportPresets, runG10ImportPreset, 
  fetchG10ImportHistory, triggerG10ImportPayload, fetchG10SchoolByCode
} from '../../../services/api';

type Decision = 'KEEP' | 'OVERWRITE' | 'NEW';

interface ConflictRow {
  schoolCode: string;
  schoolName: string;
  districtName: string;
  year: number;
  newCutoff: { nv1: number; nv2?: number; nv3?: number };
  existingCutoff?: { nv1: number; nv2?: number; nv3?: number };
  decision: Decision;
}

interface ParsedImport {
  sourceName: string;
  sourceUrl?: string;
  dataYear: number;
  districts: any[];
}

export default function Grade10AdminContainer() {
  const [adminTab, setAdminTab] = useState<'dashboard' | 'presets' | 'paste' | 'history'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [syncingPreset, setSyncingPreset] = useState<string | null>(null);

  // Paste import state
  const [pasteJson, setPasteJson] = useState('');
  const [parseError, setParseError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictRow[]>([]);
  const [parsedPayload, setParsedPayload] = useState<ParsedImport | null>(null);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, p, h] = await Promise.all([
        fetchG10AdminStats(), fetchG10ImportPresets(), fetchG10ImportHistory()
      ]);
      setStats(s); setPresets(p); setHistory(h);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSyncPreset = async (filename: string) => {
    setSyncingPreset(filename);
    try {
      const res = await runG10ImportPreset(filename);
      alert(`✅ Đồng bộ thành công! ${res.schoolsAdded + res.schoolsUpdated} trường, ${res.cutoffsAdded} điểm chuẩn.`);
      await loadData();
    } catch (e: any) { alert(`❌ Đồng bộ thất bại: ${e.message}`); }
    finally { setSyncingPreset(null); }
  };

  const handleAnalyze = async () => {
    setParseError(''); setConflicts([]); setParsedPayload(null); setImportResult(null);
    if (!pasteJson.trim()) return;

    let parsed: ParsedImport;
    try {
      parsed = JSON.parse(pasteJson);
      if (!parsed.districts || !Array.isArray(parsed.districts)) throw new Error('Thiếu trường "districts"');
    } catch (e: any) {
      setParseError(`JSON không hợp lệ: ${e.message}`);
      return;
    }

    setAnalyzing(true);
    setParsedPayload(parsed);
    const rows: ConflictRow[] = [];

    for (const district of parsed.districts) {
      for (const school of district.schools || []) {
        if (!school.cutoffs || school.cutoffs.length === 0) continue;

        let existingCutoffsMap: Record<number, any> = {};
        try {
          const detail = await fetchG10SchoolByCode(school.code);
          if (detail?.cutoffScores) {
            for (const c of detail.cutoffScores) {
              existingCutoffsMap[c.year] = c;
            }
          }
        } catch (_) { /* school might not exist yet */ }

        for (const cutoff of school.cutoffs) {
          if (!cutoff.cutoffNV1 && cutoff.cutoffNV1 !== 0) continue;
          const existing = existingCutoffsMap[cutoff.year];
          rows.push({
            schoolCode: school.code,
            schoolName: school.name,
            districtName: district.name,
            year: cutoff.year,
            newCutoff: { nv1: cutoff.cutoffNV1, nv2: cutoff.cutoffNV2, nv3: cutoff.cutoffNV3 },
            existingCutoff: existing
              ? { nv1: existing.cutoffNV1, nv2: existing.cutoffNV2, nv3: existing.cutoffNV3 }
              : undefined,
            decision: existing ? 'KEEP' : 'NEW',
          });
        }
      }
    }

    setConflicts(rows);
    setAnalyzing(false);
    const conflictSchools = new Set(rows.filter(r => r.existingCutoff).map(r => r.schoolCode));
    setExpandedSchools(conflictSchools);
  };

  const setDecision = (schoolCode: string, year: number, decision: Decision) => {
    setConflicts(prev => prev.map(r =>
      r.schoolCode === schoolCode && r.year === year ? { ...r, decision } : r
    ));
  };

  const setAllForSchool = (schoolCode: string, decision: Decision) => {
    setConflicts(prev => prev.map(r =>
      r.schoolCode === schoolCode && r.existingCutoff ? { ...r, decision } : r
    ));
  };

  const handleConfirmImport = async () => {
    if (!parsedPayload) return;
    setImporting(true);
    setImportResult(null);

    const allowedKeys = new Set(
      conflicts.filter(r => r.decision !== 'KEEP').map(r => `${r.schoolCode}__${r.year}`)
    );

    const filteredPayload: ParsedImport = {
      ...parsedPayload,
      districts: parsedPayload.districts.map(district => ({
        ...district,
        schools: district.schools.map((school: any) => ({
          ...school,
          cutoffs: (school.cutoffs || []).filter((c: any) =>
            allowedKeys.has(`${school.code}__${c.year}`)
          ),
        })).filter((s: any) => s.cutoffs.length > 0 || (s.quotas && s.quotas.length > 0))
      })).filter((d: any) => d.schools.length > 0)
    };

    try {
      const res = await triggerG10ImportPayload(filteredPayload);
      setImportResult(res);
      setPasteJson('');
      setConflicts([]);
      setParsedPayload(null);
      await loadData();
    } catch (e: any) {
      setImportResult({ error: e.message });
    } finally {
      setImporting(false);
    }
  };

  const schoolGroups = conflicts.reduce<Record<string, ConflictRow[]>>((acc, row) => {
    if (!acc[row.schoolCode]) acc[row.schoolCode] = [];
    acc[row.schoolCode].push(row);
    return acc;
  }, {});

  const totalNew      = conflicts.filter(r => r.decision === 'NEW').length;
  const totalConflict = conflicts.filter(r => r.existingCutoff).length;
  const totalOverwrite = conflicts.filter(r => r.decision === 'OVERWRITE').length;
  const totalKeep     = conflicts.filter(r => r.decision === 'KEEP').length;

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
          <a href="/grade10-hcm" className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition">
            Cổng Thí Sinh Lớp 10
          </a>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4">
        <div className="max-w-7xl mx-auto flex gap-2 py-2 overflow-x-auto">
          {([
            ['dashboard', 'dashboard', <TrendingUp key="t" className="h-4 w-4" />, 'Thống kê'],
            ['presets',   'presets',   <Database key="d" className="h-4 w-4" />,   `Presets (${presets.length})`],
            ['paste',     'paste',     <ClipboardPaste key="c" className="h-4 w-4" />, 'Dán JSON & Import'],
            ['history',   'history',   <History key="h" className="h-4 w-4" />,    `Lịch sử (${history.length})`],
          ] as const).map(([tab, key, icon, label]) => (
            <button key={key} onClick={() => setAdminTab(tab as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                adminTab === tab
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
            <span className="text-xs text-slate-400">Đang truy vấn...</span>
          </div>

        ) : adminTab === 'dashboard' ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Trường THPT',      stats?.schools   ?? 0, 'Trường công lập TP.HCM'],
                ['Quận / Huyện',    stats?.districts  ?? 0, 'Phân chia hành chính'],
                ['Chỉ tiêu (Quotas)', stats?.quotas  ?? 0, 'Bản ghi qua các năm'],
                ['Điểm Chuẩn',      stats?.cutoffs    ?? 0, 'Bản ghi điểm chuẩn'],
              ].map(([label, val, sub]) => (
                <div key={label as string} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-1">
                  <span className="text-xs text-slate-400 font-semibold uppercase">{label}</span>
                  <span className="text-3xl font-black text-white">{val}</span>
                  <span className="text-[10px] text-indigo-400 font-medium">{sub}</span>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Hướng dẫn nạp dữ liệu</h3>
              <div className="text-xs text-slate-300 leading-relaxed flex flex-col gap-2">
                <p>🔹 Dùng tab <strong>Dán JSON & Import</strong> để paste dữ liệu từ AI tool, hệ thống sẽ tự phân tích xung đột và cho bạn chọn keep/overwrite từng dòng.</p>
                <p>🔹 Dùng tab <strong>Presets</strong> để đồng bộ các file JSON preset có sẵn trên server.</p>
                <p>🔹 Hiện có <strong>{stats?.cutoffs ?? 0}</strong> bản ghi điểm chuẩn — mục tiêu tối thiểu là 500 bản ghi (5–10 năm × 75 trường).</p>
              </div>
            </div>
          </div>

        ) : adminTab === 'presets' ? (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-400" /> Presets Lớp 10 Có Sẵn
                </h3>
                <p className="text-xs text-slate-400 mt-1">Các tệp cấu hình chứa dữ liệu điểm chuẩn lớp 10 của Sở GD&ĐT TP.HCM.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {presets.map((preset) => (
                  <div key={preset.filename} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full">Dữ liệu {preset.dataYear}</span>
                        <span className="text-xs text-slate-500 font-mono">{preset.filename}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white mt-2">{preset.sourceName}</h4>
                      <div className="flex gap-4 mt-3 text-[11px] text-slate-400">
                        <span>🏫 Trường: <strong>{preset.schoolsCount}</strong></span>
                        <span>📈 Điểm chuẩn: <strong>{preset.cutoffsCount}</strong></span>
                      </div>
                    </div>
                    <button onClick={() => handleSyncPreset(preset.filename)} disabled={syncingPreset !== null}
                      className="w-full mt-2 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg transition">
                      {syncingPreset === preset.filename ? '⏳ Đang đồng bộ...' : '📥 Đồng bộ & Import vào DB'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        ) : adminTab === 'paste' ? (
          /* ── PASTE JSON + CONFLICT REVIEW ──────────────────────────────────── */
          <div className="flex flex-col gap-6">

            {/* Step 1: Paste */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ClipboardPaste className="h-5 w-5 text-indigo-400" />
                    Bước 1 — Dán JSON từ AI tool
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Paste JSON có cấu trúc <code className="bg-slate-800 px-1 rounded text-indigo-300">districts[].schools[].cutoffs[]</code> rồi nhấn Phân tích.
                  </p>
                </div>
                {parsedPayload && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold whitespace-nowrap">
                    ✓ Đã phân tích
                  </span>
                )}
              </div>

              <textarea
                value={pasteJson}
                onChange={(e) => {
                  setPasteJson(e.target.value);
                  setParseError(''); setConflicts([]); setParsedPayload(null); setImportResult(null);
                }}
                placeholder={'{\n  "sourceName": "Web Research - NHÓM A",\n  "dataYear": 2024,\n  "districts": [...]\n}'}
                rows={9}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition resize-y"
              />

              {parseError && (
                <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {parseError}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleAnalyze} disabled={analyzing || !pasteJson.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition">
                  {analyzing
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang phân tích...</>
                    : '🔍 Phân tích & So sánh DB'
                  }
                </button>
              </div>
            </div>

            {/* Step 2: Conflict Review */}
            {conflicts.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                    Bước 2 — Xem xét xung đột dữ liệu
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">✨ Mới: {totalNew}</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">⚡ Xung đột: {totalConflict}</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold">📝 Ghi đè: {totalOverwrite}</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-700 border border-slate-600 text-slate-300 font-semibold">🔒 Giữ cũ: {totalKeep}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {Object.entries(schoolGroups).map(([schoolCode, rows]) => {
                    const hasConflict = rows.some(r => r.existingCutoff);
                    const isExpanded = expandedSchools.has(schoolCode);
                    const { schoolName, districtName } = rows[0];

                    return (
                      <div key={schoolCode} className={`rounded-xl border overflow-hidden ${
                        hasConflict ? 'border-amber-500/25 bg-amber-500/5' : 'border-slate-800 bg-slate-950/40'
                      }`}>
                        {/* School header row */}
                        <button
                          onClick={() => setExpandedSchools(prev => {
                            const next = new Set(prev);
                            next.has(schoolCode) ? next.delete(schoolCode) : next.add(schoolCode);
                            return next;
                          })}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/20 transition"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              hasConflict
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            }`}>
                              {hasConflict ? `⚡ ${rows.filter(r => r.existingCutoff).length} xung đột` : `✨ ${rows.length} mới`}
                            </span>
                            <span className="text-sm font-bold text-white">{schoolName}</span>
                            <span className="text-xs text-slate-400">{districtName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">[{schoolCode}]</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {hasConflict && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAllForSchool(schoolCode, 'KEEP'); }}
                                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold transition"
                                >Giữ hết</button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setAllForSchool(schoolCode, 'OVERWRITE'); }}
                                  className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 font-semibold transition"
                                >Ghi đè hết</button>
                              </>
                            )}
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-slate-400" />
                              : <ChevronDown className="h-4 w-4 text-slate-400" />
                            }
                          </div>
                        </button>

                        {/* Rows table */}
                        {isExpanded && (
                          <div className="border-t border-slate-800 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-950/80 text-slate-500 text-[10px] uppercase">
                                  <th className="px-4 py-2 text-left w-16">Năm</th>
                                  <th className="px-4 py-2 text-center" colSpan={3}>── Hiện trong DB ──</th>
                                  <th className="px-4 py-2 text-center" colSpan={3}>── Dữ liệu mới ──</th>
                                  <th className="px-4 py-2 text-center w-40">Quyết định</th>
                                </tr>
                                <tr className="bg-slate-950/50 text-slate-500 text-[10px]">
                                  <th className="px-4 py-1"></th>
                                  <th className="px-4 py-1 text-center text-slate-600">NV1</th>
                                  <th className="px-4 py-1 text-center text-slate-600">NV2</th>
                                  <th className="px-4 py-1 text-center text-slate-600">NV3</th>
                                  <th className="px-4 py-1 text-center text-indigo-500">NV1</th>
                                  <th className="px-4 py-1 text-center text-indigo-500">NV2</th>
                                  <th className="px-4 py-1 text-center text-indigo-500">NV3</th>
                                  <th></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60">
                                {rows.map(row => (
                                  <tr key={row.year} className={`transition ${
                                    row.decision === 'OVERWRITE' ? 'bg-indigo-500/5' : ''
                                  } hover:bg-slate-800/20`}>
                                    <td className="px-4 py-2.5 font-bold text-white">{row.year}</td>
                                    {/* DB values */}
                                    <td className={`px-4 py-2.5 text-center font-semibold ${
                                      row.existingCutoff && row.existingCutoff.nv1 !== row.newCutoff.nv1
                                        ? 'text-amber-400' : 'text-slate-500'
                                    }`}>
                                      {row.existingCutoff?.nv1 ?? <span className="text-slate-700">—</span>}
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-slate-600">{row.existingCutoff?.nv2 ?? '—'}</td>
                                    <td className="px-4 py-2.5 text-center text-slate-600">{row.existingCutoff?.nv3 ?? '—'}</td>
                                    {/* New values */}
                                    <td className={`px-4 py-2.5 text-center font-bold ${
                                      !row.existingCutoff ? 'text-emerald-400' :
                                      row.existingCutoff.nv1 !== row.newCutoff.nv1 ? 'text-indigo-400' : 'text-slate-300'
                                    }`}>
                                      {row.newCutoff.nv1}
                                    </td>
                                    <td className="px-4 py-2.5 text-center text-slate-400">{row.newCutoff.nv2 ?? '—'}</td>
                                    <td className="px-4 py-2.5 text-center text-slate-400">{row.newCutoff.nv3 ?? '—'}</td>
                                    {/* Decision */}
                                    <td className="px-4 py-2.5 text-center">
                                      {row.decision === 'NEW' ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                                          ✨ Thêm mới
                                        </span>
                                      ) : (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            onClick={() => setDecision(row.schoolCode, row.year, 'KEEP')}
                                            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-bold transition ${
                                              row.decision === 'KEEP'
                                                ? 'bg-slate-700 border-slate-500 text-white'
                                                : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800'
                                            }`}
                                          >
                                            <XCircle className="h-2.5 w-2.5" /> Giữ cũ
                                          </button>
                                          <button
                                            onClick={() => setDecision(row.schoolCode, row.year, 'OVERWRITE')}
                                            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-bold transition ${
                                              row.decision === 'OVERWRITE'
                                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                                : 'bg-transparent border-indigo-700/40 text-indigo-400 hover:bg-indigo-600/20'
                                            }`}
                                          >
                                            <CheckCircle2 className="h-2.5 w-2.5" /> Ghi đè
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Confirm bar */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-5 mt-1 gap-4 flex-wrap">
                  <div className="text-xs text-slate-400">
                    Sẽ import: <strong className="text-white">{totalNew + totalOverwrite}</strong> bản ghi
                    &nbsp;({totalNew} mới, {totalOverwrite} ghi đè) &nbsp;·&nbsp; Bỏ qua: <strong className="text-slate-300">{totalKeep}</strong>
                  </div>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing || (totalNew + totalOverwrite) === 0}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition"
                  >
                    {importing
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang import...</>
                      : `✅ Xác nhận Import (${totalNew + totalOverwrite} bản ghi)`
                    }
                  </button>
                </div>

                {importResult && (
                  <div className={`text-xs px-4 py-3 rounded-xl border ${
                    importResult.error
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {importResult.error
                      ? `❌ Import thất bại: ${importResult.error}`
                      : `✅ Thành công! Cập nhật ${importResult.schoolsAdded + importResult.schoolsUpdated} trường, thêm ${importResult.cutoffsAdded} điểm chuẩn.`
                    }
                  </div>
                )}
              </div>
            )}

            {parsedPayload && conflicts.length === 0 && !analyzing && (
              <div className="text-center py-8 text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
                ⚠️ JSON hợp lệ nhưng không tìm thấy điểm chuẩn nào có thể import.
              </div>
            )}
          </div>

        ) : (
          /* ── HISTORY ──────────────────────────────────────────────────────── */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-400" /> Nhật Ký Lịch Sử Import
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="p-4">Thời gian</th>
                    <th className="p-4">Nguồn dữ liệu</th>
                    <th className="p-4 text-center">Bản ghi</th>
                    <th className="p-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">Chưa có lượt import nào được ghi nhận.</td>
                    </tr>
                  ) : history.map((log) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-6 text-center text-xs text-slate-500 mt-auto">
        <p className="m-0">© 2026 Grade 10 HCMC Admission Engine Admin.</p>
      </footer>
    </div>
  );
}
