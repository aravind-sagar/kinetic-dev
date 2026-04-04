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
  Monitor,
  Smartphone,
  ChevronDown,
  Heading1,
  Heading2,
  Minus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

export default function Editor() {
  // We keep markdown in state for the debounced preview
  // but write to the textarea via ref to preserve native undo
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const debouncedMarkdown = useDebounce(markdown, 300);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Sync textarea content on first render
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = initialMarkdown;
    }
  }, []);

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

      {/* Editor Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Input Area */}
        <section className="w-1/2 flex flex-col bg-surface-container-lowest border-r border-outline-variant/10">
          <div className="flex items-center justify-between px-6 py-2 border-b border-outline-variant/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Source Editor</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Markdown / UTF-8</span>
          </div>
          <textarea
            ref={textareaRef}
            defaultValue={initialMarkdown}
            onChange={e => setMarkdown(e.target.value)}
            className="flex-1 p-6 font-mono text-sm leading-relaxed bg-transparent border-none focus:ring-0 text-on-surface/90 resize-none outline-none"
            spellCheck={false}
          />
        </section>

        {/* Preview Area */}
        <section className="w-1/2 flex flex-col bg-surface">
          <div className="flex items-center justify-between px-6 py-2 border-b border-outline-variant/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Live Preview</span>
            <div className="flex gap-2">
              <Monitor size={14} className="text-on-surface-variant" />
              <Smartphone size={14} className="text-on-surface-variant/30" />
            </div>
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
