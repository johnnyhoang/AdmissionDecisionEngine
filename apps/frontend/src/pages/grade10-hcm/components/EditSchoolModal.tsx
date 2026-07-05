import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, Sparkles, BadgeCheck, MapPin, Loader2 } from 'lucide-react';
import { fetchG10SchoolDetail, resolveG10Location, reverseG10Location } from '../../../services/api';
import type { G10LocationResult } from '../../../services/api';
import { formatSchoolYear, getRecentSchoolYears } from '../../../utils/date';
import AddressConfirmModal from './AddressConfirmModal';
import MapPickerModal from './MapPickerModal';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  onSave: (id: string, data: any) => Promise<void>;
  onAiPrefill?: (schoolName: string, schoolCode: string) => void;
}

export default function EditSchoolModal({ isOpen, onClose, schoolId, onSave, onAiPrefill }: EditSchoolModalProps) {
  const [formData, setFormData] = useState<any>(null);
  const [cutoffsMap, setCutoffsMap] = useState<any>({});
  const [quotasMap, setQuotasMap] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pendingGeocode, setPendingGeocode] = useState<G10LocationResult | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const RECENT_YEARS = getRecentSchoolYears();

  useEffect(() => {
    if (!isOpen || !schoolId) return;

    const loadSchoolDetail = async () => {
      setIsLoading(true);
      try {
        const data = await fetchG10SchoolDetail(schoolId);
        setFormData({
          name: data.name || '',
          code: data.code || '',
          districtId: data.district?.id || '',
          address: data.address || '',
          website: data.website || '',
          description: data.description || '',
          comments: data.comments || '',
          activities: data.activities || '',
          mapUrl: data.mapUrl || '',
          schoolType: data.schoolType || 'REGULAR',
          isActive: data.isActive !== false,
          isVerified: data.isVerified === true,
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
        });

        // Backend returns cutoffScores / quotaHistory — postgres decimals
        // arrive as strings, so convert to numbers for the form inputs
        const cutoffList = data.cutoffScores ?? data.cutoffs ?? [];
        const cMap: any = {};
        cutoffList.forEach((c: any) => {
          cMap[c.year] = {
            ...c,
            cutoffNV1: c.cutoffNV1 != null ? Number(c.cutoffNV1) : null,
            cutoffNV2: c.cutoffNV2 != null ? Number(c.cutoffNV2) : null,
            cutoffNV3: c.cutoffNV3 != null ? Number(c.cutoffNV3) : null,
          };
        });
        setCutoffsMap(cMap);

        const quotaList = data.quotaHistory ?? data.quotas ?? [];
        const qMap: any = {};
        quotaList.forEach((q: any) => {
          qMap[q.year] = {
            ...q,
            quota: q.quota != null ? Number(q.quota) : 0,
            registeredCount: q.registeredCount != null ? Number(q.registeredCount) : 0,
            competitionRatio: q.competitionRatio != null ? Number(q.competitionRatio) : 0,
          };
        });
        setQuotasMap(qMap);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchoolDetail();
  }, [isOpen, schoolId]);

  if (!isOpen || !formData) return null;

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCutoffChange = (year: number, field: string, value: string) => {
    setCutoffsMap((prev: any) => ({
      ...prev,
      [year]: {
        ...(prev[year] || { year, programType: 'REGULAR' }),
        [field]: value ? parseFloat(value) : null
      }
    }));
  };

  const handleQuotaChange = (year: number, field: string, value: string) => {
    setQuotasMap((prev: any) => {
      const current = prev[year] || { year, programType: 'REGULAR', quota: 0, registeredCount: 0 };
      const updated = { ...current, [field]: value ? parseInt(value, 10) : 0 };
      
      // Auto calc ratio
      if (updated.quota && updated.registeredCount) {
        updated.competitionRatio = parseFloat((updated.registeredCount / updated.quota).toFixed(2));
      } else {
        updated.competitionRatio = 0;
      }
      
      return { ...prev, [year]: updated };
    });
  };

  const handleAutoGeocode = async () => {
    if (!formData.address?.trim()) {
      alert('Vui lòng nhập địa chỉ trước khi lấy tọa độ.');
      return;
    }
    setIsGeocoding(true);
    try {
      const resolved = await resolveG10Location({
        name: formData.name,
        address: formData.address,
        mapUrl: formData.mapUrl,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
      });
      // Apply only after the user confirms the normalized address
      setPendingGeocode(resolved);
    } catch {
      alert('Lỗi kết nối khi geocode địa chỉ.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapPick = async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    // Fill the address from reverse geocoding only when it is still empty —
    // never overwrite an address the admin already typed
    let reverseAddress: string | null = null;
    try {
      const rev = await reverseG10Location({ latitude, longitude });
      reverseAddress = rev.formattedAddress || null;
    } catch {
      // coordinates alone are still useful
    }
    setFormData((prev: any) => ({
      ...prev,
      latitude,
      longitude,
      address: prev.address || reverseAddress || '',
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    }));
    setIsMapPickerOpen(false);
  };

  const handleGeocodeConfirm = () => {
    if (!pendingGeocode) return;
    const resolved = pendingGeocode;
    setPendingGeocode(null);
    setFormData((prev: any) => ({
      ...prev,
      address: resolved.formattedAddress || prev.address,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      mapUrl: prev.mapUrl || resolved.mapUrl || `https://www.google.com/maps/search/?api=1&query=${resolved.latitude},${resolved.longitude}`,
    }));
  };

  const handleAutoMapUrl = () => {
    if (!formData.name) return;
    const query = encodeURIComponent(formData.name + ', Hồ Chí Minh');
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    setFormData((prev: any) => ({ ...prev, mapUrl: url }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const cutoffs = Object.values(cutoffsMap).filter((c: any) => c.cutoffNV1 || c.cutoffNV2 || c.cutoffNV3);
      const quotas = Object.values(quotasMap).filter((q: any) => q.quota > 0);
      
      const payload = {
        ...formData,
        cutoffs,
        quotas
      };
      
      await onSave(schoolId, payload);
      onClose();
    } catch (e: any) {
      alert('Lỗi khi cập nhật: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-t-2xl md:rounded-2xl w-full max-w-6xl max-h-[94dvh] md:max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <h2 className="text-base md:text-xl font-bold text-white flex items-center gap-2 min-w-0">
            <span className="truncate">Chỉnh sửa thông tin: {formData.name}</span>
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-6 md:gap-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">Đang tải dữ liệu...</div>
          ) : (
            <>
              {/* Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 flex justify-between items-center">
                    Thông tin cơ bản
                    {onAiPrefill && !formData.isVerified && (
                       <button
                         onClick={() => { onClose(); onAiPrefill(formData.name, formData.code); }}
                         className="text-xs flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded"
                       >
                         <Sparkles className="w-3 h-3" /> Tự động điền AI
                       </button>
                    )}
                  </h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Tên trường *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleBasicChange} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Loại trường</label>
                      <select name="schoolType" value={formData.schoolType} onChange={handleBasicChange} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white">
                        <option value="REGULAR">Thường (Đại trà)</option>
                        <option value="SPECIALIZED">Chuyên</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">ID Quận/Huyện</label>
                      <input type="text" name="districtId" value={formData.districtId} onChange={handleBasicChange} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Địa chỉ</label>
                    <div className="flex gap-2">
                      <input type="text" name="address" value={formData.address} onChange={handleBasicChange} className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white" placeholder="Số nhà, tên đường, phường/xã, quận..." />
                      <button
                        type="button"
                        onClick={handleAutoGeocode}
                        disabled={isGeocoding}
                        title="Tự động lấy vĩ độ từ địa chỉ"
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                        {isGeocoding ? 'Đang tìm...' : 'Lấy tọa độ'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        title="Chọn vị trí trên bản đồ"
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
                      >
                        🗺️
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Vĩ độ (Latitude)</label>
                      <input type="number" name="latitude" value={formData.latitude} onChange={handleBasicChange} step="0.000001" className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white font-mono" placeholder="10.7769..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Kinh độ (Longitude)</label>
                      <input type="number" name="longitude" value={formData.longitude} onChange={handleBasicChange} step="0.000001" className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white font-mono" placeholder="106.6956..." />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Website</label>
                    <input type="text" name="website" value={formData.website} onChange={handleBasicChange} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2">Mô tả & Đánh giá</h3>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Mô tả (Description)</label>
                    <textarea name="description" value={formData.description} onChange={handleBasicChange} rows={3} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white resize-y" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Đánh giá chung (Comments)</label>
                    <textarea name="comments" value={formData.comments} onChange={handleBasicChange} rows={3} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white resize-y" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Hoạt động & Phong trào</label>
                    <textarea name="activities" value={formData.activities} onChange={handleBasicChange} rows={3} placeholder="Câu lạc bộ, văn nghệ, thể thao, hoạt động ngoại khóa..." className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white resize-y" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
                      Google Maps URL
                      <button type="button" onClick={handleAutoMapUrl} className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold underline cursor-pointer">
                        Tự động tạo từ tên trường
                      </button>
                    </label>
                    <input type="text" name="mapUrl" value={formData.mapUrl} onChange={handleBasicChange} className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white" placeholder="https://www.google.com/maps/..." />
                    {formData.mapUrl && (
                      <a href={formData.mapUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline text-xs mt-1 inline-block">→ Mở bản đồ để xác nhận</a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleBasicChange} className="w-4 h-4 accent-indigo-500" />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-300">Đang hoạt động (Hiển thị cho User)</label>
                  </div>

                  <div className="flex items-center gap-2 mt-2 bg-indigo-950/20 p-2 rounded-lg border border-indigo-900/30 w-max">
                    <input type="checkbox" id="isVerified" name="isVerified" checked={formData.isVerified} onChange={handleBasicChange} className="w-4 h-4 accent-indigo-500" />
                    <label htmlFor="isVerified" className="text-sm font-medium text-indigo-300 flex items-center gap-1"><BadgeCheck className="w-4 h-4" /> Xác thực Trường (Khóa auto update AI)</label>
                  </div>
                </div>
              </div>

              {/* Matrix Data */}
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" /> Dữ liệu Lịch sử (3 năm gần nhất)
                </h3>

                {/* Mobile: one card per school year — the wide table is unusable on phones */}
                <div className="flex flex-col gap-3 md:hidden">
                  {RECENT_YEARS.map(year => {
                    const q = quotasMap[year] || {};
                    const c = cutoffsMap[year] || {};
                    return (
                      <div key={year} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">Năm học {formatSchoolYear(year)}</span>
                          <span className="text-[10px] font-bold text-emerald-400">Tỉ lệ chọi: {q.competitionRatio || '—'}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(['cutoffNV1', 'cutoffNV2', 'cutoffNV3'] as const).map((field, i) => (
                            <div key={field}>
                              <label className="block text-[10px] text-indigo-300 font-bold mb-1">Điểm NV{i + 1}</label>
                              <input
                                type="number" step="0.25" inputMode="decimal"
                                value={c[field] ?? ''}
                                onChange={(e) => handleCutoffChange(year, field, e.target.value)}
                                className="w-full bg-slate-950 border border-indigo-900/50 rounded px-2 py-1.5 text-sm text-indigo-300 font-medium outline-none focus:border-indigo-500"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">Chỉ tiêu</label>
                            <input
                              type="number" inputMode="numeric"
                              value={q.quota || ''}
                              onChange={(e) => handleQuotaChange(year, 'quota', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-bold mb-1">Số đăng ký</label>
                            <input
                              type="number" inputMode="numeric"
                              value={q.registeredCount || ''}
                              onChange={(e) => handleQuotaChange(year, 'registeredCount', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left text-sm text-slate-300 whitespace-nowrap border-collapse">
                    <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-3 border border-slate-800 w-24">Năm học</th>
                        <th className="px-4 py-3 border border-slate-800">Chỉ tiêu</th>
                        <th className="px-4 py-3 border border-slate-800">Số đăng ký</th>
                        <th className="px-4 py-3 border border-slate-800 bg-emerald-950/20 text-emerald-400">Tỉ lệ chọi (Auto)</th>
                        <th className="px-4 py-3 border border-slate-800 bg-indigo-950/20 text-indigo-400">Điểm NV1</th>
                        <th className="px-4 py-3 border border-slate-800 bg-indigo-950/20 text-indigo-400">Điểm NV2</th>
                        <th className="px-4 py-3 border border-slate-800 bg-indigo-950/20 text-indigo-400">Điểm NV3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_YEARS.map(year => {
                        const q = quotasMap[year] || {};
                        const c = cutoffsMap[year] || {};
                        return (
                          <tr key={year} className="bg-slate-900 border-b border-slate-800">
                            <td className="px-4 py-2 border border-slate-800 font-bold text-slate-200">
                              {formatSchoolYear(year)}
                            </td>
                            <td className="px-4 py-2 border border-slate-800">
                              <input type="number" value={q.quota || ''} onChange={(e) => handleQuotaChange(year, 'quota', e.target.value)} className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm outline-none" />
                            </td>
                            <td className="px-4 py-2 border border-slate-800">
                              <input type="number" value={q.registeredCount || ''} onChange={(e) => handleQuotaChange(year, 'registeredCount', e.target.value)} className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm outline-none" />
                            </td>
                            <td className="px-4 py-2 border border-slate-800 bg-emerald-950/10 font-bold text-emerald-300">
                              {q.competitionRatio || '0.00'}
                            </td>
                            <td className="px-4 py-2 border border-slate-800 bg-indigo-950/10">
                              <input type="number" step="0.25" value={c.cutoffNV1 || ''} onChange={(e) => handleCutoffChange(year, 'cutoffNV1', e.target.value)} className="w-20 bg-slate-950 border border-indigo-900/50 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 text-indigo-300 font-medium" />
                            </td>
                            <td className="px-4 py-2 border border-slate-800 bg-indigo-950/10">
                              <input type="number" step="0.25" value={c.cutoffNV2 || ''} onChange={(e) => handleCutoffChange(year, 'cutoffNV2', e.target.value)} className="w-20 bg-slate-950 border border-indigo-900/50 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 text-indigo-300 font-medium" />
                            </td>
                            <td className="px-4 py-2 border border-slate-800 bg-indigo-950/10">
                              <input type="number" step="0.25" value={c.cutoffNV3 || ''} onChange={(e) => handleCutoffChange(year, 'cutoffNV3', e.target.value)} className="w-20 bg-slate-950 border border-indigo-900/50 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 text-indigo-300 font-medium" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-500 mt-2">
                    * Bỏ trống Điểm chuẩn hoặc Chỉ tiêu nếu không có dữ liệu năm đó. Hệ thống sẽ tự động gỡ các bản ghi trắng.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi (Ghi Đè)'}
          </button>
        </div>
      </div>

      <AddressConfirmModal
        isOpen={!!pendingGeocode}
        originalAddress={formData.address || formData.name}
        resolved={pendingGeocode}
        onConfirm={handleGeocodeConfirm}
        onCancel={() => setPendingGeocode(null)}
      />
      <MapPickerModal
        isOpen={isMapPickerOpen}
        title={`Chọn vị trí: ${formData.name || 'trường'}`}
        initialLat={formData.latitude !== '' ? Number(formData.latitude) : null}
        initialLng={formData.longitude !== '' ? Number(formData.longitude) : null}
        onClose={() => setIsMapPickerOpen(false)}
        onPick={handleMapPick}
      />
    </div>
  );
}
