import React from "react";
import { User } from "lucide-react";
import { CustomFieldsBlock } from "../CustomFieldsBlock";

interface ClientSectionProps {
  osData: any;
  handleInputChange: (e: any) => void;
  handleDocumentoChange: (e: any) => void;
  handleDocumentoBlur: () => void;
  documentoValido: boolean;
  handleCepChange: (e: any) => void;
  handleEnderecoChange: (field: string, value: any) => void;
  // Props para os campos customizados
  addCustomField: any;
  updateCustomField: any;
  renameCustomField: any;
  removeCustomField: any;
}

export const ClientSection: React.FC<ClientSectionProps> = ({
  osData, handleInputChange, handleDocumentoChange, handleDocumentoBlur,
  documentoValido, handleCepChange, handleEnderecoChange,
  addCustomField, updateCustomField, renameCustomField, removeCustomField
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
      <div className="md:col-span-2 space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / Razão Social</label>
        <input name="cliente" value={osData.cliente} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
      </div>
      
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
          CPF / CNPJ 
          {!documentoValido && <span className="text-red-500 ml-2 animate-pulse">INVÁLIDO</span>}
        </label>
        <input 
          name="documento" 
          value={osData.documento} 
          onChange={handleDocumentoChange} 
          onBlur={handleDocumentoBlur}
          placeholder="000.000.000-00"
          className={`w-full px-4 py-3 bg-slate-50 border ${!documentoValido ? 'border-red-500 ring-1 ring-red-100' : 'border-slate-100'} rounded-xl text-sm font-bold transition-all`} 
        />
      </div>

      {/* Seção de CEP e Endereço */}
      <div className="md:col-span-1 space-y-2">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP</label>
        <input 
          name="cep" 
          value={osData.endereco.cep} 
          onChange={handleCepChange} 
          placeholder="00000-000"
          className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm font-bold shadow-sm" 
        />
      </div>

      {/* Campos Extras do Cliente */}
      <div className="md:col-span-4">
        <CustomFieldsBlock 
          section="cliente" 
          fields={osData.customFields.cliente}
          onAdd={addCustomField}
          onUpdate={updateCustomField}
          onRename={renameCustomField}
          onRemove={removeCustomField}
        />
      </div>
    </div>
  );
};