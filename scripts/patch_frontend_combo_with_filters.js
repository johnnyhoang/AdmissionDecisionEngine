const fs = require('fs');
const path = require('path');

// 1. Patch api.ts
const apiPath = path.join(__dirname, '../apps/frontend/src/services/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(
  "userLon?: number;\n  dreamSchoolCode?: string;",
  "userLon?: number;\n  dreamSchoolCode?: string;\n  maxCommuteDistance?: number;"
);
fs.writeFileSync(apiPath, apiContent, 'utf8');

// 2. Patch Grade10Container.tsx
const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let containerContent = fs.readFileSync(containerPath, 'utf8');

// Add maxCommuteDistance state
containerContent = containerContent.replace(
  "const [selectedStrategy, setSelectedStrategy] = useState<'safe' | 'effort' | 'defense'>('safe');",
  "const [selectedStrategy, setSelectedStrategy] = useState<'safe' | 'effort' | 'defense'>('safe');\n  const [maxCommuteDistance, setMaxCommuteDistance] = useState('10');"
);

// Pass maxCommuteDistance to API call
containerContent = containerContent.replace(
  "dreamSchoolCode: dreamSchoolCode || undefined,",
  "dreamSchoolCode: dreamSchoolCode || undefined,\n        maxCommuteDistance: parseFloat(maxCommuteDistance),"
);

// Update Combo Left Input Panel UI to include max distance input and the "We care about commute" note
const oldLocationDiv = `                {/* Location */}
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
                </div>`;

const newLocationDiv = oldLocationDiv + `\n
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
                </div>`;

containerContent = containerContent.replace(oldLocationDiv, newLocationDiv);

// Update We care note
containerContent = containerContent.replace(
  "💡 Hệ thống sẽ tự động tính toán khoảng cách đường bộ thực tế (xe máy/ô tô) đến các trường và sắp xếp từ gần đến xa giúp bạn chọn lựa nguyện vọng thuận tiện đi lại nhất!",
  "☘️ <strong>Chúng tôi có quan tâm đến khoảng cách di chuyển của bạn:</strong> Hệ thống sẽ tự động cộng thêm điểm ảo ưu tiên đi lại (+1.5đ cho trường dưới 1/3 khoảng cách tối đa, +0.75đ dưới 2/3 khoảng cách) để ưu tiên các trường gần nhà lên đầu combo!"
);

// Update right panel rendering to show the strategy explanation card and auto-relaxed notice
const oldExplanationDiv = `                  {/* Strategy Info Note */}
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
                  </div>`;

const newExplanationDiv = oldExplanationDiv + `

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
`;

containerContent = containerContent.replace(oldExplanationDiv, newExplanationDiv);

// Add commuteBonus display on recommended cards
containerContent = containerContent.replace(
  `                              {school.distance !== null && (
                                <div className={\`flex items-center gap-1 \${isTooFar ? 'text-amber-500 font-medium' : ''}\`}>
                                  <span>Khoảng cách:</span>
                                  <span>{school.roadDistance || school.distance} km {isTooFar && '⚠️'}</span>
                                </div>
                              )}`,
  `                              {school.distance !== null && (
                                <div className={\`flex items-center gap-1 \${isTooFar ? 'text-amber-500 font-medium' : ''}\`}>
                                  <span>Khoảng cách:</span>
                                  <span>{school.roadDistance || school.distance} km {isTooFar && '⚠️'}</span>
                                </div>
                              )}
                              {school.commuteBonus > 0 && (
                                <div className="text-emerald-400 font-semibold">
                                  Điểm thưởng cự ly: +{school.commuteBonus}đ
                                </div>
                              )}`
);

fs.writeFileSync(containerPath, containerContent, 'utf8');
console.log('Frontend patched with commute-aware filter and strategic explanations');
