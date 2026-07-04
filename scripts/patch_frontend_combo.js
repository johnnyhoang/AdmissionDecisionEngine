const fs = require('fs');
const path = require('path');

// 1. Patch api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('getG10ComboRecommendations')) {
  const comboApi = `
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
}): Promise<any> => {
  const res = await apiFetch(\`\${API_BASE_URL}/grade10-hcm/recommendation/combo\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Không thể tải đề xuất combo nguyện vọng');
  return res.json();
};
`;
  apiContent = apiContent.replace(
    "export const evaluateG10Profile = async",
    comboApi + "\nexport const evaluateG10Profile = async"
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// 2. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// Update activeTab type and include getG10ComboRecommendations import
containerContent = containerContent.replace(
  "fetchG10Analytics, evaluateG10Profile, fetchG10AdminStats, seedAllGrade10Schools",
  "fetchG10Analytics, evaluateG10Profile, fetchG10AdminStats, seedAllGrade10Schools, getG10ComboRecommendations"
);

containerContent = containerContent.replace(
  "useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance'>('dashboard');",
  "useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance' | 'combo'>('dashboard');"
);

// Add combo states
const comboStates = `
  // Combo recommendation states
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
`;

containerContent = containerContent.replace(
  "const [isLocating, setIsLocating] = useState(false);",
  "const [isLocating, setIsLocating] = useState(false);" + comboStates
);

// Add combo logic
const comboLogic = `
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

  const handleGetCombo = async () => {
    setIsComboLoading(true);
    try {
      let lat = comboGPS?.lat;
      let lon = comboGPS?.lon;
      
      // If address is entered but not current position, geocode it
      if (comboUserAddress && comboUserAddress !== 'Tọa độ hiện tại của bạn' && !comboGPS) {
        const q = encodeURIComponent(comboUserAddress + ', Hồ Chí Minh');
        const res = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${q}&format=json&limit=1\`);
        const data = await res.json();
        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      }

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
      });

      // Calculate driving distance for combos using OSRM if coords are available
      if (lat && lon) {
        const fetchRoadDistance = async (comboList: any[]) => {
          if (!comboList || comboList.length === 0) return comboList;
          try {
            const valid = comboList.filter(s => s.latitude && s.longitude);
            if (valid.length === 0) return comboList;
            const coordsString = valid.map(s => \`\${s.longitude},\${s.latitude}\`).join(';');
            const url = \`https://router.project-osrm.org/table/v1/driving/\${lon},\${lat};\${coordsString}?sources=0\`;
            const osrmRes = await fetch(url);
            const osrmData = await osrmRes.json();
            if (osrmData && osrmData.code === 'Ok' && osrmData.distances) {
              const distances = osrmData.distances[0];
              const durations = osrmData.durations[0];
              return comboList.map((s, idx) => ({
                ...s,
                roadDistance: distances[idx + 1] ? parseFloat((distances[idx + 1] / 1000).toFixed(2)) : s.distance,
                roadDuration: durations[idx + 1] ? Math.round(durations[idx + 1] / 60) : Math.round(s.distance * 2)
              }));
            }
          } catch (e) {
            console.error(e);
          }
          return comboList.map(s => ({ ...s, roadDistance: s.distance, roadDuration: Math.round(s.distance * 2) }));
        };

        res.combos.safe = await fetchRoadDistance(res.combos.safe);
        res.combos.effort = await fetchRoadDistance(res.combos.effort);
        res.combos.defense = await fetchRoadDistance(res.combos.defense);
      }

      setComboResult(res);
    } catch (e: any) {
      alert('Đề xuất thất bại: ' + e.message);
    } finally {
      setIsComboLoading(false);
    }
  };
`;

containerContent = containerContent.replace(
  "const toggleMergeSelection = (id: string) => {",
  comboLogic + "\n  const toggleMergeSelection = (id: string) => {"
);

// Add Navigation Tab Button for Combo
const calcButton = `          {hasPermission('GRADE10', 'view_recommendation', 'view') && (
            <button
              onClick={() => setActiveTab('calculator')}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
                activeTab === 'calculator'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }\`}
            >
              <CalcIcon className="h-4 w-4" />
              Đánh giá NV lớp 10
            </button>
          )}`;

const newCalcButton = calcButton + `
          {hasPermission('GRADE10', 'view_recommendation', 'view') && (
            <button
              onClick={() => setActiveTab('combo')}
              className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
                activeTab === 'combo'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }\`}
            >
              <Sparkles className="h-4 w-4" />
              Đề xuất Combo 3 NV
            </button>
          )}`;

containerContent = containerContent.replace(calcButton, newCalcButton);

// Add Tab Combo Content rendering block
const comboTabContent = `        {/* Tab: Combo Recommendation */}
        {activeTab === 'combo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Config Panel */}
            <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white m-0">Đề xuất Combo 3 NV</h2>
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
                  </div>
                </div>

                <button
                  onClick={handleGetCombo}
                  disabled={isComboLoading}
                  className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 active:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition text-xs mt-2"
                >
                  {isComboLoading ? 'Đang phân tích dữ liệu...' : '🚀 Đề Xuất Combo Nguyện Vọng'}
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
                  <p className="text-slate-400 text-sm">Vui lòng nhập khoảng điểm và bấm "Đề Xuất Combo Nguyện Vọng".</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Summary of score */}
                  <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-2xl text-xs text-slate-350 flex justify-between items-center">
                    <div>
                      Điểm thi dự kiến: <strong className="text-indigo-400 text-sm">{comboResult.minScore}đ - {comboResult.maxScore}đ</strong>
                      <span className="text-slate-500 ml-2">(Trung bình xét: {comboResult.avgScore}đ)</span>
                    </div>
                  </div>

                  {/* Strategy Tabs */}
                  <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setSelectedStrategy('safe')}
                      className={\`flex-1 py-2 text-xs font-bold rounded-lg transition \${
                        selectedStrategy === 'safe'
                          ? 'bg-indigo-650 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }\`}
                    >
                      🛡️ Tab 1: An Toàn
                    </button>
                    <button
                      onClick={() => setSelectedStrategy('effort')}
                      className={\`flex-1 py-2 text-xs font-bold rounded-lg transition \${
                        selectedStrategy === 'effort'
                          ? 'bg-indigo-650 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }\`}
                    >
                      🔥 Tab 2: Nỗ Lực (Dream NV1)
                    </button>
                    <button
                      onClick={() => setSelectedStrategy('defense')}
                      className={\`flex-1 py-2 text-xs font-bold rounded-lg transition \${
                        selectedStrategy === 'defense'
                          ? 'bg-indigo-650 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }\`}
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
                          className={\`bg-slate-900/60 border hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition \${
                            isTooFar ? 'border-amber-500/10' : 'border-slate-800'
                          }\`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={\`text-[11px] font-black px-2 py-0.5 rounded border \${
                                nvNum === 1 ? 'bg-indigo-650/15 border-indigo-500/30 text-indigo-400' :
                                nvNum === 2 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              }\`}>
                                NGUYỆN VỌNG {nvNum}
                              </span>
                              <span className="text-xs text-slate-400 font-bold px-2 py-0.5 bg-slate-800 rounded">
                                {school.schoolCode}
                              </span>
                              <span className="text-xs text-slate-500">
                                {school.districtName}
                              </span>
                            </div>

                            <h3 className="text-base font-extrabold text-white mb-2">{school.schoolName}</h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-400">
                              <div>Điểm chuẩn NV{nvNum}: <span className="font-semibold text-slate-200">{cutoff || 'Không tuyển'}đ</span></div>
                              {nvNum > 1 && school[\`nv\${nvNum}Gap\`] !== null && (
                                <div>Chênh lệch NV{nvNum}: <span className="font-semibold text-amber-500">+{school[\`nv\${nvNum}Gap\`]}đ</span></div>
                              )}
                              {school.distance !== null && (
                                <div className={\`flex items-center gap-1 \${isTooFar ? 'text-amber-500 font-medium' : ''}\`}>
                                  <span>Khoảng cách:</span>
                                  <span>{school.roadDistance || school.distance} km {isTooFar && '⚠️'}</span>
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
                          <div className="md:w-36 shrink-0 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
                            <div className="text-xs text-slate-400 mb-0.5">Xác suất đỗ NV{nvNum}</div>
                            <div className={\`text-2xl font-black \${
                              probColor === 'emerald' ? 'text-emerald-400' :
                              probColor === 'blue' ? 'text-blue-400' :
                              probColor === 'amber' ? 'text-amber-400' : 'text-rose-400'
                            }\`}>
                              {prob}%
                            </div>
                            <span className={\`text-[9px] font-bold uppercase mt-1.5 px-2 py-0.5 rounded-full block text-center \${
                              probColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                              probColor === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                              probColor === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                            }\`}>
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
        )}`;

containerContent = containerContent.replace(
  `      {/* AI Search Modal */}`,
  comboTabContent + `\n      {/* AI Search Modal */}`
);

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched with Smart Combo tab');
