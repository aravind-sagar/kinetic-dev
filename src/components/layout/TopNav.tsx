import React, { useState } from 'react';
import { Search, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../../App';
import { useNavigate } from 'react-router-dom';

const TOOLS = [
  { label: 'Markdown Editor', path: '/editor', keywords: ['editor', 'markdown', 'md', 'mermaid', 'preview'] },
  { label: 'JSON Formatter', path: '/json-formatter', keywords: ['json', 'formatter', 'beautify', 'lint'] },
  { label: 'Diff Checker', path: '/diff-checker', keywords: ['diff', 'compare', 'checker'] },
  { label: 'VS Code Shortcuts', path: '/shortcuts', keywords: ['shortcuts', 'vscode', 'keybinding', 'keyboard'] },
  { label: 'File Converters', path: '/converters', keywords: ['converter', 'pdf', 'word', 'docx', 'convert'] },
  { label: 'Dashboard', path: '/', keywords: ['dashboard', 'home'] },
];

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = query.trim().length > 0
    ? TOOLS.filter(t =>
        t.label.toLowerCase().includes(query.toLowerCase()) ||
        t.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 flex justify-between items-center px-8">
      <div className="flex items-center gap-4 w-1/3 relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" size={16} />
          <input 
            className="w-full bg-surface-container-highest/30 border-none rounded-lg pl-10 pr-8 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary/30 font-body placeholder:text-outline/50 outline-none"
            placeholder="Search for tools, snippets, or commands..."
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface">
              <X size={14} />
            </button>
          )}
        </div>
        {isOpen && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-50 overflow-hidden">
            {filtered.map(t => (
              <button
                key={t.path}
                onMouseDown={() => handleSelect(t.path)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-primary/10 hover:text-primary transition-colors border-b border-outline-variant/10 last:border-0 font-body"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="text-on-surface/70 hover:text-primary transition-all p-2 hover:bg-surface-container-high rounded-full"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
