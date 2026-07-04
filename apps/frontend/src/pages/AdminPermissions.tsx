import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAdminUsers, updateUserRole, updateUserPermissions } from '../services/api';
import { Shield, User as UserIcon, Save, ChevronRight } from 'lucide-react';

export default function AdminPermissions() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
      if (data.length > 0 && !selectedUser) {
        setSelectedUser(data[0]);
      } else if (selectedUser) {
        const updated = data.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (e: any) {
      setError(e.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser) return;
    try {
      await updateUserRole(selectedUser.id, newRole);
      await loadUsers();
    } catch (e: any) {
      alert('Không thể thay đổi chức vụ: ' + e.message);
    }
  };

  const handlePermissionToggle = (module: string, functionKey: string, type: 'view' | 'edit') => {
    if (!selectedUser) return;
    const currentPerms = [...(selectedUser.permissions || [])];
    const permIdx = currentPerms.findIndex(p => p.module === module && p.functionKey === functionKey);

    if (permIdx === -1) {
      currentPerms.push({
        module,
        functionKey,
        canView: type === 'view',
        canEdit: type === 'edit',
      });
    } else {
      currentPerms[permIdx] = {
        ...currentPerms[permIdx],
        canView: type === 'view' ? !currentPerms[permIdx].canView : currentPerms[permIdx].canView,
        canEdit: type === 'edit' ? !currentPerms[permIdx].canEdit : currentPerms[permIdx].canEdit,
      };
    }

    setSelectedUser({
      ...selectedUser,
      permissions: currentPerms,
    });
  };

  const handleToggleAllModule = (module: string, enable: boolean) => {
    if (!selectedUser) return;
    const functions = module === 'GRADE10' 
      ? ['view_dashboard', 'view_recommendation', 'edit_data']
      : ['view_universities', 'view_recommendation', 'view_optimization', 'edit_data'];

    const currentPerms = [...(selectedUser.permissions || [])];
    
    functions.forEach(fKey => {
      const permIdx = currentPerms.findIndex(p => p.module === module && p.functionKey === fKey);
      if (permIdx === -1) {
        currentPerms.push({
          module,
          functionKey: fKey,
          canView: enable,
          canEdit: enable,
        });
      } else {
        currentPerms[permIdx] = {
          ...currentPerms[permIdx],
          canView: enable,
          canEdit: enable,
        };
      }
    });

    setSelectedUser({
      ...selectedUser,
      permissions: currentPerms,
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateUserPermissions(selectedUser.id, selectedUser.permissions);
      alert('Cập nhật phân quyền thành công!');
      await loadUsers();
    } catch (e: any) {
      alert('Lưu phân quyền thất bại: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const checkPermission = (module: string, functionKey: string, type: 'view' | 'edit'): boolean => {
    if (!selectedUser) return false;
    const perm = selectedUser.permissions?.find((p: any) => p.module === module && p.functionKey === functionKey);
    return perm ? (type === 'view' ? perm.canView : perm.canEdit) : false;
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white m-0">Admin Setup Permissions</h1>
              <p className="text-xs text-slate-400 m-0">Quản lý Phân quyền Thành viên Hệ thống</p>
            </div>
          </div>
          <a href="/l10hcm" className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition">
            Về Cổng Thí Sinh
          </a>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs">
            {error}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-96 lg:h-[calc(100vh-140px)]">
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">Người dùng ({users.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`w-full p-4 text-left transition flex items-center justify-between gap-3 ${
                  selectedUser?.id === u.id ? 'bg-indigo-600/10 border-r-2 border-r-indigo-500' : 'hover:bg-slate-850/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full shrink-0 object-cover" />
                  ) : (
                    <div className="h-9 w-9 bg-slate-850 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                      <UserIcon className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    u.role === 'ADMIN' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {u.role}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto h-auto lg:h-[calc(100vh-140px)]">
          {selectedUser ? (
            <div className="flex flex-col gap-6">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 bg-slate-850 rounded-full flex items-center justify-center text-slate-400">
                      <UserIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm font-bold text-white m-0">{selectedUser.name}</h2>
                    <p className="text-xs text-slate-500 m-0">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-400">Chức vụ:</label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    disabled={selectedUser.id === currentUser?.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-205 focus:border-indigo-500 outline-none"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              {selectedUser.role === 'ADMIN' ? (
                <div className="bg-indigo-950/15 border border-indigo-500/20 p-5 rounded-xl text-center text-xs text-indigo-300">
                  ⚡ <strong>Tài khoản có quyền ADMIN:</strong> Được cấp toàn quyền truy cập (xem & ghi dữ liệu) và đặc quyền sử dụng AI Gemini trên tất cả các module. Không cần thiết lập phân quyền lẻ.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                    <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase m-0">Module Lớp 10 (Grade 10 HCM)</h4>
                        <p className="text-[10px] text-slate-500 m-0">Quyền xem, tính toán và nạp dữ liệu THPT</p>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <button
                          onClick={() => handleToggleAllModule('GRADE10', true)}
                          className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold rounded border border-slate-700 cursor-pointer"
                        >Bật hết</button>
                        <button
                          onClick={() => handleToggleAllModule('GRADE10', false)}
                          className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold rounded border border-slate-700 cursor-pointer"
                        >Tắt hết</button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3 text-xs">
                      {([
                        ['view_dashboard', 'Xem tổng quan tuyển sinh, Tra cứu & So sánh trường THPT'],
                        ['view_recommendation', 'Tính điểm & Nhận gợi ý đề xuất nguyện vọng'],
                        ['edit_data', 'Đồng bộ Preset / Import dữ liệu JSON (Quyền Ghi)'],
                      ] as const).map(([fKey, label]) => (
                        <div key={fKey} className="flex items-center justify-between border-b border-slate-800/40 pb-2.5 last:border-b-0 last:pb-0">
                          <span className="font-medium text-slate-300">{label}</span>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handlePermissionToggle('GRADE10', fKey, 'view')}
                              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded border font-bold transition cursor-pointer ${
                                checkPermission('GRADE10', fKey, 'view')
                                  ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-transparent border-slate-800 text-slate-500 hover:bg-slate-850'
                              }`}
                            >View</button>
                            <button
                              onClick={() => handlePermissionToggle('GRADE10', fKey, 'edit')}
                              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded border font-bold transition cursor-pointer ${
                                checkPermission('GRADE10', fKey, 'edit')
                                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                                  : 'bg-transparent border-slate-800 text-slate-500 hover:bg-slate-850'
                              }`}
                            >Edit</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/20">
                    <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase m-0">Module Đại Học</h4>
                        <p className="text-[10px] text-slate-500 m-0">Quyền tra cứu, gợi ý và tối ưu hoá nguyện vọng ĐH</p>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <button
                          onClick={() => handleToggleAllModule('UNIVERSITY', true)}
                          className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold rounded border border-slate-700 cursor-pointer"
                        >Bật hết</button>
                        <button
                          onClick={() => handleToggleAllModule('UNIVERSITY', false)}
                          className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-slate-355 font-semibold rounded border border-slate-700 cursor-pointer"
                        >Tắt hết</button>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3 text-xs">
                      {([
                        ['view_universities', 'Tra cứu thông tin trường Đại học & Ngành học'],
                        ['view_recommendation', 'Đánh giá hồ sơ học bạ / điểm thi & Gợi ý nguyện vọng'],
                        ['view_optimization', 'Tối ưu hoá danh sách thứ tự nguyện vọng'],
                        ['edit_data', 'Đồng bộ Preset / Import dữ liệu JSON (Quyền Ghi)'],
                      ] as const).map(([fKey, label]) => (
                        <div key={fKey} className="flex items-center justify-between border-b border-slate-800/40 pb-2.5 last:border-b-0 last:pb-0">
                          <span className="font-medium text-slate-300">{label}</span>
                          <div className="flex gap-4">
                            <button
                              onClick={() => handlePermissionToggle('UNIVERSITY', fKey, 'view')}
                              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded border font-bold transition cursor-pointer ${
                                checkPermission('UNIVERSITY', fKey, 'view')
                                  ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                                  : 'bg-transparent border-slate-800 text-slate-500 hover:bg-slate-850'
                              }`}
                            >View</button>
                            <button
                              onClick={() => handlePermissionToggle('UNIVERSITY', fKey, 'edit')}
                              className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded border font-bold transition cursor-pointer ${
                                checkPermission('UNIVERSITY', fKey, 'edit')
                                  ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
                                  : 'bg-transparent border-slate-800 text-slate-500 hover:bg-slate-850'
                              }`}
                            >Edit</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-850">
                    <button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Đang lưu...' : 'Lưu cài đặt phân quyền'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <UserIcon className="h-12 w-12 mb-3 text-slate-600" />
              Chọn một người dùng từ danh sách bên trái để phân quyền.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
