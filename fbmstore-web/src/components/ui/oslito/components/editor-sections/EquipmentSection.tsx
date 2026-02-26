import React from "react";
import { Truck } from "lucide-react";
import { CustomFieldsBlock } from "../CustomFieldsBlock";

interface EquipmentSectionProps {
  osData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  // Props para os campos customizados
  addCustomField: (section: any) => void;
  updateCustomField: (section: any, id: string, value: string) => void;
  renameCustomField: (section: string, id: string) => void;
  removeCustomField: (section: any, id: string) => void;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({
  osData,
  handleInputChange,
  addCustomField,
  updateCustomField,
  renameCustomField,
  removeCustomField
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
      {/* Identificação Principal */}
      <div className="md:col-span-2 space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Aparelho / Produto
        </label>
        <input 
          name="equipamento" 
          value={osData.equipamento} 
          onChange={handleInputChange} 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" 
          placeholder="Ex: iPhone 13 Pro Max" 
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Marca / Modelo
        </label>
        <input 
          name="marcaModelo" 
          value={osData.marcaModelo} 
          onChange={handleInputChange} 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" 
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Nº Série / IMEI
        </label>
        <input 
          name="serialIMEI" 
          value={osData.serialIMEI} 
          onChange={handleInputChange} 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" 
        />
      </div>

      {/* Detalhes de Entrada */}
      <div className="md:col-span-4 space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Acessórios (Bandeja, Tampas, Capinha, etc...)
        </label>
        <textarea 
          name="acessorios" 
          value={osData.acessorios} 
          onChange={handleInputChange} 
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm h-24 outline-none focus:border-indigo-500" 
        />
      </div>

      <div className="md:col-span-4 space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Checklist Visual (Riscos, Trincos, Detalhes)
        </label>
        <textarea 
          name="checklist" 
          value={osData.checklist} 
          onChange={handleInputChange} 
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm h-24 outline-none focus:border-indigo-500" 
        />
      </div>

      {/* Blocos de Campos Dinâmicos */}
      <div className="md:col-span-4">
        <CustomFieldsBlock 
          section="equipamento" 
          fields={osData.customFields.equipamento}
          onAdd={addCustomField}
          onUpdate={updateCustomField}
          onRename={renameCustomField}
          onRemove={removeCustomField}
        />
      </div>
    </div>
  );
};