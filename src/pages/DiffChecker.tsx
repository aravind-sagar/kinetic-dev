import React, { useState } from 'react';
import { Columns, ArrowRightLeft, FileJson, Trash2, Copy, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function DiffChecker() {
  const [input1, setInput1] = useState('{\n  "id": 1,\n  "name": "Kinetic",\n  "status": "active"\n}');
  const [input2, setInput2] = useState('{\n  "id": 1,\n  "name": "Kinetic Suite",\n  "status": "pending",\n  "version": "1.0"\n}');
  const [diffResult, setDiffResult] = useState<any[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const formatJson = (side: 1 | 2) => {
    try {
      const val = side === 1 ? input1 : input2;
      const parsed = JSON.parse(val);
      const formatted = JSON.stringify(parsed, null, 2);
      side === 1 ? setInput1(formatted) : setInput2(formatted);
    } catch (e) {
      alert("Invalid JSON on side " + side);
    }
  };

  const compareJson = () => {
    setIsComparing(true);
    const lines1 = input1.split('\n');
    const lines2 = input2.split('\n');
    
    // Simple line-by-line diff for MVP
    // In a real app, we'd use something like 'diff' or 'jsdiff'
    // But we'll implement a basic version that highlights line differences
    const maxLines = Math.max(lines1.length, lines2.length);
    const result = [];

    for (let i = 0; i < maxLines; i++) {
        const l1 = lines1[i];
        const l2 = lines2[i];

        if (l1 === l2) {
            result.push({ type: 'equal', line1: l1, line2: l2, num1: i + 1, num2: i + 1 });
        } else {
            if (l1 !== undefined) result.push({ type: 'removed', line: l1, num: i + 1 });
            if (l2 !== undefined) result.push({ type: 'added', line: l2, num: i + 1 });
        }
    }
    setDiffResult(result);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold font-headline tracking-tight mb-2">JSON Diff Checker</h2>
          <p className="text-on-surface-variant text-sm font-body">Detect structural and value mutations between two JSON objects.</p>
        </div>
        <button 
          onClick={compareJson}
          className="kinetic-gradient text-on-primary px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <ArrowRightLeft size={18} />
          RUN COMPARISON
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-3 bg-surface-container border-b border-outline-variant/10 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Original JSON (Input 1)</span>
            <button onClick={() => formatJson(1)} className="text-[10px] font-bold text-primary hover:underline">BEAUTIFY</button>
          </div>
          <textarea
            className="flex-1 p-6 font-mono text-xs bg-surface-container-lowest text-on-surface/70 border-none focus:ring-0 resize-none outline-none"
            value={input1}
            onChange={(e) => setInput1(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Right Side */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-3 bg-surface-container border-b border-outline-variant/10 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Modified JSON (Input 2)</span>
            <button onClick={() => formatJson(2)} className="text-[10px] font-bold text-secondary hover:underline">BEAUTIFY</button>
          </div>
          <textarea
            className="flex-1 p-6 font-mono text-xs bg-surface-container-lowest text-on-surface/70 border-none focus:ring-0 resize-none outline-none"
            value={input2}
            onChange={(e) => setInput2(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Diff Result */}
      {isComparing && (
        <div className="bg-surface-container-high rounded-xl border border-outline-variant/10 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container flex justify-between items-center">
            <h3 className="text-sm font-bold font-headline uppercase tracking-widest">Comparison Results</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-secondary/30 rounded-sm"></div>
                 <span className="text-[10px] font-bold text-secondary/60">ADDITIONS</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-error/30 rounded-sm"></div>
                 <span className="text-[10px] font-bold text-error/60">DELETIONS</span>
               </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-full font-mono text-xs leading-relaxed">
              {diffResult.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant/40">No differences detected. Files are identical.</div>
              ) : (
                <div className="divide-y divide-outline-variant/5">
                  {diffResult.map((res, i) => (
                    <div key={i} className={cn(
                      "flex items-start",
                      res.type === 'added' ? "bg-secondary/10" : res.type === 'removed' ? "bg-error/10" : ""
                    )}>
                      {res.type === 'equal' ? (
                        <>
                          <div className="w-12 text-right pr-4 py-1 text-outline/30 select-none border-r border-outline-variant/5">{res.num1}</div>
                          <div className="w-12 text-right pr-4 py-1 text-outline/30 select-none border-r border-outline-variant/5">{res.num2}</div>
                          <div className="flex-1 px-6 py-1 text-on-surface/40 whitespace-pre">  {res.line1}</div>
                        </>
                      ) : res.type === 'added' ? (
                        <>
                          <div className="w-12 text-right pr-4 py-1 text-outline/30 select-none border-r border-outline-variant/5"></div>
                          <div className="w-12 text-right pr-4 py-1 text-secondary/50 select-none border-r border-outline-variant/5">{res.num}</div>
                          <div className="flex-1 px-6 py-1 text-secondary whitespace-pre"><span className="mr-2 text-secondary/60">+</span>{res.line}</div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 text-right pr-4 py-1 text-error/50 select-none border-r border-outline-variant/5">{res.num}</div>
                          <div className="w-12 text-right pr-4 py-1 text-outline/30 select-none border-r border-outline-variant/5"></div>
                          <div className="flex-1 px-6 py-1 text-error whitespace-pre"><span className="mr-2 text-error/60">-</span>{res.line}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
