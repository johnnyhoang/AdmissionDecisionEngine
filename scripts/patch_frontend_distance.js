const fs = require('fs');
const path = require('path');

// 1. Patch api.ts to include lat/lng in G10SchoolItem
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');
if (!apiContent.includes('latitude?: number;')) {
  apiContent = apiContent.replace(
    "isVerified?: boolean;",
    "isVerified?: boolean;\n  latitude?: number;\n  longitude?: number;"
  );
  fs.writeFileSync(apiPath, apiContent, 'utf8');
}

// 2. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// Update activeTab state values
containerContent = containerContent.replace(
  "useState<'dashboard' | 'calculator' | 'search' | 'admin'>('dashboard');",
  "useState<'dashboard' | 'calculator' | 'search' | 'admin' | 'distance'>('dashboard');"
);

// Add distance states
const newStates = `
  // Distance Finder states
  const [userAddress, setUserAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [distanceSchools, setDistanceSchools] = useState<any[]>([]);
  const [distanceMode, setDistanceMode] = useState<'driving' | 'straight'>('driving');
`;
containerContent = containerContent.replace(
  "const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'cutoff' | 'quota'>('info');",
  "const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'cutoff' | 'quota'>('info');" + newStates
);

// Add utility logic for Haversine distance and OSRM matrix
const distanceLogic = `
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

  const handleLocateAndFind = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserAddress('Vị trí hiện tại của bạn');
        await calculateSchoolDistances(latitude, longitude);
      },
      (error) => {
        alert('Không thể xác định vị trí GPS của bạn. Vui lòng nhập địa chỉ thủ công.');
        setIsLocating(false);
      }
    );
  };

  const handleGeocodeAddress = async () => {
    if (!userAddress.trim()) {
      alert('Vui lòng nhập địa chỉ nhà.');
      return;
    }
    setIsLocating(true);
    try {
      const q = encodeURIComponent(userAddress + ', Hồ Chí Minh');
      const res = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${q}&format=json&limit=1\`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        await calculateSchoolDistances(lat, lon);
      } else {
        alert('Không tìm thấy địa chỉ này trên bản đồ. Vui lòng nhập chi tiết hơn (ví dụ: Số nhà, Tên đường, Quận).');
      }
    } catch (e) {
      alert('Lỗi định vị địa chỉ: Mạng yếu hoặc bị giới hạn.');
    } finally {
      setIsLocating(false);
    }
  };

  const calculateSchoolDistances = async (userLat: number, userLon: number) => {
    setIsLocating(true);
    try {
      // 1. Calculate straight-line distance to filter top 15 closest schools
      const tempSchools = schools
        .filter(s => s.latitude && s.longitude)
        .map(s => ({
          ...s,
          straightDistance: getHaversineDistance(userLat, userLon, s.latitude!, s.longitude!)
        }))
        .sort((a, b) => a.straightDistance - b.straightDistance)
        .slice(0, 15);

      if (tempSchools.length === 0) {
        alert('Dữ liệu tọa độ của các trường đang được đồng bộ hoặc chưa sẵn sàng. Vui lòng thử lại sau.');
        return;
      }

      // 2. Fetch OSRM driving distance for these top 15 schools
      const coordsString = tempSchools.map(s => \`\${s.longitude},\${s.latitude}\`).join(';');
      const url = \`https://router.project-osrm.org/table/v1/driving/\${userLon},\${userLat};\${coordsString}?sources=0\`;
      
      const osrmRes = await fetch(url);
      const osrmData = await osrmRes.json();

      if (osrmData && osrmData.code === 'Ok' && osrmData.distances) {
        const distances = osrmData.distances[0]; // meters from source 0 (user)
        const durations = osrmData.durations[0]; // seconds from source 0

        const finalSchools = tempSchools.map((s, idx) => {
          const mDist = distances[idx + 1]; // index 0 is user to user (0)
          const sDur = durations[idx + 1];
          return {
            ...s,
            roadDistance: mDist ? parseFloat((mDist / 1000).toFixed(2)) : parseFloat(s.straightDistance.toFixed(2)),
            roadDuration: sDur ? Math.round(sDur / 60) : Math.round(s.straightDistance * 2) // fallback estimate
          };
        }).sort((a, b) => a.roadDistance - b.roadDistance);

        setDistanceSchools(finalSchools);
      } else {
        // Fallback to straight line
        const finalSchools = tempSchools.map(s => ({
          ...s,
          roadDistance: parseFloat(s.straightDistance.toFixed(2)),
          roadDuration: Math.round(s.straightDistance * 2)
        }));
        setDistanceSchools(finalSchools);
      }
    } catch (e) {
      console.error(e);
      // Fallback to straight line on fetch failure
      const finalSchools = schools
        .filter(s => s.latitude && s.longitude)
        .map(s => {
          const d = getHaversineDistance(userLat, userLon, s.latitude!, s.longitude!);
          return {
            ...s,
            roadDistance: parseFloat(d.toFixed(2)),
            roadDuration: Math.round(d * 2)
          };
        })
        .sort((a, b) => a.roadDistance - b.roadDistance)
        .slice(0, 15);
      setDistanceSchools(finalSchools);
    } finally {
      setIsLocating(false);
    }
  };
`;

containerContent = containerContent.replace(
  "const toggleMergeSelection = (id: string) => {",
  distanceLogic + "\n  const toggleMergeSelection = (id: string) => {"
);

// Add Tab Button
const navButtons = `          <button
            onClick={() => setActiveTab('search')}
            className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }\`}
          >
            <School className="h-4 w-4" />
            Tra cứu trường THPT
          </button>`;

const newNavButtons = navButtons + `

          <button
            onClick={() => setActiveTab('distance')}
            className={\`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition \${
              activeTab === 'distance'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }\`}
          >
            <MapPin className="h-4 w-4" />
            Tìm trường gần bạn
          </button>`;

containerContent = containerContent.replace(navButtons, newNavButtons);

// Add Distance Tab Content rendering block
const distanceTabContent = `        {/* Tab: Distance Finder */}
        {activeTab === 'distance' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Address Card */}
            <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <MapPin className="h-5 w-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white m-0">Vị trí & Địa chỉ nhà</h2>
              </div>

              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nhập địa chỉ nhà của bạn</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ví dụ: 227 Nguyễn Văn Cừ, Quận 5..."
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none transition"
                    />
                    <button
                      onClick={handleGeocodeAddress}
                      disabled={isLocating}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      Định vị
                    </button>
                  </div>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold uppercase">Hoặc</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  onClick={handleLocateAndFind}
                  disabled={isLocating}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <MapPin className="h-4 w-4" />
                  {isLocating ? 'Đang xác định GPS...' : 'Lấy vị trí GPS hiện tại'}
                </button>
              </div>

              <div className="bg-slate-950/45 p-3.5 border border-slate-800/80 rounded-xl text-xs text-slate-400 leading-relaxed">
                💡 Hệ thống sẽ tự động tính toán khoảng cách đường bộ thực tế (xe máy/ô tô) đến các trường và sắp xếp từ gần đến xa giúp bạn chọn lựa nguyện vọng thuận tiện đi lại nhất!
              </div>
            </div>

            {/* Sorted Schools List Card */}
            <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 shadow flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <School className="w-5 h-5 text-indigo-400" />
                  Danh sách trường THPT lân cận ({distanceSchools.length})
                </h3>
              </div>

              {distanceSchools.length === 0 ? (
                <div className="text-center py-20 text-slate-500 text-sm">
                  Vui lòng định vị vị trí hoặc nhập địa chỉ để xem các trường gần bạn nhất.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {distanceSchools.map((school, idx) => (
                    <div
                      key={school.id}
                      onClick={() => openSchoolDetail(school.id)}
                      className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 flex justify-between items-center gap-4 cursor-pointer transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-indigo-650/15 text-indigo-400 text-xs font-bold px-2 py-1 rounded-lg border border-indigo-500/20 mt-0.5">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {school.name}
                            {school.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{school.address}</p>
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                            <span>Quận: <strong className="text-slate-350">{school.district?.name}</strong></span>
                            <span>Mã: <strong className="text-slate-350">{school.code}</strong></span>
                            <span>Điểm NV1 2025: <strong className="text-indigo-400 font-bold">{school.latestCutoffNV1 || 'N/A'}đ</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 min-w-[120px]">
                        <span className="text-sm font-black text-emerald-400 flex items-center gap-1">
                          {school.roadDistance} km
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ~{school.roadDuration} phút (xe máy)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}`;

containerContent = containerContent.replace(
  "{/* AI Search Modal */}",
  distanceTabContent + "\n      {/* AI Search Modal */}"
);

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Grade10Container.tsx patched for Distance Finder');
