import ComboFiltersPanel from './ComboFiltersPanel';
import ComboResultsPanel from './ComboResultsPanel';
import type {
  G10ComboResult,
  G10ComboStrategy,
  G10SchoolItem,
} from '../../../services/api';

interface ComboRecommendationPanelProps {
  schools: G10SchoolItem[];
  allSchools: G10SchoolItem[];
  districts: Array<{ id: string; name: string }>;
  comboResult: G10ComboResult | null;
  isComboLoading: boolean;
  selectedStrategy: G10ComboStrategy;
  onSelectedStrategyChange: (strategy: G10ComboStrategy) => void;
  comboSelectionMode: 'distance' | 'district';
  onComboSelectionModeChange: (mode: 'distance' | 'district') => void;
  minMath: string;
  maxMath: string;
  minLiterature: string;
  maxLiterature: string;
  minEnglish: string;
  maxEnglish: string;
  priorityScore: string;
  dreamSchoolCode: string;
  maxCommuteDistance: string;
  comboGPS: { lat: number; lon: number } | null;
  comboUserAddress: string;
  comboDistrictIds: string[];
  onMinMathChange: (value: string) => void;
  onMaxMathChange: (value: string) => void;
  onMinLiteratureChange: (value: string) => void;
  onMaxLiteratureChange: (value: string) => void;
  onMinEnglishChange: (value: string) => void;
  onMaxEnglishChange: (value: string) => void;
  onPriorityScoreChange: (value: string) => void;
  onDreamSchoolCodeChange: (value: string) => void;
  onMaxCommuteDistanceChange: (value: string) => void;
  onToggleComboDistrict: (districtId: string) => void;
  onClearComboDistricts: () => void;
  onRequestHomeLocation: () => void;
  onClearComboLocation: () => void;
  onRunCombo: () => void;
  onPrintResults: () => void;
  onOpenSchoolDetail: (schoolId: string) => void;
  onOpenHelp: () => void;
}

export default function ComboRecommendationPanel({
  schools,
  allSchools,
  districts,
  comboResult,
  isComboLoading,
  selectedStrategy,
  onSelectedStrategyChange,
  comboSelectionMode,
  onComboSelectionModeChange,
  minMath,
  maxMath,
  minLiterature,
  maxLiterature,
  minEnglish,
  maxEnglish,
  priorityScore,
  dreamSchoolCode,
  maxCommuteDistance,
  comboGPS,
  comboUserAddress,
  comboDistrictIds,
  onMinMathChange,
  onMaxMathChange,
  onMinLiteratureChange,
  onMaxLiteratureChange,
  onMinEnglishChange,
  onMaxEnglishChange,
  onPriorityScoreChange,
  onDreamSchoolCodeChange,
  onMaxCommuteDistanceChange,
  onToggleComboDistrict,
  onClearComboDistricts,
  onRequestHomeLocation,
  onClearComboLocation,
  onRunCombo,
  onPrintResults,
  onOpenSchoolDetail,
  onOpenHelp,
}: ComboRecommendationPanelProps) {
  return (
    <div className="max-w-7xl w-full mx-auto p-4 pb-28 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <ComboFiltersPanel
        schools={schools}
        allSchools={allSchools}
        districts={districts}
        comboSelectionMode={comboSelectionMode}
        minMath={minMath}
        maxMath={maxMath}
        minLiterature={minLiterature}
        maxLiterature={maxLiterature}
        minEnglish={minEnglish}
        maxEnglish={maxEnglish}
        priorityScore={priorityScore}
        dreamSchoolCode={dreamSchoolCode}
        maxCommuteDistance={maxCommuteDistance}
        comboGPS={comboGPS}
        comboUserAddress={comboUserAddress}
        comboDistrictIds={comboDistrictIds}
        isComboLoading={isComboLoading}
        onComboSelectionModeChange={onComboSelectionModeChange}
        onMinMathChange={onMinMathChange}
        onMaxMathChange={onMaxMathChange}
        onMinLiteratureChange={onMinLiteratureChange}
        onMaxLiteratureChange={onMaxLiteratureChange}
        onMinEnglishChange={onMinEnglishChange}
        onMaxEnglishChange={onMaxEnglishChange}
        onPriorityScoreChange={onPriorityScoreChange}
        onDreamSchoolCodeChange={onDreamSchoolCodeChange}
        onMaxCommuteDistanceChange={onMaxCommuteDistanceChange}
        onToggleComboDistrict={onToggleComboDistrict}
        onClearComboDistricts={onClearComboDistricts}
        onRequestHomeLocation={onRequestHomeLocation}
        onClearComboLocation={onClearComboLocation}
        onRunCombo={onRunCombo}
        onOpenHelp={onOpenHelp}
      />

      <ComboResultsPanel
        comboResult={comboResult}
        isComboLoading={isComboLoading}
        selectedStrategy={selectedStrategy}
        maxCommuteDistance={maxCommuteDistance}
        onSelectedStrategyChange={onSelectedStrategyChange}
        onPrintResults={onPrintResults}
        onOpenSchoolDetail={onOpenSchoolDetail}
      />
    </div>
  );
}
