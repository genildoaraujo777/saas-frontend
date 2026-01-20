import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, DragMoveEvent } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import { 
  Smartphone, PencilLine, Trash2, Eye, Save, 
  Settings2, X, ShoppingCart, User, ClipboardList 
} from 'lucide-react';

// --- DEFINIÇÃO DOS TEMPLATES ---
const TEMPLATES = {
  ASSISTENCIA: [
    { id: uuidv4(), tipo: 'header', label: 'ORDEM DE SERVIÇO - ASSISTÊNCIA', x: 200, y: 50, w: 400, h: 60 },
    { id: uuidv4(), tipo: 'text', label: 'CLIENTE', x: 50, y: 130, w: 340, h: 70 },
    { id: uuidv4(), tipo: 'text', label: 'APARELHO / MODELO', x: 410, y: 130, w: 340, h: 70 },
    { id: uuidv4(), tipo: 'text', label: 'DEFEITO RECLAMADO', x: 50, y: 220, w: 700, h: 100 },
    { id: uuidv4(), tipo: 'tabela', label: 'PEÇAS E SERVIÇOS', x: 50, y: 340, w: 700, h: 300 },
    { id: uuidv4(), tipo: 'text', label: 'LAUDO TÉCNICO FINAL', x: 50, y: 660, w: 700, h: 100 },
  ],
  PAPELARIA: [
    { id: uuidv4(), tipo: 'header', label: 'ORÇAMENTO - SPG PERSONALIZADOS', x: 200, y: 50, w: 400, h: 60 },
    { id: uuidv4(), tipo: 'text', label: 'NOME DO ANIVERSARIANTE', x: 50, y: 130, w: 450, h: 70 },
    { id: uuidv4(), tipo: 'text', label: 'IDADE', x: 520, y: 130, w: 230, h: 70 },
    { id: uuidv4(), tipo: 'text', label: 'TEMA DA FESTA', x: 50, y: 220, w: 450, h: 70 },
    { id: uuidv4(), tipo: 'date', label: 'DATA DA FESTA', x: 520, y: 220, w: 230, h: 70 },
    { id: uuidv4(), tipo: 'tabela', label: 'ITENS PERSONALIZADOS', x: 50, y: 320, w: 700, h: 400 },
  ]
};

export default function OSEditor() {
  const [campos, setCampos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [guides, setGuides] = useState<{ x: number[], y: number[] }>({ x: [], y: [] });

  // Carrega o template inicial
  const aplicarTemplate = (key: 'ASSISTENCIA' | 'PAPELARIA') => {
    setCampos(TEMPLATES[key]);
    setSelecionado(null);
  };

  // Motor de alinhamento e Nudge (Preservado conforme sua aprovação anterior)
  // ... (Aqui entra a lógica de calculateGuides e DragEvents que já validamos)

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans overflow-hidden">
      
      {/* SIDEBAR DE TEMPLATES */}
      {!isPreview && (
        <aside className="w-72 bg-white border-r p-6 shadow-xl z-50 flex flex-col gap-6">
          <div className="mb-4">
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Templates Prontos</h2>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => aplicarTemplate('ASSISTENCIA')}
                className="flex items-center gap-3 p-4 border rounded-xl hover:bg-indigo-50 transition-all border-slate-200 group"
              >
                <div className="p-2 bg-slate-100 rounded-lg group-hover:text-indigo-600"><Smartphone size={20}/></div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-700">Assistência Técnica</p>
                  <p className="text-[9px] text-slate-400 uppercase">Celulares e Eletrônicos</p>
                </div>
              </button>

              <button 
                onClick={() => aplicarTemplate('PAPELARIA')}
                className="flex items-center gap-3 p-4 border rounded-xl hover:bg-indigo-50 transition-all border-slate-200 group"
              >
                <div className="p-2 bg-slate-100 rounded-lg group-hover:text-indigo-600"><PencilLine size={20}/></div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-slate-700">Papelaria / SPG</p>
                  <p className="text-[9px] text-slate-400 uppercase">Festas e Personalizados</p>
                </div>
              </button>
            </div>
          </div>

          <hr />
          
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Campos Extras</h2>
            {/* Lista de campos manuais para se o usuário precisar de algo a mais */}
          </div>
        </aside>
      )}

      {/* ÁREA DE EDIÇÃO (CANVAS) */}
      <main className="flex-1 relative flex flex-col items-center p-8 overflow-auto">
        <header className="w-full max-w-5xl flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Painel de Orçamentos</span>
            <h1 className="text-2xl font-black text-slate-800 italic">FBMSTORE <span className="text-indigo-600">PRO</span></h1>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setIsPreview(!isPreview)} className="px-6 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase hover:shadow-md transition-all">
              {isPreview ? 'Editar Layout' : 'Visualizar Impressão'}
            </button>
            <button className="px-8 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
              Salvar Template
            </button>
          </div>
        </header>

        {/* Papel A4 Virtual */}
        <div className={`w-[800px] min-h-[1130px] bg-white shadow-2xl relative overflow-hidden rounded-sm border ${!isPreview ? 'border-dashed border-indigo-200' : 'border-none'}`}>
          {/* O motor de movimento (DraggableElement) renderiza aqui os campos do template carregado */}
          {campos.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
               <ClipboardList size={64} strokeWidth={1} />
               <p className="font-bold uppercase text-[10px] tracking-widest mt-4">Selecione um template para começar</p>
            </div>
          )}
          
          {/* Renderização dos campos... */}
        </div>
      </main>
    </div>
  );
}