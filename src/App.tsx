import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import JsonFormatter from './pages/JsonFormatter';
import Shortcuts from './pages/Shortcuts';
import Converters from './pages/Converters';
import DiffChecker from './pages/DiffChecker';

export type Theme = 'dark' | 'light';
export const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'dark',
  toggleTheme: () => {},
});
export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    } else {
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        
        <main className="ml-64 flex-1 flex flex-col min-h-screen">
          <TopNav />
          
          <div className="mt-16 p-8 flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/json-formatter" element={<JsonFormatter />} />
              <Route path="/diff-checker" element={<DiffChecker />} />
              <Route path="/shortcuts" element={<Shortcuts />} />
              <Route path="/converters" element={<Converters />} />
            </Routes>
          </div>
        </main>

      </div>
    </ThemeContext.Provider>
  );
}
