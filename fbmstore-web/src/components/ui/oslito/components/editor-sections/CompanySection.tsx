import React from "react";
import { CustomFieldsBlock } from "../CustomFieldsBlock";

export const CompanySection: React.FC<any> = ({
  osData, handleInputChange, addCustomField, updateCustomField, renameCustomField, removeCustomField
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da OS</label>
        <select name="status" value={osData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none">
          <option>AGUARDANDO APROVAÇÃO</option>
          <option>APROVADO / EM REPARO</option>
          <option>PRONTO PARA ENTREGA</option>
          <option>FINALIZADO</option>
          <option>SEM REPARO</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</label>
        <select name="prioridade" value={osData.prioridade} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none">
          <option>BAIXA</option>
          <option>NORMAL</option>
          <option>ALTA</option>
          <option>URGENTE</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <CustomFieldsBlock 
          section="empresa" 
          fields={osData.customFields.empresa}
          onAdd={addCustomField}
          onUpdate={updateCustomField}
          onRename={renameCustomField}
          onRemove={removeCustomField}
        />
      </div>
    </div>
  );
};