import { HelpCircle, Printer } from 'lucide-react';
import type { G10ComboResult, G10ComboSchool, G10ComboStrategy } from '../../../services/api';

interface ComboResultsPanelProps {
  comboResult: G10ComboResult | null;
  isComboLoading: boolean;
  selectedStrategy: G10ComboStrategy;
  maxCommuteDistance: string;
  onSelectedStrategyChange: (strategy: G10ComboStrategy) => void;
  onPrintResults: () => void;
  onOpenSchoolDetail: (schoolId: string) => void;
}

function ComboSchoolCard({
  school,
  index,
  onOpenSchoolDetail,
}: {
  school: G10ComboSchool;
  index: number;
  onOpenSchoolDetail: (schoolId: string) => void;
}) {
  const nvNum = index + 1;
  const cutoff =
    nvNum === 1 ? school.cutoffNV1 : nvNum === 2 ? school.cutoffNV2 : school.cutoffNV3;
  const prob = nvNum === 1 ? school.probNV1 : nvNum === 2 ? school.probNV2 : school.probNV3;
  const gapValue = nvNum === 2 ? school.nv2Gap : nvNum === 3 ? school.nv3Gap : null;
  const isTooFar = typeof school.roadDistance === 'number' && school.roadDistance > 15;

  return (
    <button
      type="button"
      onClick={() => onOpenSchoolDetail(school.schoolId)}
      className={`w-full text-left bg-slate-900/60 border hover:border-indigo-500/40 rounded-xl p-3.5 flex items-start justify-between gap-3 cursor-pointer transition ${
        isTooFar ? 'border-amber-500/10' : 'border-slate-800'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span
            className={`text-[11px] font-black px-2 py-0.5 rounded border ${
              nvNum === 1
                ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-400'
                : nvNum === 2
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            }`}
          >
            NV{nvNum}
          </span>
          <span className="text-[10px] text-slate-500">{school.districtName}</span>
        </div>
        <h3 className="text-sm font-extrabold text-white mb-2 truncate">{school.schoolName}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px] text-slate-400">
          <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1">
            <span className="block">Điểm NV{nvNum}</span>
            <span className="font-bold text-slate-100">{cutoff ?? 'Không tuyển'}đ</span>
          </div>
          {gapValue !== null && gapValue !== undefined && (
            <div className="rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1">
              <span className="block">Lệch NV{nvNum}</span>
              <span className="font-bold text-amber-400">+{gapValue}đ</span>
            </div>
          )}
          {typeof school.roadDistance === 'number' && (
            <div
              className={`rounded-lg bg-slate-950/45 border border-slate-800 px-2 py-1 ${
                isTooFar ? 'text-amber-400 font-medium' : ''
              }`}
            >
              <span className="block">Đường đi</span>
              <span className="font-bold">
                {school.roadDistance} km{school.roadDuration ? ` · ${school.roadDuration}p` : ''}
              </span>
            </div>
          )}
          {(school.commuteBonus ?? 0) > 0 && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-emerald-300">
              <span className="block">Cự ly bonus</span>
              <span className="font-bold">+{school.commuteBonus}đ</span>
            </div>
          )}
        </div>
        {isTooFar && (
          <p className="text-[10px] text-amber-500 mt-2 m-0 leading-relaxed">
            ⚠️ <strong>Cảnh báo:</strong> Trường nằm khá xa địa chỉ nhà của bạn (
            {school.roadDistance || school.distance}km). Hãy cân nhắc về phương tiện đi lại nếu
            đăng ký!
          </p>
        )}
      </div>

      <div className="shrink-0 text-center flex flex-col items-center gap-1">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider">Tỷ lệ đỗ</div>
        <div
          className={`text-lg font-black ${
            prob >= 80
              ? 'text-emerald-400'
              : prob >= 65
                ? 'text-blue-400'
                : prob >= 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
          }`}
        >
          {prob}%
        </div>
      </div>
    </button>
  );
}

function StrategyDescription({ strategy }: { strategy: G10ComboStrategy }) {
  if (strategy === 'safe') {
    return (
      <>
        <strong>Chiến lược An toàn:</strong> Tự động phân bổ 3 NV theo thứ tự điểm chuẩn giảm dần
        quanh điểm trung bình dự đoán của bạn. Không bắt buộc có trường mơ ước.
      </>
    );
  }
  if (strategy === 'effort') {
    return (
      <>
        <strong>Chiến lược Nỗ lực:</strong> Bạn đang rất quyết tâm, nỗ lực vượt lên chính mình!
        Đưa trường mơ ước lên NV1 bất kể tỉ lệ chọi, sau đó lùi NV2 cạnh tranh và NV3 thủ vững
        chắc.
      </>
    );
  }
  return (
    <>
      <strong>Chiến lược Phòng thủ:</strong> Bạn không tự tin và thời gian sắp cạn, cần chắc cú!
      Hạ chỉ tiêu xuống trường an toàn ngay từ NV1, lùi sâu NV2/NV3 để ưu tiên độ chắc chắn.
    </>
  );
}

function StrategyBadge({ strategy }: { strategy: G10ComboStrategy }) {
  if (strategy === 'safe') return <>🛡️ Phương Án An Toàn</>;
  if (strategy === 'effort') return <>🔥 Phương Án Nỗ Lực</>;
  return <>🏰 Phương Án Phòng Thủ</>;
}

export default function ComboResultsPanel({
  comboResult,
  isComboLoading,
  selectedStrategy,
  maxCommuteDistance,
  onSelectedStrategyChange,
  onPrintResults,
  onOpenSchoolDetail,
}: ComboResultsPanelProps) {
  if (isComboLoading) {
    return (
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
          <span className="text-xs text-slate-400">
            Đang tối ưu hóa các phương án nguyện vọng cho bạn...
          </span>
        </div>
      </div>
    );
  }

  if (!comboResult) {
    return (
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-2xl">
          <HelpCircle className="h-12 w-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Vui lòng nhập khoảng điểm và bấm "Tư Vấn Nguyện Vọng".</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-8 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="bg-indigo-950/20 border border-indigo-500/10 p-3 rounded-2xl text-xs text-slate-350 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            Điểm thi dự kiến:{' '}
            <strong className="text-indigo-400 text-[13px]">
              {comboResult.minScore}đ - {comboResult.maxScore}đ
            </strong>
            <span className="text-slate-500 ml-2 hidden sm:inline">(Trung bình xét: {comboResult.avgScore}đ)</span>
            <span className="ml-0 mt-1 block text-[10px] text-slate-500 sm:ml-2 sm:inline">
              {comboResult.selectionMode === 'district'
                ? `Chỉ xét ${comboResult.filterSummary?.selectedDistrictCount || 0} quận/huyện đã chọn`
                : 'Xét theo quãng đường đi thực tế từ nhà bạn'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {comboResult.ssf !== undefined && comboResult.ssf !== 0 && (
              <div
                className={`px-2 py-1 rounded-lg font-bold text-[9px] flex items-center gap-1 ${
                  comboResult.ssf > 0
                    ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                    : 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                }`}
              >
                {comboResult.ssf > 0 ? '⚠️ Cạnh tranh tăng nhẹ năm nay' : '✨ Điểm chuẩn hạ nhẹ'} (
                {comboResult.ssf > 0 ? `+${comboResult.ssf}` : comboResult.ssf}đ)
              </div>
            )}
            <button
              type="button"
              onClick={onPrintResults}
              className="no-print flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition text-[11px] font-bold border border-slate-700"
            >
              <Printer className="w-3 h-3" />
              In PDF
            </button>
          </div>
        </div>

        <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          {(['safe', 'effort', 'defense'] as const).map((strategy) => (
            <button
              key={strategy}
              type="button"
              onClick={() => onSelectedStrategyChange(strategy)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                selectedStrategy === strategy
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <StrategyBadge strategy={strategy} />
            </button>
          ))}
        </div>

        {comboResult.selectionMode === 'distance' && comboResult.adjusted && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-500 font-semibold leading-relaxed">
            ⚠️ <strong>Lưu ý:</strong> Do trong vòng {maxCommuteDistance} km không tìm đủ trường phù
            hợp để xếp combo, chúng tôi đã tự động nới rộng giới hạn khoảng cách lên{' '}
            <strong>{comboResult.maxCommuteDistance} km</strong>.
          </div>
        )}

        {(['safe', 'effort', 'defense'] as const).map((strategy) => {
          const schoolsForStrategy = (comboResult.combos[strategy] ?? []).filter(Boolean) as G10ComboSchool[];
          const isActive = selectedStrategy === strategy;

          return (
            <div key={strategy} className={`flex-col gap-4 ${isActive ? 'flex' : 'flex md:hidden'}`}>
              <div className="md:hidden flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-white shrink-0">
                  <StrategyBadge strategy={strategy} />
                </span>
                <div className="flex-1 border-t border-slate-800" />
              </div>

              <div className="bg-slate-950/45 p-3 border border-slate-850 rounded-xl text-xs text-slate-300">
                <p className="m-0">
                  <StrategyDescription strategy={strategy} />
                </p>
              </div>

              {comboResult.explanations?.[strategy] && (
                <div className="grade10-expert-analysis bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-2xl text-xs text-indigo-200 leading-relaxed shadow-lg flex flex-col gap-2">
                  <span className="grade10-expert-analysis-title font-bold uppercase tracking-wider text-[9px] text-indigo-400">
                    💡 Phân tích chiến thuật của chuyên gia AI:
                  </span>
                  <p className="m-0">{comboResult.explanations[strategy]}</p>
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {schoolsForStrategy.map((school, idx) => (
                  <ComboSchoolCard
                    key={school.schoolId ?? idx}
                    school={school}
                    index={idx}
                    onOpenSchoolDetail={onOpenSchoolDetail}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
