import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { resolveG10Location, reverseG10Location, searchG10Locations } from '../../../services/api';
import type { G10LocationResult } from '../../../services/api';
import HomeLocationConfirmStep from './HomeLocationConfirmStep';
import HomeLocationInputStep from './HomeLocationInputStep';
import HomeLocationMapStep from './HomeLocationMapStep';

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

/** Single self-contained modal for setting the user's home location:
    type an address (normalized + confirmed), use device GPS, or drop a
    pin on the map — the flow stays inside this modal until it succeeds. */
export default function HomeLocationModal({ isOpen, title, onClose, onConfirm }: HomeLocationModalProps) {
  const [mode, setMode] = useState<Mode>('input');
  const [address, setAddress] = useState('');
  const [original, setOriginal] = useState('');
  const [resolved, setResolved] = useState<G10LocationResult | null>(null);
  const [suggestions, setSuggestions] = useState<G10LocationResult[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const [picked, setPicked] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMode('input');
      setAddress('');
      setOriginal('');
      setResolved(null);
      setSuggestions([]);
      setError('');
      setIsBusy(false);
      setPicked(null);
    }
  }, [isOpen]);

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
    setSuggestions([]);
    try {
      const results = await searchG10Locations({ query: address, limit: 5 });
      if (results.length > 0) {
        setSuggestions(results);
        return;
      }
      const result = await resolveG10Location({ address, districtName: 'Hồ Chí Minh' });
      goConfirm(address, result);
    } catch {
      setError('Không thể định vị địa chỉ. Vui lòng thử lại hoặc dùng GPS / bản đồ.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectSuggestion = (result: G10LocationResult) => {
    goConfirm(address, result);
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

        {mode === 'input' && (
          <HomeLocationInputStep
            address={address}
            suggestions={suggestions}
            isBusy={isBusy}
            error={error}
            onAddressChange={(value) => {
              setAddress(value);
              setSuggestions([]);
            }}
            onResolve={handleResolveAddress}
            onSelectSuggestion={handleSelectSuggestion}
            onUseGps={handleGPS}
            onOpenMap={() => {
              setError('');
              setMode('map');
            }}
          />
        )}

        {mode === 'map' && (
          <HomeLocationMapStep
            isActive={mode === 'map'}
            picked={picked}
            isBusy={isBusy}
            onPickedChange={setPicked}
            onBack={() => setMode('input')}
            onUsePicked={handleMapUse}
          />
        )}

        {mode === 'confirm' && resolved && (
          <HomeLocationConfirmStep
            original={original}
            resolved={resolved}
            isBusy={isBusy}
            normalizedLabel={normalized}
            checkMapUrl={checkMapUrl}
            onBack={() => {
              setResolved(null);
              setMode('input');
            }}
            onConfirm={handleFinalConfirm}
          />
        )}
      </div>
    </div>
  );
}
