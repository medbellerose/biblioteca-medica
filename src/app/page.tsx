'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, BookOpen, ChevronDown, Lock } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import rehypeRaw from 'rehype-raw';
import yearsDataRaw from './apuntes.json';
import { SignedIn, UserButton, useUser } from '@clerk/nextjs';

export default function Home() {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMd, setSelectedMd] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({ 1: true });

  const allowedYears = useMemo(() => {
    const plan = String(user?.publicMetadata?.plan || "");
    return plan.split(',').map(num => parseInt(num.trim())).filter(num => !isNaN(num));
  }, [user]);

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

  const hasAccess = allowedYears.includes(currentYear);

  useEffect(() => {
    if (!selectedMd || isPdf) return;
    const fileName = selectedMd.includes('.') ? selectedMd : `${selectedMd}.md`;
    fetch(`/apuntes/${fileName}`)
      .then(res => res.text())
      .then(text => setContent(text.split('<b>').join('**').split('</b>').join('**')))
      .catch(() => setContent('# Error\nNo se pudo cargar el apunte.'));
  }, [selectedMd, isPdf]);

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 text-white font-bold text-lg shrink-0">
          <Brain className="w-6 h-6 text-purple-500" />
          <span>Medpath</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {yearsDataRaw.map((y) => (
            <div key={y.year}>
              <button onClick={() => setExpandedYears(p => ({...p, [y.year]: !p[y.year]}))} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-[#21262d]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  <span>Año {y.year}</span>
                </div>
                <ChevronDown className={`w-4 h-4 ${expandedYears[y.year] ? 'rotate-180' : ''}`} />
              </button>
              {expandedYears[y.year] && (
                <div className="ml-3 pl-1 border-l border-[#30363d]/50">
                  {y.subjects.map((sub, idx) => (
                    <div key={idx} className="mb-2">
                      <p className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-500">{sub.name}</p>
                      {sub.topics.map(t => (
                        <button key={t.file} onClick={() => { setSelectedMd(t.file); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full text-left px-3 py-1 text-xs rounded-md ${selectedMd === t.file ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400 hover:text-white'}`}>
                          {t.file.endsWith('.pdf') ? '📄 ' : '• '} {t.label}
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
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400"><Menu className="w-5 h-5" /></button>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          {selectedMd ? (
            <SignedIn>
              {hasAccess ? (
                isPdf ? (
                  <iframe src={`/apuntes/${selectedMd}#toolbar=0`} className="w-full h-[85vh] rounded-xl border border-[#30363d]" />
                ) : (
                  <article className="prose prose-invert prose-purple max-w-none">
                    <Markdown remarkPlugins={[remarkGfm, remarkSlug]} rehypePlugins={[rehypeRaw]}>{content}</Markdown>
                  </article>
                )
              ) : (
                <div className="mt-20 text-center p-12 border border-purple-500/20 rounded-3xl bg-[#161b22]/40">
                  <Lock className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-white">Acceso Restringido</h2>
                  <p className="text-gray-400 text-sm mt-2">No tienes permiso para este año.</p>
                </div>
              )}
            </SignedIn>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Brain className="w-16 h-16 mb-4 animate-pulse mx-auto" />
              <h2 className="text-xl font-bold uppercase tracking-widest">Medpath</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}