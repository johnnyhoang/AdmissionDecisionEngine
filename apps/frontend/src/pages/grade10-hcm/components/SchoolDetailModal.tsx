import { Printer, School, Sliders } from 'lucide-react';
import type { G10SchoolDetail } from '../../../services/api';
import SchoolDetailAnalyticsSection from './SchoolDetailAnalyticsSection';
import SchoolDetailOverviewSection from './SchoolDetailOverviewSection';

interface SchoolDetailModalProps {
  isOpen: boolean;
  schoolDetail: G10SchoolDetail | null;
  theme: 'light' | 'dark';
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (schoolId: string) => void;
  onPrint: () => void;
  buildSchoolMapUrl: (school: G10SchoolDetail) => string;
  buildSchoolMapEmbedUrl: (school: G10SchoolDetail) => string;
}

export default function SchoolDetailModal({
  isOpen,
  schoolDetail,
  theme,
  isAdmin,
  onClose,
  onEdit,
  onPrint,
  buildSchoolMapUrl,
  buildSchoolMapEmbedUrl,
}: SchoolDetailModalProps) {
  if (!isOpen || !schoolDetail) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4 z-[70]">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl md:rounded-2xl max-w-3xl w-full p-4 md:p-6 shadow-2xl relative flex flex-col gap-4 max-h-[92dvh] md:max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold"
        >
          ✕
        </button>

        <div className="border-b border-slate-800 pb-3 flex justify-between items-end gap-3 pr-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-400">
                {schoolDetail.district?.name || 'Chưa rõ quận'}
              </span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <School className="h-5 w-5 text-indigo-400 shrink-0" />
              {schoolDetail.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <button
              onClick={onPrint}
              className="no-print px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition border border-slate-700 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              In PDF
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(schoolDetail.id);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" />
                Sửa
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 min-h-0 text-xs text-slate-350 flex flex-col gap-6">
          <SchoolDetailOverviewSection
            schoolDetail={schoolDetail}
            buildSchoolMapUrl={buildSchoolMapUrl}
            buildSchoolMapEmbedUrl={buildSchoolMapEmbedUrl}
          />
          <SchoolDetailAnalyticsSection schoolDetail={schoolDetail} theme={theme} />
        </div>
      </div>
    </div>
  );
}
