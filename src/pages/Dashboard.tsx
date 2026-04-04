import React, { useState } from 'react';
import { Bolt, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const tools = [
  { 
    title: 'Markdown Editor', 
    desc: 'Real-time GitHub flavored preview with full export capabilities.', 
    icon: 'edit_note',
    color: 'primary',
    path: '/editor'
  },
  { 
    title: 'JSON Formatter', 
    desc: 'Validate, minify, or beautify your JSON data instantly.', 
    icon: 'data_object',
    color: 'secondary',
    path: '/json-formatter'
  },
  { 
    title: 'Diff Checker', 
    desc: 'Compare files or text side-by-side with semantic highlighting.', 
    icon: 'difference',
    color: 'tertiary',
    path: '/diff-checker'
  },
  { 
    title: 'Shortcuts', 
    desc: 'Master your workflow with the ultimate keybinding reference for VS Code.', 
    icon: 'keyboard',
    color: 'primary',
    path: '/shortcuts'
  },
  { 
    title: 'Converters', 
    desc: 'Base64, Hex, URL, and Unix Epoch transformations.', 
    icon: 'transform',
    color: 'error',
    path: '/converters'
  },
];

export default function Dashboard() {
  const [isGridView, setIsGridView] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container p-10 min-h-[320px] flex flex-col justify-end group">
        <div className="absolute top-0 right-0 w-2/3 h-full opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-primary/20 to-transparent"></div>
          <div className="w-full h-full border-[20px] border-outline-variant/10 rounded-full -mr-40 -mt-40"></div>
        </div>
        
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest mb-4">
            System Operational
          </span>
          <h2 className="text-5xl font-bold font-headline tracking-tighter text-on-surface mb-4">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">Dev</span>.
          </h2>
          <p className="text-on-surface/60 max-w-lg font-body leading-relaxed">
            Ready to optimize your workflow? Kinetic Terminal is ready to process your snippets and transformations.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section>
        <div className="mb-6 flex justify-between items-end">
          <h3 className="font-headline text-2xl font-bold">Standard Tools</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsGridView(true)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isGridView ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface/30 hover:text-primary"
              )}
            >
              <span className="material-symbols-outlined text-xl">grid_view</span>
            </button>
            <button 
              onClick={() => setIsGridView(false)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                !isGridView ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface/30 hover:text-primary"
              )}
            >
              <span className="material-symbols-outlined text-xl">list</span>
            </button>
          </div>
        </div>

        <div className={cn(
          "grid gap-6",
          isGridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"
        )}>
          {tools.map((tool, i) => (
            <Link key={tool.title} to={tool.path}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "group cursor-pointer bg-surface-container-high p-6 rounded-xl border border-outline-variant/0 hover:border-primary/30 transition-all duration-300 flex relative overflow-hidden h-full",
                  isGridView ? "flex-col" : "flex-row items-center gap-6"
                )}
              >
                <div className={cn(
                  "rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0",
                  isGridView ? "w-12 h-12 mb-4" : "w-14 h-14",
                  tool.color === 'primary' && "bg-primary/10 text-primary",
                  tool.color === 'secondary' && "bg-secondary/10 text-secondary",
                  tool.color === 'tertiary' && "bg-tertiary/10 text-tertiary",
                  tool.color === 'error' && "bg-error/10 text-error",
                )}>
                  <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2">{tool.title}</h4>
                  <p className="text-xs text-on-surface/50 leading-relaxed">{tool.desc}</p>
                </div>
                <div className={cn("mt-auto flex items-center justify-end", !isGridView && "ml-auto")}>
                  <ArrowRight size={16} className="text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// Helper for conditional classes
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
