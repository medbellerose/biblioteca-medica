'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Brain, Menu, ChevronRight, BookOpen, ChevronDown, Search, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';

const yearsTitles: Record<number, string> = { 1: "Primer Año", 2: "Segundo Año", 3: "Tercer Año", 4: "Cuarto Año", 5: "Quinto Año" };
const cleanId = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

const TableOfContents = ({ content }: { content: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const headings = useMemo(() => {
    return content.split('\n')
      .filter(line => line.startsWith('## '))
      .map(line => {
        const text = line.replace('## ', '').trim();
        return { text, id: cleanId(text) };
      });
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <aside className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-end transition-all duration-300 ease-in-out" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ width: isHovered ? '240px' : '30px' }}>
      <div className={`flex flex-col gap-1.5 py-3 pr-3 pl-1 transition-all ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {headings.map((h, i) => (
          <a key={i} href={`#${h.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }); }} className="block text-right no-underline text-[9px] text-gray-400 font-bold uppercase hover:text-purple-400 truncate">{h.text}</a>
        ))}
      </div>
      <div className="flex flex-col gap-3 pr-3 py-5 items-center">
        {headings.map((_, i) => <span key={i} className={`w-1 h-1 rounded-full bg-gray-500 ${isHovered ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)]' : 'opacity-30'}`}></span>)}
      </div>
    </aside>
  );
};

export default function Home() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMd, setSelectedMd] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({ 1: true });
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const allowedYears = useMemo(() => String(user?.publicMetadata?.plan || "").split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)), [user]);
  const isPdf = useMemo(() => selectedMd?.toLowerCase().endsWith('.pdf'), [selectedMd]);
  const currentYear = useMemo(() => {
    if (!selectedMd) return 0;
    for (const y of yearsDataRaw) { for (const s of y.subjects) { if (s.topics.some(t => t.file === selectedMd)) return y.year; } }
    return 0;
  }, [selectedMd]);

  useEffect(() => {
    if (!selectedMd || isPdf) { if(isPdf) setContent('---PDF---'); return; }
    fetch(`/apuntes/${selectedMd.includes('.') ? selectedMd : selectedMd + '.md'}`)
      .then(res => res.text()).then(t => setContent(t.split('<b>').join('**').split('</b>').join('**'))).catch(() => setContent('# Error'));
  }, [selectedMd, isPdf]);

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-4 border-b border-[#30363d] flex items-center gap-2.5 shrink-0 text-white font-bold text-base"><Brain className="w-5 h-5 text-purple-500" /><span>Medpath</span></div>
        <div className="p-3 border-b border-[#30363d] shrink-0"><div className="relative text-white"><Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-8 text-xs focus:outline-none focus:border-purple-500 text-white" /></div></div>
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {yearsDataRaw.map((y) => (
            <div key={y.year} className="space-y-1">
              <button onClick={() => setExpandedYears(p => ({...p, [y.year]: !p[y.year]}))} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-300 hover:bg-[#21262d]">
                <div className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-gray-500" /><span>{yearsTitles[y.year]}</span></div>
                <ChevronDown className={`w-3.5 h-3.5 ${expandedYears[y.year] || searchTerm ? 'rotate-180' : ''}`} />
              </button>
              {(expandedYears[y.year] || searchTerm) && (
                <div className="ml-2.5 pl-1 border-l border-[#30363d]/50">
                  {y.subjects.map((s, idx) => (
                    <div key={idx}>
                      <button onClick={() => setExpandedSubjects(p => ({...p, [y.year+s.name]: !p[y.year+s.name]}))} className="w-full flex items-center justify-between px-2.5 py-1 text-[9px] uppercase font-bold text-gray-500 hover:text-white"><span>{s.name}</span><ChevronDown className="w-2.5 h-2.5" /></button>
                      {(expandedSubjects[y.year+s.name] || searchTerm) && (
                        <div className="ml-2.5 space-y-0.5 pb-1.5">
                          {s.topics.map(t => (
                            <button key={t.file} onClick={() => { setSelectedMd(t.file); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full text-left px-2.5 py-0.5 text-xs rounded-sm ${selectedMd === t.file ? 'text-purple-400 font-bold bg-purple-500/10' : 'text-gray-400 hover:text-white'}`}>{t.file.endsWith('.pdf') ? '📄 ' : '• '} {t.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] overflow-hidden">
        <header className="h-12 flex items-center justify-between px-5 border-b border-[#30363d] bg-[#161b22]/50 shrink-0">
          <div className="flex items-center"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-[#21262d] rounded-md text-gray-400"><Menu className="w-4 h-4" /></button></div>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </header>
        <div className="flex-1 overflow-y-auto p-5 md:p-10 scroll-smooth relative text-white">
          <div className="max-w-5xl mx-auto relative h-full flex flex-col">
            {selectedMd && !isPdf && <TableOfContents content={content} />}
            {selectedMd ? (
              <SignedIn>
                {allowedYears.includes(currentYear) ? (
                  isPdf ? (
                    <div className="flex-1 rounded-xl overflow-hidden border border-[#30363d] bg-[#161b22]"><iframe src={`${selectedMd}`} className="w-full h-full border-0" title="PDF Viewer" /></div>
                  ) : (
                    <article className="prose prose-invert prose-purple max-w-none"><Markdown remarkPlugins={[remarkGfm, remarkSlug]} rehypePlugins={[rehypeRaw]}>{content}</Markdown></article>
                  )
                ) : (
                  <div className="mt-16 flex flex-col items-center text-center p-10 border border-purple-500/20 rounded-2xl bg-[#161b22]/40"><Lock className="w-8 h-8 text-purple-400 mb-3" /><h2 className="text-lg font-bold text-white">Módulo no adquirido</h2><p className="text-gray-400 mt-1 text-sm">Tu pase no incluye {currentYear}° año.</p></div>
                )
              }
              </SignedIn>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 flex-1"><Brain className="w-12 h-12 mb-3 animate-pulse mx-auto" /><h2 className="text-lg font-bold text-white uppercase tracking-widest">Medpath Digital</h2></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}