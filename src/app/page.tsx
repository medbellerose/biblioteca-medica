'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, ChevronDown, Search, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';

// 1. Función para limpiar IDs (necesaria para el índice)
const cleanId = (t: string) => {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
};

const TableOfContents = ({ content }: { content: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const headings = useMemo(() => {
    if (!content || content === '---MEDIA---') return [];
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
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-end transition-all duration-300" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)} 
      style={{ width: isHovered ? '280px' : '40px' }}
    >
      <div className={`flex flex-col gap-2 py-4 pr-6 bg-[#161b22]/95 backdrop-blur rounded-l-xl border border-[#30363d] transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
        {headings.map((h, i) => (
          <button 
            key={i} 
            onClick={() => {
              const el = document.getElementById(h.id);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }} 
            className="text-right text-[10px] text-gray-300 hover:text-purple-400 truncate transition-colors font-bold uppercase"
          >
            {h.text}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-4 pr-4 py-6 shrink-0">
        {headings.map((_, i) => (
          <span 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isHovered ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-gray-600'}`}
          ></span>
        ))}
      </div>
    </aside>
  );
};

export default function Home() {
  const { user, isLoaded } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMd, setSelectedMd] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({ 5: true });
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Detectores de tipo de archivo
  const isPdf = useMemo(() => selectedMd?.toLowerCase().endsWith('.pdf'), [selectedMd]);
  const isDrive = useMemo(() => selectedMd?.includes('docs.google.com'), [selectedMd]);

  useEffect(() => {
    if (!selectedMd) return;
    
    // Si es PDF o Drive, no hacemos fetch de texto
    if (isPdf || isDrive) {
      setContent('---MEDIA---');
    } else {
      const path = selectedMd.startsWith('/') ? selectedMd : `/${selectedMd}`;
      fetch(`/apuntes${path}`)
        .then(res => res.ok ? res.text() : Promise.reject())
        .then(t => setContent(t))
        .catch(() => setContent('# ❌ Error al cargar el archivo'));
    }
  }, [selectedMd, isPdf, isDrive]);

  // Lógica del buscador
  const filteredData = useMemo(() => {
    return yearsDataRaw.map(year => ({
      ...year,
      subjects: year.subjects.map(sub => ({
        ...sub,
        topics: sub.topics.filter(t => 
          t.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
          t.keywords?.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      })).filter(sub => sub.topics.length > 0)
    })).filter(year => year.subjects.length > 0);
  }, [searchTerm]);

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 text-white font-bold text-lg">
          <Brain className="w-6 h-6 text-purple-500" />
          <span>Medpath</span>
        </div>

        {/* Buscador en el Sidebar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar tema..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-md py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredData.map((y) => (
            <div key={y.year}>
              <button onClick={() => setExpandedYears(p => ({...p, [y.year]: !p[y.year]}))} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-[#21262d] rounded-lg">
                <span>Año {y.year}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedYears[y.year] ? 'rotate-180' : ''}`} />
              </button>
              {expandedYears[y.year] && (
                <div className="ml-3 border-l border-[#30363d] pl-2">
                  {y.subjects.map((sub, i) => (
                    <div key={i}>
                      <button onClick={() => setExpandedSubjects(prev => ({ ...prev, [`${y.year}-${sub.name}`]: !prev[`${y.year}-${sub.name}`] }))} className="w-full text-left py-1 text-[10px] text-gray-500 font-bold uppercase hover:text-white transition-colors">{sub.name}</button>
                      {expandedSubjects[`${y.year}-${sub.name}`] && sub.topics.map(t => (
                        <button key={t.file} onClick={() => setSelectedMd(t.file)} className={`w-full text-left px-3 py-1 text-xs rounded transition-colors ${selectedMd === t.file ? 'text-purple-400 bg-purple-500/10 font-bold' : 'text-gray-400 hover:text-white'}`}>{t.label}</button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0d1117]">
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#30363d]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg transition-colors"><Menu className="w-5 h-5" /></button>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
          <div className="max-w-4xl mx-auto relative">
            {/* Solo mostramos el índice si es un archivo Markdown con contenido */}
            {selectedMd && !isPdf && !isDrive && content && <TableOfContents content={content} />}
            
            {selectedMd ? (
              <>
                {isPdf ? (
                  <iframe src={selectedMd.startsWith('/') ? selectedMd : `/${selectedMd}`} className="w-full h-[85vh] rounded-lg border border-[#30363d]" />
                ) : isDrive ? (
                  <iframe src={selectedMd} className="w-full h-[85vh] bg-white rounded-lg border border-[#30363d]" />
                ) : (
                  <article className="prose prose-invert max-w-none prose-purple prose-headings:scroll-mt-20">
                    <Markdown 
                      remarkPlugins={[remarkGfm, remarkSlug]} 
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h2: ({children}) => {
                          const id = cleanId(children?.toString() || "");
                          return <h2 id={id}>{children}</h2>
                        }
                      }}
                    >
                      {content}
                    </Markdown>
                  </article>
                )}
              </>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center opacity-20">
                <Brain className="w-20 h-20" />
                <h1 className="text-2xl font-bold mt-4 tracking-widest uppercase">MEDPATH</h1>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}