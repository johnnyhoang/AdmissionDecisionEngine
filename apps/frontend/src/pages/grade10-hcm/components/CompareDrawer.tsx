import { X, BadgeCheck, School, Trash2, HelpCircle, TrendingDown, Printer } from 'lucide-react';
import type { G10SchoolItem } from '../../../services/api';
import { formatSchoolYear, getCurrentSchoolYear } from '../../../utils/date';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  compareList: G10SchoolItem[];
  onRemove: (school: G10SchoolItem) => void;
  onClear: () => void;
  onPrint?: () => void;
  theme: 'light' | 'dark';
}

export default function CompareDrawer({ isOpen, onClose, compareList, onRemove, onClear, onPrint, theme }: CompareDrawerProps) {
  if (!isOpen) return null;

  // Helper to find min/max values for highlighting
  const getHighlights = () => {
    const nv1List = compareList.map(s => s.latestCutoffNV1 || 0).filter(v => v > 0);
    const nv2List = compareList.map(s => s.latestCutoffNV2 || 0).filter(v => v > 0);
    const nv3List = compareList.map(s => s.latestCutoffNV3 || 0).filter(v => v > 0);
    const quotaList = compareList.map(s => s.latestQuota || 0).filter(v => v > 0);
    const ratioList = compareList.map(s => s.latestCompetitionRatio || 0).filter(v => v > 0);

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
  };

  const highlights = getHighlights();

  return (
    <div className="fixed inset-y-0 right-0 z-[80] w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <School className="h-5 w-5 text-indigo-400" />
            So Sánh Trường THPT ({compareList.length}/3)
          </h2>
          <p className="text-xs text-slate-400 mt-1">So sánh trực quan chỉ số điểm chuẩn & chỉ tiêu tuyển sinh.</p>
        </div>
        <div className="flex items-center gap-3">
          {compareList.length > 0 && onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs font-bold border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              In PDF
            </button>
          )}
          {compareList.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-slate-400 hover:text-rose-400 font-medium transition cursor-pointer"
            >
              Xóa tất cả
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {compareList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center text-slate-500">
            <HelpCircle className="h-16 w-16 text-slate-600 mb-4 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400">Chưa có trường nào được chọn so sánh</p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Vui lòng bấm nút <strong>"So sánh"</strong> ở danh sách trường bên trái để thêm vào đây.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Main Matrix Grid */}
            <div className="grid grid-cols-12 gap-3 items-stretch">
              {/* Row 1: School Header Info */}
              <div className="col-span-3 flex flex-col justify-end text-xs font-semibold text-slate-400 pb-2">
                Thông tin trường
              </div>
              {compareList.map((school) => (
                <div
                  key={school.id}
                  className={`col-span-${Math.floor(9 / compareList.length)} bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative`}
                >
                  <button
                    onClick={() => onRemove(school)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Xóa khỏi danh sách"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">{school.name}</h4>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    {school.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    <span>{school.district?.name || 'Hồ Chí Minh'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Comparison Rows */}
            <div className="flex flex-col gap-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
              
              {/* Group: Điểm chuẩn */}
              <div className="bg-slate-850/40 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                Điểm chuẩn năm học {formatSchoolYear(getCurrentSchoolYear())}
              </div>

              {/* Row: Điểm NV1 */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
                <div className="col-span-3 text-xs text-slate-400 font-medium">Nguyện vọng 1</div>
                {compareList.map((school) => {
                  const val = school.latestCutoffNV1 || 0;
                  const isMax = val > 0 && val === highlights.maxNv1;
                  const isMin = val > 0 && val === highlights.minNv1;
                  return (
                    <div
                      key={school.id}
                      className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-xs`}
                    >
                      {val > 0 ? (
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${isMax ? (theme === 'light' ? 'text-amber-600 font-extrabold' : 'text-amber-400') : isMin ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400') : 'text-slate-200'}`}>
                            {val}đ
                          </span>
                          {isMax && <span className="text-[8px] text-amber-500 font-bold">Điểm cao nhất</span>}
                          {isMin && <span className="text-[8px] text-emerald-500 font-bold">Dễ đỗ nhất</span>}
                        </div>
                      ) : (
                        <span className="text-slate-650 italic">N/A</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row: Điểm NV2 */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
                <div className="col-span-3 text-xs text-slate-400 font-medium">Nguyện vọng 2</div>
                {compareList.map((school) => {
                  const val = school.latestCutoffNV2 || 0;
                  const isMax = val > 0 && val === highlights.maxNv2;
                  const isMin = val > 0 && val === highlights.minNv2;
                  return (
                    <div
                      key={school.id}
                      className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-xs`}
                    >
                      {val > 0 ? (
                        <div className="flex flex-col">
                          <span className={`font-bold ${isMax ? (theme === 'light' ? 'text-amber-600 font-extrabold' : 'text-amber-400') : isMin ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400') : 'text-slate-200'}`}>
                            {val}đ
                          </span>
                          {isMax && <span className="text-[8px] text-amber-500 font-bold">Cao nhất</span>}
                          {isMin && <span className="text-[8px] text-emerald-500 font-bold">Dễ đỗ nhất</span>}
                        </div>
                      ) : (
                        <span className="text-slate-650 italic">N/A</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Row: Điểm NV3 */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
                <div className="col-span-3 text-xs text-slate-400 font-medium">Nguyện vọng 3</div>
                {compareList.map((school) => {
                  const val = school.latestCutoffNV3 || 0;
                  const isMax = val > 0 && val === highlights.maxNv3;
                  const isMin = val > 0 && val === highlights.minNv3;
                  return (
                    <div
                      key={school.id}
                      className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-xs`}
                    >
                      {val > 0 ? (
                        <div className="flex flex-col">
                          <span className={`font-bold ${isMax ? (theme === 'light' ? 'text-amber-600 font-extrabold' : 'text-amber-400') : isMin ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400') : 'text-slate-200'}`}>
                            {val}đ
                          </span>
                          {isMax && <span className="text-[8px] text-amber-500 font-bold">Cao nhất</span>}
                          {isMin && <span className="text-[8px] text-emerald-500 font-bold">Dễ đỗ nhất</span>}
                        </div>
                      ) : (
                        <span className="text-slate-650 italic">N/A</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Group: Chỉ tiêu tuyển sinh */}
              <div className="bg-slate-850/40 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider mt-1">
                Chỉ tiêu & Tỉ lệ chọi
              </div>

              {/* Row: Chỉ tiêu */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
                <div className="col-span-3 text-xs text-slate-400 font-medium">Chỉ tiêu tuyển</div>
                {compareList.map((school) => {
                  const val = school.latestQuota || 0;
                  const isMax = val > 0 && val === highlights.maxQuota;
                  return (
                    <div
                      key={school.id}
                      className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-xs`}
                    >
                      {val > 0 ? (
                        <div className="flex flex-col">
                          <span className={`font-bold ${isMax ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400') : 'text-slate-200'}`}>
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

              {/* Row: Tỉ lệ chọi */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
                <div className="col-span-3 text-xs text-slate-400 font-medium">Tỉ lệ chọi</div>
                {compareList.map((school) => {
                  const val = school.latestCompetitionRatio || 0;
                  const isMin = val > 0 && val === highlights.minRatio;
                  return (
                    <div
                      key={school.id}
                      className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-xs`}
                    >
                      {val > 0 ? (
                        <div className="flex flex-col">
                          <span className={`font-bold ${isMin ? (theme === 'light' ? 'text-emerald-600 font-extrabold' : 'text-emerald-400') : 'text-slate-200'}`}>
                            1 chọi {val}
                          </span>
                          {isMin && <span className="text-[8px] text-emerald-500 font-bold flex items-center gap-0.5"><TrendingDown className="w-2.5 h-2.5" /> Dễ đỗ nhất</span>}
                        </div>
                      ) : (
                        <span className="text-slate-650 italic">N/A</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Group: Khác */}
              <div className="bg-slate-850/40 px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800 uppercase tracking-wider mt-1">
                Thông tin chung
              </div>

              {/* Row: Loại trường */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20 border-b border-slate-800/40">
                <div className="col-span-3 text-xs text-slate-400 font-medium">Loại hình</div>
                {compareList.map((school) => (
                  <div
                    key={school.id}
                    className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-xs font-semibold text-slate-300`}
                  >
                    {school.schoolType === 'SPECIALIZED' ? 'Chuyên / Năng khiếu' : 'Thường / Công lập'}
                  </div>
                ))}
              </div>

              {/* Row: Địa chỉ */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-start hover:bg-slate-850/20 border-b border-slate-800/40">
                <div className="col-span-3 text-xs text-slate-400 font-medium mt-0.5">Địa chỉ</div>
                {compareList.map((school) => (
                  <div
                    key={school.id}
                    className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed`}
                    title={school.address}
                  >
                    {school.address || 'Hồ Chí Minh'}
                  </div>
                ))}
              </div>

              {/* Row: Website */}
              <div className="grid grid-cols-12 px-3 py-2.5 items-center hover:bg-slate-850/20">
                <div className="col-span-3 text-xs text-slate-400 font-medium">Website</div>
                {compareList.map((school) => (
                  <div
                    key={school.id}
                    className={`col-span-${Math.floor(9 / compareList.length)} px-1 text-xs`}
                  >
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
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
        >
          Đóng so sánh
        </button>
      </div>
    </div>
  );
}
