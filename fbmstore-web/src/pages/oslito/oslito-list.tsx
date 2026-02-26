import React, { useEffect, useState } from "react";
import { Plus, Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { OSService } from "@/services/OSService";
import { useClient } from "@/contexts/ClientContext";
import { OSListTable } from "@/components/ui/oslito/components/OSListTable";

const OSlitoList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { loggedClient } = useClient();

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token') || "";
      const data = await OSService.listOS(token);
      setOrders(data);
    } catch (err) { console.error("Erro ao carregar ordens"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleDelete = async (id: string) => {
    if(confirm("Deseja eliminar permanentemente esta OS?")) {
      const token = localStorage.getItem('token') || "";
      await OSService.deleteOS(id, token);
      fetchOrders();
    }
  };

  const filteredOrders = orders.filter(os => 
    os.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.numero?.toString().includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-['Plus_Jakarta_Sans']">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all">
              <ArrowLeft size={16} /> Voltar
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800">{loggedClient?.client?.name || 'FBMSTORE OS'} | <span className="text-indigo-600">GESTÃO</span></h1>
              <p className="text-xs font-bold text-slate-400 uppercase">Controle de Ordens de Serviço</p>
            </div>
          </div>
          <button onClick={() => navigate("/oslito/editor")} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
            <Plus size={18}/> Nova Ordem
          </button>
        </div>

        {/* BUSCA */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" placeholder="Pesquisar por cliente ou número da OS..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>

        {/* TABELA ISOLADA */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <OSListTable orders={filteredOrders} loading={loading} onEdit={(id) => navigate(`/oslito/editor/${id}`)} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
};

export default OSlitoList;