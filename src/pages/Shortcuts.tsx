import React, { useState, useMemo } from 'react';
import { Keyboard, Search, Filter, ChevronLeft, ChevronRight, Monitor, Laptop, Upload, RotateCcw } from 'lucide-react';
import shortcutsData from '../data/shortcuts-data.json';
import { cn } from '@/src/lib/utils';
import { storage } from '../lib/storage';

export default function Shortcuts() {
  const [os, setOs] = useState<'mac' | 'win'>('win');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [customShortcuts, setCustomShortcuts] = useState<any[]>(() => {
    const saved = storage.get('custom_shortcuts');
    return saved ? JSON.parse(saved) : null;
  });
  const [errorMsg, setErrorMsg] = useState('');

  const displayedShortcuts = customShortcuts || shortcutsData;

  const filteredShortcuts = useMemo(() => {
    return displayedShortcuts.filter(s => {
      const matchesCategory = activeCategory === 'ALL' || s.category === activeCategory;
      const matchesSearch = s.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const totalPages = Math.ceil(filteredShortcuts.length / itemsPerPage);
  const currentShortcuts = filteredShortcuts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const categories = [
    { label: 'GENERAL', icon: Monitor, color: 'primary' },
    { label: 'EDITOR', icon: Keyboard, color: 'secondary' },
    { label: 'NAVIGATION', icon: Laptop, color: 'tertiary' },
    { label: 'SEARCH', icon: Search, color: 'error' },
    { label: 'DISPLAY', icon: Monitor, color: 'primary' },
    { label: 'FILE', icon: Laptop, color: 'secondary' },
    { label: 'REFACTOR', icon: Keyboard, color: 'tertiary' },
    { label: 'MULTI-CURSOR', icon: Keyboard, color: 'error' },
    { label: 'TERMINAL', icon: Keyboard, color: 'primary' },
    { label: 'DEBUG', icon: Laptop, color: 'secondary' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) throw new Error('Expected a JSON array.');
        
        const parsed = json.map((item, idx) => {
          if (!item.key && !item.command) throw new Error(`Missing key or command at index ${idx}`);
          const action = item.command ? item.command.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim().toUpperCase() : 'UNKNOWN';
          return {
            id: item.command || `custom-${idx}`,
            action: action,
            category: 'CUSTOM',
            mac: item.key ? item.key.replace(/ctrl/gi, 'cmd').split('+') : [],
            win: item.key ? item.key.split('+') : []
          };
        });

        storage.set('custom_shortcuts', JSON.stringify(parsed));
        setCustomShortcuts(parsed);
        setErrorMsg('');
        setActiveCategory('ALL');
      } catch (err: any) {
        setErrorMsg(`Failed to parse shortcuts: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const handleResetDefaults = () => {
    storage.remove('custom_shortcuts');
    setCustomShortcuts(null);
    setActiveCategory('ALL');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">VS Code Shortcuts</h2>
          <p className="text-on-surface-variant max-w-xl font-body mb-4">Master your workflow with the ultimate keybinding reference. Optimized for Kinetic High-Velocity Engineering.</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="cursor-pointer text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              <Upload size={14} />
              Import your own VS Code shortcuts
              <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </label>
            {customShortcuts && (
              <button 
                onClick={handleResetDefaults}
                className="text-xs font-bold uppercase tracking-widest text-error hover:text-error/80 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={14} />
                Reset to defaults
              </button>
            )}
            {errorMsg && <span className="text-xs text-error font-mono">{errorMsg}</span>}
          </div>
        </div>
        <div className="flex gap-2 p-1 bg-surface-container rounded-xl">
          <button 
            onClick={() => setOs('mac')}
            className={cn("px-4 py-2 rounded-lg text-xs font-semibold transition-all", os === 'mac' ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface")}
          >
            MACOS
          </button>
          <button 
            onClick={() => setOs('win')}
            className={cn("px-4 py-2 rounded-lg text-xs font-semibold transition-all", os === 'win' ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface")}
          >
            WINDOWS
          </button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div 
          onClick={() => { setActiveCategory('ALL'); setCurrentPage(1); }}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer group flex flex-col items-center justify-center text-center",
            activeCategory === 'ALL' ? "bg-primary/10 border-primary/40" : "bg-surface-container-high border-outline-variant/10 hover:border-primary/20"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-widest">All</span>
        </div>
        <div 
          onClick={() => { setActiveCategory('CUSTOM'); setCurrentPage(1); }}
          className={cn(
            "p-4 rounded-xl border transition-all cursor-pointer group flex flex-col items-center justify-center text-center",
            activeCategory === 'CUSTOM' ? "bg-primary/10 border-primary/40" : "bg-surface-container-high border-outline-variant/10 hover:border-primary/20",
            !customShortcuts && "opacity-50 pointer-events-none"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-widest">Custom</span>
        </div>
        {categories.map((cat) => (
          <div 
            key={cat.label} 
            onClick={() => { setActiveCategory(cat.label); setCurrentPage(1); }}
            className={cn(
              "p-4 rounded-xl border transition-all cursor-pointer group flex flex-col items-center justify-center text-center",
              activeCategory === cat.label ? "bg-primary/10 border-primary/40" : "bg-surface-container-high border-outline-variant/10 hover:border-primary/20"
            )}
          >
            <cat.icon size={20} className={cn("mb-2 block group-hover:scale-110 transition-transform", `text-${cat.color}`)} />
            <h3 className="text-[10px] font-bold uppercase tracking-tighter">{cat.label}</h3>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
        <input 
          type="text" 
          placeholder="Search shortcuts by action or command ID..."
          className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl pl-12 pr-6 py-4 text-sm focus:ring-1 focus:ring-primary/30 outline-none"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl border border-outline-variant/5">
        <div className="px-6 py-4 flex justify-between items-center bg-surface-container-highest/10 border-b border-outline-variant/10">
          <h2 className="font-bold text-on-surface tracking-tight text-sm uppercase tracking-widest">Keyboard Shortcuts Reference</h2>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full text-[10px] font-bold text-primary uppercase">
              {activeCategory}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/30">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Action</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Keybinding</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Command ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-outline">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {currentShortcuts.length > 0 ? currentShortcuts.map((s, i) => (
                <tr key={s.id} className={cn("hover:bg-primary/5 transition-colors group", i % 2 === 1 && "bg-surface-container-low/20")}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-on-surface">{s.action}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {(os === 'mac' ? s.mac : s.win).map((k, idx) => (
                        <kbd key={idx} className="px-2 py-1 rounded bg-surface-container-highest text-[10px] font-mono text-primary border-b-2 border-primary/40 shadow-sm min-w-[24px] text-center">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-[10px] font-mono text-secondary opacity-50 group-hover:opacity-100 transition-opacity">{s.id}</code>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container-highest text-[9px] font-bold text-on-surface-variant uppercase tracking-tighter">
                      {s.category}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-on-surface-variant/40 font-body">
                    No shortcuts matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/10">
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
            Showing <span className="text-on-surface">{currentShortcuts.length}</span> of <span className="text-on-surface">{filteredShortcuts.length}</span> results
          </span>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 hover:text-primary transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg">
                Page {currentPage} of {totalPages || 1}
              </span>
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 hover:text-primary transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
