import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Moon, Sun, LogOut, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import {
  applyThemeToDocument, readStoredTheme, writeStoredTheme,
} from '../../utils/theme';
import type { AppTheme } from '../../utils/theme';

export interface HeaderLink {
  label: string;
  href?: string;
  onClick?: () => void;
  /** Visual accent for portal cross-links */
  tone?: 'default' | 'indigo' | 'emerald';
}

interface AppHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  /** Portal / admin links. Desktop: inline buttons. Mobile: collapsed into the account menu. */
  links?: HeaderLink[];
}

const toneClasses: Record<NonNullable<HeaderLink['tone']>, string> = {
  default: 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300',
  indigo: 'bg-indigo-800/60 hover:bg-indigo-700/60 border-indigo-700/50 text-indigo-300',
  emerald: 'bg-emerald-800/60 hover:bg-emerald-700/60 border-emerald-700/50 text-emerald-300',
};

/**
 * Shared responsive app header.
 * Mobile: one compact row — logo + title on the left, theme toggle and an
 * avatar button that opens an account sheet with all secondary actions.
 * Desktop: full layout with inline links, user info, theme and logout.
 */
export default function AppHeader({ icon, title, subtitle, links = [] }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const next = (event as CustomEvent<AppTheme>).detail;
      if (next === 'light' || next === 'dark') setTheme(next);
    };
    window.addEventListener('app-theme-change', handleThemeChange);
    return () => window.removeEventListener('app-theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const toggleTheme = () => {
    const next: AppTheme = theme === 'light' ? 'dark' : 'light';
    applyThemeToDocument(next);
    writeStoredTheme(next);
    setTheme(next);
  };

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="h-9 w-9 md:h-8 md:w-8 shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
      title={theme === 'light' ? 'Chuyển sang dark mode' : 'Chuyển sang light mode'}
      aria-label={theme === 'light' ? 'Chuyển sang dark mode' : 'Chuyển sang light mode'}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );

  const avatar = user?.avatar ? (
    <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-slate-700 object-cover" />
  ) : (
    <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">
      {user?.name?.[0]?.toUpperCase()}
    </div>
  );

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5 md:py-4 flex flex-row justify-between items-center gap-2 md:gap-4">
        {/* Logo + title */}
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <div className="bg-indigo-600 p-2 md:p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/30 shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm md:text-xl font-bold tracking-tight text-white m-0 truncate">{title}</h1>
            {subtitle && <p className="text-[10px] md:text-xs text-slate-400 m-0 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs font-bold text-white">{user?.name}</div>
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user?.role}</div>
            </div>
            {avatar}
          </div>

          {links.map((link) => {
            const classes = `text-xs font-semibold px-3 py-1.5 border rounded-lg transition cursor-pointer ${toneClasses[link.tone ?? 'default']}`;
            return link.href ? (
              <a key={link.label} href={link.href} className={classes}>{link.label}</a>
            ) : (
              <button key={link.label} type="button" onClick={link.onClick} className={classes}>{link.label}</button>
            );
          })}

          {themeButton}
          <button onClick={logout} className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer">
            Đăng xuất
          </button>
        </div>

        {/* Mobile actions: theme + account menu */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0" ref={menuRef}>
          {themeButton}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="h-9 pl-1 pr-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
            aria-label="Mở menu tài khoản"
            aria-expanded={menuOpen}
          >
            {avatar}
            <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-3 top-[calc(100%+6px)] w-64 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 animate-pop-in">
              <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1.5">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user?.role}</div>
              </div>

              {links.map((link) => {
                const classes = 'w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition text-left cursor-pointer';
                return link.href ? (
                  <a key={link.label} href={link.href} className={classes} onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </a>
                ) : (
                  <button
                    key={link.label}
                    type="button"
                    className={classes}
                    onClick={() => { setMenuOpen(false); link.onClick?.(); }}
                  >
                    {link.label}
                  </button>
                );
              })}

              <div className="border-t border-slate-800/80 mt-1.5 pt-1.5">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition text-left cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
