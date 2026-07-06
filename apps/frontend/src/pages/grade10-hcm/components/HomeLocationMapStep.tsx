import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, Loader2 } from 'lucide-react';

const HCM_CENTER: [number, number] = [10.7769, 106.7009];

const pinIcon = L.divIcon({
  className: 'map-picker-pin',
  html: '📍',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

interface HomeLocationMapStepProps {
  isActive: boolean;
  picked: { latitude: number; longitude: number } | null;
  isBusy: boolean;
  onPickedChange: (value: { latitude: number; longitude: number } | null) => void;
  onBack: () => void;
  onUsePicked: () => void;
}

export default function HomeLocationMapStep({
  isActive,
  picked,
  isBusy,
  onPickedChange,
  onBack,
  onUsePicked,
}: HomeLocationMapStepProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!isActive || !mapDivRef.current) return;

    const map = L.map(mapDivRef.current).setView(HCM_CENTER, 12);
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
          onPickedChange({ latitude: pos.lat, longitude: pos.lng });
        });
        markerRef.current = marker;
      }
      onPickedChange({ latitude: lat, longitude: lng });
    };

    map.on('click', (e: L.LeafletMouseEvent) => placeMarker(e.latlng.lat, e.latlng.lng));

    return () => {
      map.remove();
      markerRef.current = null;
      onPickedChange(null);
    };
  }, [isActive, onPickedChange]);

  return (
    <>
      <div ref={mapDivRef} className="w-full" style={{ height: 400 }}></div>
      <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-800">
        <div className="text-[10px] text-slate-400 font-mono">
          {picked ? `📍 ${picked.latitude.toFixed(6)}, ${picked.longitude.toFixed(6)}` : 'Chưa chọn vị trí nào'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Quay lại
          </button>
          <button
            onClick={onUsePicked}
            disabled={!picked || isBusy}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Dùng vị trí này
          </button>
        </div>
      </div>
    </>
  );
}
