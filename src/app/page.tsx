'use client';

import { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, ChevronRight, BookOpen, ChevronDown, Search, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';

// --- IMPORTACIONES ESTABLES DE CLERK ---
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

const yearsTitles: { [key: number]: string } = {
  1: "Primer Año", 2: "Segundo Año", 3: "Tercer Año", 4: "Cuarto Año", 5: "Quinto Año"
};

const cleanId = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
};

const TableOfContents = ({ content }: { content: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const headings = useMemo(() => {
    return content.split('\n').filter(line => line.startsWith('## ')).map(line => {
        const text = line.replace('## ', '').trim();
        const id = cleanId(text);
        return { text, id };
      });
  }, [content]);
  if (headings.length === 0) return null;

  return (
    <aside className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-end transition-all duration-300" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ width: isHovered ? '260px' : '40px' }}>
      <div className={`flex flex-col gap-2 py-4 pr-4 pl-2 transition-all ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {headings.map((heading, i) => (
          <a key={i} href={`#${heading.id}`} className="block text-right text-[10px] text-gray-400 font-bold uppercase hover:text-purple-400 no-underline"
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(heading.id);
              if (target) target.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {heading.text}
          </a>
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
    (window as any).navegarApunte = (ruta: string) => {
      setSelectedMd(ruta);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return yearsDataRaw;
    const term = searchTerm.toLowerCase();
    return yearsDataRaw.map(year => ({
      ...year,
      subjects: year.subjects.map(sub => ({
        ...sub,
        topics: sub.topics.filter(topic => topic.label.toLowerCase().includes(term) || sub.name.toLowerCase().includes(term))
      })).filter(sub => sub.topics.length > 0)
    })).filter(year => year.subjects.length > 0);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedMd) return;
    fetch(`/apuntes/${selectedMd}.md`)
      .then(res => res.text())
      .then(text => {
        let cleanText = text.split('<b>').join('**').split('</b>').join('**').split('(/public/').join('(/'); 
        setContent(cleanText);
      })
      .catch(() => setContent('# Error\nNo se pudo cargar el apunte.'));
  }, [selectedMd]);

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 shrink-0 text-white font-bold text-lg">
          <Brain className="w-6 h-6 text-purple-500" />
          <span>Medpath</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredData.map((yearData) => (
            <div key={yearData.year}>
              <button onClick={() => setExpandedYears(prev => ({...prev, [yearData.year]: !prev[yearData.year]}))} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-[#21262d] rounded-lg">
                <span>{yearsTitles[yearData.year]}</span>
                <ChevronDown className={`w-4 h-4 ${expandedYears[yearData.year] ? 'rotate-180' : ''}`} />
              </button>
              {expandedYears[yearData.year] && (
                <div className="ml-3 border-l border-[#30363d]/50">
                  {yearData.subjects.map((sub, idx) => (
                    <div key={idx}>
                      <p className="px-3 py-1 text-[10px] uppercase text-gray-500 font-bold">{sub.name}</p>
                      {sub.topics.map(topic => (
                        <button key={topic.file} onClick={() => setSelectedMd(topic.file)} className={`w-full text-left px-3 py-1 text-xs ${selectedMd === topic.file ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
                          • {topic.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] overflow-hidden">
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#30363d] bg-[#161b22]/50">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-full font-bold">Iniciar Sesión</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 relative">
          <div className="max-w-4xl mx-auto">
            {selectedMd ? (
              <>
                <TableOfContents content={content} />
                <SignedIn>
                  <article className="prose prose-invert prose-purple max-w-none">
                    <Markdown remarkPlugins={[remarkGfm, remarkSlug]} rehypePlugins={[rehypeRaw]}>{content}</Markdown>
                  </article>
                </SignedIn>
                <SignedOut>
                  <div className="mt-20 flex flex-col items-center text-center p-12 border border-dashed border-[#30363d] rounded-3xl bg-[#161b22]/30">
                    <Lock className="w-12 h-12 text-purple-500 mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold text-white">Contenido Protegido</h2>
                    <p className="text-gray-400 mt-2 mb-8">Inicia sesión para desbloquear tus apuntes de Medpath.</p>
                    <SignInButton mode="modal">
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-xl">Entrar ahora</button>
                    </SignInButton>
                  </div>
                </SignedOut>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center mt-20">
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