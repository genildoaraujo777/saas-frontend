import React, { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft, ChevronLeft, ChevronRight, Palette, Download, Save, 
  Settings2, User, Truck, FileText, ShoppingCart 
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";

// Nossos Hooks e Serviços
import { useOSForm } from "@/components/ui/oslito/hooks/useOSForm";
import { OSService } from "@/services/OSService";
import { useClient } from "@/contexts/ClientContext";
import { numberToBRL } from "@/utils/currency";
import { validateCpfCnpj } from "@/utils/validators"; // Importe a validação
import { OSPrintTemplate } from "@/components/ui/oslito/components/OSPrintTemplate";
import { CompanySection } from "@/components/ui/oslito/components/editor-sections/CompanySection";
import { ClientSection } from "@/components/ui/oslito/components/editor-sections/ClientSection";
import { EquipmentSection } from "@/components/ui/oslito/components/editor-sections/EquipmentSection";
import { DiagnosticsSection } from "@/components/ui/oslito/components/editor-sections/DiagnosticsSection";
import { FinancialSection } from "@/components/ui/oslito/components/editor-sections/FinancialSection";
import { FinalizationSection } from "@/components/ui/oslito/components/editor-sections/FinalizationSection";
import { ProductCatalog } from "@/components/ui/oslito/components/editor-sections/ProductCatalog";

// Nossos Componentes Isolados

const OSlitoEditor: React.FC = () => {
  const navigate = useNavigate();
  const { osId } = useParams();
  const { loggedClient } = useClient();
  const pdfRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Refs para os calendários nativos (Passados para o FinancialSection)
  const inputEntradaRef = useRef<HTMLInputElement>(null);
  const inputPrevisaoRef = useRef<HTMLInputElement>(null);
  const inputRetiradaRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("dados"); 
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<any[]>([]);

  // O "Cérebro" da operação
  const { 
    osData, setOsData, itens, setItens, totais, 
    documentoValido, handleInputChange, handleCepChange 
  } = useOSForm(osId);

  // Carrega Logo e Produtos ao montar
  useEffect(() => {
    const initData = async () => {
      const logoSalvo = localStorage.getItem('fbmstore_logo');
      if (logoSalvo) setCompanyLogo(logoSalvo);
      
      try {
        const token = localStorage.getItem('token') || "";
        const prods = await OSService.listProducts(token);
        setProdutos(prods);
      } catch (err) { console.error("Erro ao carregar produtos"); }
    };
    initData();
  }, []);

  // --- HANDLERS DE CAMPOS CUSTOMIZADOS ---
  const addCustomField = (section: keyof typeof osData.customFields) => {
    const label = prompt("Nome do novo campo:");
    if (!label) return;
    const newField = { id: Date.now().toString(), label, value: "" };
    setOsData((prev: any) => ({
      ...prev, customFields: { ...prev.customFields, [section]: [...prev.customFields[section], newField] }
    }));
  };

  const updateCustomField = (section: string, id: string, newValue: string) => {
    setOsData((prev: any) => ({
      ...prev, customFields: { ...prev.customFields, [section]: prev.customFields[section].map((f: any) => f.id === id ? { ...f, value: newValue } : f) }
    }));
  };

  const renameCustomField = (section: string, id: string) => {
    // Correção do 'never': Forçamos a tipagem como any[]
    const field = (osData.customFields[section as keyof typeof osData.customFields] as any[]).find((f: any) => f.id === id);
    const newLabel = prompt("Novo nome para o campo:", field?.label);
    if (!newLabel) return;
    setOsData((prev: any) => ({
      ...prev, customFields: { ...prev.customFields, [section]: prev.customFields[section as keyof typeof prev.customFields].map((f: any) => f.id === id ? { ...f, label: newLabel } : f) }
    }));
  };

  const removeCustomField = (section: string, id: string) => {
    setOsData((prev: any) => ({
      ...prev, customFields: { ...prev.customFields, [section]: prev.customFields[section].filter((f: any) => f.id !== id) }
    }));
  };

  // --- HANDLERS DE ITENS ---
  const addItem = () => {
    setItens((prevItens: any[]) => [
      ...prevItens, 
      { id: Date.now() + Math.random(), qtd: 1, produto: "", preco: 0 }
    ]);
  };
  
  const removeItem = (id: number) => { 
    setItens((prev: any[]) => prev.length > 1 ? prev.filter(i => i.id !== id) : prev); 
  };
  
  const updateItem = (id: number, field: string, value: any) => {
    setItens((prev: any[]) => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // --- FUNÇÕES DE AÇÃO (SALVAR, PDF, LOGO) ---

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => { setCompanyLogo(reader.result as string); localStorage.setItem('fbmstore_logo', reader.result as string); };
      reader.readAsDataURL(file);
    } else if (file) alert("A imagem é muito grande. Escolha uma de até 1MB.");
  };

  // 1. Lógica Real de Gerar PDF
  const gerarPDF = async () => {
    if (!pdfRef.current) return;
    
    // Configuração com tipagem corrigida (as const)
    const opt = {
      margin: 0, 
      filename: `Orcamento_${osData.numero}.pdf`, 
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    try { 
      await html2pdf().set(opt).from(pdfRef.current).save(); 
    } catch (error) { 
      console.error(error);
      alert("Erro ao gerar PDF."); 
    }
  };

  // 2. Lógica Real de Salvar Template
  const saveLayoutAsTemplate = async () => {
    try {
      // Clona o objeto para não alterar o estado visual
      const layoutOnly = JSON.parse(JSON.stringify(osData.customFields));
      
      // Limpa os valores, mantendo apenas os labels (estrutura)
      Object.keys(layoutOnly).forEach(section => {
        layoutOnly[section].forEach((field: any) => field.value = "");
      });

      const token = localStorage.getItem('token') || "";
      await OSService.saveTemplate({
        customFieldsLayout: layoutOnly,
        defaultTermosGarantia: osData.termosGarantia
      }, token);
      
      alert("Layout salvo como padrão para suas próximas OS!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar modelo.");
    }
  };

  // 3. Lógica Real de Salvar OS
  const salvarOS = async () => {
    // Validação de Documento antes de salvar
    const cleanDoc = osData.documento.replace(/\D/g, "");
    if (cleanDoc.length > 0 && !validateCpfCnpj(cleanDoc)) {
      alert("O CPF ou CNPJ informado é inválido. Por favor, corrija antes de salvar.");
      // Opcional: focar na aba de cliente
      setActiveTab('cliente');
      return;
    }

    try {
      // Filtra itens vazios
      const validItens = itens.filter(item => item.produto && item.produto.trim() !== "");

      const payload: any = {
        ...osData,
        itens: validItens,
        subtotal: totais.subtotalPeças,
        total: totais.total,
      };

      // Se for criação, removemos o _id undefined para o Mongo criar um novo
      if (!payload._id) delete payload._id;

      const token = localStorage.getItem('token') || "";
      
      if (osData._id) {
        // UPDATE
        const response = await OSService.updateOS(osData._id, payload, token);
        setOsData(response); 
        alert("Ordem de Serviço atualizada com sucesso!");
      } else {
        // CREATE
        const response = await OSService.saveOS(payload, token);
        setOsData(response); // Atualiza o estado com o novo _id e numero gerado
        alert(`Ordem de Serviço salva com sucesso! Nº ${response.numero}`);
      }
      
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar no banco de dados.");
    }
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) tabsRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-['Plus_Jakarta_Sans']">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* HEADER */}
        <header className="bg-indigo-600 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <button onClick={() => navigate("/oslito")} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all">
                 <ArrowLeft size={16} /> Voltar
              </button>
              <div onClick={() => logoInputRef.current?.click()} className="cursor-pointer">
                {companyLogo ? <img src={companyLogo} alt="Logo" className="h-12 object-contain" /> : <h1 className="text-2xl font-black italic">{loggedClient?.client.name || "FBMSTORE"} | OSLITO</h1>}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
           </div>
           <span className="bg-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase">
              {osData._id ? `Nº ${osData.numero}` : "Nova OS"}
           </span>
        </header>

        {/* TABS NAVEGAÇÃO COM SCROLL ESCONDIDO */}
        <div className="relative flex items-center bg-slate-50/50 border-b border-slate-100 group">
          <style>{`.hide-scroll-webkit::-webkit-scrollbar { display: none; }`}</style>

          <button type="button" onClick={() => scrollTabs('left')} className="absolute left-0 z-10 h-full px-3 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
            <ChevronLeft size={20} />
          </button>

          <nav ref={tabsRef} className="flex flex-1 overflow-x-auto snap-x hide-scroll-webkit px-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}>
             {[
              { id: 'empresa', label: '1. Empresa', icon: <Settings2 size={16}/> },
              { id: 'cliente', label: '2. Cliente', icon: <User size={16}/> },
              { id: 'equipamento', label: '3. Equipamento', icon: <Truck size={16}/> },
              { id: 'servico', label: '4. Diagnóstico', icon: <FileText size={16}/> },
              { id: 'financeiro', label: '5. Financeiro', icon: <ShoppingCart size={16}/> },
              { id: 'encerramento', label: '6. Finalização', icon: <Save size={16}/> },
              { id: 'produtos', label: '7. Catálogo', icon: <Settings2 size={16}/> }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase snap-start transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          <button type="button" onClick={() => scrollTabs('right')} className="absolute right-0 z-10 h-full px-3 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* RENDERIZAÇÃO DAS SEÇÕES */}
        <main className="p-8">
          {activeTab === 'empresa' && <CompanySection osData={osData} handleInputChange={handleInputChange} addCustomField={addCustomField} updateCustomField={updateCustomField} renameCustomField={renameCustomField} removeCustomField={removeCustomField} />}
          
          {activeTab === 'cliente' && <ClientSection osData={osData} handleInputChange={handleInputChange} handleCepChange={handleCepChange} handleEnderecoChange={(f,v) => setOsData((prev:any) => ({...prev, endereco: {...prev.endereco, [f]: v}}))} documentoValido={documentoValido} handleDocumentoChange={handleInputChange} handleDocumentoBlur={() => {}} addCustomField={addCustomField} updateCustomField={updateCustomField} renameCustomField={renameCustomField} removeCustomField={removeCustomField} />}
          
          {activeTab === 'equipamento' && <EquipmentSection osData={osData} handleInputChange={handleInputChange} addCustomField={addCustomField} updateCustomField={updateCustomField} renameCustomField={renameCustomField} removeCustomField={removeCustomField} />}
          
          {activeTab === 'servico' && <DiagnosticsSection osData={osData} handleInputChange={handleInputChange} addCustomField={addCustomField} updateCustomField={updateCustomField} renameCustomField={renameCustomField} removeCustomField={removeCustomField} />}
          
          {activeTab === 'financeiro' && <FinancialSection osData={osData} setOsData={setOsData} itens={itens} produtos={produtos} totais={totais} updateItem={updateItem} addItem={addItem} removeItem={removeItem} handleInputChange={handleInputChange} inputEntradaRef={inputEntradaRef} inputPrevisaoRef={inputPrevisaoRef} inputRetiradaRef={inputRetiradaRef} nativeToMaskedDate={(val) => val} addCustomField={addCustomField} updateCustomField={updateCustomField} renameCustomField={renameCustomField} removeCustomField={removeCustomField} />}
          
          {activeTab === 'encerramento' && <FinalizationSection osData={osData} handleInputChange={handleInputChange} addCustomField={addCustomField} updateCustomField={updateCustomField} renameCustomField={renameCustomField} removeCustomField={removeCustomField} />}
          
          {activeTab === 'produtos' && <ProductCatalog produtos={produtos} setProdutos={setProdutos} />}

          {/* RODAPÉ */}
          <footer className="mt-12 pt-8 border-t border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center lg:items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
              <span className="text-3xl font-black text-indigo-600 tracking-tighter">{numberToBRL(totais.total)}</span>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <button 
                onClick={saveLayoutAsTemplate} 
                className="flex items-center gap-2 bg-amber-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-amber-600 transition-all"
              >
                <Palette size={18}/> Salvar Modelo
              </button>
              
              <button 
                onClick={gerarPDF} 
                disabled={!osData?._id} // TRAVA O BOTÃO SE NÃO TIVER ID
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg transition-all ${
                  !osData?._id 
                    ? "bg-slate-300 cursor-not-allowed opacity-60 text-slate-500" 
                    : "bg-slate-900 text-white hover:scale-105"
                }`}
              >
                <Download size={18}/> Gerar PDF
              </button>
              
              <button 
                onClick={salvarOS} 
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
              >
                <Save size={18}/> {osData?._id ? "Atualizar OS" : "Salvar OS"}
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* COMPONENTE DO PDF INVISÍVEL */}
      <OSPrintTemplate ref={pdfRef} osData={osData} itens={itens} totais={totais} companyLogo={companyLogo} />
    </div>
  );
};

export default OSlitoEditor;