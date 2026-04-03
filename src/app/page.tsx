'use client';

import { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, ChevronRight, BookOpen, ChevronDown, Search } from 'lucide-center';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';

const yearsTitles: { [key: number]: string } = {
  1: "Primer Año", 2: "Segundo Año", 3: "Tercer Año", 4: "Cuarto Año", 5: "Quinto Año"
};

// --- FUNCIÓN DE LIMPIEZA UNIVERSAL ---
const cleanId = (text: string) => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^\w\s-]/g, '') // Quita símbolos, puntos, dos puntos, emojis
    .trim()
    .replace(/\s+/g, '-'); // Espacios por guiones
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMd, setSelectedMd] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({ 1: true });
  const [expandedSubjects, setExpandedSubjects] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const handleChangeDoc = (e: any) => {
      if (e.detail) {
        setSelectedMd(e.detail);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
              placeholder="Buscar por título o concepto..."
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
                  {yearData.subjects.map((sub, idx) => (
                    <div key={idx}>
                      <button onClick={() => setExpandedSubjects(prev => ({...prev, [`${yearData.year}-${sub.name}`]: !prev[`${yearData.year}-${sub.name}`]}))} className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-400 hover:text-white">
                        <span>{sub.name}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {(expandedSubjects[`${yearData.year}-${sub.name}`] || searchTerm) && (
                        <div className="ml-4 space-y-1">
                          {sub.topics.map(topic => (
                            <button key={topic.file} onClick={() => handleSelection(topic.file)} className={`w-full text-left py-1 text-xs ${selectedMd === topic.file ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}>
                              • {topic.label}
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

      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative overflow-hidden">
        <header className="h-14 flex items-center px-6 border-b border-[#30363d] bg-[#161b22]/50 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-4 flex items-center gap-2 text-[10px] text-gray-500 truncate uppercase font-medium">
              <span>Medpath</span>
              {selectedMd && <><ChevronRight className="w-3 h-3" /> <span className="text-purple-400">{selectedMd.split('/').pop()?.split('_').join(' ')}</span></>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#0d1117] scroll-smooth relative">
          <div className="max-w-4xl mx-auto relative">
            {selectedMd && <TableOfContents content={content} />}

            {selectedMd ? (
              <article className="prose prose-invert prose-purple max-w-none prose-blockquote:not-italic prose-headings:scroll-mt-24 prose-headings:text-white prose-p:text-gray-300 prose-img:rounded-xl prose-img:mx-auto prose-table:border prose-table:border-[#30363d] prose-th:bg-[#161b22] prose-th:p-4 prose-td:p-4 prose-table:my-8 prose-table:w-full">
                <Markdown 
                  remarkPlugins={[remarkGfm, remarkSlug]} 
                  rehypePlugins={[rehypeRaw]}
                >
                  {content}
                </Markdown>
              </article>
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