import React from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";

export interface CustomFieldProp {
  id: string;
  label: string;
  value: string;
}

export interface CustomFieldsBlockProps {
  section: "empresa" | "cliente" | "equipamento" | "servico" | "financeiro" | "encerramento";
  fields: CustomFieldProp[];
  onAdd: (section: any) => void;
  onUpdate: (section: any, id: string, value: string) => void;
  onRename: (section: string, id: string) => void;
  onRemove: (section: any, id: string) => void;
}

export const CustomFieldsBlock: React.FC<CustomFieldsBlockProps> = ({ 
  section, fields, onAdd, onUpdate, onRename, onRemove 
}) => (
  <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
    <div className="flex justify-between items-center mb-4">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campos Extras</h4>
      <button 
        type="button"
        onClick={() => onAdd(section)} 
        className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-100 transition-all flex items-center gap-1"
      >
        <Plus size={12} /> Add Campo
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(field => (
        <div key={field.id} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase">{field.label}</label>
            <input 
              type="text" 
              value={field.value} 
              onChange={(e) => onUpdate(section, field.id, e.target.value)} 
              className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500" 
            />
          </div>
          <button type="button" onClick={() => onRename(section, field.id)} className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors" title="Editar nome do campo">
            <Settings2 size={18} />
          </button>
          <button type="button" onClick={() => onRemove(section, field.id)} className="p-2 text-slate-300 hover:text-red-500 mb-1">
            <Trash2 size={16}/>
          </button>
        </div>
      ))}
    </div>
  </div>
);