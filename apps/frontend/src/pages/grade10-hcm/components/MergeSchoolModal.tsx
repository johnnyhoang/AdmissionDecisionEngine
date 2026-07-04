import { useState, useEffect } from 'react';
import { X, ArrowRight, Combine } from 'lucide-react';
import type { G10SchoolItem } from '../../../services/api';

interface MergeSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  school1: G10SchoolItem | null;
  school2: G10SchoolItem | null;
  onMerge: (primaryId: string, secondaryId: string, mergedData: any) => Promise<void>;
}

const FIELDS = [
  { key: 'name', label: 'Tên trường' },
  { key: 'code', label: 'Mã trường' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'website', label: 'Website' },
  { key: 'mapUrl', label: 'Google Maps URL' },
  { key: 'schoolType', label: 'Loại trường' },
  { key: 'description', label: 'Mô tả (Description)', isLongText: true },
  { key: 'comments', label: 'Đánh giá/Comments', isLongText: true },
  { key: 'comments', label: 'Đánh giá/Comments', isLongText: true },
];

export default function MergeSchoolModal({ isOpen, onClose, school1, school2, onMerge }: MergeSchoolModalProps) {
  const [mergedData, setMergedData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (school1 && school2) {
        try {
          // In a real app we would call fetchG10SchoolDetail from api.ts here
          // For now, we initialize basic fields
          const initialData: any = {};
          FIELDS.forEach(f => {
            initialData[f.key] = (school1 as any)[f.key] || '';
          });
          // Note: this modal only lets the admin pick basic profile fields.
          // Cutoffs and quotas are intentionally NOT sent here - the backend
          // (Grade10SchoolService.mergeSchools) auto-merges them by
          // year/programType so no history is lost when the secondary
          // school is deleted.
          setMergedData(initialData);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchDetails();
  }, [school1, school2]);

  if (!isOpen || !school1 || !school2) return null;

  const handleFill = (key: string, value: string) => {
    setMergedData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleCombine = (key: string, val1: string, val2: string) => {
    const combined = [val1, val2].filter(v => v && v.trim() !== '').join('\n\n');
    setMergedData((prev: any) => ({ ...prev, [key]: combined }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onMerge(school1.id, school2.id, mergedData);
      onClose();
    } catch (e: any) {
      alert('Lỗi khi merge: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Merge 2 Trường
            <span className="text-sm font-normal px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">Trường 1 (Chính) & Trường 2 (Phụ sẽ bị xoá)</span>
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-slate-400 border-b border-slate-800 pb-2 mb-4">
            <div className="col-span-2">Trường dữ liệu</div>
            <div className="col-span-3 text-indigo-300">Trường 1 (ID: {school1.id.substring(0,6)}...)</div>
            <div className="col-span-3 text-purple-300">Trường 2 (ID: {school2.id.substring(0,6)}...)</div>
            <div className="col-span-4 text-emerald-300">Dữ liệu sau khi gộp (Sẽ lưu)</div>
          </div>

          <div className="flex flex-col gap-4">
            {FIELDS.map(field => {
              const val1 = (school1 as any)[field.key] || '';
              const val2 = (school2 as any)[field.key] || '';
              const isDiff = val1 !== val2;

              return (
                <div key={field.key} className={`grid grid-cols-12 gap-4 items-start p-3 rounded-xl border ${isDiff ? 'bg-amber-950/20 border-amber-900/30' : 'border-transparent'}`}>
                  <div className="col-span-2 font-medium text-slate-300 flex flex-col gap-1">
                    {field.label}
                    {isDiff && <span className="text-[10px] uppercase bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded w-max">Khác biệt</span>}
                  </div>
                  
                  <div 
                    className={`col-span-3 p-2 rounded-lg border cursor-pointer hover:border-indigo-500 transition ${isDiff ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800'}`}
                    onClick={() => handleFill(field.key, val1)}
                    title="Click để copy vào ô Edit"
                  >
                    <div className={`text-sm line-clamp-4 whitespace-pre-wrap ${!val1 ? 'text-slate-600 italic' : 'text-slate-300'}`}>
                      {val1 || '(Trống)'}
                    </div>
                  </div>

                  <div 
                    className={`col-span-3 p-2 rounded-lg border cursor-pointer hover:border-purple-500 transition ${isDiff ? 'border-slate-700 bg-slate-900/50' : 'border-slate-800'}`}
                    onClick={() => handleFill(field.key, val2)}
                    title="Click để copy vào ô Edit"
                  >
                    <div className={`text-sm line-clamp-4 whitespace-pre-wrap ${!val2 ? 'text-slate-600 italic' : 'text-slate-300'}`}>
                      {val2 || '(Trống)'}
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col gap-2">
                    {field.isLongText ? (
                      <textarea
                        value={mergedData[field.key] || ''}
                        onChange={(e) => handleFill(field.key, e.target.value)}
                        className="w-full bg-slate-950 border border-emerald-900/50 focus:border-emerald-500 rounded-lg p-2.5 text-sm text-slate-200 outline-none transition min-h-[100px] resize-y"
                      />
                    ) : (
                      <input
                        type="text"
                        value={mergedData[field.key] || ''}
                        onChange={(e) => handleFill(field.key, e.target.value)}
                        className="w-full bg-slate-950 border border-emerald-900/50 focus:border-emerald-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition"
                      />
                    )}
                    {field.isLongText && isDiff && (
                      <button
                        onClick={() => handleCombine(field.key, val1, val2)}
                        className="self-start text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition"
                      >
                        <Combine className="w-3.5 h-3.5" />
                        Gộp cả 2 văn bản
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Đang Merge...' : 'Xác nhận Merge Trường'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
