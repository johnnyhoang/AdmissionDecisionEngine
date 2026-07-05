import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Search as SearchIcon, TrendingUp, Calculator as CalcIcon, MapPin,
  BadgeCheck, School, HelpCircle, Sparkles, ArrowUpDown,
  BarChart2, BookOpen, Sliders, Award, RefreshCw, Printer, GitMerge
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  fetchG10Schools, fetchG10AllSchools, fetchG10SchoolDetail, fetchG10Districts,
  fetchG10Analytics, evaluateG10Profile, getG10ComboRecommendations,
  fetchNearbyG10Schools,
} from '../../services/api';
import type { G10SchoolItem, G10RecommendationItem } from '../../services/api';
import AiSearchModal from '../../components/AiSearchModal';
import HomeLocationModal from './components/HomeLocationModal';
import type { HomeLocationPick } from './components/HomeLocationModal';
import SchoolGroupedDropdown from './components/SchoolGroupedDropdown';
import BottomNav from '../../components/layout/BottomNav';
import MergeSchoolModal from './components/MergeSchoolModal';
import EditSchoolModal from './components/EditSchoolModal';
import CompareDrawer from './components/CompareDrawer';
import { updateG10School } from '../../services/api';
import { mergeG10Schools } from '../../services/api';
import { getCurrentSchoolYear, formatSchoolYear } from '../../utils/date';
import { useAuth } from '../../context/useAuth';
import { applyThemeToDocument, readStoredTheme } from '../../utils/theme';

export default function Grade10Container() {
  // ── UI States ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = readStoredTheme();
    return saved;
  });

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
  const [allSchools, setAllSchools] = useState<G10SchoolItem[]>([]);
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
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const districtDropdownRef = useRef<HTMLDivElement>(null);
  const [isEvalDistrictDropdownOpen, setIsEvalDistrictDropdownOpen] = useState(false);
  const evalDistrictDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<any>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrefillSchool, setAiPrefillSchool] = useState<{
    name: string;
    code: string;
    districtName?: string;
    districtCode?: string;
  } | undefined>(undefined);
  // What the print button should render into the print area
  const [printTarget, setPrintTarget] = useState<'results' | 'school' | 'compare'>('results');

  // ── Distance Finder states ─────────────────────────────────────────────────
  const [userAddress, setUserAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [distanceSchools, setDistanceSchools] = useState<any[]>([]);
  const [isProximityFilterActive, setIsProximityFilterActive] = useState(false);
  // Unified home-location modal (type address / GPS / map) — the context
  // decides what happens after the user confirms a location
  const [homeLocationContext, setHomeLocationContext] = useState<'proximity' | 'combo' | null>(null);

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
  const [comboSelectionMode, setComboSelectionMode] = useState<'distance' | 'district'>('distance');
  const [comboDistrictIds, setComboDistrictIds] = useState<string[]>([]);

  // ── Calculator form states ─────────────────────────────────────────────────
  const [mathScore, setMathScore] = useState('8.5');
  const [literatureScore, setLiteratureScore] = useState('8.0');
  const [englishScore, setEnglishScore] = useState('8.5');
  const [priorityScore, setPriorityScore] = useState('0');
  const [bonusScore, setBonusScore] = useState('0');
  const [preferredDistricts, setPreferredDistricts] = useState<string[]>([]);
  const [targetNV, setTargetNV] = useState('NV1');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // ── Compare List ───────────────────────────────────────────────────────────
  const [compareList, setCompareList] = useState<G10SchoolItem[]>([]);

  useEffect(() => {
    loadDistricts();
    loadSchools();
    loadAnalytics();
    // Full list (limit 500) for dropdown selectors like "Trường Mơ ước"
    fetchG10AllSchools().then(setAllSchools).catch(() => {});
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target as Node)) {
        setIsDistrictDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleClickOutsideEval(event: MouseEvent) {
      if (evalDistrictDropdownRef.current && !evalDistrictDropdownRef.current.contains(event.target as Node)) {
        setIsEvalDistrictDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideEval);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideEval);
    };
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

  // Debounced search — reload the list 350ms after the user stops typing
  // instead of firing one API call per keystroke
  const isFirstSearchRun = useRef(true);
  useEffect(() => {
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadSchools(searchQuery, selectedDistricts.join(','));
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = (val: string) => {
    setSearchQuery(val);
  };

  const handleDistrictToggle = (distId: string) => {
    let next: string[];
    if (selectedDistricts.includes(distId)) {
      next = selectedDistricts.filter(id => id !== distId);
    } else {
      next = [...selectedDistricts, distId];
    }
    setSelectedDistricts(next);
    loadSchools(searchQuery, next.join(','));
  };

  const handleSelectAllDistricts = () => {
    const allIds = districts.map(d => d.id);
    setSelectedDistricts(allIds);
    loadSchools(searchQuery, allIds.join(','));
  };

  const handleClearDistricts = () => {
    setSelectedDistricts([]);
    loadSchools(searchQuery, '');
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
        selectionMode: comboSelectionMode,
        preferredDistricts: comboSelectionMode === 'district' ? comboDistrictIds : undefined,
      });

      setComboResult(res);
    } catch (e: any) {
      alert('Tư vấn thất bại: ' + e.message);
    } finally {
      setIsComboLoading(false);
    }
  };

  // Render the chosen content into the print area, then open the print
  // dialog once React has committed the swap
  const printDocument = (target: 'results' | 'school' | 'compare') => {
    setPrintTarget(target);
    setTimeout(() => window.print(), 150);
  };

  // Rough bounding box of Ho Chi Minh City — the home location must fall
  // inside it before distance-based recommendations make sense
  const isWithinHCM = (lat: number, lon: number) =>
    lat >= 10.3 && lat <= 11.25 && lon >= 106.2 && lon <= 107.1;

  const handleGetCombo = async () => {
    if (comboSelectionMode === 'distance') {
      if (!comboGPS) {
        alert('Vui lòng đặt vị trí nhà (địa chỉ, GPS hoặc ghim trên bản đồ) để hệ thống tính khoảng cách đến trường.');
        return;
      }
      if (!isWithinHCM(comboGPS.lat, comboGPS.lon)) {
        alert('Vị trí nhà của bạn nằm ngoài phạm vi TP.HCM. Vui lòng đặt lại vị trí trong TP.HCM để được tư vấn theo khoảng cách.');
        return;
      }
    }
    if (comboSelectionMode === 'district' && comboDistrictIds.length === 0) {
      alert('Vui lòng chọn ít nhất một quận/huyện mong muốn.');
      return;
    }
    // The home location (if any) was already normalized and confirmed
    // inside HomeLocationModal — just run with the stored coordinates
    await runComboRequest(
      comboSelectionMode === 'distance' ? comboGPS?.lat : undefined,
      comboSelectionMode === 'distance' ? comboGPS?.lon : undefined,
    );
  };

  const toggleComboDistrict = (districtId: string) => {
    setComboDistrictIds((current) =>
      current.includes(districtId)
        ? current.filter((id) => id !== districtId)
        : [...current, districtId],
    );
  };

  // Called when the user finishes the flow inside HomeLocationModal
  const handleHomeLocationConfirm = async ({ latitude, longitude, label }: HomeLocationPick) => {
    const context = homeLocationContext;
    setHomeLocationContext(null);

    if (context === 'proximity') {
      setUserAddress(label);
      setIsLocating(true);
      try {
        await calculateSchoolDistances(latitude, longitude);
        setIsProximityFilterActive(true);
      } finally {
        setIsLocating(false);
      }
    } else if (context === 'combo') {
      setComboGPS({ lat: latitude, lon: longitude });
      setComboUserAddress(label);
    }
  };

  

  
  const handleEditSave = async (id: string, payload: any) => {
    await updateG10School(id, payload);
    setEditingSchoolId(null);
    loadSchools(debouncedSearchQuery, selectedDistricts.join(','));
  };

  const handleMergeSave = async (primaryId: string, secondaryId: string, mergedData: any) => {
    await mergeG10Schools(primaryId, secondaryId, mergedData);
    setSelectedMergeIds([]);
    loadSchools(debouncedSearchQuery, selectedDistricts.join(','));
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
        preferredDistricts: preferredDistricts.length > 0 ? preferredDistricts : undefined,
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

  const canRecommend = hasPermission('GRADE10', 'view_recommendation', 'view');
  // Tones live in index.css (g10-completeness--*) so both themes get
  // enough contrast — Tailwind pastel text on tinted bg was unreadable
  const getCompletenessTone = (percent?: number) => {
    const value = percent ?? 0;
    if (value >= 90) return 'g10-completeness--high';
    if (value >= 70) return 'g10-completeness--mid';
    if (value >= 45) return 'g10-completeness--warn';
    return 'g10-completeness--low';
  };

  // Mobile bottom navigation: 4 primary destinations + "Thêm" sheet for the
  // rest — mirrors the desktop tab bar but in a mobile-app layout
  const bottomNavItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <BarChart2 className="h-5 w-5" /> },
    { id: 'search', label: 'Tra cứu', icon: <School className="h-5 w-5" /> },
    ...(canRecommend
      ? [
          { id: 'calculator', label: 'Đánh giá', icon: <CalcIcon className="h-5 w-5" /> },
          { id: 'combo', label: 'Tư vấn', icon: <Sparkles className="h-5 w-5" /> },
        ]
      : []),
  ];
  const bottomNavMoreItems = [
    { id: 'specialized', label: 'Lớp Chuyên', icon: <Award className="h-4 w-4" />, description: 'Tư vấn NV chuyên & tích hợp (sắp ra mắt)' },
    { id: 'adjust', label: 'Mô phỏng', icon: <RefreshCw className="h-4 w-4" />, description: 'Mô phỏng đợt điều chỉnh NV (sắp ra mắt)' },
  ];

  return (
    <div className="grade10-module flex-1 flex flex-col">
      {/* Navigation tabs (desktop) — mobile uses the fixed BottomNav instead */}
      <nav className="hidden md:block bg-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Scrollable Tabs Wrapper */}
          <div className="w-full flex flex-row flex-nowrap gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap pr-2">
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
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <BottomNav
        items={bottomNavItems}
        moreItems={bottomNavMoreItems}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as typeof activeTab)}
      />

      {/* Floating Compare Badge — sits above the mobile bottom nav */}
      {compareList.length > 0 && (
        <button
          onClick={() => setIsCompareOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-600/40 text-xs font-extrabold cursor-pointer transition-all duration-200 animate-pop-in border border-indigo-400/30"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Xem so sánh
          <span className="flex items-center justify-center h-5 w-5 bg-white text-indigo-600 rounded-full text-[10px] font-black leading-none">
            {compareList.length}
          </span>
        </button>
      )}

      {/* Main Content Area — extra bottom padding on mobile clears the fixed BottomNav */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 pb-28 md:p-6 flex flex-col gap-6">
        
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
                    Hệ thống lưu trữ lịch sử điểm chuẩn, chỉ tiêu tuyển sinh, số lượng thí sinh đăng ký và tỉ lệ chọi 3 năm gần nhất giúp học sinh và phụ huynh đưa ra quyết định đăng ký nguyện vọng tối ưu nhất.
                  </p>
                  <p className="bg-slate-950/45 p-3 border border-slate-800 rounded-xl">
                    💡 <strong>Mẹo nhỏ:</strong> Hãy nhập điểm thử của 3 môn (Toán, Văn, Anh) và điểm ưu tiên vào tab <strong>"Đánh giá NV lớp 10"</strong> để nhận đề xuất trường công lập phù hợp nhất dựa trên tỉ lệ đỗ lịch sử!
                  </p>

                  {/* Selling Points grid */}
                  <div className="mt-4 border-t border-slate-800/80 pt-4">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3">🌟 Các tính năng nổi bật của Hệ thống</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div className="bg-slate-950/30 border border-slate-850 p-3 rounded-xl flex items-start gap-2.5">
                        <span className="text-indigo-400 text-lg">📊</span>
                        <div>
                          <strong className="text-slate-200 block text-[11px] mb-0.5">Dữ liệu lớn lịch sử 3 năm</strong>
                          <span className="text-slate-400 text-[10px] leading-relaxed block">Lưu trữ và đối sánh trực quan chỉ tiêu, hồ sơ đăng ký, tỉ lệ chọi và điểm chuẩn của 115+ trường THPT.</span>
                        </div>
                      </div>
                      <div className="bg-slate-950/30 border border-slate-850 p-3 rounded-xl flex items-start gap-2.5">
                        <span className="text-emerald-400 text-lg">🧠</span>
                        <div>
                          <strong className="text-slate-200 block text-[11px] mb-0.5">Giải thuật Đánh giá Xác suất</strong>
                          <span className="text-slate-400 text-[10px] leading-relaxed block">Áp dụng mô hình toán học tích lũy và hàm mũ để dự báo khả năng đỗ thực tế của học sinh theo từng nguyện vọng.</span>
                        </div>
                      </div>
                      <div className="bg-slate-950/30 border border-slate-850 p-3 rounded-xl flex items-start gap-2.5">
                        <span className="text-amber-400 text-lg">🛡️</span>
                        <div>
                          <strong className="text-slate-200 block text-[11px] mb-0.5">Mô phỏng 3 NV tối ưu</strong>
                          <span className="text-slate-400 text-[10px] leading-relaxed block">Tự động đề xuất tổ hợp 3 Nguyện vọng thông minh theo 3 hướng: An Toàn, Nỗ Lực (Mơ ước) và Phòng Thủ vững chắc.</span>
                        </div>
                      </div>
                      <div className="bg-slate-950/30 border border-slate-850 p-3 rounded-xl flex items-start gap-2.5">
                        <span className="text-rose-400 text-lg">📍</span>
                        <div>
                          <strong className="text-slate-200 block text-[11px] mb-0.5">Tích hợp Cự ly di chuyển</strong>
                          <span className="text-slate-400 text-[10px] leading-relaxed block">Tự động tìm kiếm trường gần bạn nhất bằng GPS, tính khoảng cách thực tế và cộng điểm thưởng cự ly thông minh.</span>
                        </div>
                      </div>
                    </div>
                  </div>
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

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Môn Toán</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={mathScore}
                    onChange={(e) => setMathScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-1.5 text-center text-xs text-slate-200 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Môn Văn</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={literatureScore}
                    onChange={(e) => setLiteratureScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-1.5 text-center text-xs text-slate-200 outline-none transition" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 text-center">Môn Anh</label>
                  <input 
                    type="number" step="0.25" max="10" min="0"
                    value={englishScore}
                    onChange={(e) => setEnglishScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-1.5 text-center text-xs text-slate-200 outline-none transition" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Điểm Ưu Tiên (0-2đ)</label>
                  <input 
                    type="number" step="0.5" max="2" min="0"
                    value={priorityScore}
                    onChange={(e) => setPriorityScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Điểm Khuyến Khích</label>
                  <input 
                    type="number" step="0.5" max="2" min="0"
                    value={bonusScore}
                    onChange={(e) => setBonusScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nguyện Vọng Xét</label>
                  <select 
                    value={targetNV}
                    onChange={(e) => setTargetNV(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="NV1">Nguyện vọng 1</option>
                    <option value="NV2">Nguyện vọng 2</option>
                    <option value="NV3">Nguyện vọng 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Quận Ưu Tiên</label>
                  <div ref={evalDistrictDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEvalDistrictDropdownOpen(!isEvalDistrictDropdownOpen)}
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 flex items-center justify-between outline-none transition cursor-pointer select-none"
                    >
                      <span className="truncate">
                        {preferredDistricts.length === 0
                          ? 'Tất cả Quận/Huyện'
                          : preferredDistricts.length === districts.length
                          ? 'Tất cả Quận/Huyện'
                          : preferredDistricts.length === 1
                          ? districts.find((d: any) => d.id === preferredDistricts[0])?.name
                          : `${preferredDistricts.length} quận được chọn`}
                      </span>
                      <span className="ml-1 text-slate-500">▼</span>
                    </button>
                    {isEvalDistrictDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-full min-w-[220px] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs text-slate-350 animate-pop-in">
                        <div className="flex justify-between items-center px-2 py-1.5 border-b border-slate-800/80 mb-1.5">
                          <span className="font-semibold text-slate-400">Chọn Quận/Huyện</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPreferredDistricts([])}
                              className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                            >
                              Bỏ chọn
                            </button>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1 pr-1">
                          {districts.map((d: any) => {
                            const isChecked = preferredDistricts.includes(d.id);
                            return (
                              <label
                                key={d.id}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-900 rounded-lg cursor-pointer transition select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setPreferredDistricts(prev =>
                                      isChecked ? prev.filter(id => id !== d.id) : [...prev, d.id]
                                    );
                                  }}
                                  className="rounded border-slate-850 text-indigo-600 bg-slate-950 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                />
                                <span className={`text-xs ${isChecked ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}>
                                  {d.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
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
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-900/40 p-4 border border-slate-800 rounded-xl">
                <div>
                  <div className="flex items-center gap-1.5">
                  <h2 className="text-sm md:text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>
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
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-indigo-950/25 border border-indigo-500/10 p-3 rounded-xl text-xs text-slate-300">
                    <div>
                      💡 Điểm xét tuyển của bạn: <strong className="text-indigo-400 text-sm">{evaluationResult.candidateScore}đ</strong> (Toán: {evaluationResult.details.math} | Văn: {evaluationResult.details.literature} | Anh: {evaluationResult.details.english} | Điểm cộng: {Number(evaluationResult.details.priority) + Number(evaluationResult.details.bonus)})
                    </div>
                    <button
                      onClick={() => printDocument('results')}
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
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 justify-between lg:items-center bg-slate-900 border border-slate-800 p-3 md:p-4 rounded-xl">
              <div className="relative w-full lg:max-w-md">
                <SearchIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={isProximityFilterActive ? "🔒 Lọc cự ly đang kích hoạt (bị khóa)..." : "Tìm trường theo tên (VD: Bùi Thị Xuân)..."}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  disabled={isProximityFilterActive}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none transition disabled:opacity-50 disabled:bg-slate-950/40 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {user?.role === 'ADMIN' && selectedMergeIds.length === 2 && (
                  <button
                    onClick={() => setIsMergeModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Merge 2 Trường Đã Chọn
                  </button>
                )}




                <button
                  onClick={() => setHomeLocationContext('proximity')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isProximityFilterActive
                      ? 'bg-rose-600/10 border-rose-500/20 text-rose-400 hover:bg-rose-600/20'
                      : 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-600/20'
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {isLocating ? 'Đang tính cự ly...' : isProximityFilterActive ? '📍 Cự ly: Bật' : 'Tìm gần nhà'}
                </button>

                <div ref={districtDropdownRef} className="relative flex-1 sm:flex-none min-w-0">
                  <button
                    type="button"
                    onClick={() => !isProximityFilterActive && setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                    disabled={isProximityFilterActive}
                    className="w-full sm:w-56 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-350 flex items-center justify-between outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-700 transition select-none cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedDistricts.length === 0
                        ? 'Tất cả Quận/Huyện'
                        : selectedDistricts.length === districts.length
                        ? 'Tất cả Quận/Huyện'
                        : selectedDistricts
                            .map(id => districts.find(d => d.id === id)?.name)
                            .filter(Boolean)
                            .join(', ')}
                    </span>
                    <span className="ml-1 text-slate-500">▼</span>
                  </button>

                  {isDistrictDropdownOpen && (
                    <div className="absolute right-0 md:left-0 mt-1.5 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs text-slate-350 animate-pop-in">
                      <div className="flex justify-between items-center px-2 py-1.5 border-b border-slate-800/80 mb-1.5">
                        <span className="font-semibold text-slate-400">Chọn Quận/Huyện</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllDistricts}
                            className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                          >
                            Tất cả
                          </button>
                          <span className="text-slate-700">|</span>
                          <button
                            type="button"
                            onClick={handleClearDistricts}
                            className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                          >
                            Bỏ chọn
                          </button>
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto scrollbar-thin space-y-1 pr-1">
                        {districts.map((d: any) => {
                          const isChecked = selectedDistricts.includes(d.id);
                          return (
                            <label
                              key={d.id}
                              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-900 rounded-lg cursor-pointer transition select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleDistrictToggle(d.id)}
                                className="rounded border-slate-850 text-indigo-600 bg-slate-950 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                              />
                              <span className={`text-xs ${isChecked ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}>
                                {d.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  Tổng số: <span className="font-semibold text-slate-200">{isProximityFilterActive ? distanceSchools.length : schools.length}</span> trường
                </div>
              </div>
            </div>

            {isProximityFilterActive && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-950/20 border border-indigo-500/20 p-3 rounded-xl text-xs text-indigo-300 font-semibold shadow-md">
                <span className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-indigo-400 animate-bounce shrink-0" />
                  <span className="truncate">Lọc theo cự ly gần nhà: <strong className="text-white">{userAddress || 'GPS'}</strong> (15 trường gần nhất)</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-xs font-semibold shadow-md">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isProximityFilterActive ? distanceSchools : schools).map((school) => {
                const isCompared = compareList.some(item => item.id === school.id);
                const isMergeSelected = selectedMergeIds.includes(school.id);
                const cardDistance = school.roadDistance ?? school.distance;
                const latestAdmissionYear = school.latestYear || getCurrentSchoolYear();
                const latestQuotaYear = school.latestQuotaYear || latestAdmissionYear;
                return (
                  <div key={school.id} className={`relative bg-slate-900/60 border rounded-xl p-3.5 shadow-md flex flex-col justify-between gap-3 transition-all duration-200 ${
                    isMergeSelected
                      ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-amber-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}>
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className="rounded-full bg-slate-800/80 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300 truncate max-w-[130px]">
                            {school.district?.name || 'TP.HCM'}
                          </span>
                          {user?.role === 'ADMIN' && school.dataCompleteness && (
                            <div
                              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-black shadow-sm ${getCompletenessTone(school.dataCompleteness.percent)}`}
                              title={`${school.dataCompleteness.completedFields}/${school.dataCompleteness.totalFields} trường dữ liệu đã hoàn thiện`}
                            >
                              <span>{school.dataCompleteness.percent}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
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
                              className={`text-[10px] px-1.5 py-0.5 rounded transition border flex items-center gap-1 ${
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
                            className={`text-[10px] px-1.5 py-0.5 rounded transition border ${
                              isCompared 
                                ? 'bg-rose-600 border-rose-500 text-white' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isCompared ? 'Bỏ so sánh' : 'So sánh'}
                          </button>
                        </div>
                      </div>
                      <h3 className="text-[13px] font-black text-white mb-1.5 hover:text-indigo-400 cursor-pointer flex items-center gap-1.5 leading-tight" onClick={() => openSchoolDetail(school.id)}>
                        <span className="line-clamp-2">{school.name}</span>
                        {school.isVerified && <span title="Trường đã xác thực"><BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" /></span>}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-start gap-1 leading-normal">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{school.address || 'Hồ Chí Minh'}</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1.5">
                          <div className="text-[9px] text-slate-500">NV1 {formatSchoolYear(latestAdmissionYear)}</div>
                          <div className="text-sm font-black text-indigo-400">{school.latestCutoffNV1 || '—'}đ</div>
                        </div>
                        <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1.5">
                          <div className="text-[9px] text-slate-500">Chỉ tiêu {formatSchoolYear(latestQuotaYear)}</div>
                          <div className="text-sm font-black text-slate-100">{school.latestQuota?.toLocaleString() || '—'}</div>
                        </div>
                        <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1.5">
                          <div className="text-[9px] text-slate-500">Tỷ lệ chọi</div>
                          <div className="text-sm font-black text-rose-400">{school.latestCompetitionRatio ? `1:${school.latestCompetitionRatio}` : '—'}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-slate-400">
                        <span>NV2 <strong className="text-slate-200">{school.latestCutoffNV2 || '—'}đ</strong></span>
                        <span>NV3 <strong className="text-slate-200">{school.latestCutoffNV3 || '—'}đ</strong></span>
                        {school.latestRegisteredCount ? (
                          <span>ĐK NV1 <strong className="text-slate-200">{school.latestRegisteredCount.toLocaleString()}</strong></span>
                        ) : null}
                      </div>

                      {isProximityFilterActive && typeof cardDistance === 'number' && (
                        <div className="flex justify-between text-[10px] bg-indigo-950/20 border border-indigo-900/30 px-2 py-1.5 rounded-lg text-indigo-300 font-semibold">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-indigo-400" /> Đường đi
                          </span>
                          <span className="font-extrabold text-indigo-200">
                            {cardDistance} km{school.roadDuration ? ` (~${school.roadDuration} phút)` : ''}
                          </span>
                        </div>
                      )}
                      {user?.role === 'ADMIN' && (
                        <div className="flex gap-2 mt-0.5">
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

      {/* School Detail Modal — bottom sheet on mobile, centered dialog on desktop */}
      {selectedSchoolId && schoolDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4 z-[70]">
          <div className="bg-slate-900 border border-slate-800 rounded-t-2xl md:rounded-2xl max-w-3xl w-full p-4 md:p-6 shadow-2xl relative flex flex-col gap-4 max-h-[92dvh] md:max-h-[90vh]">
            <button
              onClick={() => setSelectedSchoolId(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b border-slate-800 pb-3 flex justify-between items-end gap-3 pr-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">

                  <span className="text-xs text-slate-400">{schoolDetail.district?.name || 'Chưa rõ quận'}</span>
                </div>
                <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <School className="h-5 w-5 text-indigo-400 shrink-0" />
                  {schoolDetail.name}
                </h2>
              </div>
              <div className="flex items-center gap-2 mb-1 shrink-0">
                <button
                  onClick={() => printDocument('school')}
                  className="no-print px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition border border-slate-700 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  In PDF
                </button>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setSelectedSchoolId(null);
                      setEditingSchoolId(schoolDetail.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Sửa toàn diện
                  </button>
                )}
              </div>
            </div>

            {/* Continuous content — no tabs, everything scrolls top-to-bottom */}
            <div className="overflow-y-auto pr-1 flex-1 min-h-0 text-xs text-slate-350 flex flex-col gap-6">
              <section>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">🏫 Tổng quan</h3>
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
                      {schoolDetail.activities && (
                        <div className="space-y-1 mt-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">🎭 Hoạt động & Phong trào</span>
                          <p className="text-slate-400 leading-relaxed font-normal">{schoolDetail.activities}</p>
                        </div>
                      )}
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
              </section>

              <section>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">📈 Điểm chuẩn</h3>
                <div className="flex flex-col gap-5">
                  {/* Multi-line Cutoff Chart */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      Đồ thị biến động điểm chuẩn 3 năm gần đây
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
              </section>

              <section>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">🎯 Chỉ tiêu & Tỷ lệ chọi</h3>
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
              </section>
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
        onPrint={() => printDocument('compare')}
        theme={theme}
      />
      {/* Unified home-location modal (address / GPS / map — all in one flow) */}
      <HomeLocationModal
        isOpen={!!homeLocationContext}
        title={homeLocationContext === 'proximity' ? 'Tìm trường gần bạn' : 'Vị trí nhà của bạn'}
        onClose={() => setHomeLocationContext(null)}
        onConfirm={handleHomeLocationConfirm}
      />
        {/* Tab: Combo Recommendation — rendered outside the main container in the
            DOM, so it carries the same container/padding classes itself */}
        {activeTab === 'combo' && (
          <div className="max-w-7xl w-full mx-auto p-4 pb-28 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
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
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 text-center font-semibold">Toán (Min-Max)</label>
                      <div className="flex gap-0.5 items-center">
                        <input type="number" step="0.25" value={minMath} onChange={e => setMinMath(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-xs text-white" />
                        <span className="text-slate-500 text-[10px]">-</span>
                        <input type="number" step="0.25" value={maxMath} onChange={e => setMaxMath(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-xs text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 text-center font-semibold">Văn (Min-Max)</label>
                      <div className="flex gap-0.5 items-center">
                        <input type="number" step="0.25" value={minLiterature} onChange={e => setMinLiterature(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-xs text-white" />
                        <span className="text-slate-500 text-[10px]">-</span>
                        <input type="number" step="0.25" value={maxLiterature} onChange={e => setMaxLiterature(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-xs text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 text-center font-semibold">Anh (Min-Max)</label>
                      <div className="flex gap-0.5 items-center">
                        <input type="number" step="0.25" value={minEnglish} onChange={e => setMinEnglish(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-xs text-white" />
                        <span className="text-slate-500 text-[10px]">-</span>
                        <input type="number" step="0.25" value={maxEnglish} onChange={e => setMaxEnglish(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-center text-xs text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Điểm cộng ưu tiên</label>
                      <input type="number" step="0.5" value={priorityScore} onChange={e => setPriorityScore(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" />
                    </div>
                    {comboSelectionMode === 'distance' && (
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold">Cự ly tối đa (km)</label>
                      <div className="flex gap-1 items-center">
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={maxCommuteDistance}
                          onChange={(e) => setMaxCommuteDistance(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-200 outline-none"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">km</span>
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                {/* Dream school selector — grouped by district with search */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Trường Mơ ước NV1</label>
                  <SchoolGroupedDropdown
                    schools={allSchools.length > 0 ? allSchools : schools}
                    value={dreamSchoolCode}
                    onChange={setDreamSchoolCode}
                    placeholder="-- Chọn trường mơ ước --"
                  />
                </div>

                {/* Candidate scope */}
                <div className="flex flex-col gap-3">
                  <label className="block text-xs font-semibold text-slate-400">Phạm vi xét trường</label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/60 border border-slate-800 p-1">
                    <button
                      type="button"
                      onClick={() => setComboSelectionMode('distance')}
                      className={`rounded-lg px-2 py-2 text-[11px] font-black transition ${
                        comboSelectionMode === 'distance'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Theo khoảng cách
                    </button>
                    <button
                      type="button"
                      onClick={() => setComboSelectionMode('district')}
                      className={`rounded-lg px-2 py-2 text-[11px] font-black transition ${
                        comboSelectionMode === 'district'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Theo quận mong muốn
                    </button>
                  </div>
                </div>

                {comboSelectionMode === 'distance' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Địa chỉ nhà (tính đường đi thực tế)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHomeLocationContext('combo')}
                      className={`flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-lg px-3 py-2 text-xs text-left transition cursor-pointer ${
                        comboGPS ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">
                        {comboGPS ? comboUserAddress || 'Đã đặt vị trí nhà' : 'Đặt vị trí nhà của bạn...'}
                      </span>
                    </button>
                    {comboGPS && (
                      <button
                        type="button"
                        onClick={() => { setComboGPS(null); setComboUserAddress(''); }}
                        className="px-2.5 bg-slate-800 border border-slate-700 hover:border-slate-650 text-slate-400 hover:text-white rounded-lg text-xs cursor-pointer"
                        title="Xóa vị trí"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 mb-0">
                    Khoảng cách được tính theo quãng đường đi thực tế, không phải đường chim bay.
                  </p>
                </div>
                ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-slate-400">Chọn quận/huyện muốn xét</label>
                    <button
                      type="button"
                      onClick={() => setComboDistrictIds([])}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-200"
                    >
                      Xóa chọn
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                    {districts.map((district: any) => {
                      const checked = comboDistrictIds.includes(district.id);
                      return (
                        <button
                          key={district.id}
                          type="button"
                          onClick={() => toggleComboDistrict(district.id)}
                          className={`rounded-lg border px-2 py-1.5 text-left text-[10px] font-bold transition ${
                            checked
                              ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {checked ? '✓ ' : ''}{district.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 m-0">
                    Khi chọn quận, hệ thống chỉ xét các trường thuộc các quận này và bỏ hoàn toàn điểm thưởng khoảng cách.
                  </p>
                </div>
                )}

                <button
                  onClick={handleGetCombo}
                  disabled={isComboLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-xs mt-2 cursor-pointer"
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
                  <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-2xl text-xs text-slate-350 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      Điểm thi dự kiến: <strong className="text-indigo-400 text-sm">{comboResult.minScore}đ - {comboResult.maxScore}đ</strong>
                      <span className="text-slate-500 ml-2">(Trung bình xét: {comboResult.avgScore}đ)</span>
                      <span className="ml-0 mt-1 block text-[10px] text-slate-500 sm:ml-2 sm:inline">
                        {comboResult.selectionMode === 'district'
                          ? `Chỉ xét ${comboResult.filterSummary?.selectedDistrictCount || 0} quận/huyện đã chọn`
                          : 'Xét theo quãng đường đi thực tế từ nhà bạn'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
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
                        onClick={() => printDocument('results')}
                        className="no-print flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-xs font-bold border border-slate-700"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        In PDF
                      </button>
                    </div>
                  </div>

                  {/* Strategy Tabs — desktop only; mobile stacks all three sections */}
                  <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setSelectedStrategy('safe')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                        selectedStrategy === 'safe'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🛡️ <span className="hidden sm:inline">Phương Án </span>An Toàn
                    </button>
                    <button
                      onClick={() => setSelectedStrategy('effort')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                        selectedStrategy === 'effort'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🔥 <span className="hidden sm:inline">Phương Án </span>Nỗ Lực
                    </button>
                    <button
                      onClick={() => setSelectedStrategy('defense')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                        selectedStrategy === 'defense'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🏰 <span className="hidden sm:inline">Phương Án </span>Phòng Thủ
                    </button>
                  </div>

                  {/* Auto-relaxed warning */}
                  {comboResult.selectionMode === 'distance' && comboResult.adjusted && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-500 font-semibold leading-relaxed">
                      ⚠️ <strong>Lưu ý:</strong> Do trong vòng {maxCommuteDistance} km không tìm đủ trường phù hợp để xếp combo, chúng tôi đã tự động nới rộng giới hạn khoảng cách lên <strong>{comboResult.maxCommuteDistance} km</strong>.
                    </div>
                  )}

                  {/* Strategy sections — desktop shows the tab-selected one,
                      mobile stacks all three from top to bottom */}
                  {([
                    { key: 'safe', icon: '🛡️', title: 'Phương Án An Toàn', desc: <>💡 <strong>Chiến lược An Toàn:</strong> Tự động phân bổ 3 NV theo thứ tự điểm chuẩn giảm dần quanh điểm trung bình dự đoán của bạn. Không bắt buộc có trường mơ ước.</> },
                    { key: 'effort', icon: '🔥', title: 'Phương Án Nỗ Lực', desc: <>💡 <strong>Chiến lược Nỗ Lực:</strong> Bạn đang rất quyết tâm, nỗ lực vượt lên chính mình! Đưa trường Mơ ước lên NV1 bất kể tỉ lệ chọi, sau đó lùi NV2 cạnh tranh và NV3 thủ vững chắc.</> },
                    { key: 'defense', icon: '🏰', title: 'Phương Án Phòng Thủ', desc: <>💡 <strong>Chiến lược Phòng Thủ:</strong> Bạn không tự tin và thời gian sắp cạn, cần chắc cú! Hạ chỉ tiêu xuống trường an toàn ngay từ NV1, lùi sâu NV2/NV3 để đảm bảo 100% có vé vào trường công lập.</> },
                  ] as const).map(({ key: strategy, icon, title, desc }) => (
                    <div key={strategy} className={`flex-col gap-4 ${selectedStrategy === strategy ? 'flex' : 'flex md:hidden'}`}>
                      {/* Mobile-only section header */}
                      <div className="md:hidden flex items-center gap-2 mt-1">
                        <span className="text-sm font-black text-white shrink-0">{icon} {title}</span>
                        <div className="flex-1 border-t border-slate-800"></div>
                      </div>

                      {/* Strategy Info Note */}
                      <div className="bg-slate-950/45 p-3.5 border border-slate-850 rounded-xl text-xs text-slate-300">
                        <p className="m-0">{desc}</p>
                      </div>

                      {/* Dynamic Explanation Card */}
                      {comboResult.explanations && comboResult.explanations[strategy] && (
                        <div className="grade10-expert-analysis bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl text-xs text-indigo-200 leading-relaxed shadow-lg flex flex-col gap-2">
                          <span className="grade10-expert-analysis-title font-bold uppercase tracking-wider text-[10px] text-indigo-400">💡 Phân tích chiến thuật của chuyên gia AI:</span>
                          <p className="m-0">{comboResult.explanations[strategy]}</p>
                        </div>
                      )}

                      {/* Recommended 3-NV Combo List */}
                      <div className="flex flex-col gap-3">
                    {comboResult.combos[strategy]?.map((school: any, idx: number) => {
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
                          className={`bg-slate-900/60 border hover:border-indigo-500/40 rounded-xl p-3.5 flex items-start justify-between gap-3 cursor-pointer transition ${
                            isTooFar ? 'border-amber-500/10' : 'border-slate-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                                nvNum === 1 ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400' :
                                nvNum === 2 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              }`}>
                                NV{nvNum}
                              </span>

                              <span className="text-[10px] text-slate-500">
                                {school.districtName}
                              </span>
                            </div>

                            <h3 className="text-sm font-extrabold text-white mb-2 truncate">{school.schoolName}</h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px] text-slate-400">
                              <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1">
                                <span className="block">Điểm NV{nvNum}</span>
                                <span className="font-bold text-slate-100">{cutoff || 'Không tuyển'}đ</span>
                              </div>
                              {nvNum > 1 && school[`nv${nvNum}Gap`] !== null && (
                                <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1">
                                  <span className="block">Lệch NV{nvNum}</span>
                                  <span className="font-bold text-amber-400">+{school[`nv${nvNum}Gap`]}đ</span>
                                </div>
                              )}
                              {school.roadDistance !== null && school.roadDistance !== undefined && (
                                <div className={`rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1 ${isTooFar ? 'text-amber-400 font-medium' : ''}`}>
                                  <span className="block">Đường đi</span>
                                  <span className="font-bold">{school.roadDistance} km{school.roadDuration ? ` · ${school.roadDuration}p` : ''}</span>
                                </div>
                              )}
                              {school.commuteBonus > 0 && (
                                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-emerald-300">
                                  <span className="block">Cự ly bonus</span>
                                  <span className="font-bold">+{school.commuteBonus}đ</span>
                                </div>
                              )}
                            </div>



                            {isTooFar && (
                              <p className="text-[10px] text-amber-500 mt-2 m-0 leading-relaxed">
                                ⚠️ <strong>Cảnh báo:</strong> Trường nằm khá xa địa chỉ nhà của bạn ({school.roadDistance || school.distance}km). Hãy cân nhắc về phương tiện đi lại nếu đăng ký!
                              </p>
                            )}
                          </div>

                          {/* Pass probability for this NV */}
                          <div className="w-20 shrink-0 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/45 px-2 py-2">
                            <div className="text-[9px] text-slate-500 mb-0.5">Đỗ NV{nvNum}</div>
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
                  ))}
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
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📊 1. Vì sao không thể chỉ nhìn điểm chuẩn năm ngoái?</h3>
                <p className="m-0">Điểm chuẩn <strong>mỗi năm mỗi khác</strong>: năm nào đông thí sinh hơn, đề dễ hơn, hoặc trường tuyển ít hơn thì điểm chuẩn sẽ nhích lên. Hệ thống nhìn vào các yếu tố đó để <strong>dự đoán điểm chuẩn của năm nay</strong>, giúp con tránh trường hợp "điểm bằng năm ngoái mà vẫn trượt" vì năm nay điểm chuẩn tăng.</p>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🎯 2. Con số "Xác suất đỗ" nên hiểu thế nào?</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li>Điểm của con <strong>vừa bằng</strong> điểm chuẩn dự đoán → cơ hội khoảng <strong>50/50</strong>, như đứng đúng ranh giới đỗ/trượt.</li>
                  <li>Điểm <strong>cao hơn</strong> điểm chuẩn → cơ hội tăng dần, nhưng tối đa hệ thống chỉ hiện <strong>88%</strong> — vì đi thi luôn có rủi ro (sức khỏe, tâm lý phòng thi), không bao giờ chắc chắn 100%.</li>
                  <li>Điểm <strong>thấp hơn</strong> điểm chuẩn → cơ hội giảm rất nhanh, nên cân nhắc kỹ.</li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🧭 3. Đọc kết quả và chọn trường thế nào cho khôn ngoan?</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong className="text-emerald-400">Xanh lá (An toàn)</strong>: điểm của con dư khá nhiều so với điểm chuẩn — yên tâm đăng ký.</li>
                  <li><strong className="text-blue-400">Xanh dương (Cạnh tranh)</strong>: điểm ở mức vừa đủ — có thể đặt ở NV1 nếu thật sự thích trường này.</li>
                  <li><strong className="text-amber-400">Vàng / <span className="text-rose-400">Đỏ</span> (Rủi ro)</strong>: điểm đang thấp hơn điểm chuẩn — chỉ nên liều ở NV1, tuyệt đối không đặt ở NV2, NV3.</li>
                  <li>Nguyên tắc vàng: <strong>NV1 chọn trường mơ ước vừa tầm, NV2 chọn trường chắc ăn hơn, NV3 phải là trường chắc chắn đỗ.</strong></li>
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
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🛡️ 1. Ba phương án — chọn theo tính cách và hoàn cảnh của con</h3>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>An Toàn</strong> 🛡️: cả 3 nguyện vọng đều bám sát sức học hiện tại — NV1 cao nhất, NV2 và NV3 thấp dần để luôn có đường lui. Phù hợp với đa số học sinh.</li>
                  <li><strong>Nỗ Lực</strong> 🔥: dành cho con đang quyết tâm bứt phá — NV1 là trường mơ ước (dù khó), NV2 vừa sức, NV3 thật chắc chắn để làm lưới an toàn.</li>
                  <li><strong>Phòng Thủ</strong> 🏰: dành cho gia đình muốn chắc chắn 100% con có chỗ học công lập — cả NV1 cũng đã chọn trường dễ đỗ, NV2 và NV3 càng chắc hơn nữa.</li>
                </ul>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📍 2. Vì sao trường gần nhà được ưu tiên?</h3>
                <p className="m-0">Ba năm cấp 3, mỗi ngày đi học 2 lượt — trường gần nhà giúp con <strong>đỡ vất vả, an toàn hơn và có thêm thời gian nghỉ ngơi, học tập</strong>. Vì vậy khi hai trường có chất lượng tương đương, hệ thống sẽ xếp trường gần nhà lên trên.</p>
              </section>
              <section className="bg-slate-950/30 p-4 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🚗 3. Khi quanh nhà không đủ trường phù hợp thì sao?</h3>
                <p className="m-0">Nếu trong bán kính bạn chọn không tìm đủ trường tốt để xếp 3 nguyện vọng, hệ thống sẽ <strong>tự động mở rộng phạm vi tìm kiếm</strong> và hiển thị thông báo rõ ràng để bạn biết và cân nhắc lại quãng đường đi học.</p>
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
          loadSchools(searchQuery, selectedDistricts.join(','));
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
            {printTarget === 'school'
              ? '🏫 Hồ sơ trường THPT'
              : printTarget === 'compare'
              ? '📊 So sánh trường THPT'
              : '📋 Kết quả phân tích nguyện vọng lớp 10 TP.HCM'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6b7280' }}>
            Hệ thống AdmissionDecisionEngine • In ngày {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* ── SCHOOL PROFILE ─────────────────────────────────────────────── */}
        {printTarget === 'school' && schoolDetail && (
          <div>
            <h2 className="print-section-title">{schoolDetail.name}</h2>

            <div className="print-card" style={{ marginBottom: 12, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
              <div style={{ fontSize: 10, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>📍 Quận/Huyện: <strong>{schoolDetail.district?.name || 'TP.HCM'}</strong></span>
                <span>🏫 Địa chỉ: <strong>{schoolDetail.address || 'Chưa cập nhật'}</strong></span>
                {schoolDetail.website && <span>🌐 Website: <strong>{schoolDetail.website}</strong></span>}
              </div>
            </div>

            {schoolDetail.description && (
              <div className="print-card" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 900, color: '#3730a3', marginBottom: 4, fontSize: 10 }}>📝 Giới thiệu chung</div>
                <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.6 }}>{schoolDetail.description}</div>
              </div>
            )}

            {schoolDetail.activities && (
              <div className="print-card" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 900, color: '#3730a3', marginBottom: 4, fontSize: 10 }}>🎭 Hoạt động & Phong trào</div>
                <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.6 }}>{schoolDetail.activities}</div>
              </div>
            )}

            {schoolDetail.cutoffs?.length > 0 && (
              <div className="print-card" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 900, color: '#3730a3', marginBottom: 6, fontSize: 10 }}>📈 Điểm chuẩn qua các năm</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: '#eef2ff', color: '#3730a3' }}>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe', textAlign: 'left' }}>Năm học</th>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe' }}>Nguyện vọng 1</th>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe' }}>Nguyện vọng 2</th>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe' }}>Nguyện vọng 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolDetail.cutoffs.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', fontWeight: 700 }}>{formatSchoolYear(item.year)}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', textAlign: 'center', fontWeight: 700, color: '#4338ca' }}>{item.cutoffNV1 ? `${item.cutoffNV1}đ` : '—'}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', textAlign: 'center' }}>{item.cutoffNV2 ? `${item.cutoffNV2}đ` : '—'}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', textAlign: 'center' }}>{item.cutoffNV3 ? `${item.cutoffNV3}đ` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {schoolDetail.quotas?.length > 0 && (
              <div className="print-card">
                <div style={{ fontWeight: 900, color: '#3730a3', marginBottom: 6, fontSize: 10 }}>🎯 Chỉ tiêu & Tỷ lệ chọi</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: '#eef2ff', color: '#3730a3' }}>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe', textAlign: 'left' }}>Năm học</th>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe' }}>Chỉ tiêu</th>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe' }}>Số đăng ký NV1</th>
                      <th style={{ padding: 6, border: '1px solid #c7d2fe' }}>Tỷ lệ chọi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolDetail.quotas.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', fontWeight: 700 }}>{formatSchoolYear(item.year)}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', textAlign: 'center' }}>{item.quota || '—'}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', textAlign: 'center' }}>{item.registeredCount ? item.registeredCount.toLocaleString() : '—'}</td>
                        <td style={{ padding: 6, border: '1px solid #e0e7ff', textAlign: 'center', fontWeight: 700, color: '#dc2626' }}>{item.competitionRatio || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── COMPARE SCHOOLS ────────────────────────────────────────────── */}
        {printTarget === 'compare' && compareList.length > 0 && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ background: '#eef2ff', color: '#3730a3' }}>
                  <th style={{ padding: 6, border: '1px solid #c7d2fe', textAlign: 'left', width: 120 }}>Tiêu chí</th>
                  {compareList.map((school) => (
                    <th key={school.id} style={{ padding: 6, border: '1px solid #c7d2fe', textAlign: 'left' }}>{school.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  ['Quận/Huyện', (s: G10SchoolItem) => s.district?.name || 'TP.HCM'],
                  ['Địa chỉ', (s: G10SchoolItem) => s.address || 'Chưa cập nhật'],
                  [`Điểm NV1 (${formatSchoolYear(compareList[0]?.latestYear)})`, (s: G10SchoolItem) => s.latestCutoffNV1 ? `${s.latestCutoffNV1}đ` : '—'],
                  ['Điểm NV2', (s: G10SchoolItem) => s.latestCutoffNV2 ? `${s.latestCutoffNV2}đ` : '—'],
                  ['Điểm NV3', (s: G10SchoolItem) => s.latestCutoffNV3 ? `${s.latestCutoffNV3}đ` : '—'],
                  ['Website', (s: G10SchoolItem) => s.website || '—'],
                ] as [string, (s: G10SchoolItem) => string][]).map(([label, getValue]) => (
                  <tr key={label}>
                    <td style={{ padding: 6, border: '1px solid #e0e7ff', fontWeight: 700, color: '#3730a3' }}>{label}</td>
                    {compareList.map((school) => (
                      <td key={school.id} style={{ padding: 6, border: '1px solid #e0e7ff' }}>{getValue(school)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── SECTION 1: Đánh Giá Cá Nhân ─────────────────────────────────── */}
        {printTarget === 'results' && evaluationResult && (
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
                {preferredDistricts.length > 0 && (
                  <span>Quận ưu tiên: <strong>{preferredDistricts.map(id => districts.find((d: any) => String(d.id) === String(id))?.name).filter(Boolean).join(', ')}</strong></span>
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
        {printTarget === 'results' && comboResult && (
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
                  <span>Trường mơ ước NV1: <strong>{(allSchools.length > 0 ? allSchools : schools).find((s) => s.code === dreamSchoolCode)?.name ?? ''}</strong></span>
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
                safe: '🛡️ Phương Án An Toàn — Phân bổ 3 NV theo điểm chuẩn trung bình dự đoán',
                effort: '🔥 Phương Án Nỗ Lực — Đặt trường mơ ước lên NV1 làm mục tiêu chính',
                defense: '🏰 Phương Án Phòng Thủ — Chắc chắn có suất công lập gần nhà làm điểm tựa',
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
