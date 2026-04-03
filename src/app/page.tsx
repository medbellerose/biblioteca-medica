'use client';

import { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, ChevronRight, BookOpen, ChevronDown, Search, Lock, MessageCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';

// --- IMPORTACIONES DE CLERK ---
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs';

const yearsTitles: { [key: number]: string } = {
  1: "Primer Año", 2: "Segundo Año", 3: "Tercer Año", 4: "Cuarto Año", 5: "Quinto Año"
};

const cleanId = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

const TableOfContents = ({ content }: { content: string }) => {
  const [isHovered, setIsHovered] = useState(false);

  const headings = useMemo(() => {
    return content.split('\n')
      .filter(line => line.startsWith('## ')) 
      .map(line => {
        const text = line.replace('## ', '').trim();
        const id = cleanId(text);
        return { text, id };
      });
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <aside 
      className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-end transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: isHovered ? '260px' : '40px' }}
    >
      <div className={`
        flex flex-col gap-2 py-4 pr-4 pl-2 transition-all duration-300
        ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}
      `}>
        {headings.map((heading, i) => (
          <a
            key={i}
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(heading.id);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              } else {
                const allHeadings = document.querySelectorAll('h2');
                const found = Array.from(allHeadings).find(h => cleanId(h.innerText) === heading.id);
                if (found) found.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="block whitespace-nowrap overflow-hidden text-right transition-colors no-underline text-[10px] text-gray-400 font-bold uppercase tracking-tight hover:text-purple-400"
          >
            {heading.text}
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-4 items-center pr-4 py-6">
        {headings.map((_, i) => (
          <span 
            key={`dot-${i}`} 
            className={`
              w-1.5 h-1.5 rounded-full transition-all duration-300 bg-gray-500
              ${isHovered ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'opacity-40'}
              hover:bg-white hover:scale-150
            `}
          ></span>
        ))}
      </div>
    </aside>
  );
};

export default function Home() {
  // --- LÓGICA DE PERMISOS POR NIVEL ---
  const { user } = useUser();
  const userLevel = Number(user?.publicMetadata?.plan) || 0;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMd, setSelectedMd] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({ 1: true });
  const [expandedSubjects, setExpandedSubjects] = useState<{[key: string]: boolean}>({});

  // Detectamos a qué año pertenece el apunte actual
  const currentYear = useMemo(() => {
    if (!selectedMd) return 0;
    for (const yearObj of yearsDataRaw) {
      for (const sub of yearObj.subjects) {
        if (sub.topics.some(t => t.file === selectedMd)) return yearObj.year;
      }
    }
    return 0;
  }, [selectedMd]);

  const hasAccess = userLevel >= currentYear;

  useEffect(() => {
    (window as any).navegarApunte = (ruta: string) => {
      setSelectedMd(ruta);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const mainContainer = document.querySelector('.overflow-y-auto');
      if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChangeDoc = (e: any) => {
      if (e.detail) (window as any).navegarApunte(e.detail);
    };

    window.addEventListener('changeDoc', handleChangeDoc);
    return () => window.removeEventListener('changeDoc', handleChangeDoc);
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return yearsDataRaw;
    const term = searchTerm.toLowerCase();
    return yearsDataRaw.map(year => ({
      ...year,
      subjects: year.subjects.map(sub => ({
        ...sub,
        topics: sub.topics.filter(topic => 
          topic.label.toLowerCase().includes(term) ||
          sub.name.toLowerCase().includes(term) ||
          (topic.keywords && topic.keywords.some(kw => kw.toLowerCase().includes(term)))
        )
      })).filter(sub => sub.topics.length > 0)
    })).filter(year => year.subjects.length > 0);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedMd) return;
    fetch(`/apuntes/${selectedMd}.md`)
      .then(res => res.text())
      .then(text => {
        let cleanText = text
          .split('<b>').join('**')
          .split('</b>').join('**')
          .split('(/public/').join('(/'); 

        const lines = cleanText.split('\n');
        const finalLines = lines.map(line => {
          const trimmed = line.trim();
          if (trimmed.includes('{#')) return line.split('{#')[0].trim();
          return line;
        });
        setContent(finalLines.join('\n'));
      })
      .catch(() => setContent('# Error\nNo se pudo cargar el apunte.'));
  }, [selectedMd]);

  const handleSelection = (file: string) => {
    setSelectedMd(file);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 shrink-0 text-white font-bold text-lg">
          <Brain className="w-6 h-6 text-purple-500" />
          <span>Medpath</span>
        </div>
        <div className="p-4 border-b border-[#30363d] shrink-0">
          <div className="relative group text-white">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar apunte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg py-2 pl-10 pr-8 text-xs focus:outline-none focus:border-purple-500 transition-all text-white"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredData.map((yearData) => (
            <div key={yearData.year} className="space-y-1">
              <button onClick={() => setExpandedYears(prev => ({...prev, [yearData.year]: !prev[yearData.year]}))} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-[#21262d]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span>{yearsTitles[yearData.year]}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${(expandedYears[yearData.year] || searchTerm) ? 'rotate-180' : ''}`} />
              </button>

              {(expandedYears[yearData.year] || searchTerm) && (
                <div className="ml-3 pl-1 border-l border-[#30363d]/50">
                  {yearData.subjects.map((sub, idx) => {
                    const subKey = `${yearData.year}-${sub.name}`;
                    const isSubExpanded = expandedSubjects[subKey] || searchTerm !== '';
                    return (
                      <div key={idx}>
                        <button onClick={() => setExpandedSubjects(prev => ({...prev, [subKey]: !prev[subKey]}))} className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-400 hover:text-white">
                          <span>{sub.name}</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isSubExpanded && (
                          <div className="ml-4 space-y-1">
                            {sub.topics.map(topic => (
                              <button key={topic.file} onClick={() => handleSelection(topic.file)} className={`w-full text-left py-1 text-xs ${selectedMd === topic.file ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}>
                                • {topic.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#30363d] bg-[#161b22]/50 shrink-0">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400">
              <Menu className="w-5 h-5" />
            </button>
            <div className="ml-4 flex items-center gap-2 text-[10px] text-gray-500 truncate uppercase font-medium">
                <span>Medpath</span>
                {selectedMd && <><ChevronRight className="w-3 h-3" /> <span className="text-purple-400">{selectedMd.split('/').pop()?.split('_').join(' ')}</span></>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-full font-bold shadow-lg transition-all">Iniciar Sesión</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#0d1117] scroll-smooth relative">
          <div className="max-w-4xl mx-auto relative">
            {selectedMd && <TableOfContents content={content} />}

            {selectedMd ? (
              <>
                <SignedIn>
                  {hasAccess ? (
                    <article className="prose prose-invert prose-purple max-w-none prose-blockquote:not-italic prose-headings:scroll-mt-24 prose-headings:text-white prose-p:text-gray-300 prose-img:rounded-xl prose-img:mx-auto prose-table:border prose-table:border-[#30363d] prose-th:bg-[#161b22] prose-th:p-4 prose-td:p-4 prose-table:my-8 prose-table:w-full">
                      <Markdown 
                        remarkPlugins={[remarkGfm, remarkSlug]} 
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          a: ({ node, ...props }) => {
                            const isInternal = props.href && !props.href.startsWith('http');
                            if (isInternal) {
                              return (
                                <a {...props} onClick={(e) => { e.preventDefault(); if (props.href) handleSelection(props.href); }} className={props.className}>
                                  {props.children}
                                </a>
                              );
                            }
                            return <a {...props} target="_blank" rel="noopener noreferrer" />;
                          }
                        }}
                      >
                        {content}
                      </Markdown>
                    </article>
                  ) : (
                    <div className="mt-20 flex flex-col items-center text-center p-12 border border-purple-500/20 rounded-3xl bg-[#161b22]/40">
                      <Lock className="w-10 h-10 text-purple-400 mb-4" />
                      <h2 className="text-xl font-bold text-white tracking-tight">Acceso Restringido</h2>
                      <p className="text-gray-400 mt-2 mb-8 text-sm max-w-xs">Tu pase de estudio actual ({userLevel === 0 ? 'Sin suscripción' : `Año ${userLevel}`}) no incluye el material de {currentYear}° Año.</p>
                      
                      <a href="https://wa.me/56968250136" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all">
                        <MessageCircle className="w-4 h-4" />
                        <span>Solicitar activación</span>
                      </a>
                    </div>
                  )}
                </SignedIn>

                <SignedOut>
                  <div className="mt-20 flex flex-col items-center text-center p-12 border border-dashed border-[#30363d] rounded-3xl bg-[#161b22]/30">
                    <Lock className="w-10 h-10 text-purple-500 mb-4" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Biblioteca Digital</h2>
                    <p className="text-gray-400 mt-2 mb-8 text-sm max-w-xs">Identifícate para desbloquear tu material de estudio.</p>
                    <SignInButton mode="modal">
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-xl transition-all">Entrar a la Biblioteca</button>
                    </SignInButton>
                  </div>
                </SignedOut>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center mt-20">
                <Brain className="w-16 h-16 text-gray-800 mb-4 animate-pulse" />
                <h2 className="text-xl font-bold text-gray-300">Medpath Digital</h2>
                <p className="text-gray-500 text-sm mt-2">Busca un tema y comienza a estudiar.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}