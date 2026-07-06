import { X, School, HelpCircle, Printer } from 'lucide-react';
import type { G10SchoolItem } from '../../../services/api';
import CompareDrawerMatrix from './CompareDrawerMatrix';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  compareList: G10SchoolItem[];
  onRemove: (school: G10SchoolItem) => void;
  onClear: () => void;
  onPrint?: () => void;
  theme: 'light' | 'dark';
}

export default function CompareDrawer({
  isOpen,
  onClose,
  compareList,
  onRemove,
  onClear,
  onPrint,
  theme,
}: CompareDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[80] w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 transform translate-x-0">
      <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <School className="h-5 w-5 text-indigo-400" />
            So Sánh Trường THPT ({compareList.length}/3)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            So sánh trực quan chỉ số điểm chuẩn & chỉ tiêu tuyển sinh.
          </p>
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
          <CompareDrawerMatrix compareList={compareList} theme={theme} onRemove={onRemove} />
        )}
      </div>

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
