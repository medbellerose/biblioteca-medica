'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, BookOpen, ChevronDown, Search, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';

const yearsTitles: Record<number, string> = { 1: "Primer Año", 2: "Segundo Año", 3: "Tercer Año", 4: "Cuarto Año", 5: "Quinto Año" };

const cleanId = (t: string) => {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
};

const TableOfContents = ({ content }: { content: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const headings = useMemo(() => {
    return content.split('\n')
      .filter(line => line.trim().startsWith('## '))
      .map(line => {
        const text = line.replace('## ', '').trim();
        return { text, id: cleanId(text) };
      });
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <aside 
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-end transition-all duration-300" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)} 
      style={{ width: isHovered ? '280px' : '40px' }}
    >
      <div className={`flex flex-col gap-2 py-4 pr-6 transition-all ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
        {headings.map((h, i) => (
          <button 
            key={i} 
            onClick={() => {
              const el = document.getElementById(h.id);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-right text-[10px] text-gray-400 font-bold uppercase hover:text-purple-400 truncate transition-colors"
          >
            {h.text}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-4 pr-4 py-6">
        {headings.map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full bg-gray-500 ${isHovered ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'opacity-40'}`}></span>
        ))}
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
    for (const y of yearsDataRaw) { 
      for (const s of y.subjects) { 
        if (s.topics.some(t => t.file === selectedMd)) return y.year; 
      } 
    }
    return 0;
  }, [selectedMd]);

  const toggleSubject = (year: number, subjectName: string) => {
    const key = `${year}-${subjectName}`;
    setExpandedSubjects(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!selectedMd) return;
    if (isPdf) {
      setContent('---PDF---');
    } else {
      const fileName = selectedMd.includes('.') ? selectedMd : `${selectedMd}.md`;
      fetch(`/apuntes/${fileName}`)
        .then(res => res.text())
        .then(t => setContent(t))
        .catch(() => setContent('# Error'));
    }
  }, [selectedMd, isPdf]);

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 shrink-0 text-white font-bold text-lg">
          <Brain className="w-6 h-6 text-purple-500" />
          <span>Medpath</span>
        </div>

        {/* BARRA DE BÚSQUEDA AÑADIDA SIN TOCAR LO DEMÁS */}
        <div className="p-4 border-b border-[#30363d] shrink-0">
          <div className="relative text-white">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar apunte..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg py-2 pl-10 text-xs focus:outline-none focus:border-purple-500 text-white" 
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {yearsDataRaw.map((y) => (
            <div key={y.year}>
              <button onClick={() => setExpandedYears(p => ({...p, [y.year]: !p[y.year]}))} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#21262d]">
                <div className="flex items-center gap-2 font-bold">Año {y.year}</div>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedYears[y.year] || searchTerm ? 'rotate-180' : ''}`} />
              </button>
              {(expandedYears[y.year] || searchTerm) && (
                <div className="ml-3 border-l border-[#30363d]/50">
                  {y.subjects.map((sub, i) => (
                    <div key={i}>
                      <button 
                        onClick={() => toggleSubject(y.year, sub.name)} 
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-colors"
                      >
                        <span>{sub.name}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedSubjects[`${y.year}-${sub.name}`] || searchTerm ? 'rotate-180' : ''}`} />
                      </button>
                      {(expandedSubjects[`${y.year}-${sub.name}`] || searchTerm) && (
                        <div className="ml-3 space-y-1 pb-2">
                          {sub.topics
                            .filter(t => 
                              t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (t.keywords && t.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase())))
                            )
                            .map(t => (
                              <button key={t.file} onClick={() => setSelectedMd(t.file)} className={`w-full text-left px-3 py-1 text-xs rounded-md ${selectedMd === t.file ? 'text-purple-400 bg-purple-500/10 font-bold' : 'text-gray-400 hover:text-white'}`}>
                                {t.file.endsWith('.pdf') ? '📄 ' : '• '} {t.label}
                              </button>
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

      <main className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#30363d]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="w-5 h-5 text-gray-400" /></button>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 relative scroll-smooth">
          <div className="max-w-5xl mx-auto h-full">
            {selectedMd && !isPdf && <TableOfContents content={content} />}
            {selectedMd ? (
              <SignedIn>
                {allowedYears.includes(currentYear) ? (
                  isPdf ? (
                    <iframe src={`${selectedMd}#view=FitH`} className="w-full h-[88vh] rounded-xl border border-[#30363d]" />
                  ) : (
                    <article className="prose prose-invert prose-purple max-w-none prose-headings:scroll-mt-24">
                      <Markdown 
                        remarkPlugins={[remarkGfm, remarkSlug]} 
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          h2: ({children}) => {
                            const id = cleanId(children?.toString() || "");
                            return <h2 id={id}>{children}</h2>;
                          }
                        }}
                      >
                        {content}
                      </Markdown>
                    </article>
                  )
                ) : (
                  <div className="mt-20 text-center"><Lock className="w-10 h-10 mx-auto text-purple-400" /><h2 className="mt-4 font-bold text-white text-xl">Módulo no adquirido</h2></div>
                )
              }
              </SignedIn>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Brain className="w-16 h-16 animate-pulse" />
                <h2 className="text-xl font-bold mt-4 text-white">Medpath Digital</h2>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}