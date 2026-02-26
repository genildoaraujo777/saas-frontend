import React from "react";
import { CustomFieldsBlock } from "../CustomFieldsBlock";

export const DiagnosticsSection: React.FC<any> = ({
  osData, handleInputChange, addCustomField, updateCustomField, renameCustomField, removeCustomField
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-red-500">Defeito Reclamado</label>
        <textarea name="defeitoRelatado" value={osData.defeitoRelatado} onChange={handleInputChange} className="w-full p-4 bg-red-50/30 border border-red-100 rounded-xl text-sm font-bold h-20 outline-none" />
      </div>
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest text-blue-500">Diagnóstico Técnico</label>
        <textarea name="diagnosticoTecnico" value={osData.diagnosticoTecnico} onChange={handleInputChange} className="w-full p-4 bg-blue-50/30 border border-blue-100 rounded-xl text-sm font-bold h-20 outline-none" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico Responsável</label>
          <input name="tecnicoResponsavel" value={osData.tecnicoResponsavel} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none" />
        </div>
      </div>
      <CustomFieldsBlock 
        section="servico" 
        fields={osData.customFields.servico}
        onAdd={addCustomField}
        onUpdate={updateCustomField}
        onRename={renameCustomField}
        onRemove={removeCustomField}
      />
    </div>
  );
};