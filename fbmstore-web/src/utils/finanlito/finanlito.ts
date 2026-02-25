import { ITransactionExtended } from "@/types";
import { CATEGORY_COLORS } from "../constantes";
import { FinanLitoService } from "@/services/FinanLitoService";

// Helper para cores com fallback para categorias customizadas
export const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] || '#6366f1';

export async function checkAndMigrateOverdue(list: ITransactionExtended[]) {
    const token = localStorage.getItem('token') || "";
    const now = new Date();
    // CORREÇÃO DE DATA: Considera apenas o início do dia de hoje (00:00:00)
    now.setHours(0, 0, 0, 0); 

    const updates: Promise<any>[] = [];
    const updatedList = list.map(t => {
      if (t.status === 'pending') {
        const tDate = new Date(t.date);
        if (tDate < now) {
          updates.push(
            FinanLitoService.update(t._id || t.id || '', { status: 'overdue' }, token)
              .catch(err => console.error(`Falha ao auto-atualizar transação`, err))
          );
          return { ...t, status: 'overdue' } as ITransactionExtended;
        }
      }
      return t;
    });

    if (updates.length > 0) Promise.all(updates); 
    return updatedList;
  }