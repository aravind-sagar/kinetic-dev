import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileCode, 
  Braces, 
  FileDiff, 
  Keyboard, 
  RefreshCw, 
  Settings, 
  Terminal,
  Plus
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FileCode, label: 'Editor', path: '/editor' },
  { icon: Braces, label: 'JSON Formatter', path: '/json-formatter' },
  { icon: FileDiff, label: 'Diff Checker', path: '/diff-checker' },
  { icon: Keyboard, label: 'Shortcuts', path: '/shortcuts' },
  { icon: RefreshCw, label: 'Converters', path: '/converters' },
];

const secondaryItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Terminal, label: 'Logs', path: '/logs' },
];

export function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant/10 bg-surface-container-low flex flex-col py-6 px-4 z-50">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-bold tracking-tighter text-on-surface font-headline uppercase">Kinetic</h1>
        <p className="text-[10px] uppercase tracking-widest text-primary/40 font-bold">Terminal v1.0</p>
      </div>

      <nav className="flex-1 space-y-1">
        <div className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant/40 mb-2 px-2">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-headline font-medium text-sm tracking-tight transition-all active:scale-[0.98]",
              isActive 
                ? "text-primary border-l-2 border-primary bg-primary/5" 
                : "text-on-surface/60 hover:bg-surface-container-high hover:text-on-surface"
            )}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/10">
        <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-primary/40 font-bold">
          Kinetic Terminal v1.0
        </div>
        <a 
          href="https://aravind-sagar.github.io/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 block text-[10px] font-bold text-on-surface/40 hover:text-primary transition-colors uppercase tracking-widest"
        >
          Made by Aravind
        </a>
      </div>
    </aside>
  );
}
