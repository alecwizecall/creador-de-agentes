import React, { useState } from 'react';
import { BusinessInfo, DataSource, ProcessingStatus } from '../types';
import { enrichBusinessInfo, summarizeUrlContent } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Building2, 
  Globe, 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  Loader2, 
  Link as LinkIcon,
  Upload
} from 'lucide-react';

// Resolve PDF.js library from import
// This handles different ESM environment behaviors (CDN vs Bundlers)
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;

// Configure PDF.js worker
if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

interface InputSectionProps {
  businessInfo: BusinessInfo;
  setBusinessInfo: React.Dispatch<React.SetStateAction<BusinessInfo>>;
  dataSources: DataSource[];
  setDataSources: React.Dispatch<React.SetStateAction<DataSource[]>>;
  onGenerate: () => void;
  status: ProcessingStatus;
}

const InputSection: React.FC<InputSectionProps> = ({
  businessInfo,
  setBusinessInfo,
  dataSources,
  setDataSources,
  onGenerate,
  status
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'data'>('info');
  const [urlInput, setUrlInput] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);
  const [isUrlProcessing, setIsUrlProcessing] = useState(false);

  // Common styles for inputs: Dark background, white text
  const inputClassName = "w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all";

  // Handlers for Business Info
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleEnrich = async () => {
    if (!businessInfo.name) return;
    setIsEnriching(true);
    try {
      const result = await enrichBusinessInfo(`${businessInfo.name} ${businessInfo.industry || ''}`);
      setBusinessInfo(prev => ({
        ...prev,
        description: prev.description ? `${prev.description}\n\n${result}` : result
      }));
    } catch (error) {
      console.error(error);
      alert('No se pudo autocompletar la información. Por favor intenta manualmente.');
    } finally {
      setIsEnriching(false);
    }
  };

  // Helper to extract text from PDF
  const readPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Use the resolved pdfjs instance
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
        fullText += `--- Página ${i} ---\n${pageText}\n\n`;
      }
      return fullText;
    } catch (error) {
      console.error("PDF Reading Error:", error);
      throw new Error("No se pudo leer el PDF.");
    }
  };

  // Handlers for Data Sources
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        let text = '';
        if (file.type === 'application/pdf') {
          text = await readPdfText(file);
        } else {
          text = await file.text();
        }

        const newSource: DataSource = {
          id: crypto.randomUUID(),
          type: 'file',
          name: file.name,
          content: text,
          status: 'ready'
        };
        setDataSources(prev => [...prev, newSource]);
      } catch (err) {
        console.error("Failed to read file", err);
        alert("Error al leer el archivo. Asegúrate de que es un archivo de texto válido o PDF.");
      }
      // Reset input
      e.target.value = ''; 
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput) return;
    setIsUrlProcessing(true);
    try {
      const summary = await summarizeUrlContent(urlInput);
      const newSource: DataSource = {
        id: crypto.randomUUID(),
        type: 'url',
        name: urlInput,
        content: summary,
        status: 'ready'
      };
      setDataSources(prev => [...prev, newSource]);
      setUrlInput('');
    } catch (error) {
      console.error(error);
      alert("Error al procesar la información de la URL.");
    } finally {
      setIsUrlProcessing(false);
    }
  };

  const removeSource = (id: string) => {
    setDataSources(prev => prev.filter(ds => ds.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 shrink-0">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'info' 
              ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50/50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 size={18} />
          Info Negocio
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'data' 
              ? 'text-brand-600 border-b-2 border-brand-500 bg-brand-50/50' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText size={18} />
          Base Conocimiento
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'info' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre del Negocio</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="name"
                    value={businessInfo.name}
                    onChange={handleInfoChange}
                    placeholder="ej. Consultorio Médico"
                    className={`flex-1 ${inputClassName}`}
                  />
                  <button
                    onClick={handleEnrich}
                    disabled={isEnriching || !businessInfo.name}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors text-sm border border-slate-200"
                    title="Buscar info en la web"
                  >
                    {isEnriching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                    <span className="hidden sm:inline">Auto-llenar</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Usa "Auto-llenar" para buscar información pública en Google.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Industria</label>
                <input
                  type="text"
                  name="industry"
                  value={businessInfo.industry}
                  onChange={handleInfoChange}
                  placeholder="ej. E-commerce, Salud, Servicios"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción y Servicios</label>
                <textarea
                  name="description"
                  value={businessInfo.description}
                  onChange={handleInfoChange}
                  rows={12}
                  placeholder="Describe tu negocio, productos principales y propuesta de valor..."
                  className={`${inputClassName} resize-none`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tono de Voz</label>
                  <select
                    name="tone"
                    value={businessInfo.tone}
                    onChange={handleInfoChange}
                    className={inputClassName}
                  >
                    <option value="Profesional y Servicial">Profesional y Servicial</option>
                    <option value="Amigable y Casual">Amigable y Casual</option>
                    <option value="Orientado a Ventas">Orientado a Ventas</option>
                    <option value="Técnico y Preciso">Técnico y Preciso</option>
                    <option value="Empático y Cuidadoso">Empático y Cuidadoso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Idioma</label>
                  <select
                    name="language"
                    value={businessInfo.language}
                    onChange={handleInfoChange}
                    className={inputClassName}
                  >
                    <option value="Español">Español</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Francés">Francés</option>
                    <option value="Alemán">Alemán</option>
                    <option value="Portugués">Portugués</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* URL Input */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Globe size={16} className="text-brand-500" />
                Agregar contenido web
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/precios"
                  className="flex-1 px-3 py-2 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                />
                <button
                  onClick={handleUrlAdd}
                  disabled={isUrlProcessing || !urlInput}
                  className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  {isUrlProcessing ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                  Agregar
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Usamos Google Search para leer y resumir el contenido del enlace para la base de conocimiento del bot.
              </p>
            </div>

            {/* File Upload */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Upload size={16} className="text-brand-500" />
                Subir Documentos
              </label>
              <div className="relative group">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-1 text-sm text-slate-500"><span className="font-semibold">Clic para subir</span> o arrastrar y soltar</p>
                      <p className="text-xs text-slate-400">TXT, MD, PDF, CSV, JSON (max 1MB)</p>
                    </div>
                    <input type="file" className="hidden" accept=".txt,.md,.csv,.json,.pdf" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            </div>

            {/* List of Sources */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Fuentes de datos activas ({dataSources.length})</h3>
              {dataSources.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  Aún no hay documentos o enlaces agregados.
                </div>
              ) : (
                <ul className="space-y-2">
                  {dataSources.map((ds) => (
                    <li key={ds.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-md shrink-0">
                          {ds.type === 'url' ? <LinkIcon size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{ds.name}</p>
                          <p className="text-xs text-slate-500 truncate">{ds.content.slice(0, 40)}...</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSource(ds.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
        <button
          onClick={onGenerate}
          disabled={status === ProcessingStatus.GENERATING || (!businessInfo.name && dataSources.length === 0)}
          className="w-full py-3 px-6 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white rounded-lg font-semibold shadow-lg shadow-brand-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {status === ProcessingStatus.GENERATING ? (
            <>
              <Loader2 className="animate-spin" /> Generando Prompt...
            </>
          ) : (
            <>
              Generar Prompt del Agente
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;