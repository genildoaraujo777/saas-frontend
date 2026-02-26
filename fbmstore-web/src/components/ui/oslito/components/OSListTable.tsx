import React from "react";
import { FileText, Trash2 } from "lucide-react";
import { numberToBRL } from "@/utils/currency";

interface OSListTableProps {
  orders: any[];
  loading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const OSListTable: React.FC<OSListTableProps> = ({ orders, loading, onEdit, onDelete }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PRONTO PARA ENTREGA": return "bg-emerald-100 text-emerald-700";
      case "EM MANUTENÇÃO": return "bg-blue-100 text-blue-700";
      case "AGUARDANDO APROVAÇÃO": return "bg-amber-100 text-amber-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Carregando base de dados...</div>;
  if (orders.length === 0) return (
    <div className="p-20 text-center space-y-4">
      <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300"><FileText size={32} /></div>
      <p className="text-slate-400 font-bold">Nenhuma ordem de serviço encontrada.</p>
    </div>
  );

  return (
    <div style={{ width: '100%', overflowX: 'auto', display: 'block' }}>
      <table style={{ minWidth: '1000px', width: '100%', borderCollapse: 'collapse' }} className="text-left">
        <thead>
          <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <th className="p-6">OS Nº</th>
            <th className="p-6">Cliente</th>
            <th className="p-6">Equipamento</th>
            <th className="p-6">Status</th>
            <th className="p-6 text-right">Total</th>
            <th className="p-6 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {orders.map((os: any) => (
            <tr key={os._id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="p-6">
                <span className="font-mono font-black text-slate-800">#{os.numero}</span>
                <p className="text-[9px] text-slate-400 font-bold">{new Date(os.createdAt).toLocaleDateString()}</p>
              </td>
              <td className="p-6 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">{os.cliente}</span>
                  <span className="text-[10px] text-slate-400">{os.contato}</span>
                </div>
              </td>
              <td className="p-6 text-xs font-bold text-slate-500">{os.equipamento}</td>
              <td className="p-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusStyle(os.status)}`}>{os.status}</span>
              </td>
              <td className="p-6 text-right font-mono font-black text-indigo-600">{numberToBRL(Number(os.total || 0))}</td>
              <td className="p-6 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => onEdit(os._id)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"><FileText size={16}/></button>
                  <button onClick={() => onDelete(os._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};