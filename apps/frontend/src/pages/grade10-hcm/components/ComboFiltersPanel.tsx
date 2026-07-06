import { HelpCircle, MapPin, Sparkles } from 'lucide-react';
import SchoolGroupedDropdown from './SchoolGroupedDropdown';
import type { G10SchoolItem } from '../../../services/api';

interface ComboFiltersPanelProps {
  schools: G10SchoolItem[];
  allSchools: G10SchoolItem[];
  districts: Array<{ id: string; name: string }>;
  comboSelectionMode: 'distance' | 'district';
  minMath: string;
  maxMath: string;
  minLiterature: string;
  maxLiterature: string;
  minEnglish: string;
  maxEnglish: string;
  priorityScore: string;
  dreamSchoolCode: string;
  maxCommuteDistance: string;
  comboGPS: { lat: number; lon: number } | null;
  comboUserAddress: string;
  comboDistrictIds: string[];
  isComboLoading: boolean;
  onComboSelectionModeChange: (mode: 'distance' | 'district') => void;
  onMinMathChange: (value: string) => void;
  onMaxMathChange: (value: string) => void;
  onMinLiteratureChange: (value: string) => void;
  onMaxLiteratureChange: (value: string) => void;
  onMinEnglishChange: (value: string) => void;
  onMaxEnglishChange: (value: string) => void;
  onPriorityScoreChange: (value: string) => void;
  onDreamSchoolCodeChange: (value: string) => void;
  onMaxCommuteDistanceChange: (value: string) => void;
  onToggleComboDistrict: (districtId: string) => void;
  onClearComboDistricts: () => void;
  onRequestHomeLocation: () => void;
  onClearComboLocation: () => void;
  onRunCombo: () => void;
  onOpenHelp: () => void;
}

export default function ComboFiltersPanel({
  schools,
  allSchools,
  districts,
  comboSelectionMode,
  minMath,
  maxMath,
  minLiterature,
  maxLiterature,
  minEnglish,
  maxEnglish,
  priorityScore,
  dreamSchoolCode,
  maxCommuteDistance,
  comboGPS,
  comboUserAddress,
  comboDistrictIds,
  isComboLoading,
  onComboSelectionModeChange,
  onMinMathChange,
  onMaxMathChange,
  onMinLiteratureChange,
  onMaxLiteratureChange,
  onMinEnglishChange,
  onMaxEnglishChange,
  onPriorityScoreChange,
  onDreamSchoolCodeChange,
  onMaxCommuteDistanceChange,
  onToggleComboDistrict,
  onClearComboDistricts,
  onRequestHomeLocation,
  onClearComboLocation,
  onRunCombo,
  onOpenHelp,
}: ComboFiltersPanelProps) {
  return (
    <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sparkles className="h-5 w-5 text-indigo-400" />
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-white m-0">🌈 Tư vấn 3 Nguyện Vọng</h2>
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer"
            title="Xem cẩm nang chiến thuật"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2">
          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-0.5">
            Khoảng điểm dự đoán
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[9px] text-slate-400 mb-0.5 sm:text-center font-semibold">
                Toán (Min-Max)
              </label>
              <div className="flex gap-0.5 items-center">
                <input
                  type="number"
                  step="0.25"
                  value={minMath}
                  onChange={(e) => onMinMathChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.25 text-center text-[11px] text-white"
                />
                <span className="text-slate-500 text-[10px]">-</span>
                <input
                  type="number"
                  step="0.25"
                  value={maxMath}
                  onChange={(e) => onMaxMathChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.25 text-center text-[11px] text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400 mb-0.5 sm:text-center font-semibold">
                Văn (Min-Max)
              </label>
              <div className="flex gap-0.5 items-center">
                <input
                  type="number"
                  step="0.25"
                  value={minLiterature}
                  onChange={(e) => onMinLiteratureChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.25 text-center text-[11px] text-white"
                />
                <span className="text-slate-500 text-[10px]">-</span>
                <input
                  type="number"
                  step="0.25"
                  value={maxLiterature}
                  onChange={(e) => onMaxLiteratureChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.25 text-center text-[11px] text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] text-slate-400 mb-0.5 sm:text-center font-semibold">
                Anh (Min-Max)
              </label>
              <div className="flex gap-0.5 items-center">
                <input
                  type="number"
                  step="0.25"
                  value={minEnglish}
                  onChange={(e) => onMinEnglishChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.25 text-center text-[11px] text-white"
                />
                <span className="text-slate-500 text-[10px]">-</span>
                <input
                  type="number"
                  step="0.25"
                  value={maxEnglish}
                  onChange={(e) => onMaxEnglishChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.25 text-center text-[11px] text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[110px_minmax(0,1fr)] gap-2.5 border-t border-slate-800 pt-2.5 items-end">
            <div>
              <label className="block text-[9px] text-slate-400 mb-0.5 font-semibold">
                Điểm cộng ưu tiên
              </label>
              <input
                type="number"
                step="0.5"
                value={priorityScore}
                onChange={(e) => onPriorityScoreChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.25 text-[11px] text-white"
              />
            </div>
            <div>
              <label className="block text-[9px] text-slate-400 mb-0.5 font-semibold">
                Trường Mơ ước NV1
              </label>
              <SchoolGroupedDropdown
                schools={allSchools.length > 0 ? allSchools : schools}
                value={dreamSchoolCode}
                onChange={onDreamSchoolCodeChange}
                placeholder="-- Chọn trường mơ ước --"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            Phạm vi xét trường
          </label>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-950/60 border border-slate-800 p-1">
            <button
              type="button"
              onClick={() => onComboSelectionModeChange('distance')}
              className={`rounded-lg px-2.5 py-2 text-left transition border ${
                comboSelectionMode === 'distance'
                  ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] md:text-[11px] font-black leading-tight">
                Theo khoảng cách
              </div>
              <div className="hidden sm:block text-[10px] mt-0.5 leading-snug text-inherit opacity-80">
                Dùng vị trí nhà và cự ly tối đa để lọc trường phù hợp.
              </div>
            </button>
            <button
              type="button"
              onClick={() => onComboSelectionModeChange('district')}
              className={`rounded-lg px-2.5 py-2 text-left transition border ${
                comboSelectionMode === 'district'
                  ? 'bg-emerald-600/15 border-emerald-500/40 text-white'
                  : 'text-slate-400 hover:text-slate-200 border-transparent hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] md:text-[11px] font-black leading-tight">
                Theo quận mong muốn
              </div>
              <div className="hidden sm:block text-[10px] mt-0.5 leading-snug text-inherit opacity-80">
                Chỉ xét trường thuộc quận/huyện bạn chọn, không dùng cự ly.
              </div>
            </button>
          </div>
        </div>

        {comboSelectionMode === 'distance' ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-indigo-500/15 bg-indigo-950/15 p-2.5 md:p-4">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-[10px] md:text-xs font-semibold text-slate-300">
                Điều kiện theo khoảng cách
              </label>
              <span className="text-[9px] md:text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-1.5 py-0.5">
                Cự ly được áp dụng
              </span>
            </div>
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-slate-400 mb-1">
                Địa chỉ nhà (tính đường đi thực tế)
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onRequestHomeLocation}
                  className={`flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-lg px-2.5 py-2 text-[11px] text-left transition cursor-pointer ${
                    comboGPS ? 'text-slate-200' : 'text-slate-500'
                  }`}
                >
                  <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                  <span className="truncate">
                    {comboGPS ? comboUserAddress || 'Đã đặt vị trí nhà' : 'Đặt vị trí nhà của bạn...'}
                  </span>
                </button>
                {comboGPS && (
                  <button
                    type="button"
                    onClick={onClearComboLocation}
                    className="px-2 bg-slate-800 border border-slate-700 hover:border-slate-650 text-slate-400 hover:text-white rounded-lg text-[11px] cursor-pointer"
                    title="Xóa vị trí"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="hidden sm:block text-[10px] text-slate-500 mt-1.5 mb-0">
                Khoảng cách được tính theo quãng đường đi thực tế, không phải đường chim bay.
              </p>
            </div>
            <div>
              <label className="block text-[10px] md:text-xs font-semibold text-slate-400 mb-1">
                Cự ly tối đa
              </label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxCommuteDistance}
                  onChange={(e) => onMaxCommuteDistanceChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                />
                <span className="text-[9px] md:text-[10px] text-slate-500 font-bold shrink-0">
                  km
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-950/15 p-2.5 md:p-4">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-[10px] md:text-xs font-semibold text-slate-300">
                Điều kiện theo quận/huyện
              </label>
              <button
                type="button"
                onClick={onClearComboDistricts}
                className="text-[9px] md:text-[10px] font-bold text-slate-400 hover:text-slate-200"
              >
                Xóa chọn
              </button>
            </div>
            <div className="max-h-28 sm:max-h-40 overflow-y-auto grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950/40 p-1.5">
              {districts.map((district) => {
                const checked = comboDistrictIds.includes(district.id);
                return (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => onToggleComboDistrict(district.id)}
                    className={`rounded-lg border px-2 py-1 text-left text-[9px] md:text-[10px] font-bold leading-tight transition ${
                      checked
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {checked ? '✓ ' : ''}
                    {district.name}
                  </button>
                );
              })}
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 m-0">
              Khi chọn quận, hệ thống chỉ xét các trường thuộc quận/huyện này và bỏ hoàn toàn
              điểm thưởng cự ly.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onRunCombo}
          disabled={isComboLoading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-xs mt-2 cursor-pointer"
        >
          {isComboLoading ? 'Đang phân tích dữ liệu...' : '🚀 Tư Vấn Nguyện Vọng'}
        </button>
      </div>
    </div>
  );
}
