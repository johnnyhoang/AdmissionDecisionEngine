import { MapPin } from 'lucide-react';
import type { G10SchoolDetail } from '../../../services/api';
import { formatSchoolYear } from '../../../utils/date';

interface SchoolDetailOverviewSectionProps {
  schoolDetail: G10SchoolDetail;
  buildSchoolMapUrl: (school: G10SchoolDetail) => string;
  buildSchoolMapEmbedUrl: (school: G10SchoolDetail) => string;
}

export default function SchoolDetailOverviewSection({
  schoolDetail,
  buildSchoolMapUrl,
  buildSchoolMapEmbedUrl,
}: SchoolDetailOverviewSectionProps) {
  const cutoffs = schoolDetail.cutoffs ?? [];
  const quotas = schoolDetail.quotas ?? [];

  return (
    <section>
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
        🏫 Tổng quan
      </h3>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                🏫 Địa chỉ
              </span>
              <div className="font-semibold text-slate-200">
                {schoolDetail.address || 'Chưa cập nhật'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                🌐 Website
              </span>
              <a
                href={schoolDetail.website || undefined}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline truncate block font-medium"
              >
                {schoolDetail.website || 'N/A'}
              </a>
            </div>
            <div className="space-y-1 mt-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                📝 Giới thiệu chung
              </span>
              <p className="text-slate-400 leading-relaxed font-normal">
                {schoolDetail.description ||
                  'Chưa có thông tin giới thiệu chi tiết cho trường THPT này.'}
              </p>
            </div>
            {schoolDetail.activities && (
              <div className="space-y-1 mt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  🎭 Hoạt động &amp; Phong trào
                </span>
                <p className="text-slate-400 leading-relaxed font-normal whitespace-pre-line">
                  {schoolDetail.activities}
                </p>
              </div>
            )}
            {schoolDetail.regulations && (
              <div className="space-y-1 mt-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  📏 Nội quy &amp; Quy định
                </span>
                <p className="text-slate-400 leading-relaxed font-normal whitespace-pre-line">
                  {schoolDetail.regulations}
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
              <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                Bản đồ vị trí cơ sở
              </span>
              <a
                href={buildSchoolMapUrl(schoolDetail)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-755 text-[10px] text-slate-350 font-bold rounded-lg border border-slate-700 transition"
              >
                Mở Google Maps
              </a>
            </div>
            <iframe
              title="Bản đồ vị trí cơ sở"
              src={buildSchoolMapEmbedUrl(schoolDetail)}
              className="w-full flex-1 border-0"
              style={{ minHeight: 220 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <p className="text-[10px] text-slate-500 px-4 py-2 m-0 truncate">
              📍 {schoolDetail.address || 'Hồ Chí Minh, Việt Nam'}
            </p>
          </div>
        </div>

        {cutoffs.length > 0 && (
          <div className="grid grid-cols-3 gap-3 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl mt-2 text-center">
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">
                Điểm NV1 gần nhất ({formatSchoolYear(cutoffs[0]?.year)})
              </span>
              <strong className="text-base text-indigo-400">
                {cutoffs[0]?.cutoffNV1}đ
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">
                Chỉ tiêu tuyển ({formatSchoolYear(quotas[0]?.year)})
              </span>
              <strong className="text-base text-blue-400">
                {quotas[0]?.quota || 'N/A'}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">
                Tỷ lệ chọi ({formatSchoolYear(quotas[0]?.year)})
              </span>
              <strong className="text-base text-rose-400">
                1 chọi {quotas[0]?.competitionRatio || 'N/A'}
              </strong>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
