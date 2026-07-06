import { Check, ExternalLink, Loader2, Pencil } from 'lucide-react';
import type { G10LocationResult } from '../../../services/api';

interface HomeLocationConfirmStepProps {
  original: string;
  resolved: G10LocationResult;
  isBusy: boolean;
  normalizedLabel: string;
  checkMapUrl: string;
  onBack: () => void;
  onConfirm: () => void;
}

export default function HomeLocationConfirmStep({
  original,
  resolved,
  isBusy,
  normalizedLabel,
  checkMapUrl,
  onBack,
  onConfirm,
}: HomeLocationConfirmStepProps) {
  return (
    <>
      <div className="p-5 flex flex-col gap-3">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Bạn đã cung cấp
          </div>
          <div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
            {original}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
            Vị trí được xác định
          </div>
          <div className="text-xs font-bold text-white bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-3 py-2">
            {normalizedLabel || `${resolved.latitude.toFixed(6)}, ${resolved.longitude.toFixed(6)}`}
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] gap-3">
          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              resolved.precision === 'exact'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            }`}
          >
            {resolved.precision === 'exact' ? '✓ Định vị chính xác' : '≈ Định vị gần đúng'}
          </span>
          <a
            href={checkMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold transition"
          >
            <ExternalLink className="h-3 w-3" />
            Kiểm tra trên Google Maps
          </a>
        </div>
        <p className="text-[10px] text-slate-500 m-0">
          Nếu vị trí chưa đúng, bấm "Nhập lại" để thử cách khác.
        </p>
      </div>
      <div className="flex gap-2 p-4 border-t border-slate-800">
        <button
          onClick={onBack}
          disabled={isBusy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" />
          Nhập lại
        </button>
        <button
          onClick={onConfirm}
          disabled={isBusy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Đúng, dùng vị trí này
        </button>
      </div>
    </>
  );
}
