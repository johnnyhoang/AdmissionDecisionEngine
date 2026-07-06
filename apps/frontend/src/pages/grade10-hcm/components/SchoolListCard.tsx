import { memo } from 'react';
import { BadgeCheck, GitMerge, MapPin, Sliders } from 'lucide-react';
import type { G10SchoolItem } from '../../../services/api';
import { formatSchoolYear, getCurrentSchoolYear } from '../../../utils/date';

type SchoolListCardItem = G10SchoolItem & {
  distance?: number;
  roadDistance?: number;
  roadDuration?: number;
};

interface SchoolListCardProps {
  school: SchoolListCardItem;
  isCompared: boolean;
  isMergeSelected: boolean;
  isAdmin: boolean;
  isProximityFilterActive: boolean;
  getCompletenessTone: (percent?: number) => string;
  onOpenDetail: (schoolId: string) => void;
  onToggleCompare: (school: G10SchoolItem) => void;
  onToggleMerge: (schoolId: string) => void;
  onEdit: (schoolId: string) => void;
}

function SchoolListCard({
  school,
  isCompared,
  isMergeSelected,
  isAdmin,
  isProximityFilterActive,
  getCompletenessTone,
  onOpenDetail,
  onToggleCompare,
  onToggleMerge,
  onEdit,
}: SchoolListCardProps) {
  const cardDistance = school.roadDistance ?? school.distance;
  const latestAdmissionYear = school.latestYear || getCurrentSchoolYear();
  const latestQuotaYear = school.latestQuotaYear || latestAdmissionYear;
  const isLowCompleteness = Boolean(
    school.dataCompleteness && school.dataCompleteness.percent < 25,
  );

  return (
    <div
      className={`relative bg-slate-900/60 border rounded-xl p-3.5 shadow-md flex flex-col justify-between gap-3 transition-all duration-200 ${
        isMergeSelected
          ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-950/10'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200 truncate max-w-[130px]">
              {school.district?.name || 'TP.HCM'}
            </span>
            {isLowCompleteness && (
              <span className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                ⚠️ Chờ cập nhật dữ liệu
              </span>
            )}
            {isAdmin && school.dataCompleteness && (
              <div
                className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-black shadow-sm ${getCompletenessTone(school.dataCompleteness.percent)}`}
                title={`${school.dataCompleteness.completedFields}/${school.dataCompleteness.totalFields} trường dữ liệu đã hoàn thiện`}
              >
                <span>{school.dataCompleteness.percent}%</span>
              </div>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMerge(school.id);
                }}
                className={`text-[10px] px-1.5 py-0.5 rounded transition border flex items-center gap-1 ${
                  isMergeSelected
                    ? 'bg-amber-500 border-amber-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-400'
                }`}
                title="Chọn để gộp trường"
              >
                <GitMerge className="w-2.5 h-2.5" />
                {isMergeSelected ? '✓ Đã chọn' : 'Gộp'}
              </button>
            )}
            <button
              disabled={isLowCompleteness}
              onClick={() => onToggleCompare(school)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition border ${
                isCompared
                  ? 'bg-rose-600 border-rose-500 text-white'
                  : isLowCompleteness
                    ? 'bg-slate-900 border-slate-850 text-slate-650 cursor-not-allowed opacity-50'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isCompared ? 'Bỏ so sánh' : 'So sánh'}
            </button>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(school.id);
                }}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-emerald-600/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-600/20 hover:border-emerald-500/30 transition"
                title="Sửa trường"
              >
                <Sliders className="w-2.5 h-2.5" />
                Sửa
              </button>
            )}
          </div>
        </div>

        <h3
          className={`text-[13px] font-black mb-1.5 flex items-center gap-1.5 leading-tight ${
            isLowCompleteness
              ? 'text-slate-500 cursor-not-allowed'
              : 'text-white hover:text-indigo-400 cursor-pointer'
          }`}
          onClick={() => {
            if (isLowCompleteness) {
              alert('Trường này hiện đang chờ cập nhật thêm dữ liệu tuyển sinh.');
              return;
            }
            onOpenDetail(school.id);
          }}
        >
          <span className="line-clamp-2">{school.name}</span>
          {school.isVerified && (
            <span title="Trường đã xác thực">
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </span>
          )}
        </h3>

        <p className="text-[11px] text-slate-400 flex items-start gap-1 leading-normal">
          <MapPin className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{school.address || 'Hồ Chí Minh'}</span>
        </p>
      </div>

      <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1.5">
            <div className="text-[9px] text-slate-500">NV1 {formatSchoolYear(latestAdmissionYear)}</div>
            <div className="text-sm font-black text-indigo-400">{school.latestCutoffNV1 || '—'}đ</div>
          </div>
          <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1.5">
            <div className="text-[9px] text-slate-500">Chỉ tiêu {formatSchoolYear(latestQuotaYear)}</div>
            <div className="text-sm font-black text-slate-100">{school.latestQuota?.toLocaleString() || '—'}</div>
          </div>
          <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1.5">
            <div className="text-[9px] text-slate-500">Tỷ lệ chọi</div>
            <div className="text-sm font-black text-rose-400">{school.latestCompetitionRatio ? `1:${school.latestCompetitionRatio}` : '—'}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-400">
          <span>NV2 <strong className="text-slate-200">{school.latestCutoffNV2 || '—'}đ</strong></span>
          <span>NV3 <strong className="text-slate-200">{school.latestCutoffNV3 || '—'}đ</strong></span>
          {school.latestRegisteredCount ? (
            <span>ĐK NV1 <strong className="text-slate-200">{school.latestRegisteredCount.toLocaleString()}</strong></span>
          ) : null}
        </div>

        {isProximityFilterActive && typeof cardDistance === 'number' && (
          <div className="flex justify-between text-[10px] bg-indigo-950/20 border border-indigo-900/30 px-2 py-1.5 rounded-lg text-indigo-300 font-semibold">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-indigo-400" /> Đường đi
            </span>
            <span className="font-extrabold text-indigo-200">
              {cardDistance} km{school.roadDuration ? ` (~${school.roadDuration} phút)` : ''}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

export default memo(SchoolListCard);
