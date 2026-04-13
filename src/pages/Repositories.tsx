import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Trash2, Edit2, Github, GitBranch, GitPullRequest, CircleDot, PlayCircle, ExternalLink, X } from 'lucide-react';
import { storage } from '../lib/storage';
import { cn } from '@/src/lib/utils';
import Fuse from 'fuse.js';

interface Repo {
  id: string;
  name: string;
  baseUrl: string;
}

export default function Repositories() {
  const [repos, setRepos] = useState<Repo[]>(() => {
    const saved = storage.get('saved_repositories');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'facebook/react', baseUrl: 'https://github.com/facebook/react' }
    ];
  });
  
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<Repo | null>(null);
  
  const [formData, setFormData] = useState({ name: '', baseUrl: '' });

  useEffect(() => {
    storage.set('saved_repositories', JSON.stringify(repos));
  }, [repos]);

  const fuse = useMemo(() => new Fuse(repos, { keys: ['name', 'baseUrl'], threshold: 0.3 }), [repos]);

  const filteredRepos = useMemo(() => {
    if (!query.trim()) return repos;
    return fuse.search(query).map(r => r.item);
  }, [query, repos, fuse]);

  const handleSaveRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.baseUrl) return;
    
    let url = formData.baseUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);

    if (editingRepo) {
      setRepos(repos.map(r => r.id === editingRepo.id ? { ...r, name: formData.name, baseUrl: url } : r));
    } else {
      setRepos([...repos, { id: Math.random().toString(36).substr(2, 9), name: formData.name, baseUrl: url }]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRepo(null);
    setFormData({ name: '', baseUrl: '' });
  };

  const openEdit = (repo: Repo, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRepo(repo);
    setFormData({ name: repo.name, baseUrl: repo.baseUrl });
    setShowModal(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this repository?')) {
      setRepos(repos.filter(r => r.id !== id));
    }
  };

  const QUICK_ACTIONS = [
    { label: 'Branches', icon: GitBranch, path: '/tree/main' },
    { label: 'PRs', icon: GitPullRequest, path: '/pulls' },
    { label: 'Issues', icon: CircleDot, path: '/issues' },
    { label: 'Actions', icon: PlayCircle, path: '/actions' }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Repositories</h2>
          <p className="text-on-surface-variant max-w-xl font-body">Manage and quick-navigate your essential codebases.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="kinetic-gradient text-on-primary px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          ADD REPO
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline/50" size={18} />
        <input 
          type="text" 
          placeholder="Fuzzy search repositories..."
          className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl pl-12 pr-6 py-4 text-sm focus:ring-1 focus:ring-primary/30 outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRepos.map(repo => (
          <div 
            key={repo.id}
            onClick={() => window.open(repo.baseUrl, '_blank')}
            className="group bg-surface-container-low border border-outline-variant/10 rounded-2xl p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 cursor-pointer transition-all flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10">
              <button 
                onClick={(e) => openEdit(repo, e)}
                className="p-2 bg-surface-container-high hover:bg-primary/20 text-on-surface hover:text-primary rounded-lg transition-colors shadow-sm"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={(e) => handleDelete(repo.id, e)}
                className="p-2 bg-surface-container-high hover:bg-error/20 text-on-surface hover:text-error rounded-lg transition-colors shadow-sm"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                <Github size={20} />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-on-surface truncate text-lg">{repo.name}</h3>
                <p className="text-xs text-on-surface-variant truncate underline hover:text-primary flex items-center gap-1 group-hover:text-primary/70 transition-colors">
                  {repo.baseUrl} <ExternalLink size={10} />
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 grid grid-cols-4 gap-2 border-t border-outline-variant/10">
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`${repo.baseUrl}${action.path}`, '_blank');
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
                  title={action.label}
                >
                  <action.icon size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredRepos.length === 0 && (
          <div className="col-span-full py-12 text-center text-on-surface-variant/40 font-body border border-outline-variant/10 rounded-2xl border-dashed">
            No repositories found matching your search.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold font-headline mb-6">{editingRepo ? 'Edit Repository' : 'Add Repository'}</h3>
            <form onSubmit={handleSaveRepo} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. facebook/react"
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">Base URL</label>
                <input 
                  required
                  type="url" 
                  value={formData.baseUrl}
                  onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://github.com/facebook/react"
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  className="kinetic-gradient text-on-primary px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  SAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
