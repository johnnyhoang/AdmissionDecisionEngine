import { BadgeCheck, Loader2, MapPin } from 'lucide-react';
import type { ChangeEvent } from 'react';

interface EditSchoolBasicSectionProps {
  formData: any;
  districts: any[];
  onBasicChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAutoGeocode: () => void;
  onOpenMapPicker: () => void;
  onAutoMapUrl: () => void;
  isGeocoding: boolean;
}

export default function EditSchoolBasicSection({
  formData,
  districts,
  onBasicChange,
  onAutoGeocode,
  onOpenMapPicker,
  onAutoMapUrl,
  isGeocoding,
}: EditSchoolBasicSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 flex justify-between items-center">
          Thông tin cơ bản
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Tên trường *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onBasicChange}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Loại trường</label>
            <select
              name="schoolType"
              value={formData.schoolType}
              onChange={onBasicChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="REGULAR">Thường (Đại trà)</option>
              <option value="SPECIALIZED">Chuyên</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Quận/Huyện</label>
            <select
              name="districtId"
              value={formData.districtId}
              onChange={onBasicChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">-- Chọn Quận/Huyện --</option>
              {districts.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Địa chỉ</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={onBasicChange}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Số nhà, tên đường, phường/xã, quận..."
            />
            <button
              type="button"
              onClick={onAutoGeocode}
              disabled={isGeocoding}
              title="Tự động lấy vĩ độ từ địa chỉ"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
            >
              {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              {isGeocoding ? 'Đang tìm...' : 'Lấy tọa độ'}
            </button>
            <button
              type="button"
              onClick={onOpenMapPicker}
              title="Chọn vị trí trên bản đồ"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
            >
              Bản đồ
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Website
          </label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={onBasicChange}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 mt-2 bg-indigo-950/20 p-2 rounded-lg border border-indigo-900/30 w-max">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={onBasicChange}
              className="w-4 h-4 accent-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
              Đang hoạt động
            </label>
          </div>
          <div className="flex items-center gap-2 mt-2 bg-indigo-950/20 p-2 rounded-lg border border-indigo-900/30 w-max">
            <input
              type="checkbox"
              id="isVerified"
              name="isVerified"
              checked={formData.isVerified}
              onChange={onBasicChange}
              className="w-4 h-4 accent-indigo-500"
            />
            <label htmlFor="isVerified" className="text-sm font-medium text-indigo-300 flex items-center gap-1">
              <BadgeCheck className="w-4 h-4" /> Xác thực Trường
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          Địa chỉ & bản đồ
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
            Google Maps URL
            <button type="button" onClick={onAutoMapUrl} className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold underline cursor-pointer">
              Tự động tạo từ tên trường
            </button>
          </label>
          <input
            type="text"
            name="mapUrl"
            value={formData.mapUrl}
            onChange={onBasicChange}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="https://www.google.com/maps/..."
          />
          {formData.mapUrl && (
            <a href={formData.mapUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline text-xs mt-1 inline-block">
              → Mở bản đồ để xác nhận
            </a>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Tọa độ</label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={onBasicChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Latitude"
            />
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={onBasicChange}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Longitude"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
