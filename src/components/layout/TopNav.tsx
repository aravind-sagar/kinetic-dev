import { useState } from 'react';
import { Search, Moon, Sun, X, Settings, LogOut, User } from 'lucide-react';
import { useTheme } from '../../App';
import { useNavigate } from 'react-router-dom';
import { isPersistentMode, setPersistentMode } from '../../lib/storage';
import { useSession, signOut } from '../../lib/auth-client';

const TOOLS = [
  { label: 'Markdown Editor', path: '/editor', keywords: ['editor', 'markdown', 'md', 'mermaid', 'preview'] },
  { label: 'JSON Formatter', path: '/json-formatter', keywords: ['json', 'formatter', 'beautify', 'lint'] },
  { label: 'Diff Checker', path: '/diff-checker', keywords: ['diff', 'compare', 'checker'] },
  { label: 'VS Code Shortcuts', path: '/shortcuts', keywords: ['shortcuts', 'vscode', 'keybinding', 'keyboard'] },
  { label: 'File Converters', path: '/converters', keywords: ['converter', 'pdf', 'word', 'docx', 'convert'] },
  { label: 'Pages', path: '/pages', keywords: ['pages', 'github', 'git', 'repo', 'code'] },
  { label: 'Dashboard', path: '/', keywords: ['dashboard', 'home'] },
];

export function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [persistentMode, setPersistentModeState] = useState(isPersistentMode());
  const navigate = useNavigate();
  const { data: sessionData } = useSession();
  const user = sessionData?.user;

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
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-on-surface/70 hover:text-primary transition-all p-1.5 pr-3 hover:bg-surface-container-high rounded-full border border-transparent hover:border-outline-variant/20"
          >
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                {user?.name?.[0] || <User size={14} />}
              </div>
            )}
            <span className="text-sm font-bold truncate max-w-[100px]">{user?.name || "Settings"}</span>
          </button>
          
          {showSettings && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
              {user ? (
                <div className="p-4 border-b border-outline-variant/10 bg-surface-container">
                  <p className="font-bold text-sm text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                </div>
              ) : (
                <div className="p-4 border-b border-outline-variant/10">
                  <button onClick={() => navigate('/signin')} className="w-full kinetic-gradient py-2 rounded-lg text-on-primary text-sm font-bold">Sign In</button>
                </div>
              )}

              <div className="p-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">Preferences</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface/80">Persistent Sync</span>
                  <button
                    onClick={() => {
                      const next = !persistentMode;
                      setPersistentModeState(next);
                      setPersistentMode(next);
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${persistentMode ? 'bg-primary' : 'bg-surface-container-highest'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-on-primary transition-transform ${persistentMode ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
                <p className="text-[10px] text-outline mt-2 leading-tight">
                  {user ? "When enabled, your work syncs to the cloud securely." : "When enabled, your work is saved locally in your browser."}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-on-surface/80">Data Tools</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.open('/api/sync/export', '_blank')}
                      className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest hover:bg-primary/20 text-on-surface-variant hover:text-primary rounded transition-colors"
                      title="Export Data"
                    >
                      Export JSON
                    </button>
                    <label className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest hover:bg-secondary/20 text-on-surface-variant hover:text-secondary rounded transition-colors cursor-pointer" title="Import Data">
                      Import
                      <input 
                        type="file" 
                        accept=".json"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const text = await file.text();
                            const parsed = JSON.parse(text);
                            const res = await fetch('/api/sync/import', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(parsed)
                            });
                            if (res.ok) alert('Import successful, please refresh.');
                            else alert('Import failed.');
                          } catch (err) {
                            alert('Malformed file.');
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {user && (
                <div className="p-2 border-t border-outline-variant/10">
                  <button 
                    onClick={async () => {
                      await signOut();
                      navigate('/');
                      setShowSettings(false);
                    }}
                    className="w-full flex items-center gap-2 text-error px-4 py-2 hover:bg-error/10 transition-colors rounded-lg text-sm font-bold"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
