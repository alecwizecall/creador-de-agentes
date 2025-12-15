import React, { useState } from 'react';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';
import InputSection from './components/InputSection';
import ResultSection from './components/ResultSection';
import { BusinessInfo, DataSource, ProcessingStatus } from './types';
import { generateSystemPrompt } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: '',
    industry: '',
    description: '',
    tone: 'Profesional y Servicial',
    language: 'Español'
  });
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');

  const handleGenerate = async () => {
    setStatus(ProcessingStatus.GENERATING);
    try {
      const prompt = await generateSystemPrompt(businessInfo, dataSources);
      setGeneratedPrompt(prompt);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
      // Optional: Add toast notification here
      alert("Algo salió mal al generar el prompt.");
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-2 rounded-lg text-white">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
                Asistente de generación de prompts
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Generador de System Prompts</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* API Key warning if missing - though environment variable is expected */}
            {!process.env.API_KEY && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                <AlertCircle size={14} />
                <span>Modo Demo (Requiere API Key)</span>
              </div>
            )}
            <a 
              href="https://ai.google.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors flex items-center gap-1"
            >
              Potenciado por Gemini <Sparkles size={14} className="text-brand-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 h-full flex flex-col min-h-0">
             <div className="mb-4 shrink-0">
               <h2 className="text-lg font-bold text-slate-800">1. Contexto y Datos</h2>
               <p className="text-sm text-slate-500">Define la personalidad y conocimiento de tu bot.</p>
             </div>
             <div className="flex-1 min-h-0">
               <InputSection 
                 businessInfo={businessInfo}
                 setBusinessInfo={setBusinessInfo}
                 dataSources={dataSources}
                 setDataSources={setDataSources}
                 onGenerate={handleGenerate}
                 status={status}
               />
             </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 h-full flex flex-col min-h-0">
            <div className="mb-4 shrink-0">
               <h2 className="text-lg font-bold text-slate-800">2. Tu System Prompt</h2>
               <p className="text-sm text-slate-500">Copia este bloque de código en la configuración de tu agente de IA.</p>
             </div>
            <div className="flex-1 min-h-0">
              <ResultSection 
                prompt={generatedPrompt} 
                status={status} 
                onRegenerate={handleGenerate}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;