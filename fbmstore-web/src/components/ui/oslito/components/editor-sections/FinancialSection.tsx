import React from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { numberToBRL } from "@/utils/currency";
import { CustomFieldsBlock } from "../CustomFieldsBlock";

interface FinancialSectionProps {
  osData: any;
  itens: any[];
  produtos: any[];
  totais: any;
  updateItem: (id: number, field: string, value: any) => void;
  addItem: () => void;
  removeItem: (id: number) => void;
  handleInputChange: (e: any) => void;
  setOsData: any;
  inputEntradaRef: any;
  inputPrevisaoRef: any;
  inputRetiradaRef: any;
  nativeToMaskedDate: (val: string) => string;
  // Agora sim, recebendo as props para os Campos Extras!
  addCustomField: (section: any) => void;
  updateCustomField: (section: any, id: string, value: string) => void;
  renameCustomField: (section: string, id: string) => void;
  removeCustomField: (section: any, id: string) => void;
}

export const FinancialSection: React.FC<FinancialSectionProps> = ({
  osData, itens, produtos, totais, updateItem, addItem, removeItem, handleInputChange, setOsData, inputEntradaRef, inputPrevisaoRef, inputRetiradaRef, nativeToMaskedDate,
  addCustomField, updateCustomField, renameCustomField, removeCustomField
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. SEÇÃO DE PEÇAS E INSUMOS (Botão ADD ITEM age aqui) */}
      <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-100">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
          Peças / Insumos Utilizados
        </h4>

        <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] font-black text-slate-400 uppercase pb-2 border-b border-slate-100 mb-4">
          <div className="col-span-6">Produto / Peça / Item</div>
          <div className="col-span-2 text-center">Qtd</div>
          <div className="col-span-3">Valor Unit.</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-4 md:space-y-2 mb-4">
          {itens.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-3 md:p-0 bg-white md:bg-transparent rounded-xl border md:border-none border-slate-200 shadow-sm md:shadow-none">
              <div className="col-span-1 md:col-span-6">
                <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase mb-1">Produto</label>
                <select 
                  className="w-full p-2.5 md:p-2 bg-white border rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={item.produto} 
                  onChange={(e) => {
                    const prodNome = e.target.value;
                    const jaAdicionado = itens.some(i => i.produto === prodNome && i.id !== item.id);
                    if (jaAdicionado && prodNome !== "") { alert("Este item já foi adicionado."); return; }
                    const prodEncontrado = produtos.find((p: any) => p.nome === prodNome);
                    updateItem(item.id, 'produto', prodNome);
                    updateItem(item.id, 'preco', prodEncontrado ? prodEncontrado.preco : 0);
                  }}
                >
                  <option value="">Selecione o item...</option>
                  {produtos.map((p: any, index: number) => {
                    const isSelectedElsewhere = itens.some(i => i.produto === p.nome && i.id !== item.id);
                    return <option key={p._id || index} value={p.nome} disabled={isSelectedElsewhere}>{p.nome} {isSelectedElsewhere ? '(Já adicionado)' : ''}</option>
                  })}
                </select>
              </div>

              <div className="col-span-1 md:col-span-5 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase mb-1">Qtd</label>
                  <input type="number" min="1" value={item.qtd} onChange={(e) => updateItem(item.id, 'qtd', Math.max(1, Number(e.target.value)))} className="w-full p-2.5 md:p-2 bg-white border rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="md:col-span-3 flex items-center justify-between md:justify-start h-10 md:h-auto">
                  <label className="block md:hidden text-[9px] font-bold text-slate-400 uppercase">Preço:</label>
                  <span className="text-xs font-bold text-slate-700">{numberToBRL(item.preco || 0)}</span>
                </div>
              </div>

              <div className="col-span-1 md:col-span-1 flex justify-end md:justify-center border-t md:border-none pt-2 md:pt-0">
                <button type="button" onClick={() => removeItem(item.id)} className="flex items-center gap-2 md:block text-red-400 hover:text-red-600 p-1">
                  <span className="md:hidden text-[10px] font-bold uppercase">Remover</span><Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* O BOTÃO QUE ADICIONA PEÇAS */}
        <button type="button" onClick={addItem} className="w-full md:w-auto mt-2 px-4 py-2 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors">
          <Plus size={14}/> Add Item
        </button>
      </div>

      {/* 2. RESUMO FINANCEIRO E DATAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Mão de Obra</label>
          <input type="text" inputMode="decimal" value={numberToBRL(osData.valorMaoDeObra || 0)} onChange={(e) => { const val = Number(e.target.value.replace(/\D/g, "")) / 100; setOsData((prev: any) => ({ ...prev, valorMaoDeObra: val })); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Outros / Frete</label>
          <input type="text" inputMode="decimal" value={numberToBRL(osData.frete || 0)} onChange={(e) => { const val = Number(e.target.value.replace(/\D/g, "")) / 100; setOsData((prev: any) => ({ ...prev, frete: val })); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma Pagto</label>
          <select name="pagamento" value={osData.pagamento} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold">
            <option>PIX</option><option>CARTÃO</option><option>DINHEIRO</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Desconto (%)</label>
          <input type="number" name="desconto" value={osData.desconto} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-indigo-500">Data Entrada Equipamento</label>
          <div className="relative group">
            <input type="text" value={osData.dataDeixouEqp} readOnly className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-sm font-bold shadow-sm pr-12 outline-none" placeholder="dd/mm/aaaa" />
            <input type="date" ref={inputEntradaRef} className="absolute opacity-0 pointer-events-none right-4 w-8 h-8" onChange={(e) => setOsData((prev:any) => ({ ...prev, dataDeixouEqp: nativeToMaskedDate(e.target.value) }))}/>
            <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 group-hover:text-indigo-500 cursor-pointer" onClick={() => inputEntradaRef.current?.showPicker()} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-amber-500">Previsão Retirada</label>
          <div className="relative group">
            <input type="text" value={osData.dataPrevistaParaRetirada} readOnly className="w-full px-4 py-3 bg-white border border-amber-100 rounded-xl text-sm font-bold shadow-sm pr-12 outline-none" placeholder="dd/mm/aaaa"/>
            <input type="date" ref={inputPrevisaoRef} className="absolute opacity-0 pointer-events-none right-4 w-8 h-8" onChange={(e) => setOsData((prev:any) => ({ ...prev, dataPrevistaParaRetirada: nativeToMaskedDate(e.target.value) }))}/>
            <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-300 group-hover:text-amber-500 cursor-pointer" onClick={() => inputPrevisaoRef.current?.showPicker()} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-emerald-500">Data Retirada Equipamento</label>
          <div className="relative group">
            <input type="text" value={osData.dataRetirouEqp} readOnly className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm font-bold shadow-sm pr-12 outline-none" placeholder="dd/mm/aaaa" />
            <input type="date" ref={inputRetiradaRef} className="absolute opacity-0 pointer-events-none right-4 w-8 h-8" onChange={(e) => setOsData((prev:any) => ({ ...prev, dataRetirouEqp: nativeToMaskedDate(e.target.value) }))}/>
            <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-300 group-hover:text-emerald-500 cursor-pointer" onClick={() => inputRetiradaRef.current?.showPicker()} />
          </div>
        </div>
      </div>

      {/* 3. CAMPOS EXTRAS (Agora conectado corretamente!) */}
      <CustomFieldsBlock 
        section="financeiro" 
        fields={osData.customFields.financeiro}
        onAdd={addCustomField}
        onUpdate={updateCustomField}
        onRename={renameCustomField}
        onRemove={removeCustomField}
      />
    </div>
  );
};