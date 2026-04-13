import React, { useState } from 'react';
import { Download, Copy, Trash2, Settings2, Activity, CheckCircle2, FileJson, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { storage } from '../lib/storage';
const initialJson = {
  project: {
    name: "Kinetic Terminal",
    version: "1.0.4-stable",
    status: "operational",
    environment: "production",
    metrics: {
      latency: "14ms",
      uptime: 0.9998
    },
    dependencies: [
      "typescript",
      "tailwind-css",
      "space-grotesk-font"
    ],
    config: {
      theme: "obsidian-dark",
      animations: false,
      caching: {
        strategy: "stale-while-revalidate",
        ttl: 3600
      }
    }
  }
};

export default function JsonFormatter() {
  const [jsonStr, setJsonStr] = useState(() => storage.get('json_formatter_input') || JSON.stringify(initialJson, null, 2));
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);
  const [rules, setRules] = useState({
    sortKeys: true,
    removeWhitespace: false
  });

  React.useEffect(() => {
    const t = setTimeout(() => {
      storage.set('json_formatter_input', jsonStr);
    }, 500);
    return () => clearTimeout(t);
  }, [jsonStr]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset?")) {
      setJsonStr('');
      storage.remove('json_formatter_input');
    }
  };

  const sortObject = (obj: any): any => {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    return Object.keys(obj).sort().reduce((acc: any, key) => {
      acc[key] = sortObject(obj[key]);
      return acc;
    }, {});
  };

  const processJson = (input: string = jsonStr, updateState: boolean = true) => {
    try {
      let parsed = JSON.parse(input);
      if (rules.sortKeys) {
        parsed = sortObject(parsed);
      }
      
      let result = '';
      if (rules.removeWhitespace) {
        result = JSON.stringify(parsed);
      } else {
        const space = indent === 0 ? '\t' : indent;
        result = JSON.stringify(parsed, null, space);
      }
      
      if (updateState) {
        setJsonStr(result);
      }
      return result;
    } catch (e) {
      return null;
    }
  };

  React.useEffect(() => {
    // Auto-beautify when rules change if valid
    const formatted = processJson(jsonStr, false);
    if (formatted && formatted !== jsonStr) {
      setJsonStr(formatted);
    }
  }, [rules, indent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isJsonValid = () => {
    try {
      JSON.parse(jsonStr);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight mb-2">JSON Formatter</h2>
          <p className="text-on-surface-variant text-sm font-body">Cleanse, validate and beautify your data structures with kinetic precision.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="px-6 py-2 bg-surface-container-high text-error rounded-lg text-sm font-semibold border border-outline-variant/10 hover:border-error/20 transition-all flex items-center gap-2 hover:bg-error/10"
          >
            <Trash2 size={16} />
            Reset
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 kinetic-gradient text-on-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-primary/10 active:scale-95 transition-all"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-20rem)] min-h-[500px]">
        {/* Editor Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-low rounded-xl flex-1 border border-outline-variant/5 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-surface-container border-b border-outline-variant/10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", isJsonValid() ? "bg-secondary" : "bg-error")}></span>
                  <span className={cn("text-xs font-mono font-medium", isJsonValid() ? "text-secondary" : "text-error")}>
                    {isJsonValid() ? "JSON" : "INVALID"}
                  </span>
                </div>
                <span className="text-xs text-outline font-body">{(jsonStr.length / 1024).toFixed(1)} KB</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-surface-container-highest rounded text-outline transition-colors relative"
                  title="Copy to Clipboard"
                >
                  {copied ? <Check size={16} className="text-secondary" /> : <Copy size={16} />}
                </button>
                <button onClick={() => setJsonStr('')} className="p-1.5 hover:bg-surface-container-highest rounded text-outline transition-colors" title="Clear">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <textarea
              className="flex-1 font-mono text-sm p-6 bg-surface-container-lowest text-on-surface/80 border-none focus:ring-0 resize-none outline-none"
              value={jsonStr}
              onChange={(e) => setJsonStr(e.target.value)}
              spellCheck={false}
              placeholder="Paste your JSON here..."
            />
          </div>
        </div>

        {/* Config Sidebar */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-high rounded-xl p-6 shadow-xl shadow-black/20 flex flex-col">
            <h3 className="text-sm font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
              <Settings2 size={18} className="text-primary" />
              Formatting Rules
            </h3>
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-outline font-bold">Indentation Size</label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 4, 0].map((val) => (
                    <button 
                      key={val}
                      onClick={() => setIndent(val)}
                      className={cn(
                        "py-2 border rounded-lg text-xs font-medium transition-colors",
                        (indent === val) 
                          ? "border-primary text-primary bg-primary/5" 
                          : "border-outline-variant/30 text-on-surface/60 hover:bg-surface-container-highest"
                      )}
                    >
                      {val === 0 ? 'Tabs' : `${val} Spaces`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between group">
                  <span className="text-sm font-body text-on-surface/80">Sort object keys</span>
                  <button 
                    onClick={() => setRules({ ...rules, sortKeys: !rules.sortKeys })}
                    className={cn(
                      "w-10 h-5 rounded-full relative flex items-center px-1 transition-all",
                      rules.sortKeys ? "bg-primary/20" : "bg-surface-container-lowest border border-outline-variant"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full shadow-sm transition-transform",
                      rules.sortKeys ? "bg-primary-container translate-x-5" : "bg-outline"
                    )} />
                  </button>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-sm font-body text-on-surface/80">Remove whitespace</span>
                  <button 
                    onClick={() => setRules({ ...rules, removeWhitespace: !rules.removeWhitespace })}
                    className={cn(
                      "w-10 h-5 rounded-full relative flex items-center px-1 transition-all",
                      rules.removeWhitespace ? "bg-primary/20" : "bg-surface-container-lowest border border-outline-variant"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full shadow-sm transition-transform",
                      rules.removeWhitespace ? "bg-primary-container translate-x-5" : "bg-outline"
                    )} />
                  </button>
                </div>
              </div>
            </div>
            
          </div>

          <div className="bg-surface-container-high rounded-xl p-6 flex-1 flex flex-col justify-between border border-outline-variant/5">
            <div>
              <h3 className="text-sm font-bold font-headline text-on-surface mb-6 flex items-center gap-2">
                <Activity size={18} className="text-secondary" />
                Document Health
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-outline font-body">Syntax</span>
                  <span className={cn("text-xs font-bold flex items-center gap-1", isJsonValid() ? "text-secondary" : "text-error")}>
                    {isJsonValid() ? <CheckCircle2 size={14} /> : <Trash2 size={14} />}
                    {isJsonValid() ? "VALID" : "INVALID"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-outline font-body">Estimated Payload</span>
                  <span className="text-xs font-mono text-on-surface">{jsonStr.length.toLocaleString()} bytes</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/10">
              <div className="p-4 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                <p className="text-[10px] text-outline mb-2 uppercase tracking-widest font-bold">Security Status</p>
                <p className="text-xs font-mono text-secondary">Local-Only Processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
