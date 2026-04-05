'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, ChevronRight, BookOpen, ChevronDown, Search, Lock, MessageCircle } from 'lucide-react';
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
  const headings = useMemo(() => content.split('\n').filter(l => l.startsWith('## ')).map(l => ({ text: l.replace('## ', '').trim(), id: cleanId(l.replace('## ', '').trim()) })), [content]);
  if (headings.length === 0) return null;
  return (
    <aside className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-end transition-all duration-300" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ width: isHovered ? '260px' : '40px' }}>
      <div className={`flex flex-col gap-2 py-4 pr-4 pl-2 transition-all ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {headings.map((h, i) => (
          <a key={i} href={`#${h.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }); }} className="block text-right no-underline text-[10px] text-gray-400 font-bold uppercase hover:text-purple-400">{h.text}</a>
        ))}
      </div>
      <div className="flex flex-col gap-4 pr-4 py-6">
        {headings.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full bg-gray-500 ${isHovered ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'opacity-40'}`}></span>)}
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
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 shrink-0 text-white font-bold text-lg"><Brain className="w-6 h-6 text-purple-500" /><span>Medpath</span></div>
        <div className="p-4 border-b border-[#30363d] shrink-0"><div className="relative text-white"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg py-2 pl-10 text-xs focus:outline-none focus:border-purple-500 text-white" /></div></div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {yearsDataRaw.map((y) => (
            <div key={y.year} className="space-y-1">
              <button onClick={() => setExpandedYears(p => ({...p, [y.year]: !p[y.year]}))} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-[#21262d]">
                <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-500" /><span>{yearsTitles[y.year]}</span></div>
                <ChevronDown className={`w-4 h-4 ${expandedYears[y.year] || searchTerm ? 'rotate-180' : ''}`} />
              </button>
              {(expandedYears[y.year] || searchTerm) && (
                <div className="ml-3 pl-1 border-l border-[#30363d]/50">
                  {y.subjects.map((s, idx) => (
                    <div key={idx}>
                      <button onClick={() => setExpandedSubjects(p => ({...p, [y.year+s.name]: !p[y.year+s.name]}))} className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] uppercase font-bold text-gray-500 hover:text-white"><span>{s.name}</span><ChevronDown className="w-3 h-3" /></button>
                      {(expandedSubjects[y.year+s.name] || searchTerm) && (
                        <div className="ml-3 space-y-1 pb-2">
                          {s.topics.map(t => (
                            <button key={t.file} onClick={() => { setSelectedMd(t.file); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full text-left px-3 py-1 text-xs rounded-md ${selectedMd === t.file ? 'text-purple-400 font-bold bg-purple-500/10' : 'text-gray-400 hover:text-white'}`}>{t.file.endsWith('.pdf') ? '📄 ' : '• '} {t.label}</button>
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
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#30363d] bg-[#161b22]/50 shrink-0">
          <div className="flex items-center"><button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400"><Menu className="w-5 h-5" /></button></div>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth relative">
          <div className="max-w-5xl mx-auto relative h-full">
            {selectedMd && !isPdf && <TableOfContents content={content} />}
            {selectedMd ? (
              <SignedIn>
                {allowedYears.includes(currentYear) ? (
                  isPdf ? (
                    <div className="w-full h-[85vh] rounded-xl overflow-hidden border border-[#30363d] bg-[#161b22]"><iframe src={`${selectedMd}#toolbar=0`} className="w-full h-full" title="PDF" /></div>
                  ) : (
                    <article className="prose prose-invert prose-purple max-w-none"><Markdown remarkPlugins={[remarkGfm, remarkSlug]} rehypePlugins={[rehypeRaw]}>{content}</Markdown></article>
                  )
                ) : (
                  <div className="mt-20 flex flex-col items-center text-center p-12 border border-purple-500/20 rounded-3xl bg-[#161b22]/40"><Lock className="w-10 h-10 text-purple-400 mb-4" /><h2 className="text-xl font-bold text-white">Módulo no adquirido</h2><p className="text-gray-400 mt-2 text-sm">Tu pase no incluye {currentYear}° año.</p></div>
                )
              }
              </SignedIn>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center mt-20 opacity-50"><Brain className="w-16 h-16 mb-4 animate-pulse mx-auto" /><h2 className="text-xl font-bold text-white">Medpath Digital</h2></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}