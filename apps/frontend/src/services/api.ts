const API_BASE_URL = 'http://localhost:3000/api/v1';

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
  probabilityCategory: 'SAFE' | 'MATCH' | 'REACH' | 'LOW';
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

export const fetchUniversities = async (search = '', city = ''): Promise<{ items: UniversityItem[] }> => {
  const url = new URL(`${API_BASE_URL}/universities`);
  if (search) url.searchParams.append('search', search);
  if (city) url.searchParams.append('city', city);
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Không thể tải danh sách trường đại học');
  return res.json();
};

export const fetchMajors = async (): Promise<MajorItem[]> => {
  const res = await fetch(`${API_BASE_URL}/majors`);
  if (!res.ok) throw new Error('Không thể tải danh sách ngành học');
  return res.json();
};

export const fetchMajorAnalytics = async (code: string): Promise<Array<{ year: number; avgBenchmark: number }>> => {
  const res = await fetch(`${API_BASE_URL}/majors/${code}/analytics`);
  if (!res.ok) throw new Error('Không thể tải dữ liệu điểm chuẩn lịch sử');
  return res.json();
};

export const evaluateProfile = async (profileData: any): Promise<RecommendationResult[]> => {
  const res = await fetch(`${API_BASE_URL}/recommendations/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  });
  if (!res.ok) throw new Error('Đánh giá hồ sơ thất bại');
  return res.json();
};

export const triggerSeedData = async (): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/admin/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Seeding database failed');
};

export const optimizePreferences = async (profile: any, preferences: any[]): Promise<{ optimizedList: any[]; warnings: string[] }> => {
  const res = await fetch(`${API_BASE_URL}/recommendations/optimize-preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, preferences }),
  });
  if (!res.ok) throw new Error('Tối ưu nguyện vọng thất bại');
  return res.json();
};

export const chatWithAi = async (message: string): Promise<{ reply: string; data?: any }> => {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('AI Assistant phản hồi thất bại');
  return res.json();
};
