import React from "react";
import { CustomFieldsBlock } from "../CustomFieldsBlock";

export const FinalizationSection: React.FC<any> = ({
  osData, handleInputChange, addCustomField, updateCustomField, renameCustomField, removeCustomField
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Termos de Garantia</label>
        <textarea name="termosGarantia" value={osData.termosGarantia} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm h-32 outline-none" />
      </div>
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas Internas (Privado)</label>
        <textarea name="obs" value={osData.obs} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm h-20 outline-none" placeholder="Ex: Cliente difícil, equipamento já veio de outra assistência..." />
      </div>
      <CustomFieldsBlock 
        section="encerramento" 
        fields={osData.customFields.encerramento}
        onAdd={addCustomField}
        onUpdate={updateCustomField}
        onRename={renameCustomField}
        onRemove={removeCustomField}
      />
    </div>
  );
};