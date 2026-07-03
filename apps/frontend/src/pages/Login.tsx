import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Globe } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e.message || 'Không thể kết nối Google OAuth.');
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_50%)] pointer-events-none" />
      
      <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-2xl max-w-md w-full shadow-2xl flex flex-col gap-6 relative">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-3 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <div className="mt-2">
            <h1 className="text-xl font-bold tracking-tight text-white m-0">Admission Decision Engine</h1>
            <p className="text-xs text-slate-400 mt-1.5">Hệ thống Đánh giá & Gợi ý Nguyện vọng Đại học / Lớp 10</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs text-center font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-2">
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-sm disabled:opacity-50 cursor-pointer"
          >
            {loggingIn ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-slate-900" />
            ) : (
              <Globe className="h-5 w-5" />
            )}
            Đăng nhập với Google
          </button>
          
          <div className="text-[10px] text-slate-500 text-center leading-normal">
            Bằng việc đăng nhập, bạn đồng ý với các chính sách bảo mật dữ liệu và điều khoản tuyển sinh của hệ thống.
          </div>
        </div>
      </div>
    </div>
  );
}
