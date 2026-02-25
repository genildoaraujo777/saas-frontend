import { FinanLitoService } from '@/services/FinanLitoService';
import { ITransactionExtended } from '@/types';
import { DEFAULT_CATEGORIES, MONTHS } from '@/utils/constantes';
import { fmtCurrency } from '@/utils/currency';
import { checkAndMigrateOverdue } from '@/utils/finanlito/finanlito';
import { useState, useEffect, useMemo } from 'react';

export function useFinanLitoTransactions(token: string, terms: any) {
  // 1. ESTADOS GLOBAIS DE DADOS
  const [transactions, setTransactions] = useState<ITransactionExtended[]>([]);
  const [loading, setLoading] = useState(false);
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [debouncedYear, setDebouncedYear] = useState(curYear);
  const [curMonth, setCurMonth] = useState<number | null>(null);

  // 2. ESTADOS DE FILTRO E SELEÇÃO
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 3. DEBOUNCE PARA MUDANÇA DE ANO (Performance)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedYear(curYear), 500);
    return () => clearTimeout(handler);
  }, [curYear]);

  // 4. FETCH DE DADOS GLOBAIS
  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await FinanLitoService.getAll(undefined, debouncedYear, token);
      
      let dataWithOrder = data.map((t: any, index: number) => ({
          ...t,
          order: t.order !== undefined ? t.order : index
      }));
      dataWithOrder.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const sanitizedData = await checkAndMigrateOverdue(dataWithOrder);
      setTransactions(sanitizedData);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setIsSelectionMode(false);
    setSelectedCategory('Todas');
    setSelectedIds([]);
  }, [debouncedYear, curMonth, token]);

  // 5. CÁLCULOS DERIVADOS: CATEGORIAS DO USUÁRIO
  const userCategories = useMemo(() => {
      const customOnes = transactions.map(t => t.category).filter(c => c && !DEFAULT_CATEGORIES.includes(c));
      const uniqueCustom = Array.from(new Set(customOnes));
      return [...DEFAULT_CATEGORIES.filter(c => c !== 'Outros'), ...uniqueCustom, 'Outros'];
  }, [transactions]);

  // 6. CÁLCULOS DERIVADOS: TRANSAÇÕES GLOBAIS DO MÊS (Sem filtros de tela)
  const currentMonthTransactions = useMemo(() => {
    if (curMonth === null) return [];
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === curMonth && d.getFullYear() === debouncedYear;
    });
  }, [transactions, curMonth, debouncedYear]);

  // 6.1 CÁLCULOS DERIVADOS: KANBAN FILTRADO (Apenas o que aparece na tela)
  const monthFiltered = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return currentMonthTransactions.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchLower) || 
                            (t.description?.toLowerCase().includes(searchLower));
      const matchesCategory = selectedCategory === 'Todas' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [currentMonthTransactions, searchTerm, selectedCategory]);

  // 7. CÁLCULOS DERIVADOS: ESTATÍSTICAS ANUAIS E MENSAIS
  const yearData = useMemo(() => { /* Manter sua lógica exata do yearData aqui */
    return MONTHS.map((m, idx) => {
        const items = transactions.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === idx && d.getFullYear() === debouncedYear;
        });
  
        let inc = 0, exp = 0, paidExp = 0, pendingExp = 0, overdueTotal = 0;
  
        items.forEach(t => {
          const isInstallment = t.title.match(/\(\d+\/\d+\)$/);
          const isFutureProj = t.isReplicated || isInstallment;
  
          if (t.type === 'income') {
            if (t.status === 'paid' || (!isFutureProj && t.status !== 'overdue')) {
              inc += Number(t.amount);
            }
          } else {
            exp += Number(t.amount);
            if (t.status === 'paid' && !t.isCreditCard) paidExp += Number(t.amount);
            if (t.status !== 'paid') pendingExp += Number(t.amount);
            if (t.status === 'overdue') overdueTotal += Number(t.amount);
          }
        });
  
        return { name: m, index: idx, count: items.length, inc, exp, bal: inc - paidExp, pending: pendingExp, overdue: overdueTotal };
      });
  }, [transactions, debouncedYear]);

  // 7.1 ESTATÍSTICAS DO MÊS: Agora usa a lista global do mês, não a lista filtrada!
  const statsMonth = useMemo(() => {
    let inc = 0, exp = 0, paidExp = 0, pendingExp = 0, creditExp = 0;
    currentMonthTransactions.forEach(t => {
      if (t.type === 'income') inc += t.amount;
      else {
        exp += t.amount;
        if (t.isCreditCard) creditExp += t.amount;
        if (t.status === 'paid' && !t.isCreditCard) paidExp += t.amount;
        if (t.status !== 'paid') pendingExp += t.amount;
      }
    });
    return { inc, exp, bal: inc - paidExp, pending: pendingExp, creditExp };
  }, [currentMonthTransactions]);

  // 8. REGRA DE NEGÓCIO: VALIDAÇÃO DE SALDO
  const validateBalanceForPayment = async (amount: number, isCreditCard: boolean, formId?: string | null): Promise<boolean> => {
    if (isCreditCard) return true; 
  
    const originalTx = transactions.find(t => t._id === formId || t.id === formId);
    if (originalTx?.status === 'paid' && amount <= originalTx.amount) return true;
  
    // CORREÇÃO: Pega a receita total do mês, mesmo que exista um filtro ativo na tela
    const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalPaidExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid' && !t.isCreditCard && t._id !== formId && t.id !== formId)
      .reduce((acc, t) => acc + t.amount, 0);
  
    const availableBalance = Number((totalIncome - totalPaidExpenses).toFixed(2));
    const expenseAmount = Number(amount.toFixed(2));
  
    if (expenseAmount > availableBalance) {
      const confirmNewIncome = window.confirm(
        `Atenção: Você não tem ${terms.income} suficiente declarada neste mês para cobrir este pagamento.\n\n` +
        `Saldo disponível: ${fmtCurrency(availableBalance)}\nValor da despesa: ${fmtCurrency(amount)}\n\n` +
        `Deseja adicionar uma nova ${terms.income} agora?`
      );
      if (confirmNewIncome) return false; 
    }
    return true; 
  };

  // 9. REGRA DE NEGÓCIO: ATUALIZAÇÃO DE ORDEM (DRAG AND DROP)
  const updateTransactionPosition = async (draggedId: string, newStatus: string, visualIndex: number) => {
    const allItems = [...transactions];
    const draggedItemIndex = allItems.findIndex(t => (t._id === draggedId || t.id === draggedId));
    if (draggedItemIndex === -1) return;

    const item = { ...allItems[draggedItemIndex] };
    allItems.splice(draggedItemIndex, 1);

    if (newStatus === 'paid' && item.type === 'expense') {
      const isOk = await validateBalanceForPayment(item.amount, !!item.isCreditCard, item._id || item.id);
      if (!isOk) return false; // Retorna false para a UI abortar o drag
    }
    item.status = newStatus as any;

    const columnItems = allItems.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === curMonth && d.getFullYear() === debouncedYear && t.status === newStatus;
    });

    let globalInsertIndex = allItems.length;
    if (columnItems.length > 0) {
        if (visualIndex >= columnItems.length) {
            const lastItem = columnItems[columnItems.length - 1];
            globalInsertIndex = allItems.indexOf(lastItem) + 1;
        } else {
            const targetItem = columnItems[visualIndex];
            globalInsertIndex = allItems.indexOf(targetItem);
        }
    }

    if (globalInsertIndex < 0) globalInsertIndex = 0;
    if (globalInsertIndex > allItems.length) globalInsertIndex = allItems.length;

    allItems.splice(globalInsertIndex, 0, item);
    const reorderedItems = allItems.map((t, idx) => ({ ...t, order: idx }));
    setTransactions(reorderedItems);

    try {
        const orderPayload = reorderedItems.map(t => ({ id: t._id || t.id || '', order: t.order || 0 }));
        FinanLitoService.updateOrder(orderPayload, token).catch(e => console.warn(e));
        
        if (item.status !== transactions[draggedItemIndex].status) {
            await FinanLitoService.update(draggedId, { 
              status: item.status, category: item.category, isReplicated: item.isReplicated, dateReplicated: item.dateReplicated 
            }, token);
        }
        return true;
    } catch (error) {
        console.error("Erro ao sincronizar", error);
        loadData(); // Reverte em caso de erro
        return false;
    }
  };

  // 10. AÇÕES EM MASSA
  // 10.5. AÇÃO EM MASSA: CLONAR PARA O PRÓXIMO MÊS
  const cloneBulkToNextMonth = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Deseja copiar os ${selectedIds.length} itens selecionados para o próximo mês?`)) return;

    setLoading(true);
    try {
      const selectedItems = transactions.filter(t => selectedIds.includes(t._id || t.id || ''));
      const createPromises = [];
      const deletePromises = [];

      for (const t of selectedItems) {
        const date = new Date(t.date);
        const originalDay = date.getDate();
        date.setMonth(date.getMonth() + 1);
        
        // Evita transbordo de dias (ex: 31 de Jan -> 28 de Fev)
        if (date.getDate() !== originalDay) {
          date.setDate(0);
        }

        const payload = {
          title: t.title,
          description: t.description,
          amount: t.amount,
          type: t.type,
          status: t.status === 'paid' ? 'pending' : t.status,
          date: date.toISOString(),
          isCreditCard: !!t.isCreditCard,
          category: t.category || 'Outros',
          isReplicated: true,
          dateReplicated: t.dateReplicated || t.date
        };

        createPromises.push(FinanLitoService.create(payload, token));

        // REGRA CEO: Se estiver atrasado, a operação funciona como MOVER (exclui o atual)
        if (t.status === 'overdue') {
          deletePromises.push(FinanLitoService.delete(t._id || t.id || '', token));
        }
      }

      await Promise.all(createPromises);
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }

      setIsSelectionMode(false);
      setSelectedIds([]);
      loadData();
      alert(`Sucesso! ${selectedItems.length} itens enviados para o próximo mês.`);
    } catch (err) {
      alert('Erro ao clonar itens em massa.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const deleteBulk = async () => {
      if (selectedIds.length === 0) return;
      if (!confirm(`Deseja excluir os ${selectedIds.length} itens selecionados?`)) return;
  
      setLoading(true);
      try {
        const selectedItems = transactions.filter(t => selectedIds.includes(t._id || t.id || ''));
        const installmentsSelected = selectedItems.filter(t => t.title.match(/\(\d+\/\d+\)$/));
  
        // 1. Deleta os selecionados
        await Promise.all(selectedIds.map(id => FinanLitoService.delete(id, token)));
  
        // 2. Re-indexa se houver parcelas envolvidas
        if (installmentsSelected.length > 0) {
          const allTransactions = await FinanLitoService.getAll(undefined, undefined, token);
          
          for (const item of installmentsSelected) {
            const match = item.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
            if (!match) continue;
  
            const siblingsLeft = allTransactions.filter(t => {
              const sMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
              return sMatch && sMatch[1] === match[1] && sMatch[3] === match[3] && !selectedIds.includes(t._id || t.id || '');
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
            if (siblingsLeft.length === 0) continue;
  
            const anchorDate = new Date(siblingsLeft[0].date);
            const originalDay = anchorDate.getDate();
  
            const updates = siblingsLeft.map((s, idx) => {
              const newDate = new Date(anchorDate);
              newDate.setMonth(anchorDate.getMonth() + idx);
              if (newDate.getDate() !== originalDay) newDate.setDate(0);
  
              return FinanLitoService.update(s._id || s.id || '', { 
                ...s,
                title: `${match[1]} (${idx + 1}/${siblingsLeft.length})`,
                date: newDate.toISOString()
              }, token);
            });
            await Promise.all(updates);
          }
        }
  
        setIsSelectionMode(false);
        setSelectedIds([]);
        loadData();
      } catch (err) { alert('Erro na exclusão em massa.'); }
      finally { setLoading(false); }
  };

  // 11. GESTÃO DE CATEGORIAS CUSTOMIZADAS
  const handleRenameUserCategory = async (oldName: string) => {
    const newName = window.prompt(`Renomear categoria "${oldName}" para:`, oldName);
    if (!newName || newName === oldName) return;

    const affected = transactions.filter(t => t.category === oldName);
    if (confirm(`Isso atualizará ${affected.length} lançamentos. Confirmar?`)) {
        setLoading(true);
        try {
            await Promise.all(affected.map(t => 
                FinanLitoService.update(t._id || t.id || '', { category: newName }, token)
            ));
            if (selectedCategory === oldName) setSelectedCategory(newName);
            loadData();
        } catch (e) { alert("Erro ao renomear"); }
        finally { setLoading(false); }
    }
  };

  const handleDeleteUserCategory = async (catName: string) => {
    const affected = transactions.filter(t => t.category === catName);
    if (confirm(`Excluir categoria "${catName}"? ${affected.length} lançamentos voltarão para "Outros".`)) {
        setLoading(true);
        try {
            await Promise.all(affected.map(t => 
                FinanLitoService.update(t._id || t.id || '', { category: 'Outros' }, token)
            ));
            if (selectedCategory === catName) setSelectedCategory('Todas');
            loadData();
        } catch (e) { alert("Erro ao excluir"); }
        finally { setLoading(false); }
    }
  };

  return {
    // Estado Global
    transactions, loading, setLoading, loadData,
    curYear, setCurYear, debouncedYear,
    curMonth, setCurMonth,
    
    // Filtros
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    userCategories, monthFiltered, currentMonthTransactions,
    
    // Derived Data
    yearData, statsMonth,
    
    // Seleção em Massa
    isSelectionMode, toggleSelectionMode,
    selectedIds, handleToggleSelect, deleteBulk,

    // Regras de Negócio
    validateBalanceForPayment,
    updateTransactionPosition,
    handleRenameUserCategory,
    handleDeleteUserCategory,
    cloneBulkToNextMonth
  };
}