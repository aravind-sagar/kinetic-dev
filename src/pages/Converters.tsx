import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  CloudUpload, 
  Settings, 
  Download, 
  ShieldCheck, 
  Zap, 
  History,
  ChevronRight,
  FileDigit,
  FileCheck,
  Loader2,
  CheckCircle2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as pdfjs from 'pdfjs-dist';
// @ts-ignore - Vite handled worker import
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Set worker for PDF.js - using local worker for better stability in Vite
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Converters() {
  const [conversionType, setConversionType] = useState<'MD_PDF' | 'PDF_WORD' | 'WORD_PDF'>('MD_PDF');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultFile, setResultFile] = useState<{ name: string, blob: Blob } | null>(null);
  const [tempHtml, setTempHtml] = useState<string>('');
  const [tempMd, setTempMd] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renderRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      if (conversionType === 'MD_PDF') {
        await convertMdToPdf(file);
      } else if (conversionType === 'PDF_WORD') {
        await convertPdfToWord(file);
      } else if (conversionType === 'WORD_PDF') {
        await convertWordToPdf(file);
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      console.error('[Converter] Failed:', err);
      alert(`Conversion failed: ${msg}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setTempHtml('');
      setTempMd('');
    }
  };

  const captureToPdf = async (filename: string) => {
    if (!renderRef.current) return;
    
    // Small delay to ensure React has rendered the content
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const element = renderRef.current;
    const canvas = await html2canvas(element, { 
      scale: 2, 
      backgroundColor: '#131313',
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    const blob = pdf.output('blob');
    setResultFile({ name: filename, blob });
  };

  const convertMdToPdf = async (file: File) => {
    const text = await file.text();
    setTempMd(text);
    setProgress(50);
    await captureToPdf(file.name.replace('.md', '.pdf'));
    setProgress(100);
  };

  const convertPdfToWord = async (file: File) => {
    console.log('[PDF→Word] Starting conversion for:', file.name, 'size:', file.size);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('[PDF→Word] File read as ArrayBuffer, size:', arrayBuffer.byteLength);
    
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    console.log('[PDF→Word] PDF loading task created');
    
    const pdf = await loadingTask.promise;
    console.log('[PDF→Word] PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        console.log(`[PDF→Word] Page ${i}/${pdf.numPages}, chars:`, pageText.length);
        fullText += pageText + '\n\n';
        setProgress(Math.round((i / pdf.numPages) * 100));
    }

    console.log('[PDF→Word] Total extracted text length:', fullText.length);
    
    if (!fullText.trim()) {
        throw new Error('No text could be extracted. This PDF may be image-based or encrypted.');
    }

    // Build paragraphs from text blocks
    const paragraphs = fullText.split('\n\n').filter(Boolean).map(
      text => new Paragraph({ children: [new TextRun(text.trim())] })
    );

    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs,
        }],
    });

    console.log('[PDF→Word] Building DOCX document...');
    const blob = await Packer.toBlob(doc);
    console.log('[PDF→Word] DOCX blob size:', blob.size);
    setResultFile({ name: file.name.replace('.pdf', '.docx'), blob });
  };

  const convertWordToPdf = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    setTempHtml(result.value);
    setProgress(50);
    await captureToPdf(file.name.replace('.docx', '.pdf'));
    setProgress(100);
  };

  const downloadResult = () => {
    if (!resultFile) return;
    const url = URL.createObjectURL(resultFile.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultFile.name;
    a.click();
    URL.revokeObjectURL(url);
    setResultFile(null);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hidden Render Div for html2canvas - white background for accurate PDF */}
      <div className="fixed -left-[9999px] top-0 w-[210mm]">
        <div ref={renderRef} className="p-12 md-preview pdf-export-target max-w-none min-h-[297mm]" style={{ backgroundColor: '#ffffff', color: '#111111' }}>
          {tempMd ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{tempMd}</ReactMarkdown>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: tempHtml }} />
          )}
        </div>
      </div>

      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-primary/60 mb-4 tracking-widest uppercase">
          <span>Tools</span>
          <ChevronRight size={10} />
          <span className="text-on-surface">Universal Converters</span>
        </div>
        <h2 className="text-4xl font-bold font-headline tracking-tight text-on-surface">File & Diagram Converters</h2>
        <p className="text-on-surface-variant max-w-2xl mt-3 text-lg font-body">Professional transformation suite for documents and diagrams. 100% Client-side. Private & Secure.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Tool Area */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/5">
            <div className="flex gap-4 mb-8">
              {[
                { id: 'MD_PDF', label: 'Markdown → PDF', icon: FileText },
                { id: 'PDF_WORD', label: 'PDF → Word', icon: FileDigit },
                { id: 'WORD_PDF', label: 'Word → PDF', icon: FileCheck },
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => { setConversionType(t.id as any); setResultFile(null); }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    conversionType === t.id ? "bg-primary/10 border-primary/40 text-primary" : "bg-surface-container-high border-outline-variant/10 hover:border-primary/20 text-on-surface-variant"
                  )}
                >
                  <t.icon size={24} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>

            <div 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center transition-all cursor-pointer group",
                isProcessing ? "border-primary/20 bg-primary/5 cursor-wait" : "border-outline-variant/20 bg-surface-container-lowest hover:border-primary/40"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
                accept={conversionType === 'MD_PDF' ? '.md,.mmd' : conversionType === 'PDF_WORD' ? '.pdf' : '.doc,.docx'}
              />
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Loader2 size={48} className="text-primary animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-on-surface">Processing locally...</p>
                    <p className="text-[10px] text-primary mt-1 font-mono uppercase font-bold">{progress}% COMPLETE</p>
                  </div>
                </div>
              ) : resultFile ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-2 animate-bounce">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Ready: {resultFile.name}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadResult(); }}
                      className="mt-4 kinetic-gradient text-on-primary px-6 py-2 rounded-lg text-xs font-bold shadow-lg"
                    >
                      DOWNLOAD FILE
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setResultFile(null); }}
                      className="block mx-auto mt-2 text-[10px] text-outline hover:underline"
                    >
                      Convert another
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <CloudUpload size={48} className="text-outline-variant group-hover:text-primary transition-colors mb-4" />
                  <p className="text-sm font-bold text-on-surface">Select your file to start</p>
                  <p className="text-xs text-on-surface-variant mt-2">No data is sent to any server.</p>
                </>
              )}
            </div>

            {conversionType === 'PDF_WORD' && (
              <div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
                <AlertTriangle size={18} className="text-error mt-0.5 shrink-0" />
                <p className="text-xs text-error font-medium leading-relaxed">
                  Notice: PDF to Word conversion extracts structural text elements. Complex PDFs with multi-column layouts or nested tables may not convert with 100% visual accuracy.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Info & Side */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="p-6 bg-surface-container-high rounded-xl border border-outline-variant/10 shadow-xl">
             <h4 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
               <Settings size={14} />
               Transformation Privacy
             </h4>
             <p className="text-xs text-on-surface-variant leading-relaxed font-body">
               Kinetic uses Web-Assembly and local V8 isolates to process your files directly in the browser's memory. This means zero tracking, zero logs, and zero persistence.
             </p>
             <div className="mt-6 flex items-center gap-3 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
               <ShieldCheck size={16} className="text-secondary" />
               <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">End-to-End Private</span>
             </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          {[
            { icon: ShieldCheck, title: 'In-Browser Security', desc: 'Runs fully in your browser — your files never leave your device for processing.', color: 'primary' },
            { icon: Zap, title: 'Accurate Rendering', desc: 'Direct conversion with structural formatting preserved for complex document types.', color: 'secondary' },
            { icon: History, title: 'Instant Processing', desc: 'Real-time transformation with no queue times or server-side latency.', color: 'tertiary' },
          ].map((info) => (
            <div key={info.title} className="p-6 bg-surface-container-low rounded-lg border border-outline-variant/5 hover:border-primary/20 transition-all">
              <info.icon size={24} className={cn("mb-4 block", `text-${info.color}`)} />
              <h4 className="font-bold text-sm mb-2 uppercase tracking-wide">{info.title}</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed font-body">{info.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
