'use client';

import { useState, useEffect, useMemo } from 'react';
import { Brain, Menu, ChevronRight, BookOpen, ChevronDown, Search, X } from 'lucide-react';
import Markdown from 'react-markdown';
import yearsDataRaw from './apuntes.json';

const yearsTitles: { [key: number]: string } = {
  1: "Primer Año", 2: "Segundo Año", 3: "Tercer Año", 4: "Cuarto Año", 5: "Quinto Año"
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMd, setSelectedMd] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({ 1: true });
  const [expandedSubjects, setExpandedSubjects] = useState<{[key: string]: boolean}>({});

  const filteredData = useMemo(() => {
    if (!searchTerm) return yearsDataRaw;
    return yearsDataRaw.map(year => ({
      ...year,
      subjects: year.subjects.map(sub => ({
        ...sub,
        topics: sub.topics.filter(topic => 
          topic.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(sub => sub.topics.length > 0)
    })).filter(year => year.subjects.length > 0);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedMd) return;

    fetch(`/apuntes/${selectedMd}.md`)
      .then(res => res.text())
      .then(text => {
        // LIMPIEZA DE TABLAS: Aseguramos el espacio necesario
        let cleanText = text.split('\n|').join('\n\n|');
        
        // LIMPIEZA DE ETIQUETAS: Quitamos las marcas de citación del PDF
        const tags = ['', '[cite_end]', ''];
        tags.forEach(tag => {
          cleanText = cleanText.split(tag).join('');
        });

        // FILTRADO DE LÍNEAS: Quitamos referencias de origen
        const finalContent = cleanText.split('\n').filter(line => {
          const l = line.toLowerCase();
          return !l.includes('text-[#e6edf3]">
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
              placeholder="Buscar apuntes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg py-2 pl-10 pr-8 text-xs focus:outline-none focus:border-purple-500 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2.5 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredData.map((yearData) => (
            <div key={yearData.year} className="space-y-1">
              <button 
                onClick={() => setExpandedYears(prev => ({...prev, [yearData.year]: !prev[yearData.year]}))} 
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-[#21262d]"
              >
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
                      <button 
                        onClick={() => setExpandedSubjects(prev => ({...prev, [`${yearData.year}-${sub.name}`]: !prev[`${yearData.year}-${sub.name}`]}))} 
                        className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                      >
                        <span>{sub.name}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {(expandedSubjects[`${yearData.year}-${sub.name}`] || searchTerm) && (
                        <div className="ml-4 space-y-1">
                          {sub.topics.map(topic => (
                            <button 
                              key={topic.file} 
                              onClick={() => handleSelection(topic.file)} 
                              className={`w-full text-left py-1 text-xs ${selectedMd === topic.file ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                            >
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
              {selectedMd && <><ChevronRight className="w-3 h-3" /> <span className="text-purple-400">{selectedMd.split('-').join(' ')}</span></>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#0d1117]">
          {selectedMd ? (
            <article className="max-w-4xl mx-auto prose prose-invert prose-purple prose-headings:text-white prose-p:text-gray-300 prose-img:rounded-xl prose-img:mx-auto prose-table:border prose-table:border-[#30363d] prose-th:bg-[#161b22] prose-th:p-4 prose-td:p-4 prose-table:my-8">
              <Markdown>{content}</Markdown>
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Brain className="w-16 h-16 text-gray-800 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-300">Medpath Digital</h2>
              <p className="text-gray-500 text-sm mt-2">Busca un tema y comienza a estudiar.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}