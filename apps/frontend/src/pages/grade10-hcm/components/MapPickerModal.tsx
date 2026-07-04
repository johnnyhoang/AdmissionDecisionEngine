import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Check, Loader2 } from 'lucide-react';

const HCM_CENTER: [number, number] = [10.7769, 106.7009];

const pinIcon = L.divIcon({
  className: 'map-picker-pin',
  html: '📍',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

interface MapPickerModalProps {
  isOpen: boolean;
  title?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onClose: () => void;
  /** Called with the picked coordinates when the user confirms. The modal
      shows a processing state while the returned promise is pending. */
  onPick: (point: { latitude: number; longitude: number }) => Promise<void> | void;
}

export default function MapPickerModal({
  isOpen, title, initialLat, initialLng, onClose, onPick,
}: MapPickerModalProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [picked, setPicked] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen || !mapDivRef.current) return;

    const hasInitial =
      typeof initialLat === 'number' && Number.isFinite(initialLat) &&
      typeof initialLng === 'number' && Number.isFinite(initialLng);
    const start: [number, number] = hasInitial ? [initialLat!, initialLng!] : HCM_CENTER;

    const map = L.map(mapDivRef.current).setView(start, hasInitial ? 15 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const placeMarker = (lat: number, lng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setPicked({ latitude: pos.lat, longitude: pos.lng });
        });
        markerRef.current = marker;
      }
      setPicked({ latitude: lat, longitude: lng });
    };

    if (hasInitial) placeMarker(initialLat!, initialLng!);
    map.on('click', (e: L.LeafletMouseEvent) => placeMarker(e.latlng.lat, e.latlng.lng));

    return () => {
      map.remove();
      markerRef.current = null;
      setPicked(null);
    };
  }, [isOpen, initialLat, initialLng]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!picked || isProcessing) return;
    setIsProcessing(true);
    try {
      await onPick(picked);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 m-0">
              <MapPin className="h-4 w-4 text-indigo-400" />
              {title || 'Chọn vị trí trên bản đồ'}
            </h2>
            <p className="text-[10px] text-slate-400 m-0 mt-1">
              Nhấp vào bản đồ để đặt ghim 📍, kéo ghim để tinh chỉnh vị trí.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div ref={mapDivRef} className="w-full" style={{ height: 420 }}></div>

        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono">
            {picked
              ? `📍 ${picked.latitude.toFixed(6)}, ${picked.longitude.toFixed(6)}`
              : 'Chưa chọn vị trí nào'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={!picked || isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isProcessing ? 'Đang xử lý...' : 'Xác nhận vị trí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
