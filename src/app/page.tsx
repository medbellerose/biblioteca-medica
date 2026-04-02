'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, Menu, ChevronRight, BookOpen, ChevronDown,
  FileText, Microscope, Dna, Activity, Stethoscope
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import yearsDataRaw from './apuntes.json';

const iconMap: { [key: number]: any } = {
  1: BookOpen, 2: Microscope, 3: Dna, 4: Activity, 5: Stethoscope
};

const yearsTitles: { [key: number]: string } = {
  1: "Primer Año", 2: "Segundo Año", 3: "Tercer Año", 4: "Cuarto Año", 5: "Quinto Año"
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMd, setSelectedMd] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({ 1: true });
  const [expandedSubjects, setExpandedSubjects] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (selectedMd) {
      fetch(`/apuntes/${selectedMd}.md`)
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(() => setContent('# Error\nNo se pudo cargar el apunte.'));
    }
  }, [selectedMd]);

  const handleSelection = (file: string) => {
    setSelectedMd(file);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col z-50`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3 shrink-0">
          <Brain className="w-6 h-6 text-purple-500" />
          <span className="font-bold text-lg text-white">Medpath</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {yearsDataRaw.map((yearData) => {
            const YearIcon = iconMap[yearData.year] || BookOpen;
            return (
              <div key={yearData.year} className="space-y-1">
                <button onClick={() => setExpandedYears(prev => ({...prev, [yearData.year]: !prev[yearData.year]}))} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-[#21262d]">
                  <div className="flex items-center gap-2">
                    <YearIcon className="w-4 h-4 text-gray-500" />
                    <span>{yearsTitles[yearData.year]}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedYears[yearData.year] ? 'rotate-180' : ''}`} />
                </button>
                {expandedYears[yearData.year] && (
                  <div className="ml-3 pl-1 border-l border-[#30363d]/50">
                    {yearData.subjects.map((sub, idx) => (
                      <div key={idx}>
                        <button onClick={() => setExpandedSubjects(prev => ({...prev, [`${yearData.year}-${sub.name}`]: !prev[`${yearData.year}-${sub.name}`]}))} className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-gray-400 hover:text-white">
                          <span>{sub.name}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {expandedSubjects[`${yearData.year}-${sub.name}`] && (
                          <div className="ml-4 space-y-1">
                            {sub.topics.map(topic => (
                              <button key={topic.file} onClick={() => handleSelection(topic.file)} className={`w-full text-left py-1 text-xs ${selectedMd === topic.file ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
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
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        <header className="h-14 flex items-center px-6 border-b border-[#30363d] bg-[#161b22]/50 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-4 flex items-center gap-2 text-[10px] text-gray-500 truncate uppercase">
              <span>Medpath</span>
              {selectedMd && <><ChevronRight className="w-3 h-3" /> <span className="text-purple-400">{selectedMd.replace(/-/g, ' ')}</span></>}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          {selectedMd ? (
            <article className="max-w-3xl mx-auto prose prose-invert prose-purple prose-headings:text-white prose-p:text-gray-300 prose-img:rounded-xl prose-img:mx-auto">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Brain className="w-16 h-16 text-gray-800 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-300">Medpath Digital</h2>
              <p className="text-gray-500 text-sm mt-2">Selecciona un tema para estudiar sin distracciones.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}