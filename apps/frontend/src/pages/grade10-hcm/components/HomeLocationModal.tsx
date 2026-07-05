import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Check, Pencil, ExternalLink, Loader2, Search } from 'lucide-react';
import { resolveG10Location, reverseG10Location } from '../../../services/api';
import type { G10LocationResult } from '../../../services/api';

export interface HomeLocationPick {
  latitude: number;
  longitude: number;
  label: string;
}

interface HomeLocationModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  /** Called once the user has confirmed a location. Parent closes the modal. */
  onConfirm: (pick: HomeLocationPick) => Promise<void> | void;
}

type Mode = 'input' | 'map' | 'confirm';

const HCM_CENTER: [number, number] = [10.7769, 106.7009];

const pinIcon = L.divIcon({
  className: 'map-picker-pin',
  html: '📍',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

/** Single self-contained modal for setting the user's home location:
    type an address (normalized + confirmed), use device GPS, or drop a
    pin on the map — the flow stays inside this modal until it succeeds. */
export default function HomeLocationModal({ isOpen, title, onClose, onConfirm }: HomeLocationModalProps) {
  const [mode, setMode] = useState<Mode>('input');
  const [address, setAddress] = useState('');
  const [original, setOriginal] = useState('');
  const [resolved, setResolved] = useState<G10LocationResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  // Map state
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [picked, setPicked] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMode('input');
      setAddress('');
      setOriginal('');
      setResolved(null);
      setError('');
      setIsBusy(false);
      setPicked(null);
    }
  }, [isOpen]);

  // Leaflet lifecycle — only while the map step is visible
  useEffect(() => {
    if (!isOpen || mode !== 'map' || !mapDivRef.current) return;

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
          setPicked({ latitude: pos.lat, longitude: pos.lng });
        });
        markerRef.current = marker;
      }
      setPicked({ latitude: lat, longitude: lng });
    };

    map.on('click', (e: L.LeafletMouseEvent) => placeMarker(e.latlng.lat, e.latlng.lng));

    return () => {
      map.remove();
      markerRef.current = null;
      setPicked(null);
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const goConfirm = (originalLabel: string, result: G10LocationResult) => {
    setOriginal(originalLabel);
    setResolved(result);
    setError('');
    setMode('confirm');
  };

  const handleResolveAddress = async () => {
    if (!address.trim()) {
      setError('Vui lòng nhập địa chỉ nhà.');
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      const result = await resolveG10Location({ address, districtName: 'Hồ Chí Minh' });
      goConfirm(address, result);
    } catch {
      setError('Không thể định vị địa chỉ. Vui lòng thử lại hoặc dùng GPS / bản đồ.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsBusy(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let result: G10LocationResult = {
          latitude, longitude, formattedAddress: null, mapUrl: null, source: 'gps', precision: 'exact',
        };
        try {
          result = await reverseG10Location({ latitude, longitude });
        } catch {
          // coordinates alone are enough
        }
        setIsBusy(false);
        goConfirm('Vị trí GPS hiện tại', result);
      },
      () => {
        setIsBusy(false);
        setError('Không thể xác định vị trí GPS. Vui lòng nhập địa chỉ hoặc chọn trên bản đồ.');
      },
    );
  };

  const handleMapUse = async () => {
    if (!picked) return;
    setIsBusy(true);
    const { latitude, longitude } = picked;
    let result: G10LocationResult = {
      latitude, longitude, formattedAddress: null, mapUrl: null, source: 'map', precision: 'exact',
    };
    try {
      result = await reverseG10Location({ latitude, longitude });
    } catch {
      // coordinates alone are enough
    }
    setIsBusy(false);
    goConfirm('Vị trí chọn trên bản đồ', result);
  };

  const handleFinalConfirm = async () => {
    if (!resolved || isBusy) return;
    setIsBusy(true);
    try {
      await onConfirm({
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        label: resolved.formattedAddress || original,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const normalized = resolved?.formattedAddress || original;
  const checkMapUrl = resolved
    ? resolved.mapUrl || `https://www.google.com/maps/search/?api=1&query=${resolved.latitude},${resolved.longitude}`
    : '';

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative bg-slate-900 border border-slate-700 rounded-2xl w-full flex flex-col shadow-2xl overflow-hidden ${mode === 'map' ? 'max-w-2xl' : 'max-w-md'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 m-0">
              <MapPin className="h-4 w-4 text-indigo-400" />
              {title || 'Vị trí nhà của bạn'}
            </h2>
            {mode === 'map' && (
              <p className="text-[10px] text-slate-400 m-0 mt-1">Nhấp vào bản đồ để đặt ghim 📍, kéo ghim để tinh chỉnh.</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer">✕</button>
        </div>

        {/* Step: type address / GPS / open map */}
        {mode === 'input' && (
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ nhà của bạn</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ví dụ: 227 Nguyễn Văn Cừ, Quận 5..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleResolveAddress(); }}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition"
                />
                <button
                  onClick={handleResolveAddress}
                  disabled={isBusy}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Kiểm tra
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase">Hoặc</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleGPS}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-indigo-400" />
              {isBusy ? 'Đang định vị...' : 'Sử dụng GPS hiện tại'}
            </button>

            <button
              onClick={() => { setError(''); setMode('map'); }}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              🗺️ Chọn vị trí trên bản đồ
            </button>

            {error && <p className="text-[11px] text-rose-400 m-0">⚠️ {error}</p>}
          </div>
        )}

        {/* Step: pick on map */}
        {mode === 'map' && (
          <>
            <div ref={mapDivRef} className="w-full" style={{ height: 400 }}></div>
            <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono">
                {picked ? `📍 ${picked.latitude.toFixed(6)}, ${picked.longitude.toFixed(6)}` : 'Chưa chọn vị trí nào'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('input')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleMapUse}
                  disabled={!picked || isBusy}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Dùng vị trí này
                </button>
              </div>
            </div>
          </>
        )}

        {/* Step: review normalized result and confirm */}
        {mode === 'confirm' && resolved && (
          <>
            <div className="p-5 flex flex-col gap-3">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bạn đã cung cấp</div>
                <div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">{original}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Vị trí được xác định</div>
                <div className="text-xs font-bold text-white bg-indigo-950/40 border border-indigo-500/30 rounded-lg px-3 py-2">
                  {normalized || `${resolved.latitude.toFixed(6)}, ${resolved.longitude.toFixed(6)}`}
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
                <a href={checkMapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold transition">
                  <ExternalLink className="h-3 w-3" />
                  Kiểm tra trên Google Maps
                </a>
              </div>
              <p className="text-[10px] text-slate-500 m-0">Nếu vị trí chưa đúng, bấm "Nhập lại" để thử cách khác.</p>
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-800">
              <button
                onClick={() => { setResolved(null); setMode('input'); }}
                disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                Nhập lại
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Đúng, dùng vị trí này
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
