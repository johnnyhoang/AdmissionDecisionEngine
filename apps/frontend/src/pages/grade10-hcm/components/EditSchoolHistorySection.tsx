import { Calculator } from 'lucide-react';
import { formatSchoolYear } from '../../../utils/date';

interface EditSchoolHistorySectionProps {
  yearsList: number[];
  cutoffsMap: Record<number, any>;
  quotasMap: Record<number, any>;
  onAddYear: () => void;
  onCutoffChange: (year: number, field: string, value: string) => void;
  onQuotaChange: (year: number, field: string, value: string) => void;
}

export default function EditSchoolHistorySection({
  yearsList,
  cutoffsMap,
  quotasMap,
  onAddYear,
  onCutoffChange,
  onQuotaChange,
}: EditSchoolHistorySectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-400" />
          Dữ liệu Lịch sử
        </span>
        <button
          type="button"
          onClick={onAddYear}
          className="px-2.5 py-1 bg-indigo-650 hover:bg-indigo-600 text-white rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
        >
          + Thêm năm học
        </button>
      </h3>

      <div className="flex flex-col gap-3 md:hidden">
        {yearsList.map((year) => {
          const q = quotasMap[year] || {};
          const c = cutoffsMap[year] || {};
          return (
            <div key={year} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white">Năm học {formatSchoolYear(year)}</span>
                <span className="text-[10px] font-bold text-emerald-400">Tỉ lệ chọi: {q.competitionRatio || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Chỉ tiêu</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={q.quota || ''}
                    onChange={(e) => onQuotaChange(year, 'quota', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Số đăng ký</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={q.registeredCount || ''}
                    onChange={(e) => onQuotaChange(year, 'registeredCount', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Tỉ lệ chọi</label>
                  <div className="w-full bg-emerald-950/10 border border-slate-700 rounded px-2 py-1.5 text-sm font-bold text-emerald-300">
                    {q.competitionRatio || '0.00'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['cutoffNV1', 'cutoffNV2', 'cutoffNV3'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">{field.toUpperCase()}</label>
                    <input
                      type="number"
                      step="0.25"
                      value={c[field] || ''}
                      onChange={(e) => onCutoffChange(year, field, e.target.value)}
                      className="w-full bg-slate-950 border border-indigo-900/50 rounded px-2 py-1.5 text-sm outline-none focus:border-indigo-500 text-indigo-300 font-medium"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap border-collapse">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 border border-slate-800 w-24">Năm học</th>
              <th className="px-4 py-3 border border-slate-800">Chỉ tiêu</th>
              <th className="px-4 py-3 border border-slate-800">Số đăng ký</th>
              <th className="px-4 py-3 border border-slate-800 bg-emerald-950/20 text-emerald-400">Tỉ lệ chọi (Auto)</th>
              <th className="px-4 py-3 border border-slate-800 bg-indigo-950/20 text-indigo-400">Điểm NV1</th>
              <th className="px-4 py-3 border border-slate-800 bg-indigo-950/20 text-indigo-400">Điểm NV2</th>
              <th className="px-4 py-3 border border-slate-800 bg-indigo-950/20 text-indigo-400">Điểm NV3</th>
            </tr>
          </thead>
          <tbody>
            {yearsList.map((year) => {
              const q = quotasMap[year] || {};
              const c = cutoffsMap[year] || {};
              return (
                <tr key={year} className="border-b border-slate-800">
                  <td className="px-4 py-2 border border-slate-800 font-semibold">{formatSchoolYear(year)}</td>
                  <td className="px-4 py-2 border border-slate-800">
                    <input type="number" value={q.quota || ''} onChange={(e) => onQuotaChange(year, 'quota', e.target.value)} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm outline-none" />
                  </td>
                  <td className="px-4 py-2 border border-slate-800">
                    <input type="number" value={q.registeredCount || ''} onChange={(e) => onQuotaChange(year, 'registeredCount', e.target.value)} className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm outline-none" />
                  </td>
                  <td className="px-4 py-2 border border-slate-800 bg-emerald-950/10 font-bold text-emerald-300">{q.competitionRatio || '0.00'}</td>
                  <td className="px-4 py-2 border border-slate-800 bg-indigo-950/10">
                    <input type="number" step="0.25" value={c.cutoffNV1 || ''} onChange={(e) => onCutoffChange(year, 'cutoffNV1', e.target.value)} className="w-20 bg-slate-950 border border-indigo-900/50 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 text-indigo-300 font-medium" />
                  </td>
                  <td className="px-4 py-2 border border-slate-800 bg-indigo-950/10">
                    <input type="number" step="0.25" value={c.cutoffNV2 || ''} onChange={(e) => onCutoffChange(year, 'cutoffNV2', e.target.value)} className="w-20 bg-slate-950 border border-indigo-900/50 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 text-indigo-300 font-medium" />
                  </td>
                  <td className="px-4 py-2 border border-slate-800 bg-indigo-950/10">
                    <input type="number" step="0.25" value={c.cutoffNV3 || ''} onChange={(e) => onCutoffChange(year, 'cutoffNV3', e.target.value)} className="w-20 bg-slate-950 border border-indigo-900/50 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 text-indigo-300 font-medium" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 mt-2">
        * Bỏ trống Điểm chuẩn hoặc Chỉ tiêu nếu không có dữ liệu năm đó. Hệ thống sẽ tự động gỡ các bản ghi trắng.
      </p>
    </div>
  );
}
