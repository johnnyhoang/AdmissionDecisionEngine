export declare class GetRecommendationDto {
    math: number;
    literature: number;
    english: number;
    priority?: number;
    bonus?: number;
    preferredDistrict?: string;
    targetNV?: string;
}
export declare class GetComboRecommendationDto {
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
}
