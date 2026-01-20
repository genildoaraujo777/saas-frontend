import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  DndContext, PointerSensor, useSensor, useSensors, 
  DragEndEvent, DragMoveEvent, useDraggable 
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ResizableBox } from 'react-resizable';
import { 
  Trash2, Plus, Settings2, X, Type, Calendar, 
  Image as ImageIcon, Square, MousePointer2, List,
  User, Phone, MapPin, Palette, Truck, CreditCard, ShoppingCart
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// COMPONENTE DO ELEMENTO (Adaptado para os campos do index.html)
function DraggableElement({ campo, isSelected, isAnySelected, isTargeted, isCtrlPressed, onSelect, onResize, onRemove, isPreview, onUpdate }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: campo.id,
    disabled: isPreview 
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: campo.x,
    top: campo.y,
    position: 'absolute' as const,
    zIndex: isDragging ? 100 : (isSelected ? 50 : 10),
  };

  return (
    <div ref={setNodeRef} style={style} className="select-none" onMouseDown={() => !isPreview && onSelect(campo)}>
      <ResizableBox
        width={campo.w}
        height={campo.h}
        onResize={(e, data) => onResize(campo.id, data.size, false)}
        onResizeStop={(e, data) => onResize(campo.id, data.size, true)}
        minConstraints={[100, 40]}
        handle={!isPreview ? <span className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-indigo-600 rounded-tl-lg z-50 shadow-sm" /> : <></>}
      >
        <div
          {...(isPreview ? {} : { ...listeners, ...attributes })}
          className={`w-full h-full bg-white border rounded-lg flex flex-col p-3 transition-all duration-75 ${
            isSelected && !isPreview ? 'border-indigo-600 shadow-xl ring-1 ring-indigo-600' : 
            ((isAnySelected || isTargeted || isCtrlPressed) && !isPreview) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10' : 'border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
             {campo.icon}
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate select-none">
                {campo.label}
             </label>
          </div>

          <div className="flex-1 flex items-center overflow-hidden">
             {/* RENDERIZAÇÃO BASEADA NO MAPEAMENTO DO INDEX.HTML */}
             {['cliente', 'contato', 'endereco', 'tema', 'crianca'].includes(campo.tipo) && (
               <input type="text" placeholder={`Informe ${campo.label}...`} disabled={!isPreview} className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1 text-xs text-slate-700 outline-none" />
             )}
             
             {campo.tipo === 'data' && (
               <input type="date" disabled={!isPreview} className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1 text-xs text-slate-700 outline-none" />
             )}

             {campo.tipo === 'pagamento' && (
               <select disabled={!isPreview} className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1 text-xs text-slate-700 outline-none">
                 <option>PIX</option><option>CRÉDITO</option><option>DÉBITO</option>
               </select>
             )}

             {campo.tipo === 'transporte' && (
               <select disabled={!isPreview} className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1 text-xs text-slate-700 outline-none">
                 <option>RETIRADA</option><option>SEDEX</option><option>UBER</option>
               </select>
             )}

             {campo.tipo === 'tabela' && (
               <div className="w-full h-full border rounded border-slate-100 overflow-hidden text-[9px]">
                 <div className="grid grid-cols-4 bg-slate-100 font-bold p-1 border-b">
                   <span>QTD</span><span>PRODUTO</span><span>UNIT.</span><span className="text-right">TOTAL</span>
                 </div>
                 <div className="p-1 text-slate-300 italic">Itens do orçamento aparecerão aqui...</div>
               </div>
             )}

             {campo.tipo === 'logo' && (
               <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded">
                 <ImageIcon size={24} className="text-slate-300" />
               </div>
             )}
          </div>

          {!isPreview && isSelected && (
            <button onMouseDown={(e) => { e.stopPropagation(); onRemove(campo.id); }} className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 z-[150]"><Trash2 size={12} /></button>
          )}
        </div>
      </ResizableBox>
    </div>
  );
}

export default function OSEditor() {
  const [campos, setCampos] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [guides, setGuides] = useState<{ x: number[], y: number[], targetIds: string[] }>({ x: [], y: [] , targetIds: []});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  const calculateGuides = useCallback((id: string, nX: number, nY: number, nW: number, nH: number) => {
    const threshold = 10;
    const gX: number[] = [], gY: number[] = [], targets: string[] = [];
    campos.forEach(t => {
      if (t.id === id) return;
      let matched = false;
      const myX = [nX, nX + nW / 2, nX + nW], targetX = [t.x, t.x + t.w / 2, t.x + t.w];
      myX.forEach(mx => targetX.forEach(tx => { if (Math.abs(mx - tx) < threshold) { gX.push(tx); matched = true; } }));
      const myY = [nY, nY + nH / 2, nY + nH], targetY = [t.y, t.y + t.h / 2, t.y + t.h];
      myY.forEach(my => targetY.forEach(ty => { if (Math.abs(my - ty) < threshold) { gY.push(ty); matched = true; } }));
      if (matched) targets.push(t.id);
    });
    setGuides({ x: [...new Set(gX)], y: [...new Set(gY)], targetIds: targets });
  }, [campos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
      if (!selecionado || isPreview || !e.ctrlKey) return;
      let nX = selecionado.x, nY = selecionado.y;
      if (e.key === 'ArrowLeft') { e.preventDefault(); nX -= 1; }
      if (e.key === 'ArrowRight') { e.preventDefault(); nX += 1; }
      if (e.key === 'ArrowUp') { e.preventDefault(); nY -= 1; }
      if (e.key === 'ArrowDown') { e.preventDefault(); nY += 1; }
      if (nX !== selecionado.x || nY !== selecionado.y) {
        setCampos(prev => prev.map(c => c.id === selecionado.id ? { ...c, x: nX, y: nY } : c));
        setSelecionado((p: any) => ({ ...p, x: nX, y: nY }));
        calculateGuides(selecionado.id, nX, nY, selecionado.w, selecionado.h);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Control') { setIsCtrlPressed(false); setGuides({ x: [], y: [], targetIds: [] }); } };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [selecionado, isPreview, calculateGuides]);

  const adicionarCampo = (tipo: string, label: string, icon: any) => {
    const novo = { id: uuidv4(), tipo, label, icon, x: 250, y: 250, w: 250, h: 80 };
    setCampos([...campos, novo]);
    setSelecionado(novo);
  };

  const handleDragMove = (e: DragMoveEvent) => {
    const { active, delta } = e;
    const c = campos.find(item => item.id === active.id);
    if (c) calculateGuides(active.id as string, c.x + delta.x, c.y + delta.y, c.w, c.h);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, delta } = e;
    setGuides({ x: [], y: [], targetIds: [] });
    const cAtivo = campos.find(c => c.id === active.id);
    if (!cAtivo) return;
    const newX = Math.round(cAtivo.x + delta.x), newY = Math.round(cAtivo.y + delta.y);
    setCampos(prev => prev.map(c => c.id === active.id ? { ...c, x: newX, y: newY } : c));
    setSelecionado((p: any) => p?.id === active.id ? { ...p, x: newX, y: newY } : p);
  };

  const handleResize = (id: string, size: {width: number, height: number}, isFinal: boolean) => {
    const c = campos.find(item => item.id === id);
    if (!c) return;
    if (!isFinal) calculateGuides(id, c.x, c.y, size.width, size.height);
    else { 
      setGuides({ x: [], y: [], targetIds: [] });
      setCampos(prev => prev.map(f => f.id === id ? { ...f, w: size.width, h: size.height } : f));
      setSelecionado((p: any) => p?.id === id ? { ...p, w: size.width, h: size.height } : p);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {!isPreview && (
        <aside className="w-72 bg-white border-r p-6 shadow-sm z-50 flex flex-col gap-6 overflow-y-auto">
          <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Mapeamento index.html</h2>
          <div className="space-y-2">
            {[ 
              { tipo: 'logo', icon: <ImageIcon size={14}/>, label: 'Logo da Empresa' },
              { tipo: 'cliente', icon: <User size={14}/>, label: 'Nome do Cliente' },
              { tipo: 'contato', icon: <Phone size={14}/>, label: 'Contato/WhatsApp' },
              { tipo: 'endereco', icon: <MapPin size={14}/>, label: 'Endereço Entrega' },
              { tipo: 'tema', icon: <Palette size={14}/>, label: 'Tema do Pedido' },
              { tipo: 'data', icon: <Calendar size={14}/>, label: 'Datas (Festa/Entrega)' },
              { tipo: 'pagamento', icon: <CreditCard size={14}/>, label: 'Forma Pagamento' },
              { tipo: 'transporte', icon: <Truck size={14}/>, label: 'Logística' },
              { tipo: 'tabela', icon: <ShoppingCart size={14}/>, label: 'Tabela de Itens' }
            ].map((item) => (
              <button key={item.tipo} onClick={() => adicionarCampo(item.tipo, item.label, item.icon)} className="w-full flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-500 transition-all group">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-indigo-600">{item.icon}</div>
                <span className="text-[9px] font-black text-slate-600 uppercase text-left">{item.label}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <main className="flex-1 relative flex flex-col items-center overflow-auto p-10">
          <div className="w-full max-w-5xl flex justify-between mb-8 items-center">
             <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic tracking-tighter">FBMSTORE | <span className="text-indigo-600">DESIGNER</span></h1>
             <div className="flex gap-3">
                <button onClick={() => { setIsPreview(!isPreview); setSelecionado(null); }} className="px-6 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase shadow-sm transition-all">{isPreview ? 'Sair do Preview' : 'Preview'}</button>
                <button className="px-8 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase shadow-xl">Salvar Layout</button>
             </div>
          </div>

          <div className={`w-full max-w-5xl bg-white shadow-2xl rounded-sm min-h-[1200px] relative overflow-hidden ${!isPreview ? 'border-2 border-dashed border-slate-100' : ''}`}>
            {guides.x.map((v, i) => <div key={`x-${i}`} className="absolute top-0 bottom-0 border-l border-blue-400 z-0 opacity-60 shadow-[0_0_8px_rgba(96,165,250,0.3)]" style={{ left: v }} />)}
            {guides.y.map((v, i) => <div key={`y-${i}`} className="absolute left-0 right-0 border-t border-blue-400 z-0 opacity-60 shadow-[0_0_8px_rgba(96,165,250,0.3)]" style={{ top: v }} />)}

            {campos.map(c => (
              <DraggableElement 
                key={c.id} campo={c} isPreview={isPreview} isSelected={selecionado?.id === c.id}
                isAnySelected={!!selecionado} isTargeted={guides.targetIds.includes(c.id)} isCtrlPressed={isCtrlPressed}
                onSelect={setSelecionado} onResize={handleResize}
                onRemove={(id: any) => { setCampos(prev => prev.filter(f => f.id !== id)); setSelecionado(null); }}
              />
            ))}
          </div>
        </main>
      </DndContext>

      {selecionado && !isPreview && (
        <aside className="w-80 bg-white border-l p-8 flex flex-col gap-6 z-50 animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center border-b pb-4"><h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Settings2 size={16}/> Propriedades</h3><X size={18} className="text-slate-300 cursor-pointer" onClick={() => setSelecionado(null)} /></div>
          <div className="space-y-4"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Título do Bloco</label><input className="w-full bg-slate-50 border p-3 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all" value={selecionado.label} onChange={(e) => { const v = e.target.value.toUpperCase(); setCampos(prev => prev.map(c => c.id === selecionado.id ? { ...c, label: v } : c)); setSelecionado((p: any) => ({...p, label: v})); }} /></div>
        </aside>
      )}
    </div>
  );
}