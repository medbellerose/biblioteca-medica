'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, ChevronDown, Search, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';

const cleanId = (t: string) => {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
};

const TableOfContents = ({ content }: { content: string }) => {
  const [isHovered, setIsHovered] = useState(false);
  const headings = useMemo(() => {
    if (!content) return [];
    return content.split('\n')
      .filter(line => line.trim().startsWith('## '))
      .map(line => {
        const text = line.replace('## ', '').trim();
        return { text, id: cleanId(text) };
      });
  }, [content]);
  if (headings.length === 0) return null;
  return (
    <aside className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center justify-end" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ width: isHovered ? '280px' : '40px' }}>
      <div className={`flex flex-col gap-2 py-4 pr-6 bg-[#161b22]/95 backdrop-blur rounded-l-xl border border-[#30363d] transition-all ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
        {headings.map((h, i) => (
          <button key={i} onClick={() => document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' })} className="text-right text-[10px] text-gray-300 hover:text-purple-400 truncate">{h.text}</button>
        ))}
      </div>
      <div className="flex flex-col gap-4 pr-4 py-6 shrink-0">
        {headings.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-gray-600'}`}></span>)}
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

  const isPdf = useMemo(() => selectedMd?.toLowerCase().endsWith('.pdf'), [selectedMd]);

  useEffect(() => {
    if (!selectedMd) return;
    if (isPdf) {
      setContent('---PDF---');
    } else {
      const path = selectedMd.startsWith('/') ? selectedMd : `/${selectedMd}`;
      fetch(`/apuntes${path}`)
        .then(res => res.ok ? res.text() : Promise.reject())
        .then(t => setContent(t))
        .catch(() => setContent('# ❌ Error al cargar el archivo'));
    }
  }, [selectedMd, isPdf]);

  const filteredData = useMemo(() => {
    return yearsDataRaw.map(year => ({
      ...year,
      subjects: year.subjects.map(sub => ({
        ...sub,
        topics: sub.topics.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()))
      })).filter(sub => sub.topics.length > 0)
    })).filter(year => year.subjects.length > 0);
  }, [searchTerm]);

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 text-white font-bold text-lg"><Brain className="w-6 h-6 text-purple-500" /><span>Medpath</span></div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredData.map((y) => (
            <div key={y.year}>
              <button onClick={() => setExpandedYears(p => ({...p, [y.year]: !p[y.year]}))} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300">
                <span>Año {y.year}</span>
                <ChevronDown className={`w-4 h-4 ${expandedYears[y.year] ? 'rotate-180' : ''}`} />
              </button>
              {expandedYears[y.year] && (
                <div className="ml-3 border-l border-[#30363d] pl-2">
                  {y.subjects.map((sub, i) => (
                    <div key={i}>
                      <button onClick={() => setExpandedSubjects(prev => ({ ...prev, [`${y.year}-${sub.name}`]: !prev[`${y.year}-${sub.name}`] }))} className="w-full text-left py-1 text-[10px] text-gray-500 font-bold uppercase">{sub.name}</button>
                      {expandedSubjects[`${y.year}-${sub.name}`] && sub.topics.map(t => (
                        <button key={t.file} onClick={() => setSelectedMd(t.file)} className={`w-full text-left px-3 py-1 text-xs rounded ${selectedMd === t.file ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400'}`}>{t.label}</button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0d1117]">
        <header className="h-14 flex items-center justify-between px-6 border-b border-[#30363d]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}><Menu className="w-5 h-5" /></button>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            {selectedMd && !isPdf && content && <TableOfContents content={content} />}
            {selectedMd ? (
              isPdf ? (
                <iframe src={selectedMd.startsWith('/') ? selectedMd : `/${selectedMd}`} className="w-full h-[85vh] rounded-lg border border-[#30363d]" />
              ) : (
                <article className="prose prose-invert max-w-none prose-purple">
                  <Markdown remarkPlugins={[remarkGfm, remarkSlug]} rehypePlugins={[rehypeRaw]}>{content}</Markdown>
                </article>
              )
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center opacity-20"><Brain className="w-20 h-20" /><h1 className="text-2xl font-bold mt-4 tracking-widest">MEDPATH</h1></div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}