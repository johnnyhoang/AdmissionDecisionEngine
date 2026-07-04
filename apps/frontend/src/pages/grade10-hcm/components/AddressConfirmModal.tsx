import { MapPin, Check, Pencil, ExternalLink } from 'lucide-react';
import type { G10LocationResult } from '../../../services/api';

interface AddressConfirmModalProps {
  isOpen: boolean;
  originalAddress: string;
  resolved: G10LocationResult | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Shows the geocoded/normalized address and waits for the user to confirm
    it is correct before the caller runs the next step. */
export default function AddressConfirmModal({
  isOpen, originalAddress, resolved, onConfirm, onCancel,
}: AddressConfirmModalProps) {
  if (!isOpen || !resolved) return null;

  const normalized = resolved.formattedAddress || originalAddress;
  const mapUrl = resolved.mapUrl
    || `https://www.google.com/maps/search/?api=1&query=${resolved.latitude},${resolved.longitude}`;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5 m-0">
            <MapPin className="h-4 w-4 text-indigo-400" />
            Xác nhận địa chỉ
          </h2>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Địa chỉ bạn nhập</div>
            <div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">{originalAddress}</div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Địa chỉ được chuẩn hóa</div>
            <div className="text-xs font-bold text-white bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-3 py-2">
              {normalized}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className={`px-2 py-0.5 rounded font-bold border ${
              resolved.precision === 'exact'
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
            }`}>
              {resolved.precision === 'exact' ? '✓ Định vị chính xác' : '≈ Định vị gần đúng'}
            </span>
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold transition"
            >
              <ExternalLink className="h-3 w-3" />
              Kiểm tra trên Google Maps
            </a>
          </div>

          <p className="text-[10px] text-slate-500 m-0">
            Nếu địa chỉ chuẩn hóa chưa đúng, bấm "Nhập lại" để chỉnh sửa địa chỉ của bạn.
          </p>
        </div>

        <div className="flex gap-2 p-4 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            Nhập lại
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Đúng, tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}
