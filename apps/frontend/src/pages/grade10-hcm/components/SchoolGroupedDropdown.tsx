import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import type { G10SchoolItem } from '../../../services/api';

interface SchoolGroupedDropdownProps {
  schools: G10SchoolItem[];
  value: string; // selected school code
  onChange: (code: string) => void;
  placeholder?: string;
}

/** Two-level school selector: schools grouped under district headers,
    with an inline search box for quick filtering. */
export default function SchoolGroupedDropdown({
  schools, value, onChange, placeholder,
}: SchoolGroupedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const selected = schools.find((s) => s.code === value) || null;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? schools.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.district?.name || '').toLowerCase().includes(q),
        )
      : schools;

    const map = new Map<string, G10SchoolItem[]>();
    for (const school of filtered) {
      const districtName = school.district?.name || 'Khu vực khác';
      if (!map.has(districtName)) map.set(districtName, []);
      map.get(districtName)!.push(school);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'vi'))
      .map(([districtName, list]) => ({
        districtName,
        schools: list.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      }));
  }, [schools, query]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 flex items-center justify-between gap-2 outline-none transition cursor-pointer"
      >
        <span className={`truncate ${selected ? '' : 'text-slate-500'}`}>
          {selected
            ? `${selected.name}${selected.district?.name ? ` — ${selected.district.name}` : ''}`
            : placeholder || '-- Chọn trường --'}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="p-0.5 text-slate-500 hover:text-white cursor-pointer"
              title="Bỏ chọn"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Inline search */}
          <div className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên trường hoặc quận..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* District → schools */}
          <div className="max-h-64 overflow-y-auto">
            {groups.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">Không tìm thấy trường phù hợp</div>
            ) : (
              groups.map((group) => (
                <div key={group.districtName}>
                  <div className="sticky top-0 z-10 px-3 py-1.5 bg-slate-800 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    📍 {group.districtName} ({group.schools.length})
                  </div>
                  {group.schools.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => { onChange(school.code); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 text-xs transition cursor-pointer ${
                        school.code === value
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{school.name}</span>
                      {school.latestCutoffNV1 != null && (
                        <span className="shrink-0 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5">
                          NV1: {school.latestCutoffNV1}đ
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
