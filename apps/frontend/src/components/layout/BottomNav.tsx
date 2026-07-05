import { useState } from 'react';
import type { ReactNode } from 'react';
import { LayoutGrid, X } from 'lucide-react';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export interface BottomNavMoreItem extends BottomNavItem {
  description?: string;
}

interface BottomNavProps {
  items: BottomNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Secondary destinations collapsed behind a "Thêm" sheet */
  moreItems?: BottomNavMoreItem[];
}

/**
 * Mobile-app style fixed bottom navigation (hidden on md+ screens).
 * Shows up to 5 primary destinations; anything extra goes into a
 * bottom-sheet opened by the "Thêm" button. Pair with `pb-28 md:pb-*`
 * on the page content so nothing hides behind the bar.
 */
export default function BottomNav({ items, activeId, onSelect, moreItems = [] }: BottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasMore = moreItems.length > 0;
  const moreActive = moreItems.some((item) => item.id === activeId);

  if (items.length === 0 && !hasMore) return null;

  const handleSelect = (id: string) => {
    onSelect(id);
    setSheetOpen(false);
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-[env(safe-area-inset-bottom)]"
        aria-label="Điều hướng chính"
      >
        <div className="flex items-stretch">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 transition cursor-pointer ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 active:text-slate-200'
                }`}
              >
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-500" />}
                <span className="relative">
                  {item.icon}
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] leading-none truncate max-w-full px-0.5 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {hasMore && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              className={`relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 transition cursor-pointer ${
                moreActive ? 'text-indigo-400' : 'text-slate-400 active:text-slate-200'
              }`}
            >
              {moreActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-500" />}
              <LayoutGrid className="h-5 w-5" />
              <span className={`text-[10px] leading-none ${moreActive ? 'font-bold' : 'font-medium'}`}>Thêm</span>
            </button>
          )}
        </div>
      </nav>

      {/* "Thêm" bottom sheet */}
      {hasMore && sheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end"
          onClick={() => setSheetOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Tính năng khác"
        >
          <div
            className="w-full bg-slate-900 border-t border-slate-800 rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tính năng khác</span>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {moreItems.map((item) => {
                const isActive = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition text-left cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className={`p-2 rounded-lg shrink-0 ${isActive ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold truncate">{item.label}</span>
                      {item.description && (
                        <span className="block text-[10px] text-slate-500 truncate">{item.description}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
