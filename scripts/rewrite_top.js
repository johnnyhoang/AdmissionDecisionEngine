/**
 * rewrite_top.js
 * Replaces the entire import block and state declaration section of Grade10Container.tsx
 * with a clean, TypeScript-strict-compliant version.
 * All logic functions (handlers, effects) and JSX are preserved as-is.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
const raw = fs.readFileSync(filePath, 'utf8');

// Find the anchor where state declarations end and actual logic begins
// We'll replace everything from start up to and including the } of the first useEffect
const anchorStart = raw.indexOf('import { useState, useEffect } from \'react\';');
const anchorEnd = raw.indexOf('  const loadDistricts = async');

if (anchorStart === -1) {
  console.error('ERROR: Cannot find start anchor');
  process.exit(1);
}
if (anchorEnd === -1) {
  console.error('ERROR: Cannot find end anchor');
  process.exit(1);
}

const newTop = `import { useState, useEffect } from 'react';
import {
  Search as SearchIcon, TrendingUp, Calculator as CalcIcon, MapPin,
  BadgeCheck, School, HelpCircle, Sparkles, ArrowUpDown,
  BarChart2, BookOpen, Sliders, Award, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  fetchG10Schools, fetchG10SchoolDetail, fetchG10Districts,
  fetchG10Analytics, evaluateG10Profile, getG10ComboRecommendations,
  getG10MacroConfig, updateG10MacroConfig
} from '../../services/api';
import type { G10SchoolItem, G10RecommendationItem } from '../../services/api';
import AiSearchModal from '../../components/AiSearchModal';
import MergeSchoolModal from './components/MergeSchoolModal';
import EditSchoolModal from './components/EditSchoolModal';
import CompareDrawer from './components/CompareDrawer';
import { updateG10School } from '../../services/api';
import { mergeG10Schools } from '../../services/api';
import { getCurrentSchoolYear, formatSchoolYear } from '../../utils/date';
import { useAuth } from '../../context/AuthContext';

export default function Grade10Container() {
  // ── UI States ──────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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

  // ── Macro configuration states (admin SSF config) ─────────────────────────
  const [macroConfig, setMacroConfig] = useState<any>(null);
  const [macroExamineesPrev, setMacroExamineesPrev] = useState('');
  const [macroExamineesCurr, setMacroExamineesCurr] = useState('');
  const [macroQuotasPrev, setMacroQuotasPrev] = useState('');
  const [macroQuotasCurr, setMacroQuotasCurr] = useState('');
  const [macroDifficulty, setMacroDifficulty] = useState('medium');
  const [isSavingMacro, setIsSavingMacro] = useState(false);

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

  `;

const after = raw.slice(anchorEnd);
const result = newTop + after;

fs.writeFileSync(filePath, result, 'utf8');
console.log('✅ Rewrote top section of Grade10Container.tsx cleanly');
console.log(`   Original length: ${raw.length} chars`);
console.log(`   New length: ${result.length} chars`);
