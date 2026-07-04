import { Shield, GraduationCap, School, Users, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function AdminHub() {
  const { user, hasPermission, logout } = useAuth();

  const cards = [
    {
      href: '/admin/university',
      icon: <GraduationCap className="h-8 w-8" />,
      color: 'from-indigo-600 to-violet-600',
      shadow: 'shadow-indigo-600/30',
      border: 'border-indigo-500/20',
      bg: 'bg-indigo-500/5 hover:bg-indigo-500/10',
      badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      title: 'Admin Đại Học',
      description: 'Quản lý dữ liệu điểm chuẩn, đồng bộ preset, import JSON và xem lịch sử tải lên cho hệ thống gợi ý nguyện vọng Đại học.',
      tag: 'UNIVERSITY',
      permKey: 'edit_data' as const,
      links: ['Đồng bộ Preset', 'Dán JSON Import', 'Lịch sử Import'],
    },
    {
      href: '/admin/l10hcm',
      icon: <School className="h-8 w-8" />,
      color: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-600/30',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      title: 'Admin Lớp 10 HCM',
      description: 'Quản lý dữ liệu điểm chuẩn & chỉ tiêu tuyển sinh THPT TP.HCM. Đồng bộ preset, nhập JSON và chạy AI tìm dữ liệu hàng loạt.',
      tag: 'GRADE10',
      permKey: 'edit_data' as const,
      links: ['Đồng bộ Preset', 'Dán JSON Import', 'AI Hàng Loạt'],
    },
    {
      href: '/admin/permissions',
      icon: <Users className="h-8 w-8" />,
      color: 'from-rose-600 to-pink-600',
      shadow: 'shadow-rose-600/30',
      border: 'border-rose-500/20',
      bg: 'bg-rose-500/5 hover:bg-rose-500/10',
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      title: 'Phân Quyền Người Dùng',
      description: 'Xem danh sách thành viên, phân quyền View/Edit chi tiết từng chức năng và thay đổi chức vụ User/Admin cho từng tài khoản.',
      tag: 'ADMIN_ONLY',
      permKey: null,
      links: ['Danh sách User', 'Chỉnh Role', 'Cấp quyền chi tiết'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white m-0">Admin Control Panel</h1>
              <p className="text-xs text-slate-400 m-0">Cổng quản trị hệ thống Admission Decision Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-slate-700 object-cover" />
              ) : (
                <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">{user?.name}</div>
                <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{user?.role}</div>
              </div>
            </div>

            <a href="/" className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition">
              🎓 Cổng Đại Học
            </a>
            <a href="/l10hcm" className="text-xs font-semibold px-3 py-1.5 bg-emerald-800/60 hover:bg-emerald-700/60 border border-emerald-700/50 text-emerald-300 rounded-lg transition">
              🏫 Cổng Lớp 10
            </a>
            <button onClick={logout} className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">Chào mừng trở lại, {user?.name?.split(' ').pop()}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Bảng Điều Khiển Admin
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Chọn một phân hệ bên dưới để bắt đầu quản lý dữ liệu và phân quyền người dùng hệ thống.
          </p>
        </div>
      </div>

      {/* Cards */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {cards.map((card) => {
            // Check access
            const hasAccess = card.tag === 'ADMIN_ONLY'
              ? user?.role === 'ADMIN'
              : hasPermission(card.tag, card.permKey!, 'view');

            return (
              <a
                key={card.href}
                href={hasAccess ? card.href : '#'}
                onClick={!hasAccess ? (e) => e.preventDefault() : undefined}
                className={`group relative flex flex-col rounded-2xl border ${card.border} ${card.bg} p-6 transition-all duration-200 ${
                  hasAccess
                    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl ' + card.shadow
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg ${card.shadow} mb-5`}>
                  {card.icon}
                </div>

                {/* Badge */}
                <span className={`absolute top-5 right-5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${card.badge}`}>
                  {card.tag === 'ADMIN_ONLY' ? 'ADMIN ONLY' : card.tag}
                </span>

                {/* Content */}
                <h3 className="text-base font-bold text-white mb-2 m-0">{card.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed flex-1 mb-5">{card.description}</p>

                {/* Sub-links */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {card.links.map(link => (
                    <span key={link} className="text-[10px] font-medium px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md">
                      {link}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className={`flex items-center gap-1 text-xs font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                  {hasAccess ? 'Truy cập ngay' : 'Không có quyền truy cập'}
                  {hasAccess && <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />}
                </div>
              </a>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/60 py-5 text-center text-xs text-slate-500">
        © 2026 Admission Decision Engine · Admin Control Panel
      </footer>
    </div>
  );
}
