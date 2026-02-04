import React, { useEffect, useState } from "react";
import { 
  Plus, Search, FileText, Trash2, Printer, 
  ChevronRight, Clock, CheckCircle, AlertCircle, ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OSService } from "@/services/OSService";
import { useClient } from "@/contexts/ClientContext";
import { numberToBRL } from "@/utils/currency";

const OSlitoList: React.FC = () => {
  const navigate = useNavigate();
  // Tipamos como 'any[]' para flexibilidade total com seus campos dinâmicos
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token') || "";
      const data = await OSService.listOS(token);
      setOrders(data);
    } catch (err) {
      console.error("Erro ao carregar ordens");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PRONTO PARA ENTREGA": return "bg-emerald-100 text-emerald-700";
      case "EM MANUTENÇÃO": return "bg-blue-100 text-blue-700";
      case "AGUARDANDO APROVAÇÃO": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filteredOrders = orders.filter(os => 
    os.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.numero?.toString().includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-['Plus_Jakarta_Sans']">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER ESTRATÉGICO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Botão Voltar para a Home */}
            <button 
              type="button" 
              onClick={() => navigate("/")} 
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter">{loggedClient?.client?.name || 'FBMSTORE OS'} | <span className="text-indigo-600">GESTÃO</span></h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Controle de Ordens de Serviço</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/oslito/editor")}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            <Plus size={18}/> Nova Ordem de Serviço
          </button>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Pesquisar por cliente ou número da OS..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* LISTAGEM */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100">
          {loading ? (
            <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Carregando base de dados...</div>
          ) : (
            /* ESTA DIV ABAIXO É A CHAVE: overflow-x-auto e w-full */
            <div style={{ width: '100%', overflowX: 'auto', display: 'block' }}>
              <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse' }} className="text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-6">OS Nº</th>
                  <th className="p-6">Cliente</th>
                  <th className="p-6" style={{ minWidth: '200px', whiteSpace: 'nowrap' }}>Equipamento</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Total</th>
                  <th className="p-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((os: any) => (
                  <tr key={os._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <span className="font-mono font-black text-slate-800">#{os.numero}</span>
                      <p className="text-[9px] text-slate-400 font-bold">{new Date(os.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-6" style={{ whiteSpace: 'nowrap' }}>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{os.cliente}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{os.contato}</span>
                      </div>
                    </td>
                    <td className="p-6 text-xs font-bold text-slate-500 whitespace-nowrap">{os.equipamento}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusStyle(os.status)}`}>
                        {os.status}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="text-sm font-black text-indigo-600 font-mono">{numberToBRL(Number(os.total || 0))}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => navigate(`/oslito/editor/${os._id}`)}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                          title="Editar/Ver Detalhes"
                        >
                          <FileText size={16}/>
                        </button>
                        <button 
                          onClick={async () => {
                            if(confirm("Deseja eliminar permanentemente esta OS?")) {
                              const token = localStorage.getItem('token') || "";
                              await OSService.deleteOS(os._id, token);
                              fetchOrders();
                            }
                          }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
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
          )}
          {!loading && filteredOrders.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <FileText size={32} />
              </div>
              <p className="text-slate-400 font-bold">Nenhuma ordem de serviço encontrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OSlitoList;