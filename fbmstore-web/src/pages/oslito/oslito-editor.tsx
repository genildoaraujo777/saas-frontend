import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  User, Phone, MapPin, Palette, Calendar, 
  CreditCard, Truck, ShoppingCart, Plus, Trash2, 
  FileText, Save, Download, Printer, Settings2, ArrowLeft,
  ChevronLeft, ChevronRight 
} from "lucide-react";
// Importamos o html2pdf apenas se necessário no lado do cliente
import html2pdf from "html2pdf.js";
import { useNavigate, useParams } from "react-router-dom";
import { IOSProduct, OSService } from "@/services/OSService";

const OSlito: React.FC = () => {
  const navigate = useNavigate();
  const { osId } = useParams(); // Importe useParams de react-router-dom
  const pdfRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null); // Ref para o container de abas
  // 1. ESTADOS DO FORMULÁRIO (Mapeados do index.html)
  const [activeTab, setActiveTab] = useState("dados");
  const [osData, setOsData] = useState({
    numero: Math.floor(Math.random() * 9000) + 1000,
    dataEmissao: new Date().toLocaleString(),
    status: "AGUARDANDO APROVAÇÃO",
    prioridade: "NORMAL",
    cliente: "",
    documento: "",
    contato: "",
    email: "",
    endereco: "",
    equipamento: "",
    marcaModelo: "",
    serialIMEI: "",
    acessorios: "",
    checklist: "",
    defeitoRelatado: "",
    diagnosticoTecnico: "",
    servicosExecutar: "",
    tecnicoResponsavel: "",
    dataEntrega: "",
    pagamento: "PIX",
    frete: 0,
    desconto: 0,
    valorMaoDeObra: 0,
    valorPecas: 0,
    deuEntrada: false,
    valorEntrada: 0,
    termosGarantia: "90 dias de garantia sobre o serviço.",
    obs: "",
    customFields: {
      empresa: [] as { id: string; label: string; value: string }[],
      cliente: [] as { id: string; label: string; value: string }[],
      equipamento: [] as { id: string; label: string; value: string }[],
      servico: [] as { id: string; label: string; value: string }[],
      financeiro: [] as { id: string; label: string; value: string }[],
      encerramento: [] as { id: string; label: string; value: string }[],
    }
  });

  useEffect(() => {
    const initEditor = async () => {
      try {
        const token = localStorage.getItem('token') || "";
        if (osId) {
          // Se tem ID na URL, estamos editando uma OS existente
          const osGravada = await OSService.getOSById(osId, token);
          setOsData(osGravada);
          if (osGravada.itens) setItens(osGravada.itens);
        } else {
          // Se não tem ID, é uma nova OS, carregamos apenas o template padrão
          const template = await OSService.getTemplate(token);
          if (template && template.customFieldsLayout) {
            setOsData(prev => ({
              ...prev,
              customFields: template.customFieldsLayout,
              termosGarantia: template.defaultTermosGarantia || prev.termosGarantia
            }));
          }
        }
      } catch (err) {
        console.log("Erro ao inicializar editor.");
      }
    };
    initEditor();
  }, [osId]);

  // Estado do Logo da Empresa (Pode vir do banco de dados futuramente)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Simulação: Carregar logo ao iniciar (Remova isso quando tiver o backend real)
 // Simulação: Carregar logo e Converter para Base64 (Correção para o PDF)
  useEffect(() => {
    // URL original do seu logo
    const originalUrl = "https://fbmstore.com.br/assets/LOGO-D9MrJGg8.png";
    
    // TRUQUE: Usamos um proxy para evitar erro de CORS no localhost
    // Em produção (no seu domínio final), você pode usar a URL direta se estiver no mesmo domínio
    const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(originalUrl);

    const carregarImagem = async () => {
      try {
        const response = await fetch(proxyUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onloadend = () => {
          setCompanyLogo(reader.result as string);
        };
        
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Erro no proxy, tentando URL direta:", error);
        setCompanyLogo(originalUrl);
      }
    };

    carregarImagem();
  }, []);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const token = localStorage.getItem('token') || "";
        const data = await OSService.listProducts(token);
        setProdutos(data);
      } catch (err) {
        console.error("Erro ao carregar catálogo de produtos");
      }
    };
    fetchProdutos();
  }, []);

  // Estado para a lista de produtos cadastrados e para o formulário de cadastro
  const [produtos, setProdutos] = useState(() => {
    const saved = localStorage.getItem('oslito_produtos');
    return saved ? JSON.parse(saved) : [
      { id: 1, nome: "Caixa milk com aplique 3D", preco: 4.5 },
      { id: 2, nome: "Caixa Pirâmide com aplique 3D", preco: 3.5 }
    ];
  });

  const [novoProduto, setNovoProduto] = useState<IOSProduct>({ 
  id: "", 
  nome: "", 
  description: "", 
  preco: 0  // ✅ Changed from "" to 0
});

  // Busca produtos do banco ao carregar a aba ou o componente
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const token = localStorage.getItem('token') || "";
        const data = await OSService.listProducts(token);
        setProdutos(data);
      } catch (err) {
        console.error("Erro ao buscar produtos da API");
      }
    };
    carregarProdutos();
  }, []);

  const salvarProduto = async () => {
    if (!novoProduto.nome || !novoProduto.preco) return;
    
    try {
      const token = localStorage.getItem('token') || "";
      
      if (novoProduto.id) {
        // --- LÓGICA DE UPDATE ---
        await OSService.updateProduct(novoProduto.id, novoProduto, token);
        
        // Atualizamos a lista local comparando de forma inteligente os IDs
        const listaAtualizada = produtos.map((p: any) => {
          // Obtemos o ID do item da lista (pode ser id ou _id)
          const pId = p.id || p._id;
          
          if (pId === novoProduto.id) {
            // Retornamos o novo produto, mas preservando o campo de ID original
            // para não quebrar a renderização da tabela (key)
            return { 
              ...p, 
              nome: novoProduto.nome, 
              description: novoProduto.description, 
              preco: novoProduto.preco 
            };
          }
          return p;
        });

        setProdutos(listaAtualizada);
        
      } else {
        // --- LÓGICA DE CREATE ---
        const savedProd = await OSService.createProduct(novoProduto, token);
        setProdutos([...produtos, savedProd]);
      }

      // Limpa o formulário e avisa o usuário
      setNovoProduto({ id: "", nome: "", description: "", preco: 0 });
      alert("Produto salvo/atualizado com sucesso!");
      
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      alert("Erro ao salvar produto no banco.");
    }
  };

  // 2. ESTADO DA TABELA DE ITENS
  const [itens, setItens] = useState([
    { id: Date.now(), qtd: 1, produto: "", preco: 0 }
  ]);

  // 3. CÁLCULOS TOTAIS (Memoizado para performance como no home.tsx)
  const totais = useMemo(() => {
    const subtotalItens = itens.reduce((acc, item) => acc + (item.qtd * item.preco), 0);
    const maoDeObra = Number(osData.valorMaoDeObra) || 0;
    const valorFrete = Number(osData.frete) || 0;
    const percDesconto = Number(osData.desconto) || 0;
    
    const base = subtotalItens + maoDeObra + valorFrete;
    const valorDesconto = base * (percDesconto / 100);
    
    return {
      subtotalPeças: subtotalItens,
      subtotalGeral: base,
      total: base - valorDesconto
    };
  }, [itens, osData.frete, osData.desconto, osData.valorMaoDeObra]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{1})(\d{4})(\d{4})/, "$1 $2-$3")
      .substring(0, 16);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 4. FUNÇÕES DE MANIPULAÇÃO
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;

        if (name === 'contato') {
      setOsData(prev => ({ ...prev, [name]: maskPhone(value) }));
      return;
    }
        
        // ✅ Convert to number for number inputs, keep as string for others
        const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
        
        setOsData(prev => ({ ...prev, [name]: finalValue }));
        };

  const addItem = () => {
    setItens([...itens, { id: Date.now(), qtd: 1, produto: "", preco: 0 }]);
  };

  const removeItem = (id: number) => {
    if (itens.length > 1) {
      setItens(itens.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItens(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  }; // fechamento do updateItem

  const addCustomField = (section: keyof typeof osData.customFields) => {
    const label = prompt("Nome do novo campo:");
    if (!label) return;
    const newField = { id: Date.now().toString(), label, value: "" };
    setOsData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [section]: [...prev.customFields[section], newField] }
    }));
  };

  const updateCustomField = (section: keyof typeof osData.customFields, id: string, newValue: string) => {
    setOsData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [section]: prev.customFields[section].map(f => f.id === id ? { ...f, value: newValue } : f)
      }
    }));
  };

  const renameCustomField = (section: string, id: string) => {
    const field = osData.customFields[section as keyof typeof osData.customFields].find(f => f.id === id);
    const newLabel = prompt("Novo nome para o campo:", field?.label);
    if (!newLabel) return;
    setOsData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [section]: prev.customFields[section as keyof typeof prev.customFields].map(f => f.id === id ? { ...f, label: newLabel } : f)
      }
    }));
  };

  const removeCustomField = (section: keyof typeof osData.customFields, id: string) => {
    setOsData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [section]: prev.customFields[section].filter(f => f.id !== id)
      }
    }));
  };

  const saveLayoutAsTemplate = async () => {
    try {
      // Enviamos apenas a estrutura (labels), limpando os valores (values)
      const layoutOnly = JSON.parse(JSON.stringify(osData.customFields));
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
      alert("Erro ao salvar template.");
    }
  };

  const CustomFieldsBlock = ({ section }: { section: keyof typeof osData.customFields }) => (
    <div className="mt-6 border-t border-dashed pt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campos Extras</h4>
        <button onClick={() => addCustomField(section)} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-100 transition-all flex items-center gap-1">
          <Plus size={12} /> Add Campo
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {osData.customFields[section].map(field => (
          <div key={field.id} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase">{field.label}</label>
              <input type="text" value={field.value} onChange={(e) => updateCustomField(section, field.id, e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold" />
            </div>
            <button 
                onClick={() => renameCustomField(section, field.id)}
                className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                title="Editar nome do campo"
              >
                <Settings2 size={18} /> {/* Aqui você pode usar o ícone Edit ou Settings2 */}
              </button>
            <button onClick={() => removeCustomField(section, field.id)} className="p-2 text-slate-300 hover:text-red-500 mb-1"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );

  // 5. GERAÇÃO DE PDF (Migrado do index.html)
  // 5. GERAÇÃO DE PDF (Migrado do index.html)
   const gerarPDF = async () => {
    if (!pdfRef.current) return;

    const opt = {
      margin: 0, // ZERADO: Deixa o CSS controlar o layout 100%
      filename: `Orcamento_${osData.numero}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(pdfRef.current).save();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-['Plus_Jakarta_Sans']">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* HEADER ESTILO FBMSTORE */}
        <header className="bg-indigo-600 p-8 text-white flex justify-between items-center">
          <div className="flex flex-col justify-center items-start">
            
            {/* LINHA SUPERIOR: BOTÃO + LOGO */}
            <div className="flex items-center gap-4 mb-2">
              
              {/* 1. Botão Voltar (Agora na esquerda) */}
              <button 
                type="button" 
                onClick={() => navigate("/oslito")}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
              >
                 <ArrowLeft size={16} /> Voltar
              </button>

              {/* 2. Logo ou Título */}
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt="Logo da Empresa" 
                  className="h-12 max-w-[250px] object-contain" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'; 
                    setCompanyLogo(null); 
                  }}
                />
              ) : (
                <h1 className="text-2xl font-black italic tracking-tighter cursor-pointer" onClick={() => {
                    const url = prompt("Cole a URL do logo para testar:");
                    if(url) setCompanyLogo(url);
                }}>
                  FBMSTORE | <span className="text-indigo-200">OSLITO</span>
                </h1>
              )}
            </div>

            {/* LINHA INFERIOR: Subtítulo (Embaixo dos dois) */}
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Gerenciador de Ordens de Serviço</p>
          </div>

          {/* LADO DIREITO: Número do Pedido */}
          <div className="text-right">
            <span className="bg-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
              Nº {osData.numero}
            </span>
          </div>
        </header>

        {/* NAVEGAÇÃO POR ABAS COM SCROLL E SETAS (DYNAMIC RESPONSIVE) */}
        <div className="relative flex items-center bg-slate-50/50 border-b border-slate-100 group">
          
          {/* Seta Esquerda - Visível em todos os tamanhos se houver overflow */}
          <button 
            onClick={() => scrollTabs('left')}
            className="absolute left-0 z-10 h-full px-3 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>

          <nav 
            ref={tabsRef}
            className="flex flex-1 overflow-x-auto scrollbar-hide snap-x no-scrollbar px-8"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              scrollBehavior: 'smooth'
            }}
          >
            {[
              { id: 'empresa', label: '1. Empresa/OS', icon: <Settings2 size={16}/> },
              { id: 'cliente', label: '2. Cliente', icon: <User size={16}/> },
              { id: 'equipamento', label: '3. Equipmento', icon: <Truck size={16}/> },
              { id: 'servico', label: '4. Diagnóstico', icon: <FileText size={16}/> },
              { id: 'financeiro', label: '5. Financeiro', icon: <ShoppingCart size={16}/> },
              { id: 'encerramento', label: '6. Finalização', icon: <Save size={16}/> },
              { id: 'produtos', label: '7. Catálogo', icon: <Settings2 size={16}/> }
            ].map((tab, index, array) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center justify-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all snap-start ${
                  activeTab === tab.id 
                    ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-slate-400 hover:text-slate-600'
                } ${index === array.length - 1 ? 'mr-10' : ''}`} // Adiciona margem no último item
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {/* Seta Direita - Visível em todos os tamanhos se houver overflow */}
          <button 
            onClick={() => scrollTabs('right')}
            className="absolute right-0 z-10 h-full px-3 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <main className="p-8">
          {/* 1. EMPRESA E OS */}
          {activeTab === 'empresa' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da OS</label>
                <select name="status" value={osData.status} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold">
                  <option>AGUARDANDO APROVAÇÃO</option>
                  <option>APROVADO / EM REPARO</option>
                  <option>PRONTO PARA ENTREGA</option>
                  <option>FINALIZADO</option>
                  <option>SEM REPARO</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</label>
                <select name="prioridade" value={osData.prioridade} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold">
                  <option>BAIXA</option>
                  <option>NORMAL</option>
                  <option>ALTA</option>
                  <option>URGENTE</option>
                </select>
              </div>
              <div className="md:col-span-2"><CustomFieldsBlock section="empresa" /></div>
            </div>
          )}

          {/* 2. DADOS DO CLIENTE */}
          {activeTab === 'cliente' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / Razão Social</label>
                <input name="cliente" value={osData.cliente} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF / CNPJ</label>
                <input name="documento" value={osData.documento} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp</label>
                <input name="contato" value={osData.contato} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                <input name="endereco" value={osData.endereco} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
              </div>
              <div className="md:col-span-4"><CustomFieldsBlock section="cliente" /></div>
            </div>
          )}

          {/* 3. DADOS DO EQUIPAMENTO */}
          {activeTab === 'equipamento' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Aparelho / Produto</label>
                <input name="equipamento" value={osData.equipamento} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" placeholder="Ex: iPhone 13 Pro Max" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Marca / Modelo</label>
                <input name="marcaModelo" value={osData.marcaModelo} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Série / IMEI</label>
                <input name="serialIMEI" value={osData.serialIMEI} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Checklist Visual (Riscos, Trincos, Detalhes)</label>
                <textarea name="checklist" value={osData.checklist} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm h-24 outline-none focus:border-indigo-500" />
              </div>
              <div className="md:col-span-4"><CustomFieldsBlock section="equipamento" /></div>
            </div>
          )}

          {/* 4. DIAGNÓSTICO E SERVIÇO */}
          {activeTab === 'servico' && (
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
                  <input name="tecnicoResponsavel" value={osData.tecnicoResponsavel} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
                </div>
              </div>
              <CustomFieldsBlock section="servico" />
            </div>
          )}

          {/* 5. FINANCEIRO E PEÇAS */}
          {activeTab === 'financeiro' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Lógica de Peças (Usando seus Itens do Pedido originais) */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Peças / Insumos Utilizados</h4>
                <table className="w-full mb-4">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase text-left border-b border-slate-100">
                      <th className="pb-2">Produto</th>
                      <th className="pb-2 w-24">Valor</th>
                      <th className="pb-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">
                          <select className="w-full p-2 bg-white border rounded-lg text-xs" value={item.produto} onChange={(e) => {
                                const prodNome = e.target.value;
                                const prodEncontrado = produtos.find((p: any) => p.nome === prodNome);
                                updateItem(item.id, 'produto', prodNome);
                                updateItem(item.id, 'preco', prodEncontrado ? prodEncontrado.preco : 0);
                            }}>
                            <option value="">Selecione o item...</option>
                            {produtos.map((p: any, index: number) => (
                              <option key={p._id || p.id || index} value={p.nome}>
                                {p.nome}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2"><input type="number" value={item.preco} onChange={(e) => updateItem(item.id, 'preco', Number(e.target.value))} className="w-full p-2 bg-white border rounded-lg text-xs font-bold" /></td>
                        <td className="py-2 text-right"><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={addItem} className="text-indigo-600 text-[10px] font-black uppercase flex items-center gap-1"><Plus size={14}/> Add Peça</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Mão de Obra</label>
                  <input type="number" name="valorMaoDeObra" value={osData.valorMaoDeObra} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Previsão Entrega</label>
                  <input type="date" name="dataEntrega" value={osData.dataEntrega} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma Pagto</label>
                  <select name="pagamento" value={osData.pagamento} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold">
                    <option>PIX</option>
                    <option>CARTÃO</option>
                    <option>DINHEIRO</option>
                  </select>
                </div>
              </div>
              <CustomFieldsBlock section="financeiro" />
            </div>
          )}

          {/* 6. FINALIZAÇÃO E GARANTIA */}
          {activeTab === 'encerramento' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Termos de Garantia</label>
                <textarea name="termosGarantia" value={osData.termosGarantia} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm h-32 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Notas Internas (Privado)</label>
                <textarea name="obs" value={osData.obs} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm h-20 outline-none" placeholder="Ex: Cliente difícil, equipamento já veio de outra assistência..." />
              </div>
              <CustomFieldsBlock section="encerramento" />
            </div>
          )}

          {/* 7. GESTÃO DE PRODUTOS / CATÁLOGO */}
          {activeTab === 'produtos' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Card de Cadastro */}
              <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center mb-6">Cadastrar Peça ou Serviço Padrão</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Nome</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Tela Original iPhone 13" 
                      value={novoProduto.nome}
                      onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Descrição</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Tela de 7 polegadas, original Apple" 
                      value={novoProduto.description}
                      onChange={(e) => setNovoProduto({...novoProduto, description: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Preço Base (R$)</label>
                    <input 
                      type="number" 
                      value={novoProduto.preco}
                      onChange={(e) => setNovoProduto({...novoProduto, preco: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <button 
                  onClick={salvarProduto}
                  className="w-full mt-6 bg-emerald-500 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:scale-[1.02] transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Save size={16}/> {novoProduto.id ? 'Atualizar no Catálogo' : 'Salvar no Catálogo'}
                </button>
              </div>

              {/* Tabela de Itens Cadastrados */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seu Catálogo (Multi-tenant)</span>
                  <span className="text-[10px] font-bold text-indigo-600">{produtos.length} Itens Salvos</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-[10px] font-black text-slate-400 uppercase border-b border-slate-50">
                      <th className="p-4">Nome do Item</th>
                      <th className="p-4">Descrição do Item</th>
                      <th className="p-4 text-right">Preço Sugerido</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {produtos.map((prod: any) => (
                      <tr key={prod.id || prod._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 text-xs font-bold text-slate-700">{prod.nome}</td>
                        <td className="p-4 text-xs font-bold text-slate-700">{prod.description}</td>
                        <td className="p-4 text-xs font-black text-emerald-500 text-right font-mono">R$ {Number(prod.preco).toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setNovoProduto({ id: prod.id || prod._id, nome: prod.nome, description: prod.description, preco: prod.preco })}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar Produto"
                            >
                              <Settings2 size={16}/>
                            </button>
                            <button 
                              onClick={async () => {
                                if(confirm(`Excluir "${prod.nome}" do catálogo?`)) {
                                  try {
                                    const token = localStorage.getItem('token') || "";
                                    await OSService.deleteProduct(prod.id || prod._id, token);
                                    setProdutos(produtos.filter((p: any) => (p.id || p._id) !== (prod.id || prod._id)));
                                  } catch (err) { alert("Erro ao excluir."); }
                                }
                              }}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir do Catálogo"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RODAPÉ DE AÇÕES */}
          <footer className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
              <span className="text-3xl font-black text-indigo-600 tracking-tighter">R$ {totais.total.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={saveLayoutAsTemplate} 
                className="flex items-center gap-2 bg-amber-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-amber-600 transition-all"
                title="Salva esta estrutura de campos para as próximas OS"
              >
                <Palette size={18}/> Salvar Modelo Padrão
              </button>
              <button onClick={gerarPDF} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                <Download size={18}/> Gerar PDF
              </button>
              <button 
                onClick={async () => {
                  try {
                    const payload = {
                      ...osData,
                      itens: itens, // Seus produtos adicionados na OS
                      subtotal: totais.subtotalPeças,
                      total: totais.total,
                      // O backend deve receber customFields como um objeto ou array no Schema
                    };
                    const token = localStorage.getItem('token') || "";
                    await OSService.saveOS(payload, token);
                    alert("Ordem de Serviço salva com sucesso!");
                    navigate("/oslito");
                  } catch (err) {
                    alert("Erro ao salvar no banco de dados.");
                  }
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
              >
                <Save size={18}/> Salvar OS
              </button>
            </div>
          </footer>
        </main>
      </div>
      
      
       {/* GABARITO DO PDF - ESTRUTURA PROFISSIONAL DE OS */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div 
          ref={pdfRef}
          style={{ 
            width: '816px',
            minHeight: '1056px',
            padding: '40px',
            backgroundColor: 'white',
            fontFamily: 'sans-serif',
            color: '#1e293b',
            boxSizing: 'border-box'
          }}
        >
          {/* HEADER */}
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" style={{ height: '45px', marginBottom: '5px' }} />
              ) : (
                <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#4f46e5', margin: 0 }}>ORDEM DE SERVIÇO</h1>
              )}
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>Emissão: {osData.dataEmissao}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: '#f1f5f9', padding: '5px 15px', borderRadius: '6px' }}>
                <p style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>OS Nº {osData.numero}</p>
                <p style={{ fontSize: '9px', fontWeight: '700', color: '#4f46e5', margin: 0, textTransform: 'uppercase' }}>{osData.status}</p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 E 3: CLIENTE E EQUIPAMENTO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>Dados do Cliente</h4>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Nome:</strong> {osData.cliente}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>CPF/CNPJ:</strong> {osData.documento}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Contato:</strong> {osData.contato}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Endereço:</strong> {osData.endereco}</p>
              {/* Renderização de Campos Extras do Cliente */}
              {osData.customFields.cliente.map(f => (
                <p key={f.id} style={{ fontSize: '11px', margin: '3px 0' }}><strong>{f.label}:</strong> {f.value}</p>
              ))}
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>Dados do Equipamento</h4>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Aparelho:</strong> {osData.equipamento}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Marca/Modelo:</strong> {osData.marcaModelo}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Nº Série/IMEI:</strong> {osData.serialIMEI}</p>
              <p style={{ fontSize: '11px', margin: '3px 0' }}><strong>Acessórios:</strong> {osData.acessorios}</p>
              {/* Renderização de Campos Extras do Equipamento */}
              {osData.customFields.equipamento.map(f => (
                <p key={f.id} style={{ fontSize: '11px', margin: '3px 0' }}><strong>{f.label}:</strong> {f.value}</p>
              ))}
            </div>
          </div>

          {/* CHECKLIST VISUAL */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' }}>Checklist / Estado Geral</h4>
            <p style={{ fontSize: '10px', color: '#334155', margin: 0, fontStyle: 'italic' }}>{osData.checklist || "Não informado."}</p>
          </div>

          {/* DIAGNÓSTICO E SERVIÇO */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '20px', background: '#f8fafc' }}>
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#ef4444', marginBottom: '3px' }}>Defeito Relatado</h4>
              <p style={{ fontSize: '11px', margin: 0 }}>{osData.defeitoRelatado}</p>
            </div>
            <div>
              <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#3b82f6', marginBottom: '3px' }}>Diagnóstico Técnico / Serviço Executado</h4>
              <p style={{ fontSize: '11px', margin: 0 }}>{osData.diagnosticoTecnico}</p>
            </div>
            {/* Campos Extras de Serviço */}
            {osData.customFields.servico.map(f => (
                <p key={f.id} style={{ fontSize: '11px', margin: '5px 0 0 0' }}><strong>{f.label}:</strong> {f.value}</p>
            ))}
          </div>

          {/* TABELA DE PEÇAS/INSUMOS */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#4f46e5', color: 'white' }}>
                <th style={{ padding: '8px', textAlign: 'left', fontSize: '10px', borderRadius: '4px 0 0 0' }}>DESCRIÇÃO DA PEÇA / PRODUTO</th>
                <th style={{ padding: '8px', textAlign: 'center', fontSize: '10px', width: '60px' }}>QTD</th>
                <th style={{ padding: '8px', textAlign: 'right', fontSize: '10px', borderRadius: '0 4px 0 0', width: '100px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px', fontSize: '11px' }}>{item.produto || "Item não selecionado"}</td>
                  <td style={{ padding: '8px', fontSize: '11px', textAlign: 'center' }}>{item.qtd}</td>
                  <td style={{ padding: '8px', fontSize: '11px', textAlign: 'right' }}>R$ {(item.qtd * item.preco).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* TOTAIS E PAGAMENTO */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ width: '60%' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', marginBottom: '5px' }}>Termos de Garantia</h4>
                <p style={{ fontSize: '9px', margin: 0, lineHeight: '1.4' }}>{osData.termosGarantia}</p>
              </div>
              <div style={{ fontSize: '10px' }}>
                <p><strong>Forma de Pagamento:</strong> {osData.pagamento}</p>
                <p><strong>Previsão de Entrega:</strong> {formatDate(osData.dataEntrega)}</p>
                <p><strong>Técnico Responsável:</strong> {osData.tecnicoResponsavel}</p>
              </div>
            </div>

            <div style={{ width: '35%', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', margin: '4px 0' }}>Total Peças: R$ {totais.subtotalPeças.toFixed(2)}</p>
              <p style={{ fontSize: '11px', margin: '4px 0' }}>Mão de Obra: R$ {Number(osData.valorMaoDeObra).toFixed(2)}</p>
              <p style={{ fontSize: '11px', margin: '4px 0' }}>Outros/Frete: R$ {Number(osData.frete).toFixed(2)}</p>
              <p style={{ fontSize: '11px', margin: '4px 0', color: '#ef4444' }}>Desconto ({osData.desconto}%): - R$ {(totais.subtotalGeral * (osData.desconto/100)).toFixed(2)}</p>
              <div style={{ borderTop: '2px solid #4f46e5', marginTop: '10px', paddingTop: '10px' }}>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Valor Total da OS</p>
                <p style={{ fontSize: '22px', fontWeight: '900', color: '#4f46e5', margin: 0 }}>R$ {totais.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* ASSINATURAS */}
          <div style={{ marginTop: '50px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
              <p style={{ fontSize: '10px', margin: 0 }}>{osData.cliente}</p>
              <p style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase' }}>Assinatura do Cliente</p>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
              <p style={{ fontSize: '10px', margin: 0 }}>Responsável Técnico</p>
              <p style={{ fontSize: '8px', color: '#64748b', textTransform: 'uppercase' }}>Assinatura da Empresa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSlito;