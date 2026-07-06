import { memo } from 'react';
import type { G10RecommendationItem } from '../../../services/api';
import { formatSchoolYear, getCurrentSchoolYear } from '../../../utils/date';

interface RecommendationCardProps {
  rec: G10RecommendationItem;
  onOpenSchoolDetail: (schoolId: string) => void;
}

function RecommendationCard({ rec, onOpenSchoolDetail }: RecommendationCardProps) {
  const probColor =
    rec.safetyCategory === 'VERY_SAFE' || rec.safetyCategory === 'SAFE'
      ? 'emerald'
      : rec.safetyCategory === 'COMPETITIVE'
        ? 'blue'
        : rec.safetyCategory === 'RISKY'
          ? 'amber'
          : 'rose';

  const currentSchoolYear = getCurrentSchoolYear();

  return (
    <div
      className={`bg-slate-900/50 hover:bg-slate-900 border rounded-xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        probColor === 'emerald'
          ? 'border-emerald-500/20 hover:border-emerald-500/40'
          : probColor === 'blue'
            ? 'border-blue-500/20 hover:border-blue-500/40'
            : probColor === 'amber'
              ? 'border-amber-500/20 hover:border-amber-500/40'
              : 'border-rose-500/20 hover:border-rose-500/40'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs text-slate-400 font-medium">{rec.districtName}</span>
        </div>

        <h3 className="text-sm font-bold text-white mb-1.5">{rec.schoolName}</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
          <div>
            Chỉ tiêu {formatSchoolYear(currentSchoolYear)}:{' '}
            <span className="font-semibold text-slate-300">N/A</span>
          </div>
          <div>
            Điểm chuẩn NV1 {formatSchoolYear(currentSchoolYear)}:{' '}
            <span className="font-semibold text-slate-300">{rec.cutoffNV1}đ</span>
          </div>
          <div>
            TB lịch sử: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {rec.nv2Gap !== null ? (
            <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold">
              NV2 Chênh lệch: +{rec.nv2Gap}đ
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full font-semibold">
              Không tuyển NV2
            </span>
          )}
          {rec.nv3Gap !== null ? (
            <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full font-semibold">
              NV3 Chênh lệch: +{rec.nv3Gap}đ
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full font-semibold">
              Không tuyển NV3
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400 mb-2 font-medium">
          <div>
            NV1: <span className="font-bold text-slate-200">{rec.cutoffNV1 ? `${rec.cutoffNV1}đ` : '—'}</span>
          </div>
          <div>
            NV2: <span className="font-semibold text-slate-350">{rec.cutoffNV2 ? `${rec.cutoffNV2}đ` : '—'}</span>
          </div>
          <div>
            NV3: <span className="font-semibold text-slate-350">{rec.cutoffNV3 ? `${rec.cutoffNV3}đ` : '—'}</span>
          </div>
          <div>
            TB NV1 lịch sử: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span>
          </div>
        </div>

        <div className="mt-3 bg-slate-950/40 p-2.5 border border-slate-800/80 rounded-lg text-[11px] text-slate-300 flex flex-col gap-2">
          {rec.adviceNV1 && (
            <div className="flex items-start gap-2 leading-relaxed">
              <span className="text-indigo-400 text-xs mt-0.5">💡</span>
              <span>
                <strong>Tư vấn NV1:</strong> {rec.adviceNV1}
              </span>
            </div>
          )}
          {rec.adviceNV2 && (
            <div className="flex items-start gap-2 leading-relaxed">
              <span className="text-emerald-400 text-xs mt-0.5">💡</span>
              <span>
                <strong>Tư vấn NV2:</strong> {rec.adviceNV2}
              </span>
            </div>
          )}
          {rec.adviceNV3 && (
            <div className="flex items-start gap-2 leading-relaxed">
              <span className="text-amber-400 text-xs mt-0.5">💡</span>
              <span>
                <strong>Tư vấn NV3:</strong> {rec.adviceNV3}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="md:w-44 shrink-0 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 gap-2">
        <div>
          <div
            className={`text-2xl font-black ${
              probColor === 'emerald'
                ? 'text-emerald-400'
                : probColor === 'blue'
                  ? 'text-blue-400'
                  : probColor === 'amber'
                    ? 'text-amber-400'
                    : 'text-rose-400'
            }`}
          >
            {rec.probability}%
          </div>
          <span
            className={`text-[10px] font-bold uppercase mt-1 px-2.5 py-0.5 rounded-full whitespace-nowrap block ${
              probColor === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : probColor === 'blue'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : probColor === 'amber'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {rec.safetyCategory === 'VERY_SAFE'
              ? 'Rất an toàn'
              : rec.safetyCategory === 'SAFE'
                ? 'An toàn'
                : rec.safetyCategory === 'COMPETITIVE'
                  ? 'Tỉ lệ chọi cao'
                  : rec.safetyCategory === 'RISKY'
                    ? 'Rủi ro'
                    : 'Rất rủi ro'}
          </span>
        </div>

        <button
          onClick={() => onOpenSchoolDetail(rec.schoolId)}
          className="w-full py-1 px-3 bg-slate-850 border border-slate-700 hover:border-indigo-500 text-[10px] font-semibold text-slate-300 hover:text-white rounded transition"
        >
          Xem trường
        </button>
      </div>
    </div>
  );
}

export default memo(RecommendationCard);
