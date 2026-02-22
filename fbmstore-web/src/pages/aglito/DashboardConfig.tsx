import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdSave, MdCloudUpload, MdArrowBack, MdEventAvailable } from "react-icons/md";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { uploadImage } from "@/services/FileStorageService";
import api from "@/services/api";
import { toast } from "react-toastify";
import { AgendamentoService } from "@/services/AgendamentoService";


// 1. COMPONENTE DE CONFIGURAÇÃO DO SAAS DE AGENDAMENTO
const DashboardConfig: React.FC = () => {
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
      toast[type](
        <div>
          <strong>{title}</strong>
          <div>{message}</div>
        </div>
      );
    };

  // 2. FUNÇÃO PARA UPLOAD DE LOGO
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = localStorage.getItem('token');
        if (!token) {
            showToast('error', 'Erro!', 'Sua sessão expirou. Faça login novamente.');
            setSubmitting(false);
            return;
        }
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Utiliza o serviço existente de storage do seu projeto
      const folder = "tenants/logos";
      const url = await uploadImage(token, file);
      console.log('url: ', url)
      setLogoUrl(url.imagePaths!);
    } catch (error) {
      alert("Erro ao subir imagem.");
    } finally {
      setUploading(false);
    }
  };

  // 3. FUNÇÃO PARA SALVAR CONFIGURAÇÕES
  // 3. FUNÇÃO PARA ATIVAR O LINK E REDIRECIONAR
// Localize a função handleSave e substitua a chamada da API direta pelo serviço:
const handleSave = async () => {
  if (!slug) return alert("O subdomínio (slug) é obrigatório.");
  
  const token = localStorage.getItem('token'); // Recupera o token como no handleLogoUpload

  try {
    setLoading(true);
    // 8. UTILIZANDO O NOVO SERVIÇO PADRONIZADO
    await AgendamentoService.saveConfig({ slug, logoUrl }, token!);
    alert("Link ativado com sucesso!");
  } catch (error) {
    alert("Erro ao salvar configurações.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER SIMPLIFICADO ESTILO FBMSTORE */}
      <header className="bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium">
          <MdArrowBack size={20} /> Voltar
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <MdEventAvailable /> Configurar Meu Agendamento
        </h1>
        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Identidade do seu Site</h2>
          <p className="text-gray-500 mb-8 text-sm">Defina como seus clientes acessarão sua agenda online.</p>

          <div className="space-y-6">
            {/* INPUT DO SUBDOMÍNIO */}
            <div>
              <FloatingLabelInput 
                label="Nome da sua marca (ex: barbearia-do-joao)" 
                value={slug} 
                onChangeText={(txt) => setSlug(txt.toLowerCase().replace(/\s+/g, '-'))} 
              />
              <p className="mt-2 text-xs text-indigo-600 font-medium">
                Seu link será: <strong>{slug || 'seu-nome'}.fbmstore.com.br</strong>
              </p>
            </div>

            {/* SEÇÃO DE LOGO */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center">
              {logoUrl ? (
                <img src={`${BASE_URL}/files/${logoUrl}`} alt="Logo" className="h-24 w-24 object-contain mb-4 rounded-lg border" />
              ) : (
                <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <MdCloudUpload size={40} className="text-gray-400" />
                </div>
              )}
              
              <label className="cursor-pointer bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors">
                {uploading ? "Subindo..." : "Selecionar Logo"}
                <input type="file" className="hidden" onChange={handleLogoUpload} accept="image/*" />
              </label>
            </div>

            {/* BOTÃO SALVAR */}
            <button 
              onClick={handleSave}
              disabled={loading || uploading}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg disabled:opacity-50"
            >
              <MdSave size={22} />
              {loading ? "Salvando..." : "Salvar e Publicar Site"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardConfig;