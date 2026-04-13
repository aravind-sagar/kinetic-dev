import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Code, 
  List, 
  ListOrdered, 
  CheckSquare,
  Download,
  ChevronDown,
  Heading1,
  Heading2,
  Minus,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { storage } from '../lib/storage';
import { cn } from '@/src/lib/utils';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

// Error boundary for Mermaid to prevent crashes
class MermaidBoundary extends React.Component<{ chart: string }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() {
    if (this.state.error) {
      return (
        <div className="my-4 p-3 border border-error/30 rounded bg-error/10 text-error text-xs font-mono">
          Mermaid diagram error — check your syntax.
        </div>
      );
    }
    return <MermaidDiagram chart={this.props.chart} />;
  }
}

const MermaidDiagram = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef(`mmd-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!ref.current || !chart.trim()) return;
    mermaid.render(id.current, chart).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = svg;
    }).catch(() => {
      if (ref.current) ref.current.innerHTML = '<p style="color:#ffb4ab;font-size:12px">Mermaid syntax error</p>';
    });
  }, [chart]);

  return <div ref={ref} className="flex justify-center my-4" />;
};

const initialMarkdown = `# Kinetic Terminal Documentation

Welcome to the **Kinetic Editor**. This is a high-performance markdown environment designed for precision and flow.

## Key Features
- **Tonal Layering** for reduced eye strain.
- **Zero-Border** interface for immersive writing.
- **Real-time Rendering** with GPT-level accuracy.

### Code Integration
\`\`\`javascript
const initTerminal = () => {
  console.log("Kinetic online.");
};
\`\`\`

### Diagrams (Mermaid)
\`\`\`mermaid
graph TD
    A[Input] --> B{Process}
    B -->|Success| C[Result]
    B -->|Failure| D[Error]
\`\`\`

> Focus on the work, we'll handle the style.`;

// Custom useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface Doc {
  id: string;
  name: string;
  content: string;
}

export default function Editor() {
  const [docs, setDocs] = useState<Doc[]>(() => {
    const saved = storage.get('editor_docs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [{ id: 'default', name: 'Untitled Doc', content: initialMarkdown }];
  });
  const [activeDocId, setActiveDocId] = useState<string>(() => storage.get('editor_active_doc') || 'default');
  const [leftWidth, setLeftWidth] = useState(50);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeDoc = docs.find(d => d.id === activeDocId) || docs[0];

  const [markdown, setMarkdown] = useState(activeDoc ? activeDoc.content : initialMarkdown);
  const debouncedMarkdown = useDebounce(markdown, 300);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storage.set('editor_docs', JSON.stringify(docs));
    storage.set('editor_active_doc', activeDocId);
  }, [docs, activeDocId]);

  useEffect(() => {
    if (textareaRef.current && activeDoc) {
      textareaRef.current.value = activeDoc.content;
      setMarkdown(activeDoc.content);
    }
  }, [activeDocId]);

  useEffect(() => {
    setDocs(prev => prev.map(d => d.id === activeDocId ? { ...d, content: debouncedMarkdown } : d));
  }, [debouncedMarkdown, activeDocId]);

  /**
   * The key fix: we use setRangeText() to insert text into the textarea.
   * This preserves the browser's native undo stack (Ctrl+Z works).
   * We also read the selection BEFORE performing any async state update.
   */
  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    // Use setRangeText to insert — this preserves undo history
    textarea.setRangeText(before + selectedText + after, start, end, 'select');
    
    // Update React state so preview re-renders
    setMarkdown(textarea.value);

    // Restore focus and position cursor inside the wrapping markers
    textarea.focus();
    if (selectedText.length === 0) {
      // Place cursor between the markers
      const pos = start + before.length;
      textarea.setSelectionRange(pos, pos);
    }
  }, []);

  const handleDownloadMarkdown = () => {
    const content = textareaRef.current?.value ?? markdown;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kinetic-export.md';
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) return;
    
    // Temporarily apply white background for clean PDF
    const el = previewRef.current;
    el.classList.add('pdf-export-target');
    
    const canvas = await html2canvas(el, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    });
    
    el.classList.remove('pdf-export-target');
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('kinetic-export.pdf');
    setShowDownloadMenu(false);
  };

  // Toolbar button groups
  const toolbarGroups = [
    [
      { title: 'Heading 1', Icon: Heading1, before: '# ', after: '' },
      { title: 'Heading 2', Icon: Heading2, before: '## ', after: '' },
      { title: 'Bold', Icon: Bold, before: '**', after: '**' },
      { title: 'Italic', Icon: Italic, before: '*', after: '*' },
      { title: 'Strikethrough', Icon: Strikethrough, before: '~~', after: '~~' },
    ],
    [
      { title: 'Link', Icon: LinkIcon, before: '[', after: '](https://)' },
      { title: 'Image', Icon: ImageIcon, before: '![alt](', after: ')' },
      { title: 'Inline Code', Icon: Code, before: '`', after: '`' },
      { title: 'Horizontal Rule', Icon: Minus, before: '\n---\n', after: '' },
    ],
    [
      { title: 'Bullet List', Icon: List, before: '- ', after: '' },
      { title: 'Numbered List', Icon: ListOrdered, before: '1. ', after: '' },
      { title: 'Task List', Icon: CheckSquare, before: '- [ ] ', after: '' },
    ],
  ];

  const handleCreateDoc = () => {
    const newDoc: Doc = { id: Math.random().toString(36).substr(2, 9), name: 'Untitled Doc', content: '' };
    setDocs([...docs, newDoc]);
    setActiveDocId(newDoc.id);
  };

  const handleDeleteDoc = (id: string) => {
    if (docs.length === 1) return; // Prevent deleting last doc
    const newDocs = docs.filter(d => d.id !== id);
    setDocs(newDocs);
    if (activeDocId === id) setActiveDocId(newDocs[0].id);
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingDocId(id);
    setEditingName(currentName);
  };

  const handleFinishRename = () => {
    if (editingDocId) {
      setDocs(docs.map(d => d.id === editingDocId ? { ...d, name: editingName || 'Untitled Doc' } : d));
      setEditingDocId(null);
    }
  };

  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    const handleMove = (eMove: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = ((eMove.clientX - rect.left) / rect.width) * 100;
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 80) newWidth = 80;
      setLeftWidth(newWidth);
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Toolbar */}
      <div className="h-14 flex items-center px-4 bg-surface-container-lowest/50 gap-1 border-b border-outline-variant/5 flex-wrap">
        {toolbarGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="h-4 w-px bg-outline-variant/20 mx-2" />}
            {group.map(({ title, Icon, before, after }) => (
              <button
                key={title}
                onMouseDown={e => {
                  e.preventDefault(); // prevent textarea losing focus
                  insertText(before, after);
                }}
                className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-primary transition-all active:scale-95"
                title={title}
              >
                <Icon size={16} />
              </button>
            ))}
          </React.Fragment>
        ))}
        
        <div className="ml-auto flex items-center gap-4 relative">
          <div className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest font-bold hidden lg:block">Local Only</div>
          <div className="relative">
            <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Download size={16} />
              Download
              <ChevronDown size={14} className={showDownloadMenu ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-surface-container-high border border-outline-variant/20 rounded-lg shadow-2xl z-50 overflow-hidden">
                <button onClick={handleDownloadMarkdown} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors border-b border-outline-variant/10">
                  MARKDOWN (.md)
                </button>
                <button onClick={handleDownloadPDF} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors">
                  PDF DOCUMENT (.pdf)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Document Sidebar */}
        <div className="w-64 border-r border-outline-variant/10 bg-surface-container flex flex-col shrink-0">
          <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface">Documents</span>
            <button onClick={handleCreateDoc} className="p-1 hover:bg-primary/20 text-primary rounded transition-colors" title="New Document">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {docs.map(doc => (
              <div 
                key={doc.id} 
                className={cn(
                  "group flex items-center justify-between px-4 py-3 border-b border-outline-variant/5 cursor-pointer transition-colors",
                  doc.id === activeDocId ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-surface-container-high border-l-2 border-l-transparent"
                )}
                onClick={() => setActiveDocId(doc.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <FileText size={14} className={doc.id === activeDocId ? "text-primary" : "text-outline"} />
                  {editingDocId === doc.id ? (
                    <input
                      autoFocus
                      className="bg-surface-container-lowest text-on-surface text-sm px-2 py-1 rounded outline-none border border-primary w-full"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={e => { if (e.key === 'Enter') handleFinishRename(); }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={cn("text-sm truncate", doc.id === activeDocId ? "text-primary font-bold" : "text-on-surface-variant")}>
                      {doc.name}
                    </span>
                  )}
                </div>
                {editingDocId !== doc.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleStartRename(doc.id, doc.name); }}
                      className="p-1.5 text-outline hover:text-on-surface rounded"
                    >
                      <Edit2 size={12} />
                    </button>
                    {docs.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }}
                        className="p-1.5 text-error/70 hover:text-error hover:bg-error/10 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor and Preview Split */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
          
          {/* Input Area */}
          <section style={{ width: `${leftWidth}%` }} className="flex flex-col bg-surface-container-lowest border-r border-outline-variant/10 shrink-0">
            <div className="flex items-center justify-between px-6 py-2 border-b border-outline-variant/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Source Editor</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Markdown / UTF-8</span>
            </div>
            <textarea
              ref={textareaRef}
              defaultValue={activeDoc?.content || initialMarkdown}
              onChange={e => setMarkdown(e.target.value)}
              className="flex-1 p-6 font-mono text-sm leading-relaxed bg-transparent border-none focus:ring-0 text-on-surface/90 resize-none outline-none"
              spellCheck={false}
            />
          </section>

          {/* Resizer */}
          <div 
            className="w-1 bg-outline-variant/20 hover:bg-primary cursor-col-resize z-10 transition-colors shrink-0"
            onPointerDown={handleDragStart}
          />

          {/* Preview Area */}
          <section style={{ width: `${100 - leftWidth}%` }} className="flex flex-col bg-surface overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-6 py-2 border-b border-outline-variant/10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Live Preview</span>
            </div>
          <div ref={previewRef} className="flex-1 p-10 overflow-y-auto md-preview">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  if (!inline && match && match[1] === 'mermaid') {
                    return (
                      <MermaidBoundary chart={String(children).replace(/\n$/, '')} />
                    );
                  }
                  if (!inline && match) {
                    return (
                      <pre className="not-prose">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    );
                  }
                  return <code className={className} {...props}>{children}</code>;
                }
              }}
            >
              {debouncedMarkdown}
            </ReactMarkdown>
          </div>
          </section>
        </div>
      </div>

      {/* Footer Stats */}
      <footer className="h-8 bg-surface-container px-6 border-t border-outline-variant/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            Private Session
          </div>
          <div>Words: {markdown.trim() ? markdown.trim().split(/\s+/).length : 0}</div>
          <div>Lines: {markdown.split('\n').length}</div>
        </div>
      </footer>
    </div>
  );
}
