'use client';

import { useState } from 'react';
import { 
  Brain, Menu, ChevronRight, BookOpen, ChevronDown,
  FileText, Microscope, Dna, Activity, Stethoscope
} from 'lucide-react';
import yearsDataRaw from './apuntes.json';

const iconMap: { [key: number]: any } = {
  1: BookOpen,
  2: Microscope,
  3: Dna,
  4: Activity,
  5: Stethoscope
};

const yearsTitles: { [key: number]: string } = {
  1: "Primer Año",
  2: "Segundo Año",
  3: "Tercer Año",
  4: "Cuarto Año",
  5: "Quinto Año"
};

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({ 1: true });
  const [expandedSubjects, setExpandedSubjects] = useState<{[key: string]: boolean}>({});

  const toggleYear = (year: number) => setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  const toggleSubject = (key: string) => setExpandedSubjects(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex h-screen bg-[#0d1117] text-[#e6edf3]">
      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#161b22] border-r border-[#30363d] overflow-hidden flex flex-col`}>
        <div className="p-5 border-b border-[#30363d] flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-500" />
          <span className="font-bold text-lg">Medpath</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {yearsDataRaw.map((yearData) => {
            const YearIcon = iconMap[yearData.year] || BookOpen;
            const isYearExpanded = expandedYears[yearData.year];
            return (
              <div key={yearData.year} className="space-y-1">
                <button onClick={() => toggleYear(yearData.year)} className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-[#21262d] hover:text-white transition">
                  <div className="flex items-center gap-2">
                    <YearIcon className="w-4 h-4 text-gray-500" />
                    <span>{yearsTitles[yearData.year]}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isYearExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isYearExpanded && (
                  <div className="ml-3 pl-1 space-y-1 border-l border-[#30363d]/50">
                    {yearData.subjects.map((subject, idx) => {
                      const subjectKey = `${yearData.year}-${subject.name}`;
                      const isSubjectExpanded = expandedSubjects[subjectKey];
                      return (
                        <div key={idx}>
                          <button onClick={() => toggleSubject(subjectKey)} className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-[#21262d] hover:text-white transition">
                            <span className="truncate">{subject.name}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isSubjectExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {isSubjectExpanded && (
                            <div className="ml-4 border-l border-[#30363d] pl-4 py-1 space-y-1">
                              {subject.topics?.map((topic) => (
                                <button key={topic.file} onClick={() => setSelectedPdf(topic.file)} className={`w-full text-left py-1 text-xs transition ${selectedPdf === topic.file ? 'text-purple-400 font-bold' : 'text-gray-400 hover:text-gray-200'}`}>
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
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
        <header className="h-14 flex items-center px-6 border-b border-[#30363d] bg-[#161b22]/50">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-[#21262d] rounded-lg text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-4 flex items-center gap-2 text-xs text-gray-500">
              <span>Medpath</span>
              {selectedPdf && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-purple-400 uppercase">{selectedPdf.replace(/-/g, ' ')}</span>
                </>
              )}
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          {selectedPdf ? (
            <iframe 
              key={selectedPdf}
              src={`/pdfs/${selectedPdf}.pdf#toolbar=0&navpanes=0`} 
              className="w-full h-[calc(100%+56px)] -mt-[56px] border-none" 
              title="PDF Viewer" 
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <FileText className="w-12 h-12 text-gray-700 mb-4" />
              <h2 className="text-xl font-bold">Medpath</h2>
              <p className="text-gray-500 text-sm mt-2 px-4">Selecciona un apunte para comenzar a estudiar.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}