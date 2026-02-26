import React, { useState } from "react";
import { Save, Settings2, Trash2 } from "lucide-react";
import { OSService, IOSProduct } from "@/services/OSService";
import { numberToBRL } from "@/utils/currency";

interface ProductCatalogProps {
  produtos: any[];
  setProdutos: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ produtos, setProdutos }) => {
  const [novoProduto, setNovoProduto] = useState<IOSProduct>({ 
    id: "", nome: "", description: "", preco: 0 
  });

  const salvarProduto = async () => {
    if (!novoProduto.nome.trim() || novoProduto.preco <= 0) {
      alert("Por favor, preencha o nome e o preço do produto.");
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || "";
      
      if (novoProduto.id) {
        // UPDATE
        await OSService.updateProduct(novoProduto.id, novoProduto, token);
        const listaAtualizada = produtos.map((p: any) => {
          const pId = p.id || p._id;
          if (pId === novoProduto.id) {
            return { ...p, nome: novoProduto.nome, description: novoProduto.description, preco: novoProduto.preco };
          }
          return p;
        });
        setProdutos(listaAtualizada);
      } else {
        // CREATE
        const savedProd = await OSService.createProduct(novoProduto, token);
        setProdutos([...produtos, savedProd]);
      }

      setNovoProduto({ id: "", nome: "", description: "", preco: 0 });
      alert("Produto salvo/atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      alert("Erro ao salvar produto no banco.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Card de Cadastro */}
      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center mb-6">Cadastrar Peça / Item / Produto ou Serviço Padrão</h3>
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
              placeholder="Ex: Tela de 7 polegadas" 
              value={novoProduto.description}
              onChange={(e) => setNovoProduto({...novoProduto, description: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Preço Base (R$)</label>
            <input 
              type="text" 
              inputMode="decimal" 
              value={numberToBRL(novoProduto.preco || 0)}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                const numericValue = Number(onlyDigits) / 100;
                setNovoProduto({...novoProduto, preco: numericValue});
              }}
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
                <td className="p-4 text-xs font-black text-emerald-500 text-right font-mono">{numberToBRL(prod.preco)}</td>
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
  );
};