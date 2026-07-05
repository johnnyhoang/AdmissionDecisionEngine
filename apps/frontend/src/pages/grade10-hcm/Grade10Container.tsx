import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search as SearchIcon, TrendingUp, Calculator as CalcIcon, MapPin,
  BadgeCheck, School, HelpCircle, Sparkles, ArrowUpDown,
  BarChart2, BookOpen, Sliders, Award, RefreshCw, Printer, GitMerge,
  Sun, Moon
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  fetchG10Schools, fetchG10SchoolDetail, fetchG10Districts,
  fetchG10Analytics, evaluateG10Profile, getG10ComboRecommendations,
  fetchNearbyG10Schools, resolveG10Location, reverseG10Location,
} from '../../services/api';
import type { G10SchoolItem, G10RecommendationItem, G10LocationResult } from '../../services/api';
import AiSearchModal from '../../components/AiSearchModal';
import AddressConfirmModal from './components/AddressConfirmModal';
import MapPickerModal from './components/MapPickerModal';
import MergeSchoolModal from './components/MergeSchoolModal';
import EditSchoolModal from './components/EditSchoolModal';
import CompareDrawer from './components/CompareDrawer';
import { updateG10School } from '../../services/api';
import { mergeG10Schools } from '../../services/api';
import { getCurrentSchoolYear, formatSchoolYear } from '../../utils/date';
import { useAuth } from '../../context/useAuth';
import { applyThemeToDocument, readStoredTheme, writeStoredTheme } from '../../utils/theme';

export default function Grade10Container() {
  // ── UI States ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = readStoredTheme();
    return saved;
  });
  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      writeStoredTheme(nextTheme);
      return nextTheme;
    });
  };
  const [helpModal, setHelpModal] = useState<'calculator' | 'combo' | null>(null);
  const { user, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' |
    'combo' | 'specialized' | 'adjust' | 'analytics' | 'compare'
  >('dashboard');
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // ── Admin school management states ─────────────────────────────────────────
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedMergeIds, setSelectedMergeIds] = useState<string[]>([]);

  // ── School / Search states ─────────────────────────────────────────────────
  const [schools, setSchools] = useState<G10SchoolItem[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [leaderboardType, setLeaderboardType] = useState<
    | 'topSchools'
    | 'bottomSchools'
    | 'topQuota'
    | 'topRatio'
    | 'bottomRatio'
    | 'topIncrease'
    | 'topDecrease'
    | 'topRegistered'
    | 'topSpecialized'
    | 'topNV3Gap'
  >('topSchools');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = searchQuery;
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<any>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrefillSchool, setAiPrefillSchool] = useState<{
    name: string;
    code: string;
    districtName?: string;
    districtCode?: string;
  } | undefined>(undefined);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'cutoff' | 'quota'>('info');

  // ── Distance Finder states ─────────────────────────────────────────────────
  const [userAddress, setUserAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [distanceSchools, setDistanceSchools] = useState<any[]>([]);
  const [isProximityFilterActive, setIsProximityFilterActive] = useState(false);
  const [isDistanceModalOpen, setIsDistanceModalOpen] = useState(false);

  // Address normalization confirmation — resolved address waiting for the
  // user to confirm before the follow-up action (distance filter / combo) runs
  const [addressConfirm, setAddressConfirm] = useState<{
    context: 'proximity' | 'combo';
    original: string;
    resolved: G10LocationResult;
  } | null>(null);

  // Map picker — pick coordinates directly on the map instead of typing an address
  const [mapPickerContext, setMapPickerContext] = useState<'proximity' | 'combo' | null>(null);

  // ── Combo recommendation states ────────────────────────────────────────────
  const [minMath, setMinMath] = useState('7.5');
  const [maxMath, setMaxMath] = useState('8.5');
  const [minLiterature, setMinLiterature] = useState('7.5');
  const [maxLiterature, setMaxLiterature] = useState('8.5');
  const [minEnglish, setMinEnglish] = useState('8.0');
  const [maxEnglish, setMaxEnglish] = useState('9.0');
  const [dreamSchoolCode, setDreamSchoolCode] = useState('');
  const [comboUserAddress, setComboUserAddress] = useState('');
  const [comboGPS, setComboGPS] = useState<{lat: number, lon: number} | null>(null);
  const [isComboLoading, setIsComboLoading] = useState(false);
  const [comboResult, setComboResult] = useState<any>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<'safe' | 'effort' | 'defense'>('safe');
  const [maxCommuteDistance, setMaxCommuteDistance] = useState('10');

  // ── Calculator form states ─────────────────────────────────────────────────
  const [mathScore, setMathScore] = useState('8.5');
  const [literatureScore, setLiteratureScore] = useState('8.0');
  const [englishScore, setEnglishScore] = useState('8.5');
  const [priorityScore, setPriorityScore] = useState('0');
  const [bonusScore, setBonusScore] = useState('0');
  const [preferredDistrict, setPreferredDistrict] = useState('');
  const [targetNV, setTargetNV] = useState('NV1');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // ── Compare List ───────────────────────────────────────────────────────────
  const [compareList, setCompareList] = useState<G10SchoolItem[]>([]);

  useEffect(() => {
    loadDistricts();
    loadSchools();
    loadAnalytics();
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<'light' | 'dark'>).detail;
      if (nextTheme === 'light' || nextTheme === 'dark') {
        setTheme(nextTheme);
      }
    };

    window.addEventListener('app-theme-change', handleThemeChange);
    return () => window.removeEventListener('app-theme-change', handleThemeChange);
  }, []);

    const loadDistricts = async () => {
    try {
      const data = await fetchG10Districts();
      setDistricts(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const loadSchools = async (search = '', distId = '') => {
    setLoading(true);
    try {
      const data = await fetchG10Schools(search, distId);
      setSchools(data.items);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await fetchG10Analytics();
      setAnalytics(data);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    loadSchools(val, selectedDistrict);
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    loadSchools(searchQuery, val);
  };

  
  
  const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };



  const calculateSchoolDistances = async (userLat: number, userLon: number) => {
    setIsLocating(true);
    try {
      const res = await fetchNearbyG10Schools({
        userLat,
        userLon,
        limit: 15,
      });
      setDistanceSchools(
        (res.items || []).map((school: any) => ({
          ...school,
          roadDistance: school.roadDistanceKm ?? school.straightDistanceKm ?? 0,
          roadDuration: school.roadDurationMin ?? Math.round((school.roadDistanceKm ?? school.straightDistanceKm ?? 0) * 3),
        })),
      );
    } catch (e) {
      console.error(e);
      const finalSchools = schools
        .filter(s => s.latitude && s.longitude)
        .map(s => {
          const d = getHaversineDistance(userLat, userLon, s.latitude!, s.longitude!);
          return {
            ...s,
            roadDistance: parseFloat(d.toFixed(2)),
            roadDuration: Math.round(d * 3),
          };
        })
        .sort((a, b) => a.roadDistance - b.roadDistance)
        .slice(0, 15);
      setDistanceSchools(finalSchools);
    } finally {
      setIsLocating(false);
    }
  };

  
  const handleComboGPS = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setComboGPS({ lat: position.coords.latitude, lon: position.coords.longitude });
        setComboUserAddress('Tọa độ hiện tại của bạn');
      },
      () => alert('Không thể lấy vị trí hiện tại')
    );
  };

  const runComboRequest = async (lat?: number, lon?: number) => {
    setIsComboLoading(true);
    try {
      const res = await getG10ComboRecommendations({
        minMath: parseFloat(minMath),
        maxMath: parseFloat(maxMath),
        minLiterature: parseFloat(minLiterature),
        maxLiterature: parseFloat(maxLiterature),
        minEnglish: parseFloat(minEnglish),
        maxEnglish: parseFloat(maxEnglish),
        priority: parseFloat(priorityScore),
        bonus: parseFloat(bonusScore),
        userLat: lat,
        userLon: lon,
        dreamSchoolCode: dreamSchoolCode || undefined,
        maxCommuteDistance: parseFloat(maxCommuteDistance),
      });

      setComboResult(res);
    } catch (e: any) {
      alert('Tư vấn thất bại: ' + e.message);
    } finally {
      setIsComboLoading(false);
    }
  };

  const handleGetCombo = async () => {
    // Address typed but not yet geocoded — normalize it and let the user
    // confirm before running the recommendation
    if (comboUserAddress && comboUserAddress !== 'Tọa độ hiện tại của bạn' && !comboGPS) {
      setIsComboLoading(true);
      try {
        const resolved = await resolveG10Location({
          address: comboUserAddress,
          districtName: 'Hồ Chí Minh',
        });
        setAddressConfirm({ context: 'combo', original: comboUserAddress, resolved });
      } catch (e: any) {
        alert('Không thể định vị địa chỉ: ' + e.message);
      } finally {
        setIsComboLoading(false);
      }
      return;
    }

    await runComboRequest(comboGPS?.lat, comboGPS?.lon);
  };

  const handleMapPick = async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    const context = mapPickerContext;
    if (!context) return;

    // Reverse-geocode so the picked point gets a readable address label;
    // the pin itself was already visually confirmed by the user on the map
    let label = `Vị trí trên bản đồ (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
    try {
      const rev = await reverseG10Location({ latitude, longitude });
      if (rev.formattedAddress) label = rev.formattedAddress;
    } catch {
      // keep coordinate label
    }

    setMapPickerContext(null);

    if (context === 'proximity') {
      setUserAddress(label);
      setIsLocating(true);
      try {
        await calculateSchoolDistances(latitude, longitude);
        setIsProximityFilterActive(true);
        setIsDistanceModalOpen(false);
      } finally {
        setIsLocating(false);
      }
    } else {
      setComboGPS({ lat: latitude, lon: longitude });
      setComboUserAddress(label);
    }
  };

  const handleAddressConfirm = async () => {
    if (!addressConfirm) return;
    const { context, original, resolved } = addressConfirm;
    setAddressConfirm(null);

    if (context === 'proximity') {
      setUserAddress(resolved.formattedAddress || original);
      setIsLocating(true);
      try {
        await calculateSchoolDistances(resolved.latitude, resolved.longitude);
        setIsProximityFilterActive(true);
        setIsDistanceModalOpen(false);
      } finally {
        setIsLocating(false);
      }
    } else {
      setComboGPS({ lat: resolved.latitude, lon: resolved.longitude });
      setComboUserAddress(resolved.formattedAddress || original);
      await runComboRequest(resolved.latitude, resolved.longitude);
    }
  };

  

  
  const handleEditSave = async (id: string, payload: any) => {
    await updateG10School(id, payload);
    setEditingSchoolId(null);
    loadSchools(debouncedSearchQuery, selectedDistrict);
  };

  const handleMergeSave = async (primaryId: string, secondaryId: string, mergedData: any) => {
    await mergeG10Schools(primaryId, secondaryId, mergedData);
    setSelectedMergeIds([]);
    loadSchools(debouncedSearchQuery, selectedDistrict);
  };

  const buildSchoolMapUrl = (school: any) => {
    if (school?.mapUrl) return school.mapUrl;
    if (school?.latitude != null && school?.longitude != null) {
      return `https://www.google.com/maps/search/?api=1&query=${school.latitude},${school.longitude}`;
    }
    const query = [school?.name, school?.address].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // Keyless Google Maps embed (output=embed) — prefers exact coordinates,
  // falls back to a name + address search
  const buildSchoolMapEmbedUrl = (school: any) => {
    if (school?.latitude != null && school?.longitude != null) {
      return `https://maps.google.com/maps?q=${school.latitude},${school.longitude}&z=16&output=embed`;
    }
    const query = [school?.name, school?.address, 'Hồ Chí Minh'].filter(Boolean).join(', ');
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await evaluateG10Profile({
        math: parseFloat(mathScore) || 0,
        literature: parseFloat(literatureScore) || 0,
        english: parseFloat(englishScore) || 0,
        priority: parseFloat(priorityScore) || 0,
        bonus: parseFloat(bonusScore) || 0,
        preferredDistrict: preferredDistrict || undefined,
        targetNV,
      });
      setEvaluationResult(res);
    } catch (e: any) {
      alert('Đánh giá cơ hội thất bại: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const openSchoolDetail = async (id: string) => {
    setSelectedSchoolId(id);
    try {
      const data = await fetchG10SchoolDetail(id);
      // Backend returns cutoffScores / quotaHistory — normalize to cutoffs / quotas
      setSchoolDetail({
        ...data,
        cutoffs: data.cutoffScores ?? data.cutoffs ?? [],
        quotas:  data.quotaHistory  ?? data.quotas  ?? [],
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  const toggleCompare = (school: G10SchoolItem) => {
    if (compareList.some(item => item.id === school.id)) {
      setCompareList(compareList.filter(item => item.id !== school.id));
    } else {
      if (compareList.length >= 3) {
        alert('Chỉ có thể so sánh tối đa 3 trường THPT cùng lúc.');
        return;
      }
      setCompareList([...compareList, school]);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Navigation tabs */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">
          
          {/* Logo & Theme Toggle Row (Mobile only header) */}
          <div className="flex items-center justify-between md:hidden w-full">
            <span className="text-xs font-black text-indigo-400 tracking-wider flex items-center gap-1.5 uppercase">
              <School className="h-4 w-4 text-indigo-400" />
              Tuyển sinh Lớp 10
            </span>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-xl border transition duration-200 cursor-pointer shadow bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 w-8 h-8 shrink-0"
              title={theme === 'light' ? 'Giao diện Tối' : 'Giao diện Sáng'}
            >
              {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Scrollable Tabs Wrapper */}
          <div className="w-full md:flex-1 flex flex-row flex-nowrap gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap pr-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Tổng quan
            </button>
            
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'search'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <School className="h-3.5 w-3.5" />
              Tra cứu trường
            </button>

            {hasPermission('GRADE10', 'view_recommendation', 'view') && (
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'calculator'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <CalcIcon className="h-3.5 w-3.5" />
                Đánh giá NV
              </button>
            )}

            {hasPermission('GRADE10', 'view_recommendation', 'view') && (
              <button
                onClick={() => setActiveTab('combo')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'combo'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tư vấn NV
              </button>
            )}

            <button
              onClick={() => setActiveTab('specialized')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'specialized'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              Lớp Chuyên
            </button>

            <button
              onClick={() => setActiveTab('adjust')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'adjust'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Mô phỏng
            </button>
          </div>

          {/* Theme Toggle Button (Desktop only) */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex items-center justify-center p-2 rounded-xl border transition duration-200 cursor-pointer shadow bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20 w-9 h-9 shrink-0"
            title={theme === 'light' ? 'Giao diện Tối' : 'Giao diện Sáng'}
          >
            {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Floating Compare Badge */}
      {compareList.length > 0 && (
        <button
          onClick={() => setIsCompareOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-600/40 text-xs font-extrabold cursor-pointer transition-all duration-200 animate-pop-in border border-indigo-400/30"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Xem so sánh
          <span className="flex items-center justify-center h-5 w-5 bg-white text-indigo-600 rounded-full text-[10px] font-black leading-none">
            {compareList.length}
          </span>
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Top stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex items-center gap-4">
                <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 p-3 rounded-xl">
                  <School className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 font-semibold uppercase">Trường THPT Công Lập</h3>
                  <p className="text-2xl font-black text-white m-0">{schools.length || 7}</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex items-center gap-4">
                <div className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 font-semibold uppercase">Quận / Huyện Hỗ Trợ</h3>
                  <p className="text-2xl font-black text-white m-0">{districts.length || 6}</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex items-center gap-4">
                <div className="bg-amber-600/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xs text-slate-400 font-semibold uppercase">Giải thuật gợi ý</h3>
                  <p className="text-2xl font-black text-white m-0">Đề xuất thông minh</p>
                </div>
              </div>
            </div>

            {/* Top schools list & basic introduction */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  🏫 Tuyển Sinh Lớp 10 Công Lập TP.HCM 🎒
                </h2>
                <div className="text-xs text-slate-300 leading-relaxed flex flex-col gap-3">
                  <p>
                    Chào mừng bạn đến với mô-đun tư vấn và gợi ý nguyện vọng tuyển sinh Lớp 10 các trường THPT Công lập tại TP. Hồ Chí Minh.
                  </p>
                  <p>
                    Hệ thống lưu trữ lịch sử điểm chuẩn, chỉ tiêu tuyển sinh, số lượng thí sinh đăng ký và tỉ lệ chọi 4 năm gần nhất giúp học sinh và phụ huynh đưa ra quyết định đăng ký nguyện vọng tối ưu nhất.
                  </p>
                  <p className="bg-slate-950/45 p-3 border border-slate-800 rounded-xl">
                    💡 <strong>Mẹo nhỏ:</strong> Hãy nhập điểm thử của 3 môn (Toán, Văn, Anh) và điểm ưu tiên vào tab <strong>"Đánh giá NV lớp 10"</strong> để nhận đề xuất trường công lập phù hợp nhất dựa trên tỉ lệ đỗ lịch sử!
                  </p>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg">
                <div>
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">🏆 Bảng Xếp Hạng Tuyển Sinh</h3>
                  <select
                    value={leaderboardType}
                    onChange={(e) => setLeaderboardType(e.target.value as any)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="topSchools">🏆 Top 10 Điểm NV1 cao nhất</option>
                    <option value="bottomSchools">📉 Top 10 Điểm NV1 thấp nhất</option>
                    <option value="topQuota">🏫 Top 10 Chỉ tiêu lớn nhất</option>
                    <option value="topRatio">🔥 Top 10 Tỉ lệ chọi cao nhất</option>
                    <option value="bottomRatio">❄️ Top 10 Tỉ lệ chọi thấp nhất</option>
                    <option value="topIncrease">📈 Top 10 Điểm tăng mạnh nhất</option>
                    <option value="topDecrease">📉 Top 10 Điểm giảm mạnh nhất</option>
                    <option value="topRegistered">👥 Top 10 Số hồ sơ đăng ký đông</option>
                    <option value="topSpecialized">💎 Top 10 Điểm trường chuyên cao</option>
                    <option value="topNV3Gap">⚡ Top 10 Lệch NV3 - NV1 lớn nhất</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {(() => {
                    if (!analytics) return <div className="text-slate-400 text-xs py-4 text-center">Đang tải bảng xếp hạng...</div>;
                    const items = analytics[leaderboardType] || [];
                    if (items.length === 0) return <div className="text-slate-400 text-xs py-4 text-center">Chưa có dữ liệu thống kê.</div>;
                    
                    return items.map((t: any, idx: number) => {
                      let displayVal = "";
                      let subVal = "";
                      
                      if (leaderboardType === 'topSchools' || leaderboardType === 'bottomSchools' || leaderboardType === 'topSpecialized') {
                        displayVal = `${t.cutoffNV1}đ`;
                      } else if (leaderboardType === 'topQuota') {
                        displayVal = `${t.quota}`;
                        subVal = "chỉ tiêu";
                      } else if (leaderboardType === 'topRatio' || leaderboardType === 'bottomRatio') {
                        displayVal = `1 chọi ${t.ratio}`;
                      } else if (leaderboardType === 'topIncrease' || leaderboardType === 'topDecrease') {
                        displayVal = `${t.cutoffNew}đ`;
                        subVal = `(lệch ${t.diff > 0 ? '+' : ''}${t.diff}đ)`;
                      } else if (leaderboardType === 'topRegistered') {
                        displayVal = `${t.registeredCount.toLocaleString()}`;
                        subVal = "hồ sơ";
                      } else if (leaderboardType === 'topNV3Gap') {
                        displayVal = `+${t.gap}đ`;
                        subVal = `(NV3: ${t.cutoffNV3}đ)`;
                      }
                      
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-800 pb-2.5 last:border-0">
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <span className={`font-black w-5 text-center ${idx < 3 ? 'text-indigo-400' : 'text-slate-500'}`}>
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <span className="font-semibold text-slate-200 block truncate" title={t.schoolName}>
                                {t.schoolName}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate block">
                                {t.districtName || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-indigo-400 block">{displayVal}</span>
                            {subVal && <span className="text-[10px] text-slate-500 block">{subVal}</span>}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
            
            {/* Historical Analytics charts merged into Dashboard */}
            {analytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. District statistics */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Điểm Chuẩn Trung Bình Theo Quận/Huyện</h3>
                  <div className="h-80 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.districtAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                        <XAxis dataKey="districtName" stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} />
                        <YAxis domain={[12, 25]} stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} />
                        <Tooltip contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b' } : { backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                        <Bar dataKey="avgCutoff" fill="#6366f1" radius={[4, 4, 0, 0]} name="Điểm chuẩn TB" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Quota registration trend */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Biến Động Tỉ Lệ Chọi và Chỉ Tiêu Tuyển Sinh</h3>
                  <div className="h-80 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.trends} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                        <XAxis dataKey="year" stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tickFormatter={formatSchoolYear} />
                        <YAxis stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} />
                        <Tooltip contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b' } : { backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                        <Legend />
                        <Line type="monotone" dataKey="totalQuota" stroke="#10b981" name="Chỉ tiêu" strokeWidth={2} />
                        <Line type="monotone" dataKey="totalRegistered" stroke="#f59e0b" name="Số đăng ký" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                Không có dữ liệu phân tích. Vui lòng nạp dữ liệu để hiển thị biểu đồ.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Calculator & Recommendations */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input student scores panel */}
            <section className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-1">
                <Sliders className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white m-0">Điểm Thi Thử Lớp 9</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Môn Toán</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={mathScore}
                    onChange={(e) => setMathScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Môn Ngữ Văn</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={literatureScore}
                    onChange={(e) => setLiteratureScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Môn Tiếng Anh</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={englishScore}
                    onChange={(e) => setEnglishScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Điểm Ưu Tiên (0-2đ)</label>
                  <input 
                    type="number" step="0.5" max="2" min="0"
                    value={priorityScore}
                    onChange={(e) => setPriorityScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Điểm Khuyến Khích</label>
                  <input 
                    type="number" step="0.5" max="2" min="0"
                    value={bonusScore}
                    onChange={(e) => setBonusScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nguyện Vọng Xét</label>
                  <select 
                    value={targetNV}
                    onChange={(e) => setTargetNV(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="NV1">Nguyện vọng 1</option>
                    <option value="NV2">Nguyện vọng 2</option>
                    <option value="NV3">Nguyện vọng 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Quận Ưu Tiên</label>
                  <select 
                    value={preferredDistrict}
                    onChange={(e) => setPreferredDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  >
                    <option value="">Tất cả Quận/Huyện</option>
                    {districts.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2 text-xs"
              >
                {loading ? 'Đang phân tích...' : '📊 Phân Tích & Gợi Ý Trường Lớp 10'}
              </button>
            </section>

            {/* Recommendations Results Panel */}
            <section className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex justify-between items-center bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                <div>
                  <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>
                  <button onClick={() => setHelpModal('calculator')} className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer" title="Xem hướng dẫn giải thuật">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
                  <p className="text-xs text-slate-400 m-0">Danh sách các trường được xếp loại theo xác suất trúng tuyển an toàn</p>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">RẤT AN TOÀN</span>
                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded">THỬ THÁCH</span>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                  <span className="text-xs text-slate-400">Đang phân tích xác suất đỗ bằng giải thuật SSF...</span>
                </div>
              ) : !evaluationResult ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                  <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Vui lòng điền điểm thi thử của bạn và bấm "Phân Tích & Gợi Ý".</p>
                </div>
              ) : evaluationResult.recommendations?.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                  <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Không tìm thấy trường nào phù hợp với bộ lọc và mức điểm hiện tại.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-indigo-950/25 border border-indigo-500/10 p-3 rounded-xl text-xs text-slate-300">
                    <div>
                      💡 Điểm xét tuyển của bạn: <strong className="text-indigo-400 text-sm">{evaluationResult.candidateScore}đ</strong> (Toán: {evaluationResult.details.math} | Văn: {evaluationResult.details.literature} | Anh: {evaluationResult.details.english} | Điểm cộng: {Number(evaluationResult.details.priority) + Number(evaluationResult.details.bonus)})
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs font-bold border border-slate-700"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      In PDF
                    </button>
                  </div>

                  {evaluationResult.recommendations.map((rec: G10RecommendationItem, index: number) => {
                    const probColor = 
                      rec.safetyCategory === 'VERY_SAFE' || rec.safetyCategory === 'SAFE' ? 'emerald' : 
                      rec.safetyCategory === 'COMPETITIVE' ? 'blue' : 
                      rec.safetyCategory === 'RISKY' ? 'amber' : 'rose';
                    
                    return (
                      <div 
                        key={index} 
                        className={`bg-slate-900/50 hover:bg-slate-900 border rounded-xl p-4 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          probColor === 'emerald' ? 'border-emerald-500/20 hover:border-emerald-500/40' :
                          probColor === 'blue' ? 'border-blue-500/20 hover:border-blue-500/40' :
                          probColor === 'amber' ? 'border-amber-500/20 hover:border-amber-500/40' : 'border-rose-500/20 hover:border-rose-500/40'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {user?.role === 'ADMIN' && (
                              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                                {rec.schoolCode}
                              </span>
                            )}
                            <span className="text-xs text-slate-400 font-medium">
                              {rec.districtName}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-bold text-white mb-1.5">{rec.schoolName}</h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
                            <div>Chỉ tiêu {formatSchoolYear(getCurrentSchoolYear())}: <span className="font-semibold text-slate-300">N/A</span></div>
                            <div>Điểm chuẩn NV1 {formatSchoolYear(getCurrentSchoolYear())}: <span className="font-semibold text-slate-300">{rec.cutoffNV1}đ</span></div>
                            <div>TB 3 năm: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span></div>
                          </div>
                          {/* NV Gaps / Chênh lệch NV */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {rec.nv2Gap !== null ? (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full font-semibold">
                                NV2 Chênh lệch: +{rec.nv2Gap}đ
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full font-semibold">
                                Không tuyển NV2
                              </span>
                            )}
                            {rec.nv3Gap !== null ? (
                              <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full font-semibold">
                                NV3 Chênh lệch: +{rec.nv3Gap}đ
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-500 rounded-full font-semibold">
                                Không tuyển NV3
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400 mb-2 font-medium">
                            <div>NV1: <span className="font-bold text-slate-200">{rec.cutoffNV1 ? `${rec.cutoffNV1}đ` : '—'}</span></div>
                            <div>NV2: <span className="font-semibold text-slate-350">{rec.cutoffNV2 ? `${rec.cutoffNV2}đ` : '—'}</span></div>
                            <div>NV3: <span className="font-semibold text-slate-350">{rec.cutoffNV3 ? `${rec.cutoffNV3}đ` : '—'}</span></div>
                            <div>TB NV1 3 năm: <span className="font-semibold text-indigo-400">{rec.historicalAvg}đ</span></div>
                          </div>

                          {/* 4 Diffs Expandable details */}
                          <details className="mt-2 group">
                            <summary className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer list-none flex items-center gap-1 font-semibold select-none">
                              <span>📊 Xem thông số kỹ thuật (d1, d2, d3, d4)</span>
                              <span className="transition-transform group-open:rotate-180">▼</span>
                            </summary>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 mt-1.5">
                              <div>d1 (NV1): <span className={`font-bold ${rec.d1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rec.d1 > 0 ? `+${rec.d1}` : rec.d1}đ</span></div>
                              <div>d2 (TB): <span className={`font-bold ${rec.d2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rec.d2 > 0 ? `+${rec.d2}` : rec.d2}đ</span></div>
                              <div>d3 (NV2): <span className={`font-bold ${rec.d3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rec.d3 > 0 ? `+${rec.d3}` : rec.d3}đ</span></div>
                              <div>d4 (NV3): <span className={`font-bold ${rec.d4 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rec.d4 > 0 ? `+${rec.d4}` : rec.d4}đ</span></div>
                            </div>
                          </details>
                          
                          {rec.advice && (
                            <div className="mt-3 bg-slate-950/40 p-2.5 border border-slate-800/80 rounded-lg text-[11px] text-slate-300 italic flex items-start gap-2">
                              <span className="text-indigo-400 text-sm leading-none mt-0.5">💡</span>
                              <span className="leading-relaxed">{rec.advice}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Gauge */}
                        <div className="md:w-44 shrink-0 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 gap-2">
                          <div>
                            <div className={`text-2xl font-black ${
                              probColor === 'emerald' ? 'text-emerald-400' :
                              probColor === 'blue' ? 'text-blue-400' :
                              probColor === 'amber' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {rec.probability}%
                            </div>
                            <span className={`text-[10px] font-bold uppercase mt-1 px-2.5 py-0.5 rounded-full whitespace-nowrap block ${
                              probColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              probColor === 'blue' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              probColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {rec.safetyCategory === 'VERY_SAFE' ? 'Rất an toàn' :
                               rec.safetyCategory === 'SAFE' ? 'An toàn' :
                               rec.safetyCategory === 'COMPETITIVE' ? 'Tỉ lệ chọi cao' :
                               rec.safetyCategory === 'RISKY' ? 'Rủi ro' : 'Rất rủi ro'}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => openSchoolDetail(rec.schoolId)}
                            className="w-full py-1 px-3 bg-slate-850 border border-slate-700 hover:border-indigo-500 text-[10px] font-semibold text-slate-300 hover:text-white rounded transition"
                          >
                            Chi tiết lịch sử
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Tab: Specialized Placeholder */}
        {activeTab === 'specialized' && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-850 rounded-2xl gap-4 max-w-2xl mx-auto text-center p-8 shadow-xl">
            <div className="bg-indigo-600/10 p-4 rounded-full text-indigo-400">
              <Award className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="text-lg font-bold text-white m-0">Tư Vấn Nguyện Vọng Chuyên & Tích Hợp</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Tính năng đang trong quá trình phát triển. Hệ thống dự kiến sẽ phân tích điểm thi chuyên môn tự chọn, áp dụng công thức đặc thù <strong>Toán + Văn + Anh + Môn chuyên * 2</strong> và đề xuất 2 trường chuyên tối ưu tại TP.HCM.
            </p>
            <div className="px-3 py-1 bg-slate-800 text-[10px] text-slate-400 rounded-full font-bold uppercase">
              ⚙️ Sẽ ra mắt trong đợt thảo luận tiếp theo
            </div>
          </div>
        )}

        {/* Tab: Adjust Placeholder */}
        {activeTab === 'adjust' && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-850 rounded-2xl gap-4 max-w-2xl mx-auto text-center p-8 shadow-xl">
            <div className="bg-emerald-600/10 p-4 rounded-full text-emerald-400">
              <RefreshCw className="h-10 w-10 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-white m-0">Mô Phỏng Đợt Điều Chỉnh Nguyện Vọng Lớp 10</h2>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Tính năng đang được phát triển. Khi Sở GD&ĐT TP.HCM công bố số liệu hồ sơ ban đầu, hệ thống sẽ tự động tính toán lại tỷ lệ chọi đột biến và khuyên phụ huynh dịch chuyển nguyện vọng để tối ưu hóa an toàn.
            </p>
            <div className="px-3 py-1 bg-slate-800 text-[10px] text-slate-400 rounded-full font-bold uppercase">
              ⏳ Sẽ ra mắt trong đợt thảo luận tiếp theo
            </div>
          </div>
        )}

        {/* Tab 3: Search Schools */}
        {activeTab === 'search' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="relative w-full md:max-w-md">
                <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={isProximityFilterActive ? "🔒 Lọc cự ly đang kích hoạt (bị khóa)..." : "Tìm trường theo tên hoặc mã trường (e.g. Bùi Thị Xuân)..."}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  disabled={isProximityFilterActive}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition disabled:opacity-50 disabled:bg-slate-950/40 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3">
                {user?.role === 'ADMIN' && selectedMergeIds.length === 2 && (
                  <button
                    onClick={() => setIsMergeModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Merge 2 Trường Đã Chọn
                  </button>
                )}




                <button
                  onClick={() => setIsDistanceModalOpen(true)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isProximityFilterActive
                      ? 'bg-rose-600/10 border-rose-500/20 text-rose-400 hover:bg-rose-600/20'
                      : 'bg-indigo-650/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-650/20'
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {isProximityFilterActive ? '📍 Cự ly: Bật' : 'Tìm gần nhà'}
                </button>

                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={isProximityFilterActive}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Tất cả Quận/Huyện</option>
                  {districts.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  Tổng số: <span className="font-semibold text-slate-200">{isProximityFilterActive ? distanceSchools.length : schools.length}</span> trường
                </div>
              </div>
            </div>

            {isProximityFilterActive && (
              <div className="flex items-center justify-between bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-xl text-xs text-indigo-300 font-semibold shadow-md">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-400 animate-bounce" />
                  Lọc theo cự ly gần nhà: <strong className="text-white">{userAddress || 'GPS'}</strong> (Hiển thị 15 trường gần nhất)
                </span>
                <button
                  onClick={() => {
                    setIsProximityFilterActive(false);
                    setDistanceSchools([]);
                    setUserAddress('');
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-extrabold cursor-pointer transition shadow"
                >
                  Xóa bộ lọc cự ly
                </button>
              </div>
            )}

            {user?.role === 'ADMIN' && selectedMergeIds.length > 0 && (
              <div className="flex items-center justify-between bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-xs font-semibold shadow-md">
                <span className="flex items-center gap-2 text-amber-300">
                  <GitMerge className="h-4 w-4 text-amber-400" />
                  {selectedMergeIds.length === 1
                    ? <>Đã chọn <strong className="text-white">1/2</strong> trường để gộp — hãy chọn thêm 1 trường nữa.</>
                    : <>Đã chọn <strong className="text-white">2/2</strong> trường. Sẵn sàng gộp!</>
                  }
                </span>
                <div className="flex items-center gap-2">
                  {selectedMergeIds.length === 2 && (
                    <button
                      onClick={() => setIsMergeModalOpen(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg text-[10px] font-extrabold cursor-pointer transition shadow flex items-center gap-1"
                    >
                      <GitMerge className="w-3 h-3" />
                      Bắt đầu Gộp Trường
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedMergeIds([])}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
                  >
                    Hủy chọn
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(isProximityFilterActive ? distanceSchools : schools).map((school) => {
                const isCompared = compareList.some(item => item.id === school.id);
                const isMergeSelected = selectedMergeIds.includes(school.id);
                return (
                  <div key={school.id} className={`bg-slate-900/60 border rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all duration-200 ${
                    isMergeSelected
                      ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        {user?.role === 'ADMIN' ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-md">
                            {school.code}
                          </span>
                        ) : (
                          <div />
                        )}
                        <div className="flex gap-2">
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMergeIds(prev => {
                                  if (prev.includes(school.id)) return prev.filter(id => id !== school.id);
                                  if (prev.length >= 2) return prev; // max 2
                                  return [...prev, school.id];
                                });
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded transition border flex items-center gap-1 ${
                                isMergeSelected
                                  ? 'bg-amber-500 border-amber-400 text-white'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/50 hover:text-amber-400'
                              }`}
                              title="Chọn để gộp trường"
                            >
                              <GitMerge className="w-2.5 h-2.5" />
                              {isMergeSelected ? '✓ Đã chọn' : 'Gộp'}
                            </button>
                          )}
                          <button
                            onClick={() => toggleCompare(school)}
                            className={`text-[10px] px-2 py-0.5 rounded transition border ${
                              isCompared 
                                ? 'bg-rose-600 border-rose-500 text-white' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isCompared ? 'Bỏ so sánh' : 'So sánh'}
                          </button>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2 hover:text-indigo-400 cursor-pointer flex items-center gap-1.5" onClick={() => openSchoolDetail(school.id)}>{school.name} {school.isVerified && <span title="Trường đã xác thực"><BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" /></span>}</h3>
                      <p className="text-xs text-slate-400 flex items-start gap-1 leading-normal">
                        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{school.address || 'Hồ Chí Minh'}</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-4 flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Điểm NV1 {formatSchoolYear(getCurrentSchoolYear())}:</span>
                        <span className="font-bold text-indigo-400">{school.latestCutoffNV1 || 'N/A'}đ</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Điểm NV2 {formatSchoolYear(getCurrentSchoolYear())}:</span>
                        <span className="font-semibold text-slate-200">{school.latestCutoffNV2 || 'N/A'}đ</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Điểm NV3 {formatSchoolYear(getCurrentSchoolYear())}:</span>
                        <span className="font-semibold text-slate-200">{school.latestCutoffNV3 || 'N/A'}đ</span>
                      </div>
                      {isProximityFilterActive && school.roadDistance !== undefined && (
                        <div className="flex justify-between text-[10px] bg-indigo-950/20 border border-indigo-900/30 p-2 rounded-lg mt-1 text-indigo-300 font-semibold">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-indigo-400" /> Cự ly:
                          </span>
                          <span className="font-extrabold text-indigo-200">
                            {school.roadDistance} km (~{school.roadDuration} phút)
                          </span>
                        </div>
                      )}
                      {user?.role === 'ADMIN' && (
                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSchoolId(school.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-[10px] font-bold transition cursor-pointer"
                          >
                            <Sliders className="h-3 w-3" />
                            Sửa toàn diện
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAiPrefillSchool({
                                name: school.name,
                                code: school.code,
                                districtName: school.district?.name,
                                districtCode: school.district?.code
                              });
                              setIsAiModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 text-[10px] font-bold transition cursor-pointer"
                          >
                            <Sparkles className="h-3 w-3" />
                            Tra cứu AI
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* School Detail Modal */}
      {selectedSchoolId && schoolDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative flex flex-col gap-4 max-h-[90vh]">
            <button
              onClick={() => setSelectedSchoolId(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {user?.role === 'ADMIN' && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-indigo-650/15 border border-indigo-500/30 text-indigo-400 rounded-md">
                      {schoolDetail.code}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{schoolDetail.district?.name || 'Chưa rõ quận'}</span>
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <School className="h-5 w-5 text-indigo-400 shrink-0" />
                  {schoolDetail.name}
                </h2>
              </div>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    setSelectedSchoolId(null);
                    setEditingSchoolId(schoolDetail.id);
                  }}
                  className="mb-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow cursor-pointer"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  Sửa toàn diện
                </button>
              )}
            </div>

            {/* Tabs Selector */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveDetailTab('info')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'info'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Tổng quan & Bản đồ
              </button>
              <button
                onClick={() => setActiveDetailTab('cutoff')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'cutoff'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Lịch sử Điểm chuẩn (3 NV)
              </button>
              <button
                onClick={() => setActiveDetailTab('quota')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                  activeDetailTab === 'quota'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Chỉ tiêu & Tỷ lệ chọi
              </button>
            </div>

            {/* Tab Contents */}
            <div className="overflow-y-auto pr-1 flex-1 min-h-0 text-xs text-slate-350">
              {activeDetailTab === 'info' && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">🏫 Địa chỉ</span>
                        <div className="font-semibold text-slate-200">{schoolDetail.address || 'Chưa cập nhật'}</div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">🌐 Website</span>
                        <a href={schoolDetail.website} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate block font-medium">
                          {schoolDetail.website || 'N/A'}
                        </a>
                      </div>
                      <div className="space-y-1 mt-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">📝 Giới thiệu chung</span>
                        <p className="text-slate-400 leading-relaxed font-normal">
                          {schoolDetail.description || 'Chưa có thông tin giới thiệu chi tiết cho trường THPT này.'}
                        </p>
                      </div>
                    </div>

                    {/* Position Map Card */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
                        <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                          Bản đồ vị trí cơ sở
                        </span>
                        <a
                          href={buildSchoolMapUrl(schoolDetail)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-755 text-[10px] text-slate-350 font-bold rounded-lg border border-slate-700 transition"
                        >
                          Mở Google Maps
                        </a>
                      </div>
                      <iframe
                        title="Bản đồ vị trí cơ sở"
                        src={buildSchoolMapEmbedUrl(schoolDetail)}
                        className="w-full flex-1 border-0"
                        style={{ minHeight: 220 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      ></iframe>
                      <p className="text-[10px] text-slate-500 px-4 py-2 m-0 truncate">
                        📍 {schoolDetail.address || 'Hồ Chí Minh, Việt Nam'}
                      </p>
                    </div>
                  </div>

                  {/* Summary Indicators */}
                  {schoolDetail.cutoffs.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl mt-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Điểm NV1 gần nhất ({formatSchoolYear(schoolDetail.cutoffs[0]?.year)})</span>
                        <strong className="text-base text-indigo-400">{schoolDetail.cutoffs[0]?.cutoffNV1}đ</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Chỉ tiêu tuyển ({formatSchoolYear(schoolDetail.quotas[0]?.year)})</span>
                        <strong className="text-base text-blue-400">{schoolDetail.quotas[0]?.quota || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Tỷ lệ chọi ({formatSchoolYear(schoolDetail.quotas[0]?.year)})</span>
                        <strong className="text-base text-rose-400">1 chọi {schoolDetail.quotas[0]?.competitionRatio || 'N/A'}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === 'cutoff' && (
                <div className="flex flex-col gap-5">
                  {/* Multi-line Cutoff Chart */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Đồ thị biến động điểm chuẩn 4 năm gần đây
                    </h4>
                    <div className="h-48 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                      {schoolDetail.cutoffs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-500 italic">Chưa có dữ liệu điểm chuẩn</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[...schoolDetail.cutoffs].reverse()}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                            <XAxis dataKey="year" stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} tickFormatter={formatSchoolYear} />
                            <YAxis domain={['auto', 'auto']} stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b', fontSize: 10 } : { backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Line type="monotone" dataKey="cutoffNV1" stroke="#6366f1" name="Nguyện vọng 1" strokeWidth={2.5} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="cutoffNV2" stroke="#10b981" name="Nguyện vọng 2" strokeWidth={2} />
                            <Line type="monotone" dataKey="cutoffNV3" stroke="#f59e0b" name="Nguyện vọng 3" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Cutoff Table */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400">Bảng chi tiết điểm chuẩn qua các năm</h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px]">
                            <th className="p-2.5">Năm học</th>
                            <th className="p-2.5">Nguyện vọng 1</th>
                            <th className="p-2.5">Nguyện vọng 2</th>
                            <th className="p-2.5">Nguyện vọng 3</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-350 bg-slate-900/20">
                          {schoolDetail.cutoffs.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-850/10">
                              <td className="p-2.5 font-bold text-white">{formatSchoolYear(item.year)}</td>
                              <td className="p-2.5 font-semibold text-indigo-400">{item.cutoffNV1 ? `${item.cutoffNV1}đ` : '—'}</td>
                              <td className="p-2.5 text-emerald-400">{item.cutoffNV2 ? `${item.cutoffNV2}đ` : '—'}</td>
                              <td className="p-2.5 text-amber-400">{item.cutoffNV3 ? `${item.cutoffNV3}đ` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeDetailTab === 'quota' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Quota vs Registered candidates */}
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[11px] font-bold text-slate-400">Đồ thị Chỉ tiêu vs Số lượng đăng ký</h4>
                      <div className="h-44 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        {schoolDetail.quotas.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-500 italic">Chưa có dữ liệu chỉ tiêu</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...schoolDetail.quotas].reverse()}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                              <XAxis dataKey="year" stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} tickFormatter={formatSchoolYear} />
                              <YAxis stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b', fontSize: 10 } : { backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                              <Bar dataKey="quota" fill="#3b82f6" name="Chỉ tiêu" radius={[3, 3, 0, 0]} />
                              <Bar dataKey="registeredCount" fill="#ec4899" name="Đăng ký NV1" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Competition ratio line chart */}
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[11px] font-bold text-slate-400">Biến động Tỷ lệ chọi</h4>
                      <div className="h-44 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        {schoolDetail.quotas.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-slate-500 italic">Chưa có dữ liệu tỷ lệ chọi</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[...schoolDetail.quotas].reverse()}>
                              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                              <XAxis dataKey="year" stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} tickFormatter={formatSchoolYear} />
                              <YAxis stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b', fontSize: 10 } : { backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                              <Line type="monotone" dataKey="competitionRatio" stroke="#f43f5e" name="Tỷ lệ chọi" strokeWidth={2.5} />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quotas table */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400">Bảng thống kê số liệu tuyển sinh</h4>
                    <div className="overflow-x-auto border border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px]">
                            <th className="p-2.5">Năm học</th>
                            <th className="p-2.5">Chỉ tiêu</th>
                            <th className="p-2.5">Số lượng đăng ký NV1</th>
                            <th className="p-2.5">Tỷ lệ chọi (1 chọi x)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-350 bg-slate-900/20">
                          {schoolDetail.quotas.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-850/10">
                              <td className="p-2.5 font-bold text-white">{formatSchoolYear(item.year)}</td>
                              <td className="p-2.5 text-blue-400 font-semibold">{item.quota || '—'}</td>
                              <td className="p-2.5 text-pink-400">{item.registeredCount ? item.registeredCount.toLocaleString() : '—'}</td>
                              <td className="p-2.5 text-rose-400 font-bold">{item.competitionRatio ? `${item.competitionRatio}` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <MergeSchoolModal 
        isOpen={isMergeModalOpen} 
        onClose={() => setIsMergeModalOpen(false)} 
        school1={schools.find(s => s.id === selectedMergeIds[0]) || null}
        school2={schools.find(s => s.id === selectedMergeIds[1]) || null}
        onMerge={handleMergeSave}
      />
      <EditSchoolModal 
        isOpen={!!editingSchoolId}
        onClose={() => setEditingSchoolId(null)}
        schoolId={editingSchoolId || ''}
        onSave={handleEditSave}
        onAiPrefill={(name, code) => { setAiPrefillSchool({name, code}); setIsAiModalOpen(true); }}
      />
      <CompareDrawer
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareList={compareList}
        onRemove={toggleCompare}
        onClear={() => setCompareList([])}
        theme={theme}
      />
      <AddressConfirmModal
        isOpen={!!addressConfirm}
        originalAddress={addressConfirm?.original ?? ''}
        resolved={addressConfirm?.resolved ?? null}
        onConfirm={handleAddressConfirm}
        onCancel={() => setAddressConfirm(null)}
      />
      <MapPickerModal
        isOpen={!!mapPickerContext}
        title="Chọn vị trí nhà của bạn"
        onClose={() => setMapPickerContext(null)}
        onPick={handleMapPick}
      />
      {/* Distance Input Modal */}
      {isDistanceModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsDistanceModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-indigo-400" />
                Tìm trường gần bạn
              </h2>
              <button 
                onClick={() => setIsDistanceModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Địa chỉ nhà của bạn</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: 227 Nguyễn Văn Cừ, Quận 5..."
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition"
                  />
                  <button
                    onClick={async () => {
                      if (!userAddress.trim()) {
                        alert('Vui lòng nhập địa chỉ nhà.');
                        return;
                      }
                      setIsLocating(true);
                      try {
                        const resolved = await resolveG10Location({
                          address: userAddress,
                          districtName: 'Hồ Chí Minh',
                        });
                        // Wait for the user to confirm the normalized address
                        // before calculating distances (handleAddressConfirm)
                        setAddressConfirm({ context: 'proximity', original: userAddress, resolved });
                      } catch {
                        alert('Lỗi định vị địa chỉ: Mạng yếu hoặc bị giới hạn.');
                      } finally {
                        setIsLocating(false);
                      }
                    }}
                    disabled={isLocating}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {isLocating ? 'Đang tìm...' : 'Tìm'}
                  </button>
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[9px] text-slate-500 font-bold uppercase">Hoặc</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                onClick={() => {
                  if (!navigator.geolocation) {
                    alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
                    return;
                  }
                  setIsLocating(true);
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords;
                      setUserAddress('Vị trí GPS hiện tại');
                      await calculateSchoolDistances(latitude, longitude);
                      setIsProximityFilterActive(true);
                      setIsDistanceModalOpen(false);
                    },
                    (_err) => {
                      alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');
                      setIsLocating(false);
                    }
                  );
                }}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-indigo-400" />
                {isLocating ? 'Đang định vị...' : 'Sử dụng GPS hiện tại'}
              </button>

              <button
                onClick={() => setMapPickerContext('proximity')}
                disabled={isLocating}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                🗺️ Chọn vị trí trên bản đồ
              </button>
            </div>
          </div>
        </div>
      )}
        {/* Tab: Combo Recommendation */}
        {activeTab === 'combo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Config Panel */}
            <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-white m-0">🌈 Tư vấn 3 Nguyện Vọng</h2>
                <button onClick={() => setHelpModal('combo')} className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer" title="Xem cẩm nang chiến thuật">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Score ranges */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Khoảng điểm dự đoán</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Toán (Min - Max)</label>
                      <div className="flex gap-1 items-center">
                        <input type="number" step="0.25" value={minMath} onChange={e => setMinMath(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                        <span className="text-slate-500 text-xs">-</span>
                        <input type="number" step="0.25" value={maxMath} onChange={e => setMaxMath(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Văn (Min - Max)</label>
                      <div className="flex gap-1 items-center">
                        <input type="number" step="0.25" value={minLiterature} onChange={e => setMinLiterature(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                        <span className="text-slate-500 text-xs">-</span>
                        <input type="number" step="0.25" value={maxLiterature} onChange={e => setMaxLiterature(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Anh (Min - Max)</label>
                      <div className="flex gap-1 items-center">
                        <input type="number" step="0.25" value={minEnglish} onChange={e => setMinEnglish(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                        <span className="text-slate-500 text-xs">-</span>
                        <input type="number" step="0.25" value={maxEnglish} onChange={e => setMaxEnglish(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Điểm cộng ưu tiên</label>
                      <input type="number" step="0.5" value={priorityScore} onChange={e => setPriorityScore(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                    </div>
                  </div>
                </div>

                {/* Dream school selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Trường Mơ ước NV1</label>
                  <select
                    value={dreamSchoolCode}
                    onChange={(e) => setDreamSchoolCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                  >
                    <option value="">-- Chọn trường mơ ước --</option>
                    {schools.slice().sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                      <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Địa chỉ nhà (Để tính khoảng cách)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường, quận..."
                      value={comboUserAddress}
                      onChange={(e) => { setComboUserAddress(e.target.value); setComboGPS(null); }}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                    <button
                      onClick={handleComboGPS}
                      className="px-2.5 bg-slate-800 border border-slate-700 hover:border-slate-650 text-slate-300 rounded-lg text-xs"
                      title="Sử dụng GPS thiết bị"
                    >
                      GPS
                    </button>
                    <button
                      onClick={() => setMapPickerContext('combo')}
                      className="px-2.5 bg-slate-800 border border-slate-700 hover:border-slate-650 text-slate-300 rounded-lg text-xs"
                      title="Chọn vị trí trên bản đồ"
                    >
                      🗺️
                    </button>
                  </div>
                </div>

                {/* Max commute distance input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Khoảng cách đi học tối đa (km)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={maxCommuteDistance}
                      onChange={(e) => setMaxCommuteDistance(e.target.value)}
                      className="w-24 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none"
                    />
                    <span className="text-xs text-slate-500">km</span>
                  </div>
                </div>

                <button
                  onClick={handleGetCombo}
                  disabled={isComboLoading}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-xs mt-2"
                >
                  {isComboLoading ? 'Đang phân tích dữ liệu...' : '🚀 Tư Vấn Nguyện Vọng'}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {isComboLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
                  <span className="text-xs text-slate-400">Đang tối ưu hóa các phương án nguyện vọng cho bạn...</span>
                </div>
              ) : !comboResult ? (
                <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
                  <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Vui lòng nhập khoảng điểm và bấm "Tư Vấn Nguyện Vọng".</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Summary of score */}
                  <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-2xl text-xs text-slate-350 flex justify-between items-center">
                    <div>
                      Điểm thi dự kiến: <strong className="text-indigo-400 text-sm">{comboResult.minScore}đ - {comboResult.maxScore}đ</strong>
                      <span className="text-slate-500 ml-2">(Trung bình xét: {comboResult.avgScore}đ)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {comboResult.ssf !== undefined && comboResult.ssf !== 0 && (
                        <div className={`px-2.5 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 ${
                          comboResult.ssf > 0
                            ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                            : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                        }`}>
                          {comboResult.ssf > 0 ? '⚠️ Cạnh tranh tăng nhẹ năm nay' : '✨ Điểm chuẩn hạ nhẹ'} ({comboResult.ssf > 0 ? `+${comboResult.ssf}` : comboResult.ssf}đ)
                        </div>
                      )}
                      <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs font-bold border border-slate-700"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        In PDF
                      </button>
                    </div>
                  </div>

                  {/* Strategy Tabs */}
                  <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setSelectedStrategy('safe')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                        selectedStrategy === 'safe'
                          ? 'bg-indigo-650 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🛡️ Tab 1: An Toàn
                    </button>
                    <button
                      onClick={() => setSelectedStrategy('effort')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                        selectedStrategy === 'effort'
                          ? 'bg-indigo-650 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🔥 Tab 2: Nỗ Lực (Dream NV1)
                    </button>
                    <button
                      onClick={() => setSelectedStrategy('defense')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                        selectedStrategy === 'defense'
                          ? 'bg-indigo-650 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🏰 Tab 3: Phòng Thủ (Chắc chắn)
                    </button>
                  </div>

                  {/* Strategy Info Note */}
                  <div className="bg-slate-950/45 p-3.5 border border-slate-850 rounded-xl text-xs text-slate-300">
                    {selectedStrategy === 'safe' && (
                      <p className="m-0">💡 <strong>Chiến lược An Toàn:</strong> Tự động phân bổ 3 NV theo thứ tự điểm chuẩn giảm dần quanh điểm trung bình dự đoán của bạn. Không bắt buộc có trường mơ ước.</p>
                    )}
                    {selectedStrategy === 'effort' && (
                      <p className="m-0">💡 <strong>Chiến lược Nỗ Lực:</strong> Bạn đang rất quyết tâm, nỗ lực vượt lên chính mình! Đưa trường Mơ ước lên NV1 bất kể tỉ lệ chọi, sau đó lùi NV2 cạnh tranh và NV3 thủ vững chắc.</p>
                    )}
                    {selectedStrategy === 'defense' && (
                      <p className="m-0">💡 <strong>Chiến lược Phòng Thủ:</strong> Bạn không tự tin và thời gian sắp cạn, cần chắc cú! Hạ chỉ tiêu xuống trường an toàn ngay từ NV1, lùi sâu NV2/NV3 để đảm bảo 100% có vé vào trường công lập.</p>
                    )}
                  </div>

                  {/* Auto-relaxed warning */}
                  {comboResult.adjusted && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-500 font-semibold leading-relaxed">
                      ⚠️ <strong>Lưu ý:</strong> Do trong vòng {maxCommuteDistance} km không tìm đủ trường phù hợp để xếp combo, chúng tôi đã tự động nới rộng giới hạn khoảng cách lên <strong>{comboResult.maxCommuteDistance} km</strong>.
                    </div>
                  )}

                  {/* Dynamic Explanation Card */}
                  {comboResult.explanations && comboResult.explanations[selectedStrategy] && (
                    <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl text-xs text-indigo-200 leading-relaxed shadow-lg flex flex-col gap-2">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-400">Phân tích chiến thuật của chuyên gia AI:</span>
                      <p className="m-0 italic">{comboResult.explanations[selectedStrategy]}</p>
                    </div>
                  )}


                  {/* Recommended 3-NV Combo List */}
                  <div className="flex flex-col gap-3">
                    {comboResult.combos[selectedStrategy]?.map((school: any, idx: number) => {
                      const nvNum = idx + 1;
                      const prob = nvNum === 1 ? school.probNV1 : nvNum === 2 ? school.probNV2 : school.probNV3;
                      const cutoff = nvNum === 1 ? school.cutoffNV1 : nvNum === 2 ? school.cutoffNV2 : school.cutoffNV3;
                      
                      // Highlight color
                      const probColor = prob >= 80 ? 'emerald' : prob >= 65 ? 'blue' : prob >= 50 ? 'amber' : 'rose';
                      const isTooFar = school.distance && school.distance > 15;

                      return (
                        <div
                          key={school.schoolId}
                          onClick={() => openSchoolDetail(school.schoolId)}
                          className={`bg-slate-900/60 border hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition ${
                            isTooFar ? 'border-amber-500/10' : 'border-slate-800'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                                nvNum === 1 ? 'bg-indigo-650/15 border-indigo-500/30 text-indigo-400' :
                                nvNum === 2 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              }`}>
                                NGUYỆN VỌNG {nvNum}
                              </span>
                              {user?.role === 'ADMIN' && (
                                <span className="text-xs text-slate-400 font-bold px-2 py-0.5 bg-slate-800 rounded">
                                  {school.schoolCode}
                                </span>
                              )}
                              <span className="text-xs text-slate-500">
                                {school.districtName}
                              </span>
                            </div>

                            <h3 className="text-base font-extrabold text-white mb-2">{school.schoolName}</h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
                              <div>Điểm chuẩn NV{nvNum}: <span className="font-semibold text-slate-200">{cutoff || 'Không tuyển'}đ</span></div>
                              {nvNum > 1 && school[`nv${nvNum}Gap`] !== null && (
                                <div>Chênh lệch NV{nvNum}: <span className="font-semibold text-amber-500">+{school[`nv${nvNum}Gap`]}đ</span></div>
                              )}
                              {school.distance !== null && (
                                <div className={`flex items-center gap-1 ${isTooFar ? 'text-amber-500 font-medium' : ''}`}>
                                  <span>Khoảng cách:</span>
                                  <span>{school.roadDistance || school.distance} km {isTooFar && '⚠️'}</span>
                                </div>
                              )}
                              {school.commuteBonus > 0 && (
                                <div className="text-emerald-400 font-semibold">
                                  Điểm thưởng cự ly: +{school.commuteBonus}đ
                                </div>
                              )}
                            </div>

                            <details className="mt-2.5 group">
                              <summary className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer list-none flex items-center gap-1 font-semibold select-none">
                                <span>📊 Xem thông số kỹ thuật (d1, d2, d3, d4)</span>
                                <span className="transition-transform group-open:rotate-180">▼</span>
                              </summary>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 mt-1.5">
                                <div>d1 (NV1): <span className={`font-bold ${school.d1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{school.d1 > 0 ? `+${school.d1}` : school.d1}đ</span></div>
                                <div>d2 (TB): <span className={`font-bold ${school.d2 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{school.d2 > 0 ? `+${school.d2}` : school.d2}đ</span></div>
                                <div>d3 (NV2): <span className={`font-bold ${school.d3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{school.d3 > 0 ? `+${school.d3}` : school.d3}đ</span></div>
                                <div>d4 (NV3): <span className={`font-bold ${school.d4 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{school.d4 > 0 ? `+${school.d4}` : school.d4}đ</span></div>
                              </div>
                            </details>

                            {isTooFar && (
                              <p className="text-[10px] text-amber-500 mt-2 m-0 leading-relaxed">
                                ⚠️ <strong>Cảnh báo:</strong> Trường nằm khá xa địa chỉ nhà của bạn ({school.roadDistance || school.distance}km). Hãy cân nhắc về phương tiện đi lại nếu đăng ký!
                              </p>
                            )}
                          </div>

                          {/* Pass probability for this NV */}
                          <div className="md:w-36 shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                            <div className="text-xs text-slate-400 mb-0.5">Xác suất đỗ NV{nvNum}</div>
                            <div className={`text-2xl font-black ${
                              probColor === 'emerald' ? 'text-emerald-400' :
                              probColor === 'blue' ? 'text-blue-400' :
                              probColor === 'amber' ? 'text-amber-400' : 'text-rose-400'
                            }`}>
                              {prob}%
                            </div>
                            <span className={`text-[9px] font-bold uppercase mt-1.5 px-2 py-0.5 rounded-full block text-center ${
                              probColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                              probColor === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                              probColor === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {prob >= 80 ? 'An tâm cao' : prob >= 65 ? 'An toàn' : prob >= 50 ? 'Cạnh tranh' : 'Rủi ro'}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      {/* ── Help Modal: Đánh Giá Cá Nhân ───────────────────────────────────── */}
      {helpModal === 'calculator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setHelpModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white m-0">📘 Cẩm Nang: Đánh Giá Cá Nhân & Gợi Ý Trường</h2>
              <button onClick={() => setHelpModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-xs leading-relaxed">
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📊 1. Giải thuật SSF — Dịch chuyển điểm chuẩn vĩ mô</h3>
                <p className="m-0">Điểm chuẩn biến động mỗi năm theo 3 nhân tố: <strong>tổng thí sinh</strong>, <strong>chỉ tiêu công lập</strong>, <strong>độ khó đề</strong>. SSF tự tính độ dịch chuyển để dự báo an toàn nhất cho năm hiện tại — tránh nộp trường bằng điểm chuẩn năm cũ nhưng vẫn trượt vì điểm chuẩn năm mới tăng.</p>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🧮 2. Công thức Xác suất đỗ (Hàm mũ bão hòa)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Bằng điểm chuẩn = 50% cơ hội</strong> — Nằm đúng ranh giới đỗ/trượt.</li>
                  <li><strong>Trần 88%</strong> — Dù điểm cao hơn nhiều, xác suất tối đa cũng chỉ 88% để nhắc nhở rủi ro phòng thi thực tế.</li>
                  <li>Công thức: nếu điểm dưới chuẩn → <code>50×e^(diff)</code>; nếu trên chuẩn → <code>50+38×(1−e^(−0.5×diff))</code></li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📉 3. Ý nghĩa 4 chỉ số Diffs (d1→d4)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>d1</strong>: Điểm bạn trừ điểm chuẩn NV1 năm gần nhất (có điều chỉnh SSF)</li>
                  <li><strong>d2</strong>: So với trung bình 3 năm gần nhất (loại bỏ đột biến)</li>
                  <li><strong>d3</strong>: Mức an toàn khi nộp ở Nguyện vọng 2</li>
                  <li><strong>d4</strong>: Mức an toàn khi nộp ở Nguyện vọng 3</li>
                </ul>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 text-center">
              <button onClick={() => setHelpModal(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition cursor-pointer">Đã Hiểu, Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Help Modal: Combo 3 Nguyện Vọng ──────────────────────────────────── */}
      {helpModal === 'combo' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setHelpModal(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white m-0">📘 Cẩm Nang: Tư Vấn 3 Nguyện Vọng Thông Minh</h2>
              <button onClick={() => setHelpModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-slate-300 text-xs leading-relaxed">
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🛡️ 1. Ba chiến thuật phân bổ Nguyện vọng</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Tab 1 — An Toàn</strong>: 3 trường bám sát phổ điểm, NV1&gt;NV2&gt;NV3 giảm dần. Luôn có trường dự phòng gần nhà.</li>
                  <li><strong>Tab 2 — Nỗ Lực</strong>: Trường mơ ước lên NV1 bất kể tỉ lệ chọi. NV2 cạnh tranh vừa, NV3 siêu an toàn làm tấm khiên.</li>
                  <li><strong>Tab 3 — Phòng Thủ</strong>: Hạ chỉ tiêu ngay từ NV1, đảm bảo 100% có suất công lập gần nhà.</li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📍 2. Điểm thưởng Cự ly đi học (Commute Bonus)</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li>Cách nhà &lt;⅓ cự ly tối đa → cộng thưởng <strong>+1.5 điểm ảo</strong></li>
                  <li>Cách nhà ⅓→⅔ cự ly → cộng thưởng <strong>+0.75 điểm ảo</strong></li>
                  <li>Điểm thưởng giúp ưu tiên trường gần nhà chất lượng tốt lên đầu danh sách.</li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🚗 3. Tự động nới lỏng khoảng cách</h3>
                <p className="m-0">Nếu cự ly quá ngắn không đủ 12 trường ứng viên, hệ thống tự nới rộng và hiện cảnh báo rõ ràng để bạn điều chỉnh lại.</p>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 text-center">
              <button onClick={() => setHelpModal(null)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition cursor-pointer">Đã Hiểu, Đóng</button>
            </div>
          </div>
        </div>
      )}

            {/* AI Search Modal */}
      <AiSearchModal 
        isOpen={isAiModalOpen}
        onClose={() => { setIsAiModalOpen(false); setAiPrefillSchool(undefined); }}
        type="GRADE10"
        prefillSchool={aiPrefillSchool}
        onImportSuccess={() => {
          loadSchools(searchQuery, selectedDistrict);
          loadAnalytics();
        }}
      />


      {/* ── PRINT AREA (screen:hidden, print:visible) ─────────────────────────
          Portaled to <body> so print CSS can hide the whole #root with
          display:none — the hidden app then contributes zero layout height
          and no trailing blank pages are printed. */}
      {createPortal(
      <div className="print-area" style={{ display: 'none' }}>
        {/* Page Header */}
        <div style={{ borderBottom: '3px solid #4338ca', paddingBottom: 8, marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#3730a3' }}>
            📋 Kết quả phân tích nguyện vọng lớp 10 TP.HCM
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280' }}>
            Hệ thống AdmissionDecisionEngine • In ngày {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* ── SECTION 1: Đánh Giá Cá Nhân ─────────────────────────────────── */}
        {evaluationResult && (
          <div>
            <h2 className="print-section-title">PHẦN 1 — ĐÁNH GIÁ CÁ NHÂN &amp; GỢI Ý TRƯỜNG PHÙ HỢP</h2>

            {/* Input scores info */}
            <div className="print-card" style={{ marginBottom: 12, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
              <div style={{ fontWeight: 900, color: '#3730a3', marginBottom: 4 }}>📝 Thông tin điểm thi thử đầu vào</div>
              <div style={{ fontSize: 10, color: '#374151', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>Môn Toán: <strong>{evaluationResult.details.math}</strong></span>
                <span>Môn Ngữ Văn: <strong>{evaluationResult.details.literature}</strong></span>
                <span>Môn Tiếng Anh: <strong>{evaluationResult.details.english}</strong></span>
                <span>Điểm ưu tiên: <strong>{evaluationResult.details.priority}</strong></span>
                <span>Điểm khuyến khích: <strong>{evaluationResult.details.bonus}</strong></span>
                <span>Nguyện vọng xét: <strong>{targetNV}</strong></span>
                {preferredDistrict && (
                  <span>Quận ưu tiên: <strong>{districts.find((d: any) => String(d.id) === String(preferredDistrict))?.name ?? ''}</strong></span>
                )}
              </div>
              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #c7d2fe' }}>
                <strong style={{ color: '#3730a3' }}>💡 Điểm xét tuyển của bạn:</strong>{' '}
                <span style={{ fontSize: 15, fontWeight: 900, color: '#4338ca' }}>{evaluationResult.candidateScore}đ</span>
              </div>
            </div>

            {/* Recommendation list */}
            {evaluationResult.recommendations?.map((rec: G10RecommendationItem, i: number) => {
              const probColor = rec.safetyCategory === 'VERY_SAFE' || rec.safetyCategory === 'SAFE' ? '#059669'
                : rec.safetyCategory === 'COMPETITIVE' ? '#2563eb'
                : rec.safetyCategory === 'RISKY' ? '#d97706' : '#dc2626';
              return (
                <div key={i} className="print-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                      {user?.role === 'ADMIN' && (
                        <span style={{ background: '#e0e7ff', padding: '1px 6px', borderRadius: 4, marginRight: 6, fontWeight: 700 }}>{rec.schoolCode}</span>
                      )}
                      {rec.districtName}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 12, color: '#1e1b4b', marginBottom: 4 }}>{rec.schoolName}</div>
                    <div style={{ fontSize: 10, color: '#374151', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>Điểm chuẩn NV1: <strong>{rec.cutoffNV1}đ</strong></span>
                      <span>NV2: <strong>{rec.cutoffNV2 ? `${rec.cutoffNV2}đ` : '—'}</strong></span>
                      <span>NV3: <strong>{rec.cutoffNV3 ? `${rec.cutoffNV3}đ` : '—'}</strong></span>
                      <span>TB 3 năm: <strong style={{ color: '#4338ca' }}>{rec.historicalAvg}đ</strong></span>
                      {rec.nv2Gap !== null && <span>NV2 Chênh: <strong>+{rec.nv2Gap}đ</strong></span>}
                      {rec.nv3Gap !== null && <span>NV3 Chênh: <strong>+{rec.nv3Gap}đ</strong></span>}
                    </div>
                    {rec.advice && <div style={{ fontSize: 9, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>💡 {rec.advice}</div>}
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 60, flexShrink: 0, paddingLeft: 10, borderLeft: '1px solid #e0e7ff' }}>
                    <div className="print-prob" style={{ color: probColor }}>{rec.probability}%</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: probColor, textTransform: 'uppercase' }}>
                      {rec.safetyCategory === 'VERY_SAFE' ? 'Rất an toàn' : rec.safetyCategory === 'SAFE' ? 'An toàn' : rec.safetyCategory === 'COMPETITIVE' ? 'Cạnh tranh' : rec.safetyCategory === 'RISKY' ? 'Rủi ro' : 'Rất rủi ro'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SECTION 2: Đề Xuất Combo 3 NV ──────────────────────────────────── */}
        {comboResult && (
          <div>
            <h2 className="print-section-title" style={{ marginTop: 20 }}>PHẦN 2 — TƯ VẤN 3 NGUYỆN VỌNG</h2>

            {/* Input scores info */}
            <div className="print-card" style={{ marginBottom: 12, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
              <div style={{ fontWeight: 900, color: '#3730a3', marginBottom: 4 }}>📝 Thông tin điểm thi thử đầu vào</div>
              <div style={{ fontSize: 10, color: '#374151', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span>Môn Toán: <strong>{minMath} – {maxMath}</strong></span>
                <span>Môn Ngữ Văn: <strong>{minLiterature} – {maxLiterature}</strong></span>
                <span>Môn Tiếng Anh: <strong>{minEnglish} – {maxEnglish}</strong></span>
                <span>Điểm cộng ưu tiên: <strong>{priorityScore}</strong></span>
                {dreamSchoolCode && (
                  <span>Trường mơ ước NV1: <strong>{schools.find((s) => s.code === dreamSchoolCode)?.name ?? dreamSchoolCode}</strong></span>
                )}
                {comboUserAddress && <span>Địa chỉ nhà: <strong>{comboUserAddress}</strong></span>}
                <span>Khoảng cách tối đa: <strong>{maxCommuteDistance} km</strong></span>
              </div>
            </div>

            {/* All 3 strategies - each one starts on its own A4 page (see
                .print-strategy-block) and repeats the score summary at the
                top so every printed page is readable on its own. */}
            {(['safe', 'effort', 'defense'] as const).map((strategy, si) => {
              const labels: Record<string, string> = {
                safe: '🛡️ Tab 1: An Toàn — Phân bổ 3 NV theo điểm trung bình dự đoán',
                effort: '🔥 Tab 2: Nỗ Lực (Dream NV1) — Đặt trường mơ ước lên NV1',
                defense: '🏰 Tab 3: Phòng Thủ — Chắc chắn có suất công lập gần nhà',
              };
              const schools = comboResult.combos?.[strategy] ?? [];
              return (
                <div key={strategy} className={si > 0 ? 'print-strategy-block' : ''} style={{ marginBottom: 16 }}>
                  {/* Combo Score Summary - repeated on top of every combo page */}
                  <div className="print-card" style={{ marginBottom: 12, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                    <strong style={{ color: '#3730a3' }}>Điểm thi dự kiến:</strong>{' '}
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#4338ca' }}>{comboResult.minScore}đ – {comboResult.maxScore}đ</span>
                    {' '}(Trung bình xét: <strong>{comboResult.avgScore}đ</strong>)
                    {comboResult.ssf !== undefined && comboResult.ssf !== 0 && (
                      <span style={{ marginLeft: 12, fontSize: 10, fontWeight: 700, color: comboResult.ssf > 0 ? '#d97706' : '#059669' }}>
                        {comboResult.ssf > 0 ? '⚠️ Cạnh tranh tăng nhẹ' : '✨ Điểm chuẩn hạ nhẹ'} ({comboResult.ssf > 0 ? `+${comboResult.ssf}` : comboResult.ssf}đ)
                      </span>
                    )}
                  </div>

                  <div style={{ fontWeight: 900, fontSize: 12, color: '#3730a3', background: '#e0e7ff', padding: '4px 10px', borderRadius: 6, marginBottom: 8 }}>
                    {labels[strategy]}
                  </div>
                  {comboResult.explanations?.[strategy] && (
                    <div style={{ fontSize: 9, color: '#4b5563', fontStyle: 'italic', marginBottom: 6, paddingLeft: 6, borderLeft: '3px solid #c7d2fe' }}>
                      {comboResult.explanations[strategy]}
                    </div>
                  )}
                  {schools.map((school: any, idx: number) => {
                    const nvNum = idx + 1;
                    const prob = nvNum === 1 ? school.probNV1 : nvNum === 2 ? school.probNV2 : school.probNV3;
                    const cutoff = nvNum === 1 ? school.cutoffNV1 : nvNum === 2 ? school.cutoffNV2 : school.cutoffNV3;
                    const probColor = prob >= 80 ? '#059669' : prob >= 65 ? '#2563eb' : prob >= 50 ? '#d97706' : '#dc2626';
                    const nvColor = nvNum === 1 ? '#4338ca' : nvNum === 2 ? '#b45309' : '#065f46';
                    return (
                      <div key={school.schoolId} className="print-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: 3 }}>
                            <span className="print-nv-badge" style={{ background: nvColor, color: 'white' }}>NGUYỆN VỌNG {nvNum}</span>
                            {user?.role === 'ADMIN' && (
                              <span style={{ fontSize: 9, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, marginRight: 6, fontWeight: 700, color: '#374151' }}>{school.schoolCode}</span>
                            )}
                            <span style={{ fontSize: 9, color: '#6b7280' }}>{school.districtName}</span>
                          </div>
                          <div style={{ fontWeight: 900, fontSize: 12, color: '#1e1b4b', marginBottom: 4 }}>{school.schoolName}</div>
                          <div style={{ fontSize: 10, color: '#374151', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <span>Điểm chuẩn NV{nvNum}: <strong>{cutoff ?? 'Không tuyển'}đ</strong></span>
                            {nvNum > 1 && school[`nv${nvNum}Gap`] != null && (
                              <span>Chênh lệch NV{nvNum}: <strong style={{ color: '#b45309' }}>+{school[`nv${nvNum}Gap`]}đ</strong></span>
                            )}
                            {school.distance !== null && (
                              <span>Khoảng cách: <strong>{school.roadDistance ?? school.distance} km</strong></span>
                            )}
                            {school.commuteBonus > 0 && (
                              <span style={{ color: '#059669' }}>Điểm thưởng cự ly: <strong>+{school.commuteBonus}đ</strong></span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: 60, flexShrink: 0, paddingLeft: 10, borderLeft: '1px solid #e0e7ff' }}>
                          <div className="print-prob" style={{ color: probColor }}>{prob}%</div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: probColor, textTransform: 'uppercase' }}>
                            {prob >= 80 ? 'An tâm cao' : prob >= 65 ? 'An toàn' : prob >= 50 ? 'Cạnh tranh' : 'Rủi ro'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 8, borderTop: '1px solid #e0e7ff', fontSize: 9, color: '#9ca3af', textAlign: 'center' }}>
          Tài liệu này được tạo tự động bởi hệ thống AdmissionDecisionEngine. Chỉ mang tính chất tham khảo, không thay thế tư vấn chuyên môn.
        </div>
      </div>,
      document.body)}

    </div>
  );
}
