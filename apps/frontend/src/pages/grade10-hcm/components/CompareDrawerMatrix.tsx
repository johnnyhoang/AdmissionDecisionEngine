import { BadgeCheck, Trash2, TrendingDown } from 'lucide-react';
import type { G10SchoolItem } from '../../../services/api';
import { formatSchoolYear, getCurrentSchoolYear } from '../../../utils/date';

interface CompareDrawerMatrixProps {
  compareList: G10SchoolItem[];
  theme: 'light' | 'dark';
  onRemove: (school: G10SchoolItem) => void;
}

function getHighlights(compareList: G10SchoolItem[]) {
  const nv1List = compareList.map((s) => s.latestCutoffNV1 || 0).filter((v) => v > 0);
  const nv2List = compareList.map((s) => s.latestCutoffNV2 || 0).filter((v) => v > 0);
  const nv3List = compareList.map((s) => s.latestCutoffNV3 || 0).filter((v) => v > 0);
  const quotaList = compareList.map((s) => s.latestQuota || 0).filter((v) => v > 0);
  const ratioList = compareList.map((s) => s.latestCompetitionRatio || 0).filter((v) => v > 0);

  return {
    maxNv1: nv1List.length ? Math.max(...nv1List) : 0,
    minNv1: nv1List.length ? Math.min(...nv1List) : 999,
    maxNv2: nv2List.length ? Math.max(...nv2List) : 0,
    minNv2: nv2List.length ? Math.min(...nv2List) : 999,
    maxNv3: nv3List.length ? Math.max(...nv3List) : 0,
    minNv3: nv3List.length ? Math.min(...nv3List) : 999,
    maxQuota: quotaList.length ? Math.max(...quotaList) : 0,
    minRatio: ratioList.length ? Math.min(...ratioList) : 999,
  };
}

function MetricCell({
  value,
  theme,
  isMax,
  isMin,
  maxLabel,
  minLabel,
}: {
  value: number;
  theme: 'light' | 'dark';
  isMax?: boolean;
  isMin?: boolean;
  maxLabel?: string;
  minLabel?: string;
}) {
  if (!value) return <span className="text-slate-650 italic">N/A</span>;

  return (
    <div className="flex flex-col">
      <span
        className={`font-bold text-sm ${
          isMax
            ? theme === 'light'
              ? 'text-amber-600 font-extrabold'
              : 'text-amber-400'
            : isMin
              ? theme === 'light'
                ? 'text-emerald-600 font-extrabold'
                : 'text-emerald-400'
              : 'text-slate-200'
        }`}
      >
        {value}
      </span>
      {isMax && maxLabel && <span className="text-[8px] text-amber-500 font-bold">{maxLabel}</span>}
      {isMin && minLabel && <span className="text-[8px] text-emerald-500 font-bold">{minLabel}</span>}
    </div>
  );
}

export default function CompareDrawerMatrix({ compareList, theme, onRemove }: CompareDrawerMatrixProps) {
  const highlights = getHighlights(compareList);
  const colClass = `col-span-${Math.floor(9 / compareList.length)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-12 gap-3 items-stretch">
        <div className="col-span-3 flex flex-col justify-end text-xs font-semibold text-slate-400 pb-2">
          Thông tin trường
        </div>
        {compareList.map((school) => (
          <div
            key={school.id}
            className={`${colClass} bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative`}
          >
            <button
              onClick={() => onRemove(school)}
              className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
              title="Xóa khỏi danh sách"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col gap-1.5 mt-2">
              <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                {school.name}
              </h4>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              {school.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              <span>{school.district?.name || 'Hồ Chí Minh'}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
        <div className="bg-slate-850/40 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
          Điểm chuẩn năm học {formatSchoolYear(getCurrentSchoolYear())}
        </div>

        {([
          ['Nguyện vọng 1', 'latestCutoffNV1', 'maxNv1', 'minNv1', 'Điểm cao nhất', 'Dễ đỗ nhất'],
          ['Nguyện vọng 2', 'latestCutoffNV2', 'maxNv2', 'minNv2', 'Cao nhất', 'Dễ đỗ nhất'],
          ['Nguyện vọng 3', 'latestCutoffNV3', 'maxNv3', 'minNv3', 'Cao nhất', 'Dễ đỗ nhất'],
        ] as const).map(([label, key, maxKey, minKey, maxLabel, minLabel]) => (
          <div
            key={label}
            className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40"
          >
            <div className="col-span-3 text-xs text-slate-400 font-medium">{label}</div>
            {compareList.map((school) => {
              const val = school[key] || 0;
              const isMax = val > 0 && val === highlights[maxKey];
              const isMin = val > 0 && val === highlights[minKey];
              return (
                <div key={school.id} className={`${colClass} px-1 text-xs`}>
                  <MetricCell
                    value={val}
                    theme={theme}
                    isMax={isMax}
                    isMin={isMin}
                    maxLabel={maxLabel}
                    minLabel={minLabel}
                  />
                </div>
              );
            })}
          </div>
        ))}

        <div className="bg-slate-850/40 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider mt-1">
          Chỉ tiêu & Tỉ lệ chọi
        </div>

        <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
          <div className="col-span-3 text-xs text-slate-400 font-medium">Chỉ tiêu tuyển</div>
          {compareList.map((school) => {
            const val = school.latestQuota || 0;
            const isMax = val > 0 && val === highlights.maxQuota;
            return (
              <div key={school.id} className={`${colClass} px-1 text-xs`}>
                {val > 0 ? (
                  <div className="flex flex-col">
                    <span
                      className={`font-bold ${
                        isMax
                          ? theme === 'light'
                            ? 'text-emerald-600 font-extrabold'
                            : 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      {val} học sinh
                    </span>
                    {isMax && <span className="text-[8px] text-emerald-500 font-bold">Nhiều nhất</span>}
                  </div>
                ) : (
                  <span className="text-slate-650 italic">N/A</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
          <div className="col-span-3 text-xs text-slate-400 font-medium">Tỉ lệ chọi</div>
          {compareList.map((school) => {
            const val = school.latestCompetitionRatio || 0;
            const isMin = val > 0 && val === highlights.minRatio;
            return (
              <div key={school.id} className={`${colClass} px-1 text-xs`}>
                {val > 0 ? (
                  <div className="flex flex-col">
                    <span
                      className={`font-bold ${
                        isMin
                          ? theme === 'light'
                            ? 'text-emerald-600 font-extrabold'
                            : 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      1 chọi {val}
                    </span>
                    {isMin && (
                      <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" /> Dễ đỗ nhất
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-650 italic">N/A</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-slate-850/40 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider mt-1">
          Thông tin chung
        </div>

        <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
          <div className="col-span-3 text-xs text-slate-400 font-medium">Loại hình</div>
          {compareList.map((school) => (
            <div key={school.id} className={`${colClass} px-1 text-xs font-semibold text-slate-300`}>
              {school.schoolType === 'SPECIALIZED' ? 'Chuyên / Năng khiếu' : 'Thường / Công lập'}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 px-3 py-2.5 items-start hover:bg-slate-850/20 border-b border-slate-800/40">
          <div className="col-span-3 text-xs text-slate-400 font-medium mt-0.5">Địa chỉ</div>
          {compareList.map((school) => (
            <div
              key={school.id}
              className={`${colClass} px-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed`}
              title={school.address}
            >
              {school.address || 'Hồ Chí Minh'}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20">
          <div className="col-span-3 text-xs text-slate-400 font-medium">Website</div>
          {compareList.map((school) => (
            <div key={school.id} className={`${colClass} px-1 text-xs`}>
              {school.website ? (
                <a
                  href={school.website.startsWith('http') ? school.website : `https://${school.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 hover:underline truncate block"
                >
                  {school.website}
                </a>
              ) : (
                <span className="text-slate-650 italic">Không có</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
