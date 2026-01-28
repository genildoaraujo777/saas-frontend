import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  User, Phone, MapPin, Palette, Calendar, 
  CreditCard, Truck, ShoppingCart, Plus, Trash2, 
  FileText, Save, Download, Printer, Settings2, ArrowLeft
} from "lucide-react";
// Importamos o html2pdf apenas se necessário no lado do cliente
import html2pdf from "html2pdf.js";
import { useNavigate } from "react-router-dom";

interface Produto {
  id: React.Key | null;
  nome: string;
  preco: number;
}

const OSlito: React.FC = () => {
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
  // 1. ESTADOS DO FORMULÁRIO (Mapeados do index.html)
  const [activeTab, setActiveTab] = useState("dados");
  const [osData, setOsData] = useState({
    numero: Math.floor(Math.random() * 9000) + 1000,
    cliente: "",
    contato: "",
    endereco: "",
    tema: "",
    crianca: "",
    idade: "", // Novo
    dataFesta: "",
    dataEntrega: "",
    pagamento: "PIX",
    transporte: "RETIRADA",
    status: "ORÇAMENTO",
    obs: "", // Novo
    frete: 0, // Novo
    desconto: 0, // Novo
    deuEntrada: false, // Novo
    valorEntrada: 0,    // Novo
  });

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

  // Estado para a lista de produtos cadastrados e para o formulário de cadastro
  const [produtos, setProdutos] = useState(() => {
    const saved = localStorage.getItem('oslito_produtos');
    return saved ? JSON.parse(saved) : [
      { id: 1, nome: "Caixa milk com aplique 3D", preco: 4.5 },
      { id: 2, nome: "Caixa Pirâmide com aplique 3D", preco: 3.5 }
    ];
  });

  const [novoProduto, setNovoProduto] = useState<Produto>({ 
  id: null, 
  nome: "", 
  preco: 0  // ✅ Changed from "" to 0
});

  useEffect(() => {
    localStorage.setItem('oslito_produtos', JSON.stringify(produtos));
  }, [produtos]);

  const salvarProduto = () => {
    if (!novoProduto.nome || !novoProduto.preco) return;
    if (novoProduto.id) {
        setProdutos(produtos.map((p: Produto) => p.id === novoProduto.id ? novoProduto : p));  // ✅ Simplified
    } else {
        setProdutos([...produtos, { ...novoProduto, id: Date.now() }]);  // ✅ Removed extra Number()
    }
    setNovoProduto({ id: null, nome: "", preco: 0 });
    };

  // 2. ESTADO DA TABELA DE ITENS
  const [itens, setItens] = useState([
    { id: Date.now(), qtd: 1, produto: "", preco: 0 }
  ]);

  // 3. CÁLCULOS TOTAIS (Memoizado para performance como no home.tsx)
  const totais = useMemo(() => {
    const subtotal = itens.reduce((acc, item) => acc + (item.qtd * item.preco), 0);
    const valorFrete = Number(osData.frete) || 0;
    const percDesconto = Number(osData.desconto) || 0;
    
    const base = subtotal + valorFrete;
    const valorDesconto = base * (percDesconto / 100);
    
    return {
      subtotal,
      total: base - valorDesconto
    };
  }, [itens, osData.frete, osData.desconto]);

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{1})(\d{4})(\d{4})/, "$1 $2-$3")
      .substring(0, 16);
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
  };

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
                onClick={() => navigate(-1)} 
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

        {/* NAVEGAÇÃO POR ABAS (Mapeado do index.html) */}
        <nav className="flex border-b border-slate-100 bg-slate-50/50">
          {[
            { id: 'dados', label: 'Dados Iniciais', icon: <User size={16}/> },
            { id: 'itens', label: 'Itens do Pedido', icon: <ShoppingCart size={16}/> },
            { id: 'pagamento', label: 'Pagamento/Entrega', icon: <CreditCard size={16}/> },
            { id: 'produtos', label: 'Produtos', icon: <Settings2 size={16}/> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* CONTEÚDO DAS ABAS */}
        <main className="p-8">
          {/* ABA DADOS INICIAIS */}
          {activeTab === 'dados' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-300">
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</label>
                <input name="cliente" value={osData.cliente} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</label>
                <input name="contato" value={osData.contato} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" placeholder="WhatsApp" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Pedido</label>
                <input name="numero" value={osData.numero} readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-sm font-mono font-bold" />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</label>
                <input name="endereco" value={osData.endereco} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" placeholder="Rua, número, bairro..." />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Criança / Evento</label>
                <input name="crianca" value={osData.crianca} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" placeholder="Nome" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Idade</label>
                <input name="idade" value={osData.idade} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" placeholder="Ex: 5 anos" />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tema do Pedido</label>
                <input name="tema" value={osData.tema} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" placeholder="Tema da festa" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Data da Festa</label>
                <input type="date" name="dataFesta" value={osData.dataFesta} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Entrega</label>
                <input type="date" name="dataEntrega" value={osData.dataEntrega} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold" />
              </div>
            </div>
          )}

          {/* ABA ITENS DO PEDIDO */}
          {activeTab === 'itens' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="pb-4 w-20">QTD</th>
                    <th className="pb-4">Produto/Serviço</th>
                    <th className="pb-4 w-32">Unitário</th>
                    <th className="pb-4 w-32 text-right">Total</th>
                    <th className="pb-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {itens.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3"><input type="number" value={item.qtd} onChange={(e) => updateItem(item.id, 'qtd', Number(e.target.value))} className="w-16 p-2 bg-slate-50 border rounded-lg text-xs font-bold" /></td>
                      <td className="py-3 pr-4">
                        <select 
                        className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold outline-none cursor-pointer"
                        value={item.produto} 
                        onChange={(e) => {
                            const nome = e.target.value;
                            const p = produtos.find((prod: Produto) => prod.nome === nome);
                            
                            // Atualiza o item diretamente no map para evitar atraso de estado
                            setItens(prev => prev.map(it => 
                            it.id === item.id 
                                ? { ...it, produto: nome, preco: p ? p.preco : 0 } 
                                : it
                            ));
                        }}
                        >
                        <option value="">Selecione um produto...</option>
                        {produtos.map((p: Produto) => (
                            <option key={String(p.id)} value={p.nome}>
                            {p.nome}
                            </option>
                        ))}
                        </select>
</td>
                      <td className="py-3 pr-4"><input type="number" value={item.preco} onChange={(e) => updateItem(item.id, 'preco', Number(e.target.value))} className="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold" /></td>
                      <td className="py-3 text-right font-black text-slate-700 text-sm">R$ {(item.qtd * item.preco).toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="flex justify-between items-start">
                <button onClick={addItem} className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-6 py-3 rounded-xl hover:bg-indigo-100 transition-colors">
                  <Plus size={16}/> Adicionar Item
                </button>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Subtotal Unid: <span className="text-slate-700 ml-2 text-xs">R$ {itens.reduce((acc, i) => acc + i.preco, 0).toFixed(2)}</span></p>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Subtotal Itens: <span className="text-slate-700 ml-2 text-xs">R$ {totais.subtotal.toFixed(2)}</span></p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Observações</label>
                <textarea name="obs" value={osData.obs} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium h-24 outline-none focus:border-indigo-500" placeholder="Observações gerais do pedido..." />
              </div>
            </div>
          )}

          {/* ABA PAGAMENTO E ENTREGA */}
          {activeTab === 'pagamento' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pagamento</label>
                  <select name="pagamento" value={osData.pagamento} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold">
                    <option value="PIX">PIX</option>
                    <option value="CRÉDITO">CRÉDITO</option>
                    <option value="DÉBITO">DÉBITO</option>
                  </select>
                  <div className="flex items-center gap-3 mt-4 bg-white p-3 rounded-xl border border-slate-100">
                  <input 
                    type="checkbox" 
                    name="deuEntrada" 
                    checked={osData.deuEntrada} 
                    onChange={(e) => setOsData(prev => ({ ...prev, deuEntrada: e.target.checked }))}
                    className="w-5 h-5 accent-indigo-600"
                  />
                  <label className="text-xs font-bold text-slate-600 uppercase">Deu Entrada/Sinal</label>
                </div>

                {osData.deuEntrada && (
                  <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor da Entrada (R$)</label>
                    <input 
                      type="number" 
                      name="valorEntrada" 
                      value={osData.valorEntrada} 
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Transporte / Logística</label>
                  <select name="transporte" value={osData.transporte} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:border-indigo-500 outline-none text-sm font-bold">
                    <option value="RETIRADA">RETIRADA NO LOCAL</option>
                    <option value="UBER MOTO">UBER MOTO</option>
                    <option value="UBER CARRO">UBER CARRO</option>
                    <option value="CORREIOS">CORREIOS / SEDEX</option>
                  </select>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ajustes Financeiros</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Frete (+)</span>
                  <input type="number" name="frete" value={osData.frete} onChange={handleInputChange} className="w-32 p-2 bg-white border rounded-lg text-xs font-bold text-right" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Desconto (%)</span>
                  <input type="number" name="desconto" value={osData.desconto} onChange={handleInputChange} className="w-32 p-2 bg-white border rounded-lg text-xs font-bold text-right" />
                </div>
              </div>
            </div>
          )}
          
          {/* ABA PRODUTOS */}
          {activeTab === 'produtos' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Formulário de Cadastro (Estilo Card Superior) */}
              <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center">Configuração de Produtos</h3>
                <input 
                  type="text" 
                  placeholder="Descrição" 
                  value={novoProduto.nome}
                  onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                <input 
                  type="number" 
                  placeholder="Preço R$" 
                  value={novoProduto.preco}
                  onChange={(e) => setNovoProduto({...novoProduto, preco: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-slate-50 border rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={salvarProduto}
                  className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                >
                  {novoProduto.id ? 'Atualizar Produto' : 'Salvar'}
                </button>
              </div>

              {/* Lista de Produtos (Estilo Tabela da Imagem) */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-50">
                    {produtos.map((prod: Produto) => (
                        <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-xs font-bold text-slate-700">{prod.nome}</td>
                        <td className="p-4 text-xs font-black text-emerald-500 text-right">R$ {prod.preco.toFixed(2)}</td>
                        <td className="p-4 text-right w-24">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => setNovoProduto({ id: prod.id ?? null, nome: prod.nome, preco: prod.preco })}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="Editar"
                            >
                              <Settings2 size={18}/>
                            </button>
                            <button 
                              onClick={() => {
                                if(confirm("Excluir este produto?")) {
                                  setProdutos(produtos.filter((p: Produto) => p.id !== prod.id));
                                }
                              }}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={18}/>
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
              <button onClick={gerarPDF} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                <Download size={18}/> Gerar PDF
              </button>
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                <Save size={18}/> Salvar OS
              </button>
            </div>
          </footer>
        </main>
      </div>
      
      
       {/* GABARITO DO PDF - TÉCNICA DO CLONE INVISÍVEL */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div 
          ref={pdfRef}
          style={{ 
            width: '816px', // Largura EXATA do formato Letter (8.5in * 96dpi)
            minHeight: '1056px', // Altura mínima do formato Letter
            padding: '48px', // Margem visual (0.5in) controlada via CSS
            backgroundColor: 'white',
            fontFamily: 'sans-serif',
            color: '#333',
            boxSizing: 'border-box' // Importante para o padding não estourar a largura
          }}
        >
            {/* CABEÇALHO DO PDF */}
            <div style={{ borderBottom: '4px solid #4f46e5', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    {companyLogo ? (
                        <img 
                            src={companyLogo} 
                            alt="Logo" 
                            // crossOrigin é VITAL para html2canvas não "sujar" o canvas com erro de segurança
                            crossOrigin="anonymous" 
                            style={{ height: '50px', objectFit: 'contain', marginBottom: '10px', display: 'block' }}
                        />
                    ) : (
                        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#4f46e5', margin: 0 }}>FBMSTORE | ORÇAMENTO</h1>
                    )}
                    
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', marginTop: '5px' }}>Nº {osData.numero}</p>
                </div>
                
                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <p style={{ margin: '2px 0' }}>Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                    <p style={{ margin: '2px 0' }}><strong>Status:</strong> {osData.status}</p>
                </div>
            </div>

            {/* DADOS CLIENTE E EVENTO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Coluna Cliente */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ color: '#4f46e5', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Cliente</h3>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Nome:</strong> {osData.cliente}</p>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Contato:</strong> {osData.contato}</p>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Endereço:</strong> {osData.endereco}</p>
                </div>

                {/* Coluna Evento */}
                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ color: '#4f46e5', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Evento</h3>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Tema:</strong> {osData.tema}</p>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Criança:</strong> {osData.crianca} ({osData.idade})</p>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Idade:</strong> {osData.idade}</p>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Data da Festa:</strong> {osData.dataFesta ? new Date(osData.dataFesta).toLocaleDateString('pt-BR') : ''}</p>
                    <p style={{ fontSize: '12px', margin: '4px 0' }}><strong>Data Entrega:</strong> {osData.dataEntrega ? new Date(osData.dataEntrega).toLocaleDateString('pt-BR') : ''}</p>
                </div>
            </div>

            {/* TABELA DE ITENS */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', fontSize: '12px' }}>
                <thead>
                    <tr style={{ background: '#4f46e5', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>QTD</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>PRODUTO</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>UNITÁRIO</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {itens.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.qtd}</td>
                            <td style={{ padding: '10px' }}>{item.produto}</td>
                            <td style={{ padding: '10px' }}>R$ {item.preco.toFixed(2)}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>R$ {(item.qtd * item.preco).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* RODAPÉ DO PDF (OBSERVAÇÕES E TOTAIS) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
                
                {/* Coluna da Esquerda: Observações e Detalhes de Pagamento */}
                <div style={{ flex: 1, fontSize: '12px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '5px' }}>Observações</h4>
                        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '10px', borderRadius: '6px', minHeight: '60px' }}>
                            {osData.obs || "Nenhuma observação adicional."}
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                            <h4 style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' }}>Pagamento</h4>
                            <p style={{ fontWeight: 'bold' }}>{osData.pagamento}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' }}>Logística</h4>
                            <p style={{ fontWeight: 'bold' }}>{osData.transporte}</p>
                        </div>
                    </div>
                </div>

                {/* Coluna da Direita: Valores */}
                <div style={{ width: '280px', textAlign: 'right', fontSize: '12px' }}>
                    <p style={{ margin: '5px 0' }}>Subtotal Unid: <strong>R$ {itens.reduce((acc, item) => acc + item.preco, 0).toFixed(2)}</strong></p>
                    <p style={{ margin: '5px 0' }}>Subtotal Itens: <strong>R$ {totais.subtotal.toFixed(2)}</strong></p>
                    <p style={{ margin: '5px 0' }}>Frete: <strong>R$ {Number(osData.frete).toFixed(2)}</strong></p>
                    <p style={{ margin: '5px 0', color: 'red' }}>Desconto ({osData.desconto}%): <strong>- R$ {(totais.subtotal * (Number(osData.desconto)/100)).toFixed(2)}</strong></p>
                    
                    {osData.deuEntrada && (
                         <p style={{ margin: '5px 0', color: 'green' }}>Entrada/Sinal: <strong>- R$ {Number(osData.valorEntrada).toFixed(2)}</strong></p>
                    )}
                    
                    <div style={{ borderTop: '2px solid #4f46e5', marginTop: '10px', paddingTop: '10px' }}>
                        <p style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#94a3b8' }}>Valor Final</p>
                        <p style={{ fontSize: '24px', fontWeight: '900', color: '#4f46e5', margin: 0 }}>
                            R$ {(totais.total - (osData.deuEntrada ? Number(osData.valorEntrada) : 0)).toFixed(2)}
                        </p>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default OSlito;