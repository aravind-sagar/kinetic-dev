import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, ExternalLink, X, PlusCircle, Box, Folder, Globe, Database, Terminal, Code, Cpu, Activity, Server, Cloud } from 'lucide-react';
import { storage } from '../lib/storage';
import Fuse from 'fuse.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY_PAGES = 'saved_pages';
const STORAGE_KEY_PAGES_LEGACY = 'saved_repositories';
const FAVICON_API_BASE = 'https://www.google.com/s2/favicons?domain=';

const PRESET_GROUPS = ['All', 'Work', 'Open Source', 'AWS', 'Tools'] as const;

const LUCIDE_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Box, Folder, Globe, Database, Terminal, Code, Cpu, Activity, Server, Cloud
};

// Action paths for well-known hostnames
const HOSTNAME_ACTIONS: Record<string, Array<{ label: string; path: string }>> = {
  'github.com':  [{ label: 'Branches', path: '/tree/main' }, { label: 'PRs', path: '/pulls' }, { label: 'Issues', path: '/issues' }, { label: 'Actions', path: '/actions' }],
  'vercel.com':  [{ label: 'Deployments', path: '/deployments' }, { label: 'Logs', path: '/logs' }, { label: 'Settings', path: '/settings' }],
  'vercel.app':  [{ label: 'Deployments', path: '/deployments' }, { label: 'Logs', path: '/logs' }, { label: 'Settings', path: '/settings' }],
  'linear.app':  [{ label: 'Issues', path: '/issues' }, { label: 'Projects', path: '/projects' }, { label: 'Cycles', path: '/cycles' }],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageAction {
  label: string;
  path: string;
}

interface PageTile {
  id: string;
  name: string;
  baseUrl: string;
  group: string;
  icon: string | null; // favicon URL, image URL, or Lucide icon name
  customActions: PageAction[];
}

type FormState = {
  name: string;
  baseUrl: string;
  group: string;
  icon: string;
  customActions: PageAction[];
};

const EMPTY_FORM: FormState = {
  name: '',
  baseUrl: '',
  group: 'Tools',
  icon: '',
  customActions: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectDefaultActions(urlStr: string): PageAction[] {
  try {
    const hostname = new URL(urlStr).hostname;
    for (const [key, actions] of Object.entries(HOSTNAME_ACTIONS)) {
      if (hostname.includes(key)) return actions;
    }
  } catch (_) { /* invalid URL, return empty */ }
  return [];
}

function getFaviconUrl(urlStr: string): string {
  try {
    const { hostname } = new URL(urlStr);
    return `${FAVICON_API_BASE}${hostname}&sz=64`;
  } catch (_) {
    return '';
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function loadPagesFromStorage(): PageTile[] {
  const saved = storage.get(STORAGE_KEY_PAGES);
  if (saved) {
    try { return JSON.parse(saved); } catch (_) {}
  }
  // Migrate from legacy key
  const legacy = storage.get(STORAGE_KEY_PAGES_LEGACY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      return parsed.map((p: PageTile) => ({
        ...p,
        group: 'All',
        icon: null,
        customActions: detectDefaultActions(p.baseUrl),
      }));
    } catch (_) {}
  }
  return [];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PagesBoard() {
  const [pages, setPages] = useState<PageTile[]>(loadPagesFromStorage);
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingPage, setEditingPage] = useState<PageTile | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);

  // Persist to storage on change, clean up legacy key
  useEffect(() => {
    storage.set(STORAGE_KEY_PAGES, JSON.stringify(pages));
    if (storage.get(STORAGE_KEY_PAGES_LEGACY)) {
      storage.remove(STORAGE_KEY_PAGES_LEGACY);
    }
  }, [pages]);

  const groups = useMemo<string[]>(() => {
    const groupSet = new Set<string>(PRESET_GROUPS);
    pages.forEach(p => p.group && groupSet.add(p.group));
    return Array.from(groupSet);
  }, [pages]);

  const fuse = useMemo(
    () => new Fuse(pages, { keys: ['name', 'baseUrl'], threshold: 0.3 }),
    [pages]
  );

  const filteredPages = useMemo(() => {
    let result = activeGroup === 'All' ? pages : pages.filter(p => p.group === activeGroup);
    if (query.trim()) {
      const hits = new Set(fuse.search(query).map(r => r.item.id));
      result = result.filter(p => hits.has(p.id));
    }
    return result;
  }, [query, pages, fuse, activeGroup]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function openAddModal() {
    setEditingPage(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(page: PageTile, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingPage(page);
    setFormData({
      name: page.name,
      baseUrl: page.baseUrl,
      group: page.group ?? 'All',
      icon: page.icon ?? '',
      customActions: page.customActions ?? [],
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPage(null);
    setFormData(EMPTY_FORM);
  }

  function handleSavePage(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.baseUrl) return;

    const url = formData.baseUrl.trim().replace(/\/$/, '');
    const actions = formData.customActions.length > 0
      ? formData.customActions
      : detectDefaultActions(url);

    if (editingPage) {
      setPages(prev => prev.map(p =>
        p.id === editingPage.id
          ? { ...p, name: formData.name, baseUrl: url, group: formData.group || 'All', icon: formData.icon || null, customActions: actions }
          : p
      ));
    } else {
      const newPage: PageTile = {
        id: generateId(),
        name: formData.name,
        baseUrl: url,
        group: formData.group || 'All',
        icon: formData.icon || null,
        customActions: actions,
      };
      setPages(prev => [...prev, newPage]);
    }
    closeModal();
  }

  function handleDeletePage(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this page?')) {
      setPages(prev => prev.filter(p => p.id !== id));
    }
  }

  function updateAction(index: number, field: keyof PageAction, value: string) {
    setFormData(prev => {
      const updated = [...prev.customActions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, customActions: updated };
    });
  }

  function removeAction(index: number) {
    setFormData(prev => ({
      ...prev,
      customActions: prev.customActions.filter((_, i) => i !== index),
    }));
  }

  function addEmptyAction() {
    setFormData(prev => ({
      ...prev,
      customActions: [...prev.customActions, { label: '', path: '' }],
    }));
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Pages</h2>
          <p className="text-on-surface-variant max-w-xl font-body">Manage and quick-navigate your essential codebases and web references.</p>
        </div>
        <button
          onClick={openAddModal}
          className="kinetic-gradient text-on-primary px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          ADD PAGE
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto" style={{ scrollbarWidth: 'none' }}>
          {groups.map(g => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeGroup === g
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={16} />
          <input
            type="text"
            placeholder="Search pages..."
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary/30 outline-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPages.map(page => {
          const LucideIcon = page.icon ? LUCIDE_ICONS[page.icon] : null;
          const isExternalIcon = page.icon?.startsWith('http');

          return (
            <div
              key={page.id}
              role="button"
              tabIndex={0}
              onClick={() => window.open(page.baseUrl, '_blank')}
              onKeyDown={e => e.key === 'Enter' && window.open(page.baseUrl, '_blank')}
              className="group bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 cursor-pointer transition-all flex flex-col relative overflow-hidden"
            >
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10">
                <button onClick={e => openEditModal(page, e)} className="p-2 bg-surface-container-high hover:bg-primary/20 text-on-surface hover:text-primary rounded-lg transition-colors shadow-sm">
                  <Edit2 size={14} />
                </button>
                <button onClick={e => handleDeletePage(page.id, e)} className="p-2 bg-surface-container-high hover:bg-error/20 text-on-surface hover:text-error rounded-lg transition-colors shadow-sm">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Icon + Meta */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0 overflow-hidden shadow-inner">
                  {isExternalIcon
                    ? <img src={page.icon!} alt="" className="w-6 h-6 object-contain" />
                    : LucideIcon
                      ? <LucideIcon width={24} height={24} />
                      : <img
                          src={getFaviconUrl(page.baseUrl)}
                          alt=""
                          className="w-6 h-6 object-contain"
                          onError={e => (e.currentTarget.style.display = 'none')}
                        />
                  }
                </div>
                <div className="overflow-hidden flex-1">
                  <h3 className="font-bold text-on-surface truncate text-lg">{page.name}</h3>
                  <p className="text-xs text-on-surface-variant truncate flex items-center gap-1 group-hover:text-primary/70 transition-colors">
                    {new URL(page.baseUrl).hostname} <ExternalLink size={10} />
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              {page.customActions.length > 0 && (
                <div className="mt-auto pt-4 flex flex-wrap gap-2 border-t border-outline-variant/10">
                  {page.customActions.map((action, i) => {
                    const targetUrl = action.path.startsWith('http')
                      ? action.path
                      : `${page.baseUrl}${action.path.startsWith('/') ? '' : '/'}${action.path}`;
                    return (
                      <button
                        key={i}
                        onClick={e => { e.stopPropagation(); window.open(targetUrl, '_blank'); }}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-highest hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredPages.length === 0 && (
          <div className="col-span-full py-12 text-center text-on-surface-variant/40 font-body border border-outline-variant/10 rounded-2xl border-dashed">
            No pages found.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container/50">
              <h3 className="text-xl font-bold font-headline text-on-surface">
                {editingPage ? 'Edit Page' : 'Add New Page'}
              </h3>
              <button type="button" onClick={closeModal} className="text-outline hover:text-on-surface transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Name</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Next.js Docs"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Base URL</label>
                  <input
                    required
                    type="url"
                    value={formData.baseUrl}
                    onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder="https://nextjs.org"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Group</label>
                  <input
                    type="text"
                    value={formData.group}
                    onChange={e => setFormData(prev => ({ ...prev, group: e.target.value }))}
                    placeholder="e.g. Work, Tools"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Icon (URL or Lucide name)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Leave empty for auto favicon"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  />
                </div>
              </div>

              {/* Custom Actions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quick Actions</label>
                  <button
                    type="button"
                    onClick={addEmptyAction}
                    className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 bg-primary/10 px-2 py-1 rounded"
                  >
                    <PlusCircle size={12} /> ADD ACTION
                  </button>
                </div>
                <div className="space-y-3 bg-surface-container p-4 rounded-xl border border-outline-variant/10">
                  {formData.customActions.length === 0 ? (
                    <p className="text-sm text-on-surface-variant/60 font-body text-center py-2">
                      No custom actions. Auto-detect runs on save based on URL.
                    </p>
                  ) : (
                    formData.customActions.map((action, index) => (
                      <div key={index} className="flex gap-3 items-center">
                        <input
                          type="text"
                          placeholder="Label"
                          value={action.label}
                          onChange={e => updateAction(index, 'label', e.target.value)}
                          className="w-1/3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Path (e.g. /pulls or https://...)"
                          value={action.path}
                          onChange={e => updateAction(index, 'path', e.target.value)}
                          className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="kinetic-gradient text-on-primary px-8 py-2 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  SAVE PAGE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
