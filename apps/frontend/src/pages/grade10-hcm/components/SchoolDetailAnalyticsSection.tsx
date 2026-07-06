import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import type { G10SchoolDetail } from '../../../services/api';
import { formatSchoolYear } from '../../../utils/date';

interface SchoolDetailAnalyticsSectionProps {
  schoolDetail: G10SchoolDetail;
  theme: 'light' | 'dark';
}

export default function SchoolDetailAnalyticsSection({ schoolDetail, theme }: SchoolDetailAnalyticsSectionProps) {
  const cutoffs = schoolDetail.cutoffs ?? [];
  const quotas = schoolDetail.quotas ?? [];

  return (
    <section>
      <h3 className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-800">
        📈 Điểm chuẩn
      </h3>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            Đồ thị biến động điểm chuẩn qua các năm
          </h4>
          <div className="h-48 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            {cutoffs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">
                Chưa có dữ liệu điểm chuẩn
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...cutoffs].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                  <XAxis
                    dataKey="year"
                    stroke={theme === 'light' ? '#6b7280' : '#94a3b8'}
                    tick={{ fontSize: 9 }}
                    tickFormatter={formatSchoolYear}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    stroke={theme === 'light' ? '#6b7280' : '#94a3b8'}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip
                    contentStyle={
                      theme === 'light'
                        ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b', fontSize: 10 }
                        : { backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Line type="monotone" dataKey="cutoffNV1" stroke="#6366f1" name="Nguyện vọng 1" strokeWidth={2.5} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="cutoffNV2" stroke="#10b981" name="Nguyện vọng 2" strokeWidth={2} />
                  <Line type="monotone" dataKey="cutoffNV3" stroke="#f59e0b" name="Nguyện vọng 3" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h4 className="text-[11px] font-bold text-slate-400">Bảng chi tiết điểm chuẩn qua các năm</h4>
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px]">
                  <th className="p-2.5">Năm học</th>
                  <th className="p-2.5">Nguyện vọng 1</th>
                  <th className="p-2.5">Nguyện vọng 2</th>
                  <th className="p-2.5">Nguyện vọng 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-350 bg-slate-900/20">
                {cutoffs.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/10">
                    <td className="p-2.5 font-bold text-white">
                      {formatSchoolYear(item.year)}
                    </td>
                    <td className="p-2.5 font-semibold text-indigo-400">
                      {item.cutoffNV1 ? `${item.cutoffNV1}đ` : '—'}
                    </td>
                    <td className="p-2.5 text-emerald-400">
                      {item.cutoffNV2 ? `${item.cutoffNV2}đ` : '—'}
                    </td>
                    <td className="p-2.5 text-amber-400">
                      {item.cutoffNV3 ? `${item.cutoffNV3}đ` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[11px] font-bold text-slate-400">Đồ thị Chỉ tiêu vs Số lượng đăng ký</h4>
              <div className="h-44 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                {quotas.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">
                    Chưa có dữ liệu chỉ tiêu
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[...quotas].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                      <XAxis dataKey="year" stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} tickFormatter={formatSchoolYear} />
                      <YAxis stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b', fontSize: 10 } : { backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      <Bar dataKey="quota" fill="#3b82f6" name="Chỉ tiêu" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="registeredCount" fill="#ec4899" name="Đăng ký NV1" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h4 className="text-[11px] font-bold text-slate-400">Biến động Tỷ lệ chọi</h4>
              <div className="h-44 w-full bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                {quotas.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">
                    Chưa có dữ liệu tỷ lệ chọi
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...quotas].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#f3e8ff' : '#1e293b'} />
                      <XAxis dataKey="year" stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} tickFormatter={formatSchoolYear} />
                      <YAxis stroke={theme === 'light' ? '#6b7280' : '#94a3b8'} tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e9d5ff', color: '#1e1b4b', fontSize: 10 } : { backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      <Line type="monotone" dataKey="competitionRatio" stroke="#f43f5e" name="Tỷ lệ chọi" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <h4 className="text-[11px] font-bold text-slate-400">Bảng thống kê số liệu tuyển sinh</h4>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold text-[10px]">
                    <th className="p-2.5">Năm học</th>
                    <th className="p-2.5">Chỉ tiêu</th>
                    <th className="p-2.5">Số lượng đăng ký NV1</th>
                    <th className="p-2.5">Tỷ lệ chọi (1 chọi x)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-350 bg-slate-900/20">
                  {quotas.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-850/10">
                      <td className="p-2.5 font-bold text-white">
                        {formatSchoolYear(item.year)}
                      </td>
                      <td className="p-2.5 text-blue-400 font-semibold">
                        {item.quota || '—'}
                      </td>
                      <td className="p-2.5 text-pink-400">
                        {item.registeredCount ? item.registeredCount.toLocaleString() : '—'}
                      </td>
                      <td className="p-2.5 text-rose-400 font-bold">
                        {item.competitionRatio ? `${item.competitionRatio}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
