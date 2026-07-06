import { Loader2, MapPin, Search } from 'lucide-react';
import type { G10LocationResult } from '../../../services/api';

interface HomeLocationInputStepProps {
  address: string;
  suggestions: G10LocationResult[];
  isBusy: boolean;
  error: string;
  onAddressChange: (value: string) => void;
  onResolve: () => void;
  onSelectSuggestion: (result: G10LocationResult) => void;
  onUseGps: () => void;
  onOpenMap: () => void;
}

export default function HomeLocationInputStep({
  address,
  suggestions,
  isBusy,
  error,
  onAddressChange,
  onResolve,
  onSelectSuggestion,
  onUseGps,
  onOpenMap,
}: HomeLocationInputStepProps) {
  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Địa chỉ nhà của bạn
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ví dụ: RS7, HCM hoặc 239 Hòa Bình, Hiệp Tân..."
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onResolve();
            }}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition"
          />
          <button
            onClick={onResolve}
            disabled={isBusy}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Tìm
          </button>
        </div>
        <p className="text-[10px] text-slate-500 m-0">
          Nhập cụm ngắn cũng được. Hệ thống sẽ trả vài vị trí để bạn chọn đúng nhà.
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
            Chọn địa chỉ đúng nhất
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-xs text-slate-200 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition"
            >
              <span className="block font-semibold">
                {suggestion.formattedAddress || `${suggestion.latitude}, ${suggestion.longitude}`}
              </span>
              <span className="mt-1 block text-[10px] text-slate-500">
                {suggestion.source === 'google' ? 'Google Maps' : 'OpenStreetMap'} · {suggestion.latitude.toFixed(5)}, {suggestion.longitude.toFixed(5)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase">Hoặc</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      <button
        onClick={onUseGps}
        disabled={isBusy}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
      >
        <MapPin className="w-4 h-4 text-indigo-400" />
        {isBusy ? 'Đang định vị...' : 'Sử dụng GPS hiện tại'}
      </button>

      <button
        onClick={onOpenMap}
        disabled={isBusy}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
      >
        🗺️ Chọn vị trí trên bản đồ
      </button>

      {error && <p className="text-[11px] text-rose-400 m-0">⚠️ {error}</p>}
    </div>
  );
}
