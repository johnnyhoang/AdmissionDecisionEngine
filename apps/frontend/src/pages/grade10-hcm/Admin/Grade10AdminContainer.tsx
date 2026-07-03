import { useState, useEffect, useRef } from 'react';
import { 
  Database, History, Sliders, TrendingUp, 
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Loader2, ClipboardPaste, ShieldAlert,
  Sparkles, Square, CheckSquare, Play, StopCircle
} from 'lucide-react';
import { 
  fetchG10AdminStats, fetchG10ImportPresets, runG10ImportPreset, 
  fetchG10ImportHistory, triggerG10ImportPayload, fetchG10SchoolByCode,
  fetchGrade10SchoolNames, searchAiCutoffs, importAiCutoffs
} from '../../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type CutoffDecision = 'KEEP' | 'OVERWRITE' | 'NEW';
type QuotaDecision  = 'KEEP' | 'OVERWRITE' | 'NEW';

interface CutoffConflictRow {
  type: 'cutoff';
  schoolCode: string;
  schoolName: string;
  districtName: string;
  year: number;
  newCutoff: { nv1: number; nv2?: number; nv3?: number };
  existingCutoff?: { nv1: number; nv2?: number; nv3?: number };
  decision: CutoffDecision;
}

interface QuotaConflictRow {
  type: 'quota';
  schoolCode: string;
  schoolName: string;
  districtName: string;
  year: number;
  newQuota: { quota: number; registeredCount?: number; competitionRatio?: number };
  existingQuota?: { quota: number; registeredCount?: number; competitionRatio?: number };
  decision: QuotaDecision;
}

type ConflictRow = CutoffConflictRow | QuotaConflictRow;

interface ParsedImport {
  sourceName: string;
  sourceUrl?: string;
  dataYear: number;
  districts: any[];
}

// ── Batch AI Search types ──────────────────────────────────────────────────────

type BatchJobStatus = 'pending' | 'searching' | 'done' | 'error' | 'skipped';

interface BatchJob {
  id: string;
  schoolCode: string;
  schoolName: string;
  districtName?: string;
  districtCode?: string;
  status: BatchJobStatus;
  foundYears?: number;
  error?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Grade10AdminContainer() {
  const [adminTab, setAdminTab] = useState<'dashboard' | 'presets' | 'paste' | 'batch-ai' | 'history'>('dashboard');
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

  // Batch AI state
  const [batchSchools, setBatchSchools] = useState<{ id: string; name: string; code: string; districtName?: string; districtCode?: string }[]>([]);
  const [batchSelected, setBatchSelected] = useState<Set<string>>(new Set());
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const batchCancelRef = useRef(false);

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

  // Load schools for batch tab on first open
  useEffect(() => {
    if (adminTab === 'batch-ai' && batchSchools.length === 0) {
      fetchGrade10SchoolNames().then(data => {
        setBatchSchools(data as any[]);
      }).catch(() => {});
    }
  }, [adminTab]);

  const handleSyncPreset = async (filename: string) => {
    setSyncingPreset(filename);
    try {
      const res = await runG10ImportPreset(filename);
      alert(`✅ Đồng bộ thành công! ${res.schoolsAdded + res.schoolsUpdated} trường, ${res.cutoffsAdded} điểm chuẩn.`);
      await loadData();
    } catch (e: any) { alert(`❌ Đồng bộ thất bại: ${e.message}`); }
    finally { setSyncingPreset(null); }
  };

  // ── Paste Import ─────────────────────────────────────────────────────────────

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
        const hasCutoffs = school.cutoffs && school.cutoffs.length > 0;
        const hasQuotas = school.quotas && school.quotas.length > 0;
        if (!hasCutoffs && !hasQuotas) continue;

        let existingCutoffsMap: Record<number, any> = {};
        let existingQuotasMap: Record<number, any> = {};
        try {
          const detail = await fetchG10SchoolByCode(school.code);
          if (detail?.cutoffScores) {
            for (const c of detail.cutoffScores) existingCutoffsMap[c.year] = c;
          }
          if (detail?.quotas) {
            for (const q of detail.quotas) existingQuotasMap[q.year] = q;
          }
        } catch (_) { /* school might not exist yet */ }

        // Parse cutoff rows
        for (const cutoff of school.cutoffs || []) {
          if (!cutoff.cutoffNV1 && cutoff.cutoffNV1 !== 0) continue;
          const existing = existingCutoffsMap[cutoff.year];
          rows.push({
            type: 'cutoff',
            schoolCode: school.code,
            schoolName: school.name,
            districtName: district.name,
            year: cutoff.year,
            newCutoff: { nv1: cutoff.cutoffNV1, nv2: cutoff.cutoffNV2, nv3: cutoff.cutoffNV3 },
            existingCutoff: existing
              ? { nv1: existing.cutoffNV1, nv2: existing.cutoffNV2, nv3: existing.cutoffNV3 }
              : undefined,
            decision: existing ? 'KEEP' : 'NEW',
          } as CutoffConflictRow);
        }

        // Parse quota rows
        for (const quota of school.quotas || []) {
          if (!quota.quota && quota.quota !== 0) continue;
          const existing = existingQuotasMap[quota.year];
          rows.push({
            type: 'quota',
            schoolCode: school.code,
            schoolName: school.name,
            districtName: district.name,
            year: quota.year,
            newQuota: { quota: quota.quota, registeredCount: quota.registeredCount, competitionRatio: quota.competitionRatio },
            existingQuota: existing
              ? { quota: existing.quota, registeredCount: existing.registeredCount, competitionRatio: existing.competitionRatio }
              : undefined,
            decision: existing ? 'KEEP' : 'NEW',
          } as QuotaConflictRow);
        }
      }
    }

    setConflicts(rows);
    setAnalyzing(false);
    const conflictSchools = new Set(
      rows.filter(r => (r.type === 'cutoff' ? r.existingCutoff : (r as QuotaConflictRow).existingQuota))
        .map(r => r.schoolCode)
    );
    setExpandedSchools(conflictSchools);
  };

  const setDecision = (schoolCode: string, year: number, rowType: 'cutoff' | 'quota', decision: CutoffDecision | QuotaDecision) => {
    setConflicts(prev => prev.map(r =>
      r.schoolCode === schoolCode && r.year === year && r.type === rowType
        ? { ...r, decision } as any
        : r
    ));
  };

  const setAllForSchool = (schoolCode: string, decision: CutoffDecision) => {
    setConflicts(prev => prev.map(r =>
      r.schoolCode === schoolCode && r.type === 'cutoff' && (r as CutoffConflictRow).existingCutoff
        ? { ...r, decision }
        : r.schoolCode === schoolCode && r.type === 'quota' && (r as QuotaConflictRow).existingQuota
          ? { ...r, decision }
          : r
    ));
  };

  const handleConfirmImport = async () => {
    if (!parsedPayload) return;
    setImporting(true);
    setImportResult(null);

    // Build allowed key sets per type
    const allowedCutoffKeys = new Set(
      conflicts.filter(r => r.type === 'cutoff' && r.decision !== 'KEEP').map(r => `${r.schoolCode}__${r.year}`)
    );
    const allowedQuotaKeys = new Set(
      conflicts.filter(r => r.type === 'quota' && r.decision !== 'KEEP').map(r => `${r.schoolCode}__${r.year}`)
    );

    const filteredPayload: ParsedImport = {
      ...parsedPayload,
      districts: parsedPayload.districts.map(district => ({
        ...district,
        schools: district.schools.map((school: any) => ({
          ...school,
          cutoffs: (school.cutoffs || []).filter((c: any) =>
            allowedCutoffKeys.has(`${school.code}__${c.year}`)
          ),
          quotas: (school.quotas || []).filter((q: any) =>
            allowedQuotaKeys.has(`${school.code}__${q.year}`)
          ),
        })).filter((s: any) => s.cutoffs.length > 0 || s.quotas.length > 0)
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

  // Grouped by school code for display
  const schoolGroups = conflicts.reduce<Record<string, ConflictRow[]>>((acc, row) => {
    if (!acc[row.schoolCode]) acc[row.schoolCode] = [];
    acc[row.schoolCode].push(row);
    return acc;
  }, {});

  const totalNew       = conflicts.filter(r => r.decision === 'NEW').length;
  const totalConflict  = conflicts.filter(r => r.type === 'cutoff'
    ? (r as CutoffConflictRow).existingCutoff
    : (r as QuotaConflictRow).existingQuota
  ).length;
  const totalOverwrite = conflicts.filter(r => r.decision === 'OVERWRITE').length;
  const totalKeep      = conflicts.filter(r => r.decision === 'KEEP').length;

  // ── Batch AI Search ───────────────────────────────────────────────────────────

  const toggleSelectSchool = (id: string) => {
    setBatchSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (batchSelected.size === batchSchools.length) {
      setBatchSelected(new Set());
    } else {
      setBatchSelected(new Set(batchSchools.map(s => s.id)));
    }
  };

  const handleStartBatch = async () => {
    if (batchSelected.size === 0) { alert('Vui lòng chọn ít nhất một trường.'); return; }

    const selectedSchools = batchSchools.filter(s => batchSelected.has(s.id));
    const jobs: BatchJob[] = selectedSchools.map(s => ({
      id: s.id,
      schoolCode: s.code,
      schoolName: s.name,
      districtName: (s as any).districtName,
      districtCode: (s as any).districtCode,
      status: 'pending',
    }));

    setBatchJobs(jobs);
    setBatchRunning(true);
    batchCancelRef.current = false;

    for (let i = 0; i < jobs.length; i++) {
      if (batchCancelRef.current) break;
      
      setBatchJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'searching' } : j));

      try {
        const res = await searchAiCutoffs({
          type: 'GRADE10',
          schoolQuery: jobs[i].schoolName,
          schoolCode: jobs[i].schoolCode,
          districtName: jobs[i].districtName,
          districtCode: jobs[i].districtCode,
        });

        // Auto-import all NEW items found
        const overrides = (res.results || [])
          .filter((item: any) => !item.exists)
          .map((item: any) => ({
            year: item.year,
            cutoffNV1: item.cutoffNV1,
            cutoffNV2: item.cutoffNV2,
            cutoffNV3: item.cutoffNV3,
            quota: item.quota,
            registeredCount: item.registeredCount,
            competitionRatio: item.competitionRatio,
          }));

        if (overrides.length > 0) {
          await importAiCutoffs({
            type: 'GRADE10',
            schoolCode: res.schoolCode,
            districtName: jobs[i].districtName,
            overrides,
          });
        }

        setBatchJobs(prev => prev.map((j, idx) => idx === i
          ? { ...j, status: 'done', foundYears: res.results?.length ?? 0 }
          : j
        ));
      } catch (err: any) {
        setBatchJobs(prev => prev.map((j, idx) => idx === i
          ? { ...j, status: 'error', error: err.message || 'Lỗi không xác định' }
          : j
        ));
      }

      // Small delay between requests to be polite to the API
      if (i < jobs.length - 1 && !batchCancelRef.current) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    setBatchRunning(false);
  };

  const handleCancelBatch = () => {
    batchCancelRef.current = true;
    setBatchRunning(false);
  };

  const batchDone   = batchJobs.filter(j => j.status === 'done').length;
  const batchError  = batchJobs.filter(j => j.status === 'error').length;
  const batchTotal  = batchJobs.length;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

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
            ['dashboard',  'dashboard',  <TrendingUp key="t" className="h-4 w-4" />,      'Thống kê'],
            ['presets',    'presets',    <Database key="d" className="h-4 w-4" />,        `Presets (${presets.length})`],
            ['paste',      'paste',      <ClipboardPaste key="c" className="h-4 w-4" />,  'Dán JSON & Import'],
            ['batch-ai',   'batch-ai',   <Sparkles key="s" className="h-4 w-4" />,        'Tìm AI Hàng Loạt'],
            ['history',    'history',    <History key="h" className="h-4 w-4" />,         `Lịch sử (${history.length})`],
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
                ['Trường THPT',       stats?.schools   ?? 0, 'Trường công lập TP.HCM'],
                ['Quận / Huyện',      stats?.districts ?? 0, 'Phân chia hành chính'],
                ['Chỉ tiêu (Quotas)', stats?.quotas    ?? 0, 'Bản ghi qua các năm'],
                ['Điểm Chuẩn',        stats?.cutoffs   ?? 0, 'Bản ghi điểm chuẩn'],
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
                <p>🔹 Dùng tab <strong>Dán JSON & Import</strong> để paste dữ liệu từ AI tool, hệ thống sẽ tự phân tích xung đột và cho bạn chọn keep/overwrite từng dòng (cả cutoffs lẫn quotas).</p>
                <p>🔹 Dùng tab <strong>Tìm AI Hàng Loạt</strong> để tự động tìm kiếm nhiều trường cùng lúc qua Gemini AI và lưu ngay các dữ liệu mới.</p>
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
                    Paste JSON có cấu trúc <code className="bg-slate-800 px-1 rounded text-indigo-300">districts[].schools[].cutoffs[] & .quotas[]</code> rồi nhấn Phân tích.
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
                    const cutoffRows = rows.filter(r => r.type === 'cutoff') as CutoffConflictRow[];
                    const quotaRows  = rows.filter(r => r.type === 'quota')  as QuotaConflictRow[];
                    const hasConflict = rows.some(r =>
                      r.type === 'cutoff' ? r.existingCutoff : (r as QuotaConflictRow).existingQuota
                    );
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
                              {hasConflict ? `⚡ xung đột` : `✨ ${rows.length} mới`}
                            </span>
                            <span className="text-sm font-bold text-white">{schoolName}</span>
                            <span className="text-xs text-slate-400">{districtName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">[{schoolCode}]</span>
                            {cutoffRows.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">📈 {cutoffRows.length} điểm chuẩn</span>
                            )}
                            {quotaRows.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">🎯 {quotaRows.length} chỉ tiêu</span>
                            )}
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

                        {/* Expanded rows */}
                        {isExpanded && (
                          <div className="border-t border-slate-800 overflow-x-auto">
                            {/* Cutoff rows */}
                            {cutoffRows.length > 0 && (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-slate-950/80 text-slate-500 text-[10px] uppercase">
                                    <th className="px-4 py-2 text-left" colSpan={8}>
                                      📈 Điểm chuẩn (NV1/NV2/NV3)
                                    </th>
                                  </tr>
                                  <tr className="bg-slate-950/50 text-slate-500 text-[10px]">
                                    <th className="px-4 py-2 text-left w-16">Năm</th>
                                    <th className="px-4 py-2 text-center" colSpan={3}>── Hiện trong DB ──</th>
                                    <th className="px-4 py-2 text-center" colSpan={3}>── Dữ liệu mới ──</th>
                                    <th className="px-4 py-2 text-center w-40">Quyết định</th>
                                  </tr>
                                  <tr className="bg-slate-950/40 text-slate-600 text-[10px]">
                                    <th className="px-4 py-1"></th>
                                    <th className="px-4 py-1 text-center">NV1</th>
                                    <th className="px-4 py-1 text-center">NV2</th>
                                    <th className="px-4 py-1 text-center">NV3</th>
                                    <th className="px-4 py-1 text-center text-indigo-500">NV1</th>
                                    <th className="px-4 py-1 text-center text-indigo-500">NV2</th>
                                    <th className="px-4 py-1 text-center text-indigo-500">NV3</th>
                                    <th></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                  {cutoffRows.map(row => (
                                    <tr key={`cutoff-${row.year}`} className={`transition ${
                                      row.decision === 'OVERWRITE' ? 'bg-indigo-500/5' : ''
                                    } hover:bg-slate-800/20`}>
                                      <td className="px-4 py-2.5 font-bold text-white">{row.year}</td>
                                      {/* DB values */}
                                      <td className={`px-4 py-2.5 text-center font-semibold ${
                                        row.existingCutoff && row.existingCutoff.nv1 !== row.newCutoff.nv1
                                          ? 'text-amber-400' : 'text-slate-500'
                                      }`}>{row.existingCutoff?.nv1 ?? <span className="text-slate-700">—</span>}</td>
                                      <td className="px-4 py-2.5 text-center text-slate-600">{row.existingCutoff?.nv2 ?? '—'}</td>
                                      <td className="px-4 py-2.5 text-center text-slate-600">{row.existingCutoff?.nv3 ?? '—'}</td>
                                      {/* New values */}
                                      <td className={`px-4 py-2.5 text-center font-bold ${
                                        !row.existingCutoff ? 'text-emerald-400' :
                                        row.existingCutoff.nv1 !== row.newCutoff.nv1 ? 'text-indigo-400' : 'text-slate-300'
                                      }`}>{row.newCutoff.nv1}</td>
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
                                              onClick={() => setDecision(row.schoolCode, row.year, 'cutoff', 'KEEP')}
                                              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-bold transition ${
                                                row.decision === 'KEEP'
                                                  ? 'bg-slate-700 border-slate-500 text-white'
                                                  : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800'
                                              }`}
                                            >
                                              <XCircle className="h-2.5 w-2.5" /> Giữ cũ
                                            </button>
                                            <button
                                              onClick={() => setDecision(row.schoolCode, row.year, 'cutoff', 'OVERWRITE')}
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
                            )}

                            {/* Quota rows */}
                            {quotaRows.length > 0 && (
                              <table className="w-full text-xs border-t border-slate-800/60">
                                <thead>
                                  <tr className="bg-slate-950/80 text-slate-500 text-[10px] uppercase">
                                    <th className="px-4 py-2 text-left" colSpan={8}>
                                      🎯 Chỉ tiêu tuyển sinh
                                    </th>
                                  </tr>
                                  <tr className="bg-slate-950/40 text-slate-600 text-[10px]">
                                    <th className="px-4 py-1 text-left w-16">Năm</th>
                                    <th className="px-4 py-1 text-center">Chỉ tiêu (DB)</th>
                                    <th className="px-4 py-1 text-center">ĐK (DB)</th>
                                    <th className="px-4 py-1 text-center">Tỷ lệ (DB)</th>
                                    <th className="px-4 py-1 text-center text-blue-500">Chỉ tiêu (Mới)</th>
                                    <th className="px-4 py-1 text-center text-blue-500">ĐK (Mới)</th>
                                    <th className="px-4 py-1 text-center text-blue-500">Tỷ lệ (Mới)</th>
                                    <th className="px-4 py-1 text-center w-40">Quyết định</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                  {quotaRows.map(row => {
                                    const hasChange = row.existingQuota && (
                                      row.existingQuota.quota !== row.newQuota.quota ||
                                      row.existingQuota.registeredCount !== row.newQuota.registeredCount
                                    );
                                    return (
                                      <tr key={`quota-${row.year}`} className={`transition ${
                                        row.decision === 'OVERWRITE' ? 'bg-blue-500/5' : ''
                                      } hover:bg-slate-800/20`}>
                                        <td className="px-4 py-2.5 font-bold text-white">{row.year}</td>
                                        {/* DB values */}
                                        <td className={`px-4 py-2.5 text-center font-semibold ${hasChange ? 'text-amber-400' : 'text-slate-500'}`}>
                                          {row.existingQuota?.quota ?? <span className="text-slate-700">—</span>}
                                        </td>
                                        <td className="px-4 py-2.5 text-center text-slate-600">{row.existingQuota?.registeredCount ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-center text-slate-600">{row.existingQuota?.competitionRatio ?? '—'}</td>
                                        {/* New values */}
                                        <td className={`px-4 py-2.5 text-center font-bold ${
                                          !row.existingQuota ? 'text-emerald-400' :
                                          hasChange ? 'text-blue-400' : 'text-slate-300'
                                        }`}>{row.newQuota.quota}</td>
                                        <td className="px-4 py-2.5 text-center text-slate-400">{row.newQuota.registeredCount ?? '—'}</td>
                                        <td className="px-4 py-2.5 text-center text-slate-400">{row.newQuota.competitionRatio ?? '—'}</td>
                                        {/* Decision */}
                                        <td className="px-4 py-2.5 text-center">
                                          {row.decision === 'NEW' ? (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                                              ✨ Thêm mới
                                            </span>
                                          ) : (
                                            <div className="flex items-center justify-center gap-1.5">
                                              <button
                                                onClick={() => setDecision(row.schoolCode, row.year, 'quota', 'KEEP')}
                                                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-bold transition ${
                                                  row.decision === 'KEEP'
                                                    ? 'bg-slate-700 border-slate-500 text-white'
                                                    : 'bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800'
                                                }`}
                                              >
                                                <XCircle className="h-2.5 w-2.5" /> Giữ cũ
                                              </button>
                                              <button
                                                onClick={() => setDecision(row.schoolCode, row.year, 'quota', 'OVERWRITE')}
                                                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-bold transition ${
                                                  row.decision === 'OVERWRITE'
                                                    ? 'bg-blue-600 border-blue-500 text-white'
                                                    : 'bg-transparent border-blue-700/40 text-blue-400 hover:bg-blue-600/20'
                                                }`}
                                              >
                                                <CheckCircle2 className="h-2.5 w-2.5" /> Ghi đè
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
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
                      : `✅ Thành công! Cập nhật ${importResult.schoolsAdded + importResult.schoolsUpdated} trường, thêm ${importResult.cutoffsAdded} điểm chuẩn, ${importResult.quotasAdded ?? 0} chỉ tiêu.`
                    }
                  </div>
                )}
              </div>
            )}

            {parsedPayload && conflicts.length === 0 && !analyzing && (
              <div className="text-center py-8 text-slate-400 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
                ⚠️ JSON hợp lệ nhưng không tìm thấy điểm chuẩn hoặc chỉ tiêu nào có thể import.
              </div>
            )}
          </div>

        ) : adminTab === 'batch-ai' ? (
          /* ── BATCH AI SEARCH ──────────────────────────────────────────────── */
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                  Tìm Dữ Liệu AI Hàng Loạt
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn các trường cần tìm kiếm. Hệ thống sẽ lần lượt gọi AI để tìm điểm chuẩn & chỉ tiêu, và tự động lưu dữ liệu mới (không ghi đè dữ liệu cũ).
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  Mỗi lần gọi AI sẽ mất phí API. Chỉ dữ liệu <strong>mới (chưa có trong DB)</strong> được tự động import. Dữ liệu đã có sẽ được bỏ qua.
                </div>
              </div>

              {/* School selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Chọn trường ({batchSelected.size}/{batchSchools.length})
                  </span>
                  <button
                    onClick={toggleSelectAll}
                    disabled={batchRunning}
                    className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition disabled:opacity-50"
                  >
                    {batchSelected.size === batchSchools.length
                      ? <><Square className="h-3 w-3" /> Bỏ chọn tất cả</>
                      : <><CheckSquare className="h-3 w-3" /> Chọn tất cả</>
                    }
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-slate-800 md:divide-y-0">
                  {batchSchools.map(school => {
                    const isSelected = batchSelected.has(school.id);
                    const job = batchJobs.find(j => j.id === school.id);
                    return (
                      <button
                        key={school.id}
                        onClick={() => !batchRunning && toggleSelectSchool(school.id)}
                        disabled={batchRunning}
                        className={`flex items-center gap-2.5 px-3 py-2.5 text-left transition ${
                          isSelected ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-800/40'
                        } disabled:cursor-not-allowed`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-600 border-indigo-500' : 'border-slate-600'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-slate-200 truncate">{school.name}</div>
                          <div className="text-[9px] text-slate-500">{(school as any).districtName || school.code}</div>
                        </div>
                        {/* Job status indicator */}
                        {job && (
                          <div className="shrink-0">
                            {job.status === 'searching' && <Loader2 className="h-3 w-3 text-indigo-400 animate-spin" />}
                            {job.status === 'done'      && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                            {job.status === 'error'     && <XCircle className="h-3 w-3 text-rose-400" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Run / Cancel */}
              <div className="flex items-center gap-3">
                {!batchRunning ? (
                  <button
                    onClick={handleStartBatch}
                    disabled={batchSelected.size === 0}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Chạy AI cho {batchSelected.size} trường
                  </button>
                ) : (
                  <button
                    onClick={handleCancelBatch}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    Dừng lại
                  </button>
                )}
                {batchJobs.length > 0 && (
                  <span className="text-xs text-slate-400">
                    Tiến trình: <strong className="text-white">{batchDone + batchError}</strong>/{batchTotal} &nbsp;·&nbsp;
                    <span className="text-emerald-400">{batchDone} thành công</span>
                    {batchError > 0 && <span className="text-rose-400"> · {batchError} lỗi</span>}
                  </span>
                )}
              </div>
            </div>

            {/* Job Results */}
            {batchJobs.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white">Kết quả tìm kiếm</h4>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-slate-800">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${batchTotal > 0 ? ((batchDone + batchError) / batchTotal) * 100 : 0}%` }}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px] uppercase">
                        <th className="px-4 py-2 text-left">Trường</th>
                        <th className="px-4 py-2 text-left">Quận/Huyện</th>
                        <th className="px-4 py-2 text-center">Trạng thái</th>
                        <th className="px-4 py-2 text-center">Dữ liệu tìm thấy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {batchJobs.map(job => (
                        <tr key={job.id} className="hover:bg-slate-800/20">
                          <td className="px-4 py-2.5 font-semibold text-white">{job.schoolName}</td>
                          <td className="px-4 py-2.5 text-slate-400">{job.districtName || '—'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {job.status === 'pending'   && <span className="text-slate-500 text-[10px]">⏳ Chờ</span>}
                            {job.status === 'searching' && <span className="flex items-center justify-center gap-1 text-indigo-400 text-[10px]"><Loader2 className="h-3 w-3 animate-spin" />Đang tìm...</span>}
                            {job.status === 'done'      && <span className="text-emerald-400 text-[10px] font-bold">✅ Xong</span>}
                            {job.status === 'error'     && <span className="text-rose-400 text-[10px] font-bold">❌ Lỗi</span>}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {job.status === 'done'  && <span className="font-bold text-indigo-400">{job.foundYears ?? 0} năm</span>}
                            {job.status === 'error' && <span className="text-rose-400 text-[10px] italic truncate max-w-[200px] block">{job.error}</span>}
                            {(job.status === 'pending' || job.status === 'searching') && <span className="text-slate-600">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
