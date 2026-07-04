const fs = require('fs');
const path = require('path');

const containerPath = path.join(__dirname, '../apps/frontend/src/pages/grade10-hcm/Grade10Container.tsx');
let content = fs.readFileSync(containerPath, 'utf8');

// 1. Inject helpModal state declaration
if (!content.includes('const [helpModal, setHelpModal]')) {
  // Let's insert it right after the theme state
  content = content.replace(
    "const [theme, setTheme] = useState<'light' | 'dark'>('light');",
    "const [theme, setTheme] = useState<'light' | 'dark'>('light');\n  const [helpModal, setHelpModal] = useState<'calculator' | 'combo' | null>(null);"
  );
  console.log('Injected helpModal state declaration');
}

// 2. Inject question mark button (?) next to Calculator Results Header
const oldCalcHeader = `<h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>`;
const newCalcHeader = `
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-bold text-white m-0">KẾT QUẢ GỢI Ý TRƯỜNG PHÙ HỢP</h2>
                  <button 
                    onClick={() => setHelpModal('calculator')}
                    className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer"
                    title="Xem hướng dẫn giải thuật & công thức tính"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>
`;
if (content.includes(oldCalcHeader)) {
  content = content.replace(oldCalcHeader, newCalcHeader);
  console.log('Injected help button next to Calculator Results Header');
}

// 3. Inject question mark button (?) next to Combo Header
const oldComboHeader = `<h2 className="text-base font-bold text-white m-0">🌈 Đề xuất Combo 3 NV</h2>`;
const newComboHeader = `
                <h2 className="text-base font-bold text-white m-0 flex items-center gap-1.5">
                  🌈 Đề xuất Combo 3 NV
                  <button 
                    onClick={() => setHelpModal('combo')}
                    className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition cursor-pointer"
                    title="Xem hướng dẫn cẩm nang chiến thuật xếp nguyện vọng"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </h2>
`;
if (content.includes(oldComboHeader)) {
  content = content.replace(oldComboHeader, newComboHeader);
  console.log('Injected help button next to Combo Header');
}

// 4. Render Modals at the bottom of Grade10Container.tsx (before final closing div)
const modalsCode = `
      {/* Help Modal for Personal Calculator Evaluation */}
      {helpModal === 'calculator' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/20">
              <h2 className="text-base font-bold text-white m-0 flex items-center gap-2">
                📘 Cẩm Nang Hướng Dẫn: Đánh Giá Cá Nhân
              </h2>
              <button 
                onClick={() => setHelpModal(null)} 
                className="text-slate-400 hover:text-white font-bold p-1 bg-slate-850 hover:bg-slate-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-300 text-xs leading-relaxed">
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📊 1. Giải thuật dịch chuyển Điểm chuẩn Vĩ mô (SSF Model)</h3>
                <p className="m-0">
                  Điểm chuẩn của các trường không bao giờ cố định mà luôn biến động từng năm phụ thuộc vào 3 nhân tố vĩ mô: <strong>Tổng số lượng thí sinh đăng ký dự thi</strong>, <strong>Chỉ tiêu tuyển sinh công lập</strong> và <strong>Độ khó của đề thi</strong>.
                </p>
                <p className="m-0">
                  Hệ số SSF tự động tính toán độ biến động này. Nếu năm nay cạnh tranh tăng, điểm thi thử của học sinh sẽ tự động bị "trừ ảo" khi so sánh với phổ điểm các năm trước, giúp phụ huynh đưa ra dự báo an toàn nhất, tránh trường hợp điểm thi bằng điểm chuẩn năm cũ vẫn bị trượt do điểm chuẩn năm mới nhảy vọt.
                </p>
              </section>

              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🧮 2. Công thức tính Xác suất đỗ thực tế nghiêm ngặt</h3>
                <p className="m-0">
                  Hệ thống áp dụng hàm mũ bão hòa để mô phỏng chính xác nhất khả năng trúng tuyển:
                </p>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Tại sao mốc bằng điểm chuẩn chỉ đạt 50% cơ hội?</strong> Điểm thi của bạn bằng khít điểm chuẩn năm ngoái có nghĩa là bạn nằm giữa ranh giới đỗ/trượt khi điểm dao động. Do đó hệ thống xếp loại đây là mức <em>"Thử thách / Cạnh tranh"</em>.</li>
                  <li><strong>Giới hạn trần 88%:</strong> Dù bạn vượt điểm chuẩn rất cao, xác suất đỗ hiển thị tối đa cũng chỉ đạt 88% (mức <em>"An tâm cao"</em>). Điều này nhắc nhở phụ huynh học sinh tránh chủ quan trước các rủi ro phòng thi thực tế (sai sót, lệch tủ, biến động cực đoan).</li>
                </ul>
              </section>

              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📉 3. Ý nghĩa của 4 chỉ số Diffs (d1, d2, d3, d4)</h3>
                <p className="m-0">
                  Thay vì chỉ so sánh với 1 năm đơn lẻ, hệ thống đánh giá trên 4 khía cạnh kỹ thuật chuyên sâu:
                </p>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>d1 (so năm ngoái):</strong> Hiệu số giữa điểm của bạn và điểm chuẩn NV1 của năm gần nhất.</li>
                  <li><strong>d2 (so trung bình 3 năm):</strong> Hiệu số so với điểm chuẩn trung bình 3 năm liền kề, giúp loại bỏ yếu tố đột biến điểm chuẩn của một năm lẻ loi.</li>
                  <li><strong>d3 (so NV2):</strong> Đánh giá mức độ an toàn khi bạn nộp trường này ở Nguyện vọng 2.</li>
                  <li><strong>d4 (so NV3):</strong> Đánh giá mức độ an toàn khi nộp ở Nguyện vọng 3.</li>
                </ul>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center">
              <button 
                onClick={() => setHelpModal(null)} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Đã Hiểu, Đóng Hướng Dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal for Combo strategic suggestion */}
      {helpModal === 'combo' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/20">
              <h2 className="text-base font-bold text-white m-0 flex items-center gap-2">
                📘 Cẩm Nang Hướng Dẫn: Đề Xuất Combo 3 Nguyện Vọng
              </h2>
              <button 
                onClick={() => setHelpModal(null)} 
                className="text-slate-400 hover:text-white font-bold p-1 bg-slate-850 hover:bg-slate-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-300 text-xs leading-relaxed">
              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🛡️ 1. Ba Chiến thuật phân bổ Nguyện vọng thông minh</h3>
                <p className="m-0">
                  Mỗi tab combo gợi ý một chiến thuật phân bổ điểm thi và cự ly khác nhau để phù hợp với hoàn cảnh:
                </p>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li><strong>Tab 1 - An Toàn (Safety-First):</strong> Lựa chọn 3 trường tối ưu nhất bám sát phổ điểm dự báo của bạn. Phân bổ điểm chuẩn NV1 &gt; NV2 &gt; NV3 giảm dần để đảm bảo bạn luôn có suất dự phòng ở trường công lập gần nhà. Không cố đưa trường Mơ ước vào nếu quá xa tầm điểm.</li>
                  <li><strong>Tab 2 - Nỗ Lực (Dream & Achieve):</strong> Đưa trường Mơ ước của bạn lên thẳng Nguyện vọng 1 bất kể mức độ cạnh tranh. Xếp một trường Cạnh tranh trung bình làm NV2 và lùi hẳn NV3 về trường cực kỳ An toàn để làm tấm khiên bảo vệ.</li>
                  <li><strong>Tab 3 - Phòng Thủ (Defensive Strategy):</strong> Dành cho những bạn muốn chắc chắn đỗ 100% gần nhà. Xếp trường An toàn làm NV1, trường Rất An toàn làm NV2 và trường cực kỳ dễ đỗ (Siêu an toàn) làm NV3.</li>
                </ul>
              </section>

              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">📍 2. Cơ chế điểm cộng Cự ly đi học (Commute Bonus)</h3>
                <p className="m-0">
                  Khoảng cách di chuyển từ nhà tới trường là yếu tố cốt lõi quyết định tính kiên trì trong suốt 3 năm học cấp 3. Giải thuật thông minh tự động cộng điểm ưu tiên ảo khi chấm điểm trường:
                </p>
                <ul className="list-disc list-inside m-0 pl-1 space-y-1">
                  <li>Nếu trường cách nhà <strong>dưới 1/3</strong> cự ly tối đa bạn chọn: Cộng thưởng <strong>+1.5 điểm</strong> ảo.</li>
                  <li>Nếu cách nhà từ <strong>1/3 đến 2/3</strong> cự ly tối đa: Cộng thưởng <strong>+0.75 điểm</strong> ảo.</li>
                  <li>Giúp đẩy các trường gần nhà có chất lượng tốt lên vị trí đề xuất đầu tiên.</li>
                </ul>
              </section>

              <section className="space-y-2 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider m-0">🚗 3. Bộ lọc và tự động nới lỏng giới hạn cự ly</h3>
                <p className="m-0">
                  Hệ thống tự động loại bỏ tất cả các trường nằm ngoài khoảng cách tối đa để bảo vệ học sinh khỏi việc đi học quá xa. Tuy nhiên, nếu cự ly quá ngắn khiến không tìm đủ 12 trường ứng viên công lập, backend sẽ tự động nới rộng cự ly và hiện cảnh báo rõ ràng để bạn điều chỉnh lại.
                </p>
              </section>
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center">
              <button 
                onClick={() => setHelpModal(null)} 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Đã Hiểu, Đóng Hướng Dẫn
              </button>
            </div>
          </div>
        </div>
      )}
`;

const closingTag = '      {/* AI Search Modal */}';
if (content.includes(closingTag)) {
  content = content.replace(closingTag, modalsCode + '\n' + closingTag);
  console.log('Successfully injected help modals before AI Search Modal');
}

fs.writeFileSync(containerPath, content, 'utf8');
console.log('Finished patching help modals');
