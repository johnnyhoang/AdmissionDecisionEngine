import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { fetchG10SchoolDetail, resolveG10Location, reverseG10Location } from '../../../services/api';
import type { G10LocationResult } from '../../../services/api';
import { getRecentSchoolYears } from '../../../utils/date';
import AddressConfirmModal from './AddressConfirmModal';
import MapPickerModal from './MapPickerModal';
import EditSchoolBasicSection from './EditSchoolBasicSection';
import EditSchoolHistorySection from './EditSchoolHistorySection';

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  onSave: (id: string, data: any) => Promise<void>;
  districts?: any[];
}

export default function EditSchoolModal({ isOpen, onClose, schoolId, onSave, districts = [] }: EditSchoolModalProps) {
  const [formData, setFormData] = useState<any>(null);
  const [cutoffsMap, setCutoffsMap] = useState<any>({});
  const [quotasMap, setQuotasMap] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [pendingGeocode, setPendingGeocode] = useState<G10LocationResult | null>(null);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [yearsList, setYearsList] = useState<number[]>([]);

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
          regulations: data.regulations || '',
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

        // Build unique years list
        const initialYearsSet = new Set<number>([
          ...RECENT_YEARS,
          ...cutoffList.map((c: any) => Number(c.year)),
          ...quotaList.map((q: any) => Number(q.year))
        ]);
        const sortedYears = Array.from(initialYearsSet)
          .filter(y => !isNaN(y) && y > 2000)
          .sort((a, b) => b - a);
        setYearsList(sortedYears);
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

  const handleAddYear = () => {
    const input = prompt('Nhập năm học cần bổ sung (Ví dụ: 2024, 2023):');
    if (!input) return;
    const year = parseInt(input.trim(), 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      alert('Năm học không hợp lệ. Vui lòng nhập năm từ 2000 đến 2100.');
      return;
    }

    if (yearsList.includes(year)) {
      const confirmOverwrite = window.confirm(
        `Năm học ${year} đã tồn tại trong danh sách. Bạn có muốn ghi đè/nhập lại điểm mới cho năm này không?`
      );
      if (confirmOverwrite) {
        setCutoffsMap((prev: any) => ({
          ...prev,
          [year]: { year, programType: 'REGULAR', cutoffNV1: null, cutoffNV2: null, cutoffNV3: null }
        }));
        setQuotasMap((prev: any) => ({
          ...prev,
          [year]: { year, programType: 'REGULAR', quota: 0, registeredCount: 0, competitionRatio: 0 }
        }));
      }
      return;
    }

    setYearsList(prev => [...prev, year].sort((a, b) => b - a));
    setCutoffsMap((prev: any) => ({
      ...prev,
      [year]: { year, programType: 'REGULAR', cutoffNV1: null, cutoffNV2: null, cutoffNV3: null }
    }));
    setQuotasMap((prev: any) => ({
      ...prev,
      [year]: { year, programType: 'REGULAR', quota: 0, registeredCount: 0, competitionRatio: 0 }
    }));
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
              <EditSchoolBasicSection
                formData={formData}
                districts={districts}
                onBasicChange={handleBasicChange}
                onAutoGeocode={handleAutoGeocode}
                onOpenMapPicker={() => setIsMapPickerOpen(true)}
                onAutoMapUrl={handleAutoMapUrl}
                isGeocoding={isGeocoding}
              />

              {/* Matrix Data */}
              <EditSchoolHistorySection
                yearsList={yearsList}
                cutoffsMap={cutoffsMap}
                quotasMap={quotasMap}
                onAddYear={handleAddYear}
                onCutoffChange={handleCutoffChange}
                onQuotaChange={handleQuotaChange}
              />
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
