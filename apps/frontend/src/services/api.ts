import { supabase } from "./supabase";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

async function apiFetch(url: string | URL, options: RequestInit = {}) {
  const session = (await supabase.auth.getSession()).data.session;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as any),
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return window.fetch(url.toString(), {
    ...options,
    headers,
  });
}

export interface UniversityItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  logoUrl: string;
  description: string;
  website: string;
  globalRanking: number;
  localRanking: number;
  averageTuition: number;
  isPublic: boolean;
  campuses: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
  }>;
}

export interface RecommendationResult {
  programId: string;
  programCode: string;
  programName: string;
  universityCode: string;
  universityName: string;
  campusName: string;
  tuitionFee: number;
  language: string;
  admissionMethod: string;
  candidateScore: number;
  benchmarkScoreLastYear: number;
  minScoreThreshold: number;
  admissionProbability: number;
  probabilityCategory: "SAFE" | "MATCH" | "REACH" | "LOW";
  explanation: string;
  breakdown: {
    rawScore: number;
    priorityBonus: number;
    regionBonus: number;
    policyBonus: number;
    certificateBonus: number;
  };
}

export interface MajorItem {
  id: string;
  code: string;
  nameVi: string;
  nameEn: string;
  sector: string;
  description: string;
}

export const fetchUniversities = async (
  search = "",
  city = "",
): Promise<{ items: UniversityItem[] }> => {
  const url = new URL(`${API_BASE_URL}/universities`);
  if (search) url.searchParams.append("search", search);
  if (city) url.searchParams.append("city", city);

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error("Không thể tải danh sách trường đại học");
  return res.json();
};

export const fetchMajors = async (): Promise<MajorItem[]> => {
  const res = await apiFetch(`${API_BASE_URL}/majors`);
  if (!res.ok) throw new Error("Không thể tải danh sách ngành học");
  return res.json();
};

export const fetchMajorAnalytics = async (
  code: string,
): Promise<Array<{ year: number; avgBenchmark: number }>> => {
  const res = await apiFetch(`${API_BASE_URL}/majors/${code}/analytics`);
  if (!res.ok) throw new Error("Không thể tải dữ liệu điểm chuẩn lịch sử");
  return res.json();
};

export const evaluateProfile = async (
  profileData: any,
): Promise<RecommendationResult[]> => {
  const res = await apiFetch(`${API_BASE_URL}/recommendations/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error("Đánh giá hồ sơ thất bại");
  return res.json();
};

/** @deprecated - REMOVED: Old seed function wiped all data. Use import pipeline instead. */
export const triggerSeedData = async (): Promise<void> => {
  // This function is intentionally disabled to prevent data loss.
  // To add data, use the import pipeline at /import endpoint.
  console.warn("triggerSeedData is disabled - use import pipeline instead");
};

export const optimizePreferences = async (
  profile: any,
  preferences: any[],
): Promise<{ optimizedList: any[]; warnings: string[] }> => {
  const res = await apiFetch(
    `${API_BASE_URL}/recommendations/optimize-preferences`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, preferences }),
    },
  );
  if (!res.ok) throw new Error("Tối ưu nguyện vọng thất bại");
  return res.json();
};

export const chatWithAi = async (
  message: string,
): Promise<{ reply: string; data?: any }> => {
  const res = await apiFetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("AI Assistant phản hồi thất bại");
  return res.json();
};

export const fetchAdminStats = async (): Promise<{
  universities: number;
  campuses: number;
  majors: number;
  programs: number;
  methods: number;
  rules: number;
  scores: number;
  histories: number;
}> => {
  const res = await apiFetch(`${API_BASE_URL}/admin/stats`);
  if (!res.ok) throw new Error("Không thể tải thống kê admin");
  return res.json();
};

export const fetchAdminHistories = async (): Promise<any[]> => {
  const res = await apiFetch(`${API_BASE_URL}/admin/histories`);
  if (!res.ok) throw new Error("Không thể tải nhật ký lịch sử");
  return res.json();
};

export interface ImportPresetItem {
  filename: string;
  sourceName: string;
  sourceUrl?: string;
  dataYear: number;
  universitiesCount: number;
  programsCount: number;
  scoresCount: number;
}

export interface ImportHistoryItem {
  id: string;
  sourceName: string;
  sourceUrl?: string;
  dataYear: number;
  universitiesCount: number;
  programsCount: number;
  scoresCount: number;
  duplicatesSkipped: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const fetchImportPresets = async (): Promise<ImportPresetItem[]> => {
  const res = await apiFetch(`http://localhost:3000/import/presets`);
  if (!res.ok) throw new Error("Không thể tải danh sách presets");
  return res.json();
};

export const runImportPreset = async (filename: string): Promise<any> => {
  const res = await apiFetch(
    `http://localhost:3000/import/presets/${filename}/run`,
    {
      method: "POST",
    },
  );
  if (!res.ok) throw new Error(`Lỗi khi đồng bộ tệp preset: ${filename}`);
  return res.json();
};

export const fetchImportHistory = async (): Promise<ImportHistoryItem[]> => {
  const res = await apiFetch(`http://localhost:3000/import/history`);
  if (!res.ok) throw new Error("Không thể tải nhật ký import");
  return res.json();
};

export const triggerImportPayload = async (payload: any): Promise<any> => {
  const res = await apiFetch(`http://localhost:3000/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Import dữ liệu thất bại");
  return res.json();
};

// ==========================================
// GRADE 10 HCMC ADMISSION MODULE APIs
// ==========================================

export interface G10SchoolDistrictSummary {
  id: string;
  name: string;
  code: string;
}

export interface G10SchoolSummary {
  id: string;
  name: string;
  code: string;
  address?: string;
  website?: string;
  schoolType: string;
  isActive: boolean;
  isVerified?: boolean;
  latitude?: number;
  longitude?: number;
  latestCutoffNV1?: number;
  latestCutoffNV2?: number;
  latestCutoffNV3?: number;
  latestYear?: number;
  latestQuota?: number;
  latestRegisteredCount?: number;
  latestCompetitionRatio?: number;
  latestQuotaYear?: number;
  dataCompleteness?: {
    percent: number;
    completedFields: number;
    totalFields: number;
  };
  straightDistanceKm?: number;
  roadDistanceKm?: number;
  roadDurationMin?: number;
  distanceSource?: string;
  distancePrecision?: string;
  district?: G10SchoolDistrictSummary;
}

export interface G10SchoolItem extends G10SchoolSummary {}

export interface G10SchoolHistoryItem {
  id: string;
  year: number;
  programType?: string;
  cutoffNV1?: number | null;
  cutoffNV2?: number | null;
  cutoffNV3?: number | null;
  lowestScore?: number | null;
  highestScore?: number | null;
  notes?: string | null;
  changes?: string | null;
  dataSource?: string | null;
}

export interface G10QuotaHistoryItem {
  id: string;
  year: number;
  quota: number;
  registeredCount?: number | null;
  competitionRatio?: number | null;
  programType?: string;
}

export interface G10RecommendationItem {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  districtName: string;
  cutoffNV1: number;
  cutoffNV2: number | null;
  cutoffNV3: number | null;
  diff: number;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  nv2Gap: number | null;
  nv3Gap: number | null;
  safetyCategory: "VERY_SAFE" | "SAFE" | "COMPETITIVE" | "RISKY" | "VERY_RISKY";
  trend: "UP" | "DOWN" | "STABLE";
  probability: number;
  historicalAvg: number;
  advice: string;
  adviceNV1?: string;
  adviceNV2?: string;
  adviceNV3?: string;
  last3YearsScores: { year: number; score: number }[];
}

export interface G10RecommendationResult {
  candidateScore: number;
  details: {
    math: number;
    literature: number;
    english: number;
    priority: number;
    bonus: number;
  };
  recommendations: G10RecommendationItem[];
}

export interface G10SchoolDetail extends G10SchoolItem {
  comments?: string | null;
  description?: string | null;
  activities?: string | null;
  regulations?: string | null;
  mapUrl?: string | null;
  cutoffs?: G10SchoolHistoryItem[];
  quotas?: G10QuotaHistoryItem[];
  cutoffScores: G10SchoolHistoryItem[];
  quotaHistory: G10QuotaHistoryItem[];
}

export interface G10LocationResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string | null;
  mapUrl?: string | null;
  source: string;
  precision: "exact" | "approximate";
}

export const resolveG10Location = async (payload: {
  name?: string;
  address?: string;
  districtName?: string;
  mapUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
}): Promise<G10LocationResult> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/location/geocode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Không thể xác định tọa độ địa lý");
  return res.json();
};

export const reverseG10Location = async (payload: {
  latitude: number;
  longitude: number;
}): Promise<G10LocationResult> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/location/reverse-geocode`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error("Không thể xác định địa chỉ từ tọa độ");
  return res.json();
};

export const searchG10Locations = async (payload: {
  query: string;
  limit?: number;
}): Promise<G10LocationResult[]> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/location/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Không thể tìm địa chỉ phù hợp");
  return res.json();
};

export const fetchNearbyG10Schools = async (payload: {
  userLat: number;
  userLon: number;
  limit?: number;
  maxDistanceKm?: number;
  search?: string;
  districtId?: string;
}): Promise<{ items: G10SchoolItem[]; total: number }> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/location/nearby-schools`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error("Không thể tải danh sách trường gần nhất");
  return res.json();
};

export const fetchG10TravelPoints = async (payload: {
  origin: {
    name?: string;
    address?: string;
    districtName?: string;
    mapUrl?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  points: Array<{
    id?: string;
    name?: string;
    address?: string;
    districtName?: string;
    latitude?: number | null;
    longitude?: number | null;
    mapUrl?: string | null;
  }>;
}): Promise<
  Array<
    G10SchoolItem & {
      straightDistanceKm?: number;
      roadDistanceKm?: number;
      roadDurationMin?: number;
      distanceSource?: string;
    }
  >
> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/location/travel-points`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error("Không thể tính khoảng cách di chuyển");
  return res.json();
};

export const fetchG10Schools = async (
  search = "",
  districtId = "",
  limit?: number,
  includeDataCompleteness?: boolean,
): Promise<{ items: G10SchoolItem[]; total: number }> => {
  const url = new URL(`${API_BASE_URL}/grade10-hcm/schools`);
  if (search) url.searchParams.append("search", search);
  if (districtId) url.searchParams.append("districtId", districtId);
  if (limit) url.searchParams.append("limit", String(limit));
  if (includeDataCompleteness)
    url.searchParams.append("includeDataCompleteness", "true");
  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error("Không thể tải danh sách trường THPT");
  return res.json();
};

/** Load ALL schools (no pagination) for use in dropdown selectors. */
export const fetchG10AllSchools = async (): Promise<G10SchoolItem[]> => {
  const url = new URL(`${API_BASE_URL}/grade10-hcm/schools`);
  url.searchParams.append("limit", "500");
  url.searchParams.append("page", "1");
  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error("Không thể tải danh sách trường THPT");
  const data = await res.json();
  return data.items ?? data;
};

export const fetchG10SchoolDetail = async (
  id: string,
): Promise<G10SchoolDetail> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/schools/${id}`);
  if (!res.ok) throw new Error("Không thể tải chi tiết trường THPT");
  return res.json();
};

export const fetchG10SchoolByCode = async (
  code: string,
): Promise<G10SchoolDetail> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/schools/code/${encodeURIComponent(code)}`,
  );
  if (!res.ok) throw new Error(`Không tìm thấy trường: ${code}`);
  return res.json();
};

export const fetchG10Districts = async (): Promise<any[]> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/schools/districts`);
  if (!res.ok) throw new Error("Không thể tải danh sách quận/huyện");
  return res.json();
};

export const fetchG10Analytics = async (): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/schools/analytics`);
  if (!res.ok) throw new Error("Không thể tải phân tích tuyển sinh lớp 10");
  return res.json();
};

export const fetchG10AdminStats = async (): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/schools/admin-stats`);
  if (!res.ok) throw new Error("Không thể tải số liệu admin lớp 10");
  return res.json();
};

export const calculateG10Score = async (scores: {
  math: number;
  literature: number;
  english: number;
  priority?: number;
  bonus?: number;
}): Promise<{ finalScore: number }> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scores),
  });
  if (!res.ok) throw new Error("Tính điểm thi lớp 10 thất bại");
  return res.json();
};

export const getG10ComboRecommendations = async (payload: {
  minMath: number;
  maxMath: number;
  minLiterature: number;
  maxLiterature: number;
  minEnglish: number;
  maxEnglish: number;
  priority?: number;
  bonus?: number;
  userLat?: number;
  userLon?: number;
  dreamSchoolCode?: string;
  maxCommuteDistance?: number;
  selectionMode?: "distance" | "district";
  preferredDistricts?: string[];
}): Promise<any> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/recommendation/combo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error("Không thể tải đề xuất combo nguyện vọng");
  return res.json();
};

export const getG10MacroConfig = async (): Promise<any> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/recommendation/macro-config`,
  );
  if (!res.ok) throw new Error("Không thể tải cấu hình vĩ mô");
  return res.json();
};

export const updateG10MacroConfig = async (payload: any): Promise<any> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/recommendation/macro-config`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) throw new Error("Không thể cập nhật cấu hình vĩ mô");
  return res.json();
};

export const evaluateG10Profile = async (payload: {
  math: number;
  literature: number;
  english: number;
  priority?: number;
  bonus?: number;
  preferredDistricts?: string[];
  targetNV?: string;
}): Promise<G10RecommendationResult> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/recommendation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gợi ý trường lớp 10 thất bại");
  return res.json();
};

export const fetchG10ImportPresets = async (): Promise<any[]> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/admin/presets`);
  if (!res.ok) throw new Error("Không thể tải presets lớp 10");
  return res.json();
};

export const runG10ImportPreset = async (filename: string): Promise<any> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/admin/presets/${filename}/run`,
    {
      method: "POST",
    },
  );
  if (!res.ok)
    throw new Error(`Đồng bộ dữ liệu lớp 10 thất bại cho tệp: ${filename}`);
  return res.json();
};

export const fetchG10ImportHistory = async (): Promise<any[]> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/admin/imports/history`,
  );
  if (!res.ok) throw new Error("Không thể tải lịch sử import lớp 10");
  return res.json();
};

export const triggerG10ImportPayload = async (payload: any): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/admin/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Gửi import payload lớp 10 thất bại");
  return res.json();
};

export interface G10ActivityLogFilters {
  page?: number;
  pageSize?: number;
  module?: "calculator" | "combo";
  userId?: string;
  from?: string;
  to?: string;
}

export const fetchG10ActivityLogs = async (
  filters: G10ActivityLogFilters = {},
): Promise<any> => {
  const url = new URL(`${API_BASE_URL}/grade10-hcm/admin/activity-logs`);
  if (filters.page) url.searchParams.append("page", filters.page.toString());
  if (filters.pageSize)
    url.searchParams.append("pageSize", filters.pageSize.toString());
  if (filters.module) url.searchParams.append("module", filters.module);
  if (filters.userId) url.searchParams.append("userId", filters.userId);
  if (filters.from) url.searchParams.append("from", filters.from);
  if (filters.to) url.searchParams.append("to", filters.to);

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error("Không thể tải nhật ký hoạt động");
  return res.json();
};

export const fetchG10ActivityLogStats = async (): Promise<any> => {
  const res = await apiFetch(
    `${API_BASE_URL}/grade10-hcm/admin/activity-logs/stats`,
  );
  if (!res.ok) throw new Error("Không thể tải thống kê hoạt động");
  return res.json();
};

export const searchAiCutoffs = async (payload: {
  type: "GRADE10" | "UNIVERSITY";
  schoolQuery: string;
  majorQuery?: string;
  schoolCode?: string;
  districtName?: string;
  districtCode?: string;
}): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/ai/search-cutoffs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "AI tìm kiếm điểm chuẩn thất bại.");
  }
  return res.json();
};

export const importAiCutoffs = async (payload: {
  type: "GRADE10" | "UNIVERSITY";
  schoolCode: string;
  majorCode?: string;
  districtName?: string;
  overrides: any[];
  address?: string;
  website?: string;
  description?: string;
  activities?: string;
  regulations?: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
}): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/ai/import-cutoffs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Nhập đè điểm chuẩn từ AI thất bại.");
  }
  return res.json();
};

export const fetchGrade10SchoolNames = async (
  q?: string,
): Promise<
  {
    id: string;
    name: string;
    code: string;
    districtName?: string;
    districtCode?: string;
  }[]
> => {
  const url = q
    ? `${API_BASE_URL}/grade10-hcm/schools/names?q=${encodeURIComponent(q)}`
    : `${API_BASE_URL}/grade10-hcm/schools/names`;
  const res = await apiFetch(url);
  if (!res.ok) return [];
  return res.json();
};

export const seedAllGrade10Schools = async (): Promise<{
  created: number;
  skipped: number;
}> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/schools/seed-all`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Seed all schools thất bại");
  return res.json();
};

export const fetchUserProfile = async (): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/auth/profile`);
  if (!res.ok) throw new Error("Không thể lấy thông tin profile");
  return res.json();
};

export const fetchAdminUsers = async (): Promise<any[]> => {
  const res = await apiFetch(`${API_BASE_URL}/admin/users`);
  if (!res.ok) throw new Error("Không thể tải danh sách người dùng");
  return res.json();
};

export const updateUserRole = async (
  userId: string,
  role: string,
): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Không thể cập nhật chức vụ người dùng");
  return res.json();
};

export const updateUserPermissions = async (
  userId: string,
  permissions: any[],
): Promise<any> => {
  const res = await apiFetch(
    `${API_BASE_URL}/admin/users/${userId}/permissions`,
    {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    },
  );
  if (!res.ok) throw new Error("Không thể cập nhật phân quyền người dùng");
  return res.json();
};

export const mergeG10Schools = async (
  primaryId: string,
  secondaryId: string,
  mergedData: any,
): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/schools/merge`, {
    method: "POST",
    body: JSON.stringify({ primaryId, secondaryId, mergedData }),
  });
  if (!res.ok) throw new Error("Không thể merge trường");
  return res.json();
};

export const updateG10School = async (id: string, data: any): Promise<any> => {
  const res = await apiFetch(`${API_BASE_URL}/grade10-hcm/schools/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Không thể cập nhật trường");
  return res.json();
};
