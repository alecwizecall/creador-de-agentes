import React from 'react';
import { Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import { ProcessingStatus } from '../types';

interface ResultSectionProps {
  prompt: string;
  status: ProcessingStatus;
  onRegenerate: () => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ prompt, status, onRegenerate }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === ProcessingStatus.IDLE) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <Sparkles size={32} />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Listo para Crear</h3>
        <p className="text-slate-500 max-w-sm">
          Completa los detalles de tu negocio y agrega documentos a la izquierda. Una vez listo, haz clic en generar para crear el prompt de tu agente de IA.
        </p>
      </div>
    );
  }

  if (status === ProcessingStatus.GENERATING || status === ProcessingStatus.SEARCHING) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-brand-600">
            <Sparkles size={20} className="animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Creando tu Agente</h3>
        <p className="text-slate-500 max-w-sm">
          Analizando datos, sintetizando conocimiento y estructurando la instrucción del sistema perfecta...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Sparkles size={16} className="text-brand-500" />
          System Prompt Generado
        </h3>
        <div className="flex gap-2">
           <button
            onClick={onRegenerate}
            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200"
            title="Regenerar"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar Código'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-0 bg-[#0d1117]">
        <pre className="p-6 text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
          {prompt}
        </pre>
      </div>
    </div>
  );
};

export default ResultSection;