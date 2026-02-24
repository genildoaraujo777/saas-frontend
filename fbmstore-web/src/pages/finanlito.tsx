import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FinanLitoService, ITransaction } from '../services/FinanLitoService';
import { MdAdd, MdArrowBack, MdChevronLeft, MdChevronRight, MdDelete, MdSearch, MdCalendarToday, MdContentCopy, MdChecklist, MdClose, MdCreditCard, MdEdit } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../contexts/TenantContext';
import { GuiaSefaz } from '@/components/ui/GuiaSefaz';
import { ScannerCustom } from '@/components/ui/ScannerCustom';

// --- UTILITÁRIOS ---
const DEFAULT_CATEGORIES = ["Alimentação", "Vestuário", "Moradia", "Transporte", "Lazer", "Saúde", "Educação", "Consumo", "Fitness", "Investimentos", "Móveis", "Outros"];

// Helper para cores com fallback para categorias customizadas
const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] || '#6366f1'; // Indigo para customizadas

const CATEGORY_COLORS: { [key: string]: string } = {
  "Alimentação": "#f97316", "Vestuário": "#1bf8e0","Moradia": "#0ea5e9", "Transporte": "#64748b",
  "Lazer": "#ec4899", "Saúde": "#ef4444", "Educação": "#8b5cf6",
  "Consumo": "#facc15", "Fitness": "#22c55e", "Investimentos": "#10b981", "Móveis": "#92400e", "Outros": "#94a3b8"
};
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const parseCurrencyToFloat = (value: string) => {
    if (!value) return 0;
    const clean = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(clean) || 0;
}

const parseISOToDateBR = (isoStr: string) => {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); 
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    } catch { return ''; }
};

const parseDateBRToISO = (str: string) => {
    if (!str || str.length < 10) return new Date().toISOString();
    try {
        const [datePart, timePart] = str.split(' ');
        const [d, m, y] = datePart.split('/').map(Number);
        let h = 0, min = 0;
        if (timePart) { [h, min] = timePart.split(':').map(Number); }
        if (!y || !m || !d) throw new Error("Data inválida");
        return new Date(y, m - 1, d, h || 0, min || 0).toISOString();
    } catch (e) {
        return new Date().toISOString();
    }
};

interface ITransactionExtended extends ITransaction {
    order?: number; 
}

// --- COMPONENTE PRINCIPAL ---

export default function FinanLitoPage() {
  // 1. Hook do White Label (Cores e Textos Dinâmicos)
  const { colors, terms } = useTenant();
  
  const [transactions, setTransactions] = useState<ITransactionExtended[]>([]);
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState<number | null>(null);
  const [debouncedYear, setDebouncedYear] = useState(curYear);
  const [loading, setLoading] = useState(false);

  // --- NOVOS ESTADOS PARA SELEÇÃO EM MASSA ---
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Estados Drag and Drop
  const [draggedItem, setDraggedItem] = useState<ITransactionExtended | null>(null);
  const [dropPlaceholder, setDropPlaceholder] = useState<{ status: string, index: number } | null>(null);

  // Estados Modal / Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  
  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formAmount, setFormAmount] = useState(''); 
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formStatus, setFormStatus] = useState<'pending' | 'paid' | 'overdue'>('pending');
  const [formDate, setFormDate] = useState('');
  const [formIsCreditCard, setFormIsCreditCard] = useState(false);
  // NOVOS ESTADOS PARA PARCELAMENTO
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);

  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const statsScrollRef = useRef<HTMLDivElement>(null);
  const kanbanScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isTutoScanning, setTutoScanning] = useState(false);

  // Fechar ao clicar fora
  useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        // Dropdown do Modal
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setIsCatDropdownOpen(false);
        }
        // Dropdown do Filtro Principal
        if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
            setIsFilterDropdownOpen(false);
        }
    };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userCategories = useMemo(() => {
      // Pega todas as categorias únicas que já existem nas transações desse usuário
      const customOnes = transactions.map(t => t.category).filter(c => c && !DEFAULT_CATEGORIES.includes(c));
      const uniqueCustom = Array.from(new Set(customOnes));
      // Retorna as padrões (sem o 'Outros' no meio) + as customizadas + 'Outros' por último
      return [...DEFAULT_CATEGORIES.filter(c => c !== 'Outros'), ...uniqueCustom, 'Outros'];
  }, [transactions]);
  
  const nativeDateInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('token') || "";
  const navigate = useNavigate();

  // Debounce para mudança de ano: Só atualiza debouncedYear 500ms após o último clique
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedYear(curYear);
    }, 500); // Meio segundo é o tempo ideal para o usuário parar de clicar

    return () => clearTimeout(handler);
  }, [curYear]);

  // --- SEGURANÇA: CHECAGEM DE LOGIN ---
  useEffect(() => {
    if (!token) {
        alert(`Você precisa estar logado para acessar o ${terms.appName}.`);
        navigate('/login', { state: { from: '/finanlito' } });
    }
  }, [token, navigate, terms.appName]);

  useEffect(() => {
    if (token) loadData();
    // Reseta seleção ao mudar de contexto
    setIsSelectionMode(false);
    setSelectedCategory('Todas');
    setSelectedIds([]);
  }, [debouncedYear, curMonth, token]);

  async function checkAndMigrateOverdue(list: ITransactionExtended[]) {
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

  async function loadData() {
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
  }

  // --- LÓGICA DE SELEÇÃO EM MASSA ---
      const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds([]);
      };

      const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
      };

      const handleScanSuccess = async (decodedUrl: string) => {
      // 1. LIMPEZA E VALIDAÇÃO BÁSICA
      // Se vier vazio ou não for uma URL, ignora e deixa o scanner continuar
      if (!decodedUrl || !decodedUrl.startsWith('http')) {
        console.log("QR Code detectado, mas não é um link válido.");
        return;
      }

      // 2. FILTRO DA FAZENDA (Segurança para não abrir lixo)
      // Verifica se no link tem "fazenda", "sefaz" ou "nfe"
      const ehUrlFazenda = /fazenda|sefaz|nfe/i.test(decodedUrl);

      if (!ehUrlFazenda) {
        // Se você quiser permitir outros links, remova esse IF. 
        // Mas para o seu caso, isso evita abrir sites errados.
        console.warn("QR Code lido, mas não parece ser uma Nota Fiscal:", decodedUrl);
        return;
      }

      // --- SE CHEGOU AQUI, A URL É REAL E É DA FAZENDA ---

      // 3. Fecha o scanner para parar de processar frames
      setIsScanning(false); 

      // 4. Avisa o usuário
      alert("Nota Fiscal Detectada! \n\n1. O site da Fazenda vai abrir.\n2. Resolva o Captcha.\n3. Copie os dados.\n4. Volte aqui e cole no card.");

      // 5. Abre a URL (O navegador pode bloquear se não houver interação humana direta, 
      // mas como vem depois de um clique ou scanner ativo, costuma funcionar)
      window.open(decodedUrl, "_blank", "noopener,noreferrer");

      // 6. Abre o modal de lançamento para o usuário já ter onde colar ao voltar
      handleOpenModal();
    };

  async function handleDeleteBulk() {
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
  }

  // --- DRAG AND DROP ---
  const handleDragStart = (e: React.DragEvent, item: ITransactionExtended) => {
    if (isSelectionMode) return; // Bloqueia drag se estiver selecionando
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item._id || item.id || '');
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropPlaceholder(null);
  };

  const onDragOverCard = (e: React.DragEvent, targetIndex: number, status: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (!draggedItem || isSelectionMode) return;
      const targetRect = e.currentTarget.getBoundingClientRect();
      const clientY = e.clientY;
      const targetMiddleY = targetRect.top + targetRect.height / 2;
      let newIndex = targetIndex;
      if (clientY > targetMiddleY) newIndex = targetIndex + 1;

      if (!dropPlaceholder || dropPlaceholder.index !== newIndex || dropPlaceholder.status !== status) {
          setDropPlaceholder({ status, index: newIndex });
      }
  };

  const onDragOverColumn = (e: React.DragEvent, status: string, listLength: number) => {
      e.preventDefault();
      if (isSelectionMode) return;
      if (!dropPlaceholder || dropPlaceholder.status !== status) {
         setDropPlaceholder({ status, index: listLength });
      }
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSelectionMode) return;
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || !dropPlaceholder) {
          handleDragEnd();
          return;
      }
      const finalIndex = dropPlaceholder.index;
      await updateTransactionPosition(draggedId, status, finalIndex);
      handleDragEnd();
  };

  const updateTransactionPosition = async (draggedId: string, newStatus: string, visualIndex: number) => {
    const allItems = [...transactions];
    const draggedItemIndex = allItems.findIndex(t => (t._id === draggedId || t.id === draggedId));
    if (draggedItemIndex === -1) return;

    const item = { ...allItems[draggedItemIndex] };
    allItems.splice(draggedItemIndex, 1);
    if (newStatus === 'paid' && item.type === 'expense') {
      const isOk = await validateBalanceForPayment(item.amount, !!item.isCreditCard);
      if (!isOk) {
        handleDragEnd();
        return;
      }
    }
    item.status = newStatus as any;

    const columnItems = allItems.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === curMonth && d.getFullYear() === curYear && t.status === newStatus;
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
            // Enviamos o status, mas o 'item' já possui isReplicated e dateReplicated
            // pois foi clonado via spread no início desta função.
            await FinanLitoService.update(draggedId, { 
              status: item.status,
              category: item.category,
              isReplicated: item.isReplicated,
              dateReplicated: item.dateReplicated 
            }, token);
        }
    } catch (error) {
        console.error("Erro ao sincronizar", error);
    }
  };

  // --- CÁLCULOS ---
  const yearData = useMemo(() => {
    return months.map((m, idx) => {
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
          
          if (t.status === 'paid' && !t.isCreditCard) {
            paidExp += Number(t.amount);
          }
          
          if (t.status !== 'paid') {
            pendingExp += Number(t.amount);
          }
          
          // CORREÇÃO AQUI: Soma apenas se o status for exatamente 'overdue'
          if (t.status === 'overdue') {
            overdueTotal += Number(t.amount);
          }
        }
      });

      return { 
        name: m, 
        index: idx, 
        count: items.length, 
        inc, 
        exp, 
        bal: inc - paidExp, 
        pending: pendingExp,
        overdue: overdueTotal
      };
    });
  }, [transactions, debouncedYear]);

  const globalBalance = useMemo(() => {
    return transactions
      .filter(t => new Date(t.date).getFullYear() === debouncedYear)
      .reduce((acc, t) => {
        const isInstallment = t.title.match(/\(\d+\/\d+\)$/);
        const isFutureProjection = t.isReplicated || isInstallment;

        // REGRA CEO: Ignora Atrasados ou Projeções (Parcelas/Replicados) que não foram pagos
        if (t.status === 'overdue' || (isFutureProjection && t.status !== 'paid')) return acc;

        // REGRA CEO: Despesas de Cartão de Crédito não abatem do saldo geral (conforme checkbox do card)
        if (t.type === 'expense' && t.isCreditCard && t.status === 'paid') return acc;

        return t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
      }, 0);
  }, [transactions, debouncedYear]);

  function openMonth(idx: number) { setCurMonth(idx); }
  function goHome() { setCurMonth(null); }

  const currencyMask = (value: string) => {
    if (!value) return "";
    const onlyDigits = value.replace(/\D/g, "");
    const numberValue = Number(onlyDigits) / 100;
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  function handleOpenModal(t?: ITransaction) {
    if (isSelectionMode) return; // Não abre modal em modo de seleção
    if (t) {
      setFormId(t._id || t.id || '');
      setFormTitle(t.title);
      setFormDesc(t.description || '');
      const cat = t.category || 'Outros';
        // Se a categoria existe na lista (seja padrão ou customizada), selecionamos ela no dropdown
      if (userCategories.includes(cat)) {
          setFormCategory(cat);
          setFormCustomCategory(''); // Limpa o input de texto
      } else {
          // Fallback de segurança
          setFormCategory('Outros');
          setFormCustomCategory(cat);
      }
      setFormAmount(t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      setFormType(t.type);
      setFormStatus(t.status);
      setFormDate(parseISOToDateBR(t.date));
      setFormIsCreditCard(t.isCreditCard === true);
      // Na edição, desativamos a opção de parcelamento para simplificar
      setIsInstallment(false);
      setTotalInstallments(2);
    } else {
      setFormId(null);
      setFormTitle('');
      setFormDesc('');
      setFormAmount('');
      setFormType('expense');
      setFormStatus('pending');
      const now = new Date();
      now.setFullYear(curYear);
      if (curMonth !== null) now.setMonth(curMonth);
      setFormDate(parseISOToDateBR(now.toISOString()));
      setFormIsCreditCard(false);
      // Resetar parcelamento
      setIsInstallment(false);
      setTotalInstallments(2);
    }
    setIsModalOpen(true);
  }

  // Adicione esta função antes do handleSave
 async function validateBalanceForPayment(amount: number, isCreditCard: boolean): Promise<boolean> {
  if (isCreditCard) return true; 

  // NOVO: Se já existe um ID (Edição) e o status atual no banco já era 'paid', ignoramos a validação
  // pois o dinheiro já saiu do saldo anteriormente.
  const originalTx = transactions.find(t => t._id === formId || t.id === formId);
  if (originalTx?.status === 'paid' && amount <= originalTx.amount) return true;

    // CALCULANDO EXATAMENTE IGUAL AOS CARDS DA TELA
    const totalIncome = monthFiltered
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalPaidExpenses = monthFiltered
      .filter(t => t.type === 'expense' && t.status === 'paid' && !t.isCreditCard && t._id !== formId && t.id !== formId)
      .reduce((acc, t) => acc + t.amount, 0);

    const availableBalance = Number((totalIncome - totalPaidExpenses).toFixed(2));
    const expenseAmount = Number(amount.toFixed(2));

    // Se o saldo for menor que o valor da despesa atual (ou se já estiver negativo)
    if (expenseAmount > availableBalance) {
      const confirmNewIncome = window.confirm(
        `Atenção: Você não tem ${terms.income} suficiente declarada neste mês para cobrir este pagamento.\n\n` +
        `Saldo disponível: ${fmtCurrency(availableBalance)}\n` +
        `Valor da despesa: ${fmtCurrency(amount)}\n\n` +
        `Deseja adicionar uma nova ${terms.income} agora?`
      );

      if (confirmNewIncome) {
        handleOpenModal(); 
        setFormType('income');
        return false; 
      }
    }
    return true; 
  }

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
                // ATUALIZAÇÃO DE ESTADO LOCAL PÓS-RENOMEAÇÃO
            if (formCategory === oldName) setFormCategory(newName); // Atualiza o select do card
            if (formCustomCategory === oldName) setFormCustomCategory(''); // Se era customizada, agora ela é uma categoria "oficial"
            if (selectedCategory === oldName) setSelectedCategory(newName); // Atualiza o filtro do topo da página
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

                // RESET DE ESTADOS EM CASO DE EXCLUSÃO
                if (formCategory === catName) setFormCategory('Outros'); // Reseta o select do card
                if (formCustomCategory === catName) setFormCustomCategory(''); // Limpa o nome se for customizado
                if (selectedCategory === catName) setSelectedCategory('Todas'); // Reseta o filtro principal da página

                loadData();
            } catch (e) { alert("Erro ao excluir"); }
            finally { setLoading(false); }
        }
    };

    // 13. HANDLE FILE: LÊ CHAVE -> COPIA -> ABRE SEFAZ
async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target?.files?.[0];
  if (!file) return;

  setLoading(true);
  const form = new FormData();
  form.append("file", file);

  try {
    const data = await FinanLitoService.scanNfcE(form, token);
    console.log('data: ',data);

    if (data.accessKey) {
      // Copia para o clipboard
      await navigator.clipboard.writeText(data.accessKey);
      
      alert("Chave de Acesso detetada e COPIADA!\n\nIremos abrir o site da Fazenda. Basta colar a chave e resolver o CAPTCHA.");
      
      // Abre a consulta em popup ou aba
      window.open("https://www.nfce.fazenda.sp.gov.br/consulta", "_blank", "noopener,noreferrer");
      
      // Abre o modal para o utilizador estar pronto para colar
      handleOpenModal();
    } else {
      alert("Não foi possível ler a Chave de Acesso. Tente uma foto mais nítida.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao conectar com o servidor de OCR.");
  } finally {
    setLoading(false);
  }
}

// 12. PARSER SAAS DE ELITE V4: CAPTURA VALOR TOTAL
const processSefazPaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text || text.length < 50) return;

    // Criamos uma versão em linha única para facilitar buscas globais
    const fullText = text.replace(/\s+/g, ' ');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 1. TÍTULO E CATEGORIA (Conforme solicitado)
    setFormTitle("CUPOM FISCAL ELETRÔNICO");
    setFormCategory('Outros'); // Categoria padrão inteligente
    setFormCustomCategory('');
    setFormType('expense');

    // 2. EXTRAÇÃO DO VALOR TOTAL (Busca Global por "Valor a pagar")
    // O Valor a pagar na sua nota é 1.012,41
    const totalMatch = fullText.match(/(?:Valor a pagar R\$|VALOR A PAGAR)\s*:?\s*([\d.]{1,},[\d]{2})/i);
    if (totalMatch) {
      setFormAmount(currencyMask(totalMatch[1].replace(/\D/g, '')));
    }

    // 3. EXTRAÇÃO DA DATA E HORA
    const dateMatch = fullText.match(/Emissão:\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2})/i);
    if (dateMatch) {
      setFormDate(`${dateMatch[1]} ${dateMatch[2]}`);
    }

    // 4. PARSER DE ITENS (Captura Nome, Qtd, Unitário e Subtotal)
    const allItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toUpperCase().includes("QTDE")) {
        // NOME: Linha anterior. Removemos o (Código: ...) e preços residuais
        let rawName = lines[i - 1] || "Item";
        const cleanName = rawName.replace(/^[\d,.]*/, '').split('(')[0].trim();

        // VALOR UNITÁRIO: Extraído da linha atual (ex: 20,25)
        const unitMatch = lines[i].match(/Vl\. Unit\.:\s*([\d,.]+)/i);
        const unitPrice = unitMatch ? unitMatch[1].trim() : "0,00";

        // VALOR TOTAL DO ITEM: Está no início da linha seguinte
        // Resolvemos o problema do "42,90VEJA" pegando apenas os números do início
        const nextLine = lines[i + 1] || "";
        const itemTotalMatch = nextLine.match(/^([\d,.]+)/);
        const itemTotal = itemTotalMatch ? itemTotalMatch[1] : unitPrice;

        // QUANTIDADE: Número após "Qtde:"
        const qtyMatch = lines[i].match(/Qtde\.:?([\d,.]+)/i);
        const qty = qtyMatch ? qtyMatch[1] : "1";

        if (cleanName && cleanName.length > 2 && !cleanName.includes("VALOR TOTAL")) {
          allItems.push(`${qty}x ${cleanName} UN(R$ ${unitPrice}) TOTAL(R$ ${itemTotal})`);
        }
      }
    }

    // 5. PREENCHIMENTO DA DESCRIÇÃO
    if (allItems.length > 0) {
      setFormDesc(`Resumo SEFAZ (${allItems.length} itens): ${allItems.join(' | ')}`);
      alert("Sucesso! Valor de " + (totalMatch ? totalMatch[1] : "não detectado") + " e itens importados.");
    } else {
      setFormDesc("Nota lida, mas verifique se os itens foram selecionados corretamente no site.");
    }

  } catch (err) {
    alert("Erro ao ler clipboard. Verifique se copiou os dados corretamente da SEFAZ.");
  }
};

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // --- LÓGICA DE PARCELAMENTO (APENAS PARA NOVOS) ---
    if (!formId && isInstallment && totalInstallments > 1) {
        setLoading(true);
        try {
            const val = parseCurrencyToFloat(formAmount);
            const isoDateBase = parseDateBRToISO(formDate); // Data da 1ª parcela
            const baseDate = new Date(isoDateBase);

            const oldCategory = transactions.find(t => t._id === formId || t.id === formId)?.category;
            const newCategory = formCategory === 'Outros' ? (formCustomCategory || 'Outros') : formCategory;

            // Se houve mudança de nome em uma categoria que já existia e não é das padrões
            if (formId && oldCategory && oldCategory !== newCategory && !DEFAULT_CATEGORIES.includes(oldCategory)) {
                const confirmSync = window.confirm(`Deseja atualizar o nome da categoria "${oldCategory}" para "${newCategory}" em TODOS os outros lançamentos?`);
                
                if (confirmSync) {
                    const othersToUpdate = transactions.filter(t => t.category === oldCategory && t._id !== formId);
                    othersToUpdate.forEach(t => {
                        FinanLitoService.update(t._id || t.id || '', { category: newCategory }, token).catch(e => console.error(e));
                    });
                }
            }

            const promises = [];

            for (let i = 0; i < totalInstallments; i++) {
                // Clona a data base para não alterar a referência
                const currentDate = new Date(baseDate);
                // Adiciona 'i' meses à data e ajusta se o dia transbordar (ex: 31/01 -> 28/02)
                currentDate.setMonth(baseDate.getMonth() + i);
                if (currentDate.getDate() !== baseDate.getDate()) {
                    currentDate.setDate(0); 
                }

                // Define o título com (x/y)
                const installmentTitle = `${formTitle} (${i + 1}/${totalInstallments})`;

                // Lógica de Status: 
                // Se a 1ª for paga, as seguintes nascem como "pendente" (padrão de segurança)
                // Se a 1ª for pendente, todas são pendentes.
                let currentStatus = formStatus;
                if (i > 0) {
                    currentStatus = 'pending'; 
                }

                // Recupera dados originais para preservar campos de replicação
                const originalItem = transactions.find(t => t._id === formId || t.id === formId);

                const payload = {
                    title: installmentTitle,
                    description: formDesc,
                    amount: val,
                    type: formType,
                    status: currentStatus,
                    date: currentDate.toISOString(),
                    isCreditCard: !!formIsCreditCard,
                    category: formCategory === 'Outros' ? (formCustomCategory || 'Outros') : formCategory,
                    isReplicated: originalItem?.isReplicated,
                    dateReplicated: originalItem?.dateReplicated ?? undefined
                };

                promises.push(FinanLitoService.create(payload, token));
            }

            await Promise.all(promises);
            setIsModalOpen(false);
            loadData();
            alert(`${totalInstallments} lançamentos gerados com sucesso!`);
        } catch (err) {
            alert('Erro ao gerar parcelas.');
        } finally {
            setLoading(false);
        }
        return; // Encerra a função aqui se for parcelado
    }
    
    // --- VERIFICAÇÃO DE DUPLICIDADE ---
    const isoDateTemp = parseDateBRToISO(formDate);
    const dateObj = new Date(isoDateTemp);
    const targetMonth = dateObj.getMonth();
    const targetYear = dateObj.getFullYear();
    const cleanNewTitle = formTitle.trim().toLowerCase();

    // 1. TRAVA DE SEGURANÇA PARA PARCELAS (Impede 2 parcelas do mesmo grupo no mesmo mês)
    const currentMatch = formTitle.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
    if (currentMatch) {
        const baseTitle = currentMatch[1].trim().toLowerCase();
        const denominator = currentMatch[3];

        const hasSiblingInMonth = transactions.some(t => {
            // Ignora o próprio card se estivermos editando
            if (formId && (t._id === formId || t.id === formId)) return false;
            
            const tDate = new Date(t.date);
            const tMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
            
            return tMatch && 
                   tMatch[1].trim().toLowerCase() === baseTitle && 
                   tMatch[3] === denominator && 
                   tDate.getMonth() === targetMonth && 
                   tDate.getFullYear() === targetYear;
        });

        if (hasSiblingInMonth) {
            alert(`Operação cancelada: Já existe uma parcela do grupo "${currentMatch[1]}" em ${months[targetMonth]} de ${targetYear}.`);
            return; 
        }
    }

    // 2. VERIFICAÇÃO GENÉRICA (Apenas para novos lançamentos simples)
    if (!formId && !currentMatch) {
        const possibleDuplicate = transactions.find(t => {
            const tDate = new Date(t.date);
            if (tDate.getMonth() !== targetMonth || tDate.getFullYear() !== targetYear) return false;
            const cleanExistingTitle = t.title.trim().toLowerCase();
            return cleanExistingTitle.includes(cleanNewTitle) || cleanNewTitle.includes(cleanExistingTitle);
        });

        if (possibleDuplicate) {
            const confirmDup = window.confirm(
                `Atenção: Já existe um lançamento semelhante neste mês: \n\n"${possibleDuplicate.title}" (R$ ${fmtCurrency(possibleDuplicate.amount)})\n\nDeseja incluir este novo mesmo assim?`
            );
            if (!confirmDup) return; 
        }
    }
    const val = parseCurrencyToFloat(formAmount);
    const isoDate = parseDateBRToISO(formDate);
    
    const payload = {
      title: formTitle, description: formDesc, amount: val, type: formType, status: formStatus, date: isoDate, isCreditCard: !!formIsCreditCard, category: formCategory === 'Outros' ? (formCustomCategory || 'Outros') : formCategory
    };

    if (formStatus === 'paid' && formType === 'expense') {
      const isOk = await validateBalanceForPayment(val, formIsCreditCard);
      if (!isOk) return;
    }

    try {
      if (formId) {
        // REGRA CEO: Detecção de alteração de valor em grupo de parcelas
        const originalItem = transactions.find(t => t._id === formId || t.id === formId);
        const match = originalItem?.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);

        if (match && val !== originalItem?.amount) {
          const baseTitle = match[1];
          const confirmValueSync = window.confirm(
            `Você alterou o valor desta parcela. Deseja atualizar o valor de TODAS as outras parcelas do grupo "${baseTitle}" para ${formAmount}?`
          );

          if (confirmValueSync) {
            // Busca global para encontrar todas as parcelas do grupo
            const allTransactions = await FinanLitoService.getAll(undefined, undefined, token);
            
            const siblings = allTransactions.filter(t => {
              const sMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
              if (!sMatch) return false;

              // REGRA CEO: Identifica como irmão se o título base for igual 
              // E se o total de parcelas (o denominador) for o mesmo.
              const sBaseTitle = sMatch[1];
              const sTotalParts = sMatch[3];
              
              return sBaseTitle === baseTitle && 
                     sTotalParts === match[3] && 
                     (t._id || t.id) !== formId;
            });

            // Atualiza todas as outras parcelas da corrente para o novo valor
            await Promise.all(siblings.map(s => 
              // REGRA CEO: Sincroniza Valor E Categoria para manter o grupo íntegro
              FinanLitoService.update(s._id || s.id || '', { 
                amount: val, 
                category: formCategory === 'Outros' ? (formCustomCategory || 'Outros') : formCategory 
              }, token)
            ));
          }
        }

        await FinanLitoService.update(formId, payload, token);
      } else {
        await FinanLitoService.create(payload, token);
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert('Erro ao salvar'); }
  }

  async function handleDelete() {
    if (!formId) return;

    const currentItem = transactions.find(t => (t._id === formId || t.id === formId));
    if (!currentItem) return;

    const match = currentItem.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
    
    // Se não for parcelado, exclusão simples
    if (!match) {
      if (!confirm('Deseja realmente excluir este lançamento?')) return;
      setLoading(true);
      try {
        await FinanLitoService.delete(formId, token);
        setIsModalOpen(false);
        loadData();
      } catch (err) { alert('Erro ao excluir'); }
      finally { setLoading(false); }
      return;
    }

    const baseTitle = match[1];
    const originalDenominator = match[3];

    if (!confirm(`Deseja excluir "${currentItem.title}"? O sistema irá reajustar as parcelas restantes para manter a sequência mensal correta.`)) return;

    setLoading(true);
    try {
      const allTransactions = await FinanLitoService.getAll(undefined, undefined, token);
      
      const siblings = allTransactions.filter(t => {
        const sMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
        return sMatch && sMatch[1] === baseTitle && sMatch[3] === originalDenominator;
      });

      const survivors = siblings
        .filter(t => (t._id || t.id) !== formId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const newTotal = survivors.length;

      // REGRA CEO: Re-alinhamento baseado no primeiro sobrevivente
      const updatePromises = survivors.map((item, idx) => {
        const anchorDate = new Date(survivors[0].date);
        const newDate = new Date(anchorDate);
        const originalDay = anchorDate.getDate();
        
        newDate.setMonth(anchorDate.getMonth() + idx);
        if (newDate.getDate() !== originalDay) newDate.setDate(0); 

        // REGRA CEO: Enviamos o objeto completo para não perder Categoria ou Metadados
        return FinanLitoService.update(item._id || item.id || '', { 
          ...item,
          title: `${baseTitle} (${idx + 1}/${newTotal})`,
          date: newDate.toISOString() 
        }, token);
      });

      await FinanLitoService.delete(formId, token);
      await Promise.all(updatePromises);
      
      setIsModalOpen(false);
      loadData();
      alert(`Parcela removida. ${newTotal} itens foram re-indexados no calendário.`);
    } catch (err) {
      alert('Erro ao processar re-indexação.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCloneToNextMonth(t: ITransactionExtended) {
    if (!confirm(`Deseja clonar "${t.title}" para o próximo mês?`)) return;

    const date = new Date(t.date);
    const originalDay = date.getDate();
    date.setMonth(date.getMonth() + 1);
    
    // Verificação de transbordo (dia 29/30/31 em meses curtos)
    if (date.getDate() !== originalDay) {
      date.setDate(0);
    }

    // Payload corrigido com type casting para evitar o erro TS(2345)
    const payload = {
      title: t.title,
      description: t.description,
      amount: t.amount,
      type: t.type,
      status: t.status === 'paid' ? 'pending' : t.status as 'pending' | 'paid' | 'overdue',
      date: date.toISOString(),
      isCreditCard: !!t.isCreditCard,
      category: formCategory || 'Outros'
    };

    setLoading(true);
    try {
      // REGRA CEO: Preserva a data original se ela já existir, senão usa a data atual do card
      const originalDateToPreserve = t.dateReplicated || t.date;

      await FinanLitoService.create({ 
        ...payload, 
        isReplicated: true, 
        dateReplicated: originalDateToPreserve 
      }, token);
      
      // REGRA CEO: Somente exclui o original se estiver ATRASADO. 
      // Itens Pendentes/Concluídos permanecem no mês de origem como histórico.
      if (t.status === 'overdue') {
          await FinanLitoService.delete(t._id || t.id || '', token);
      }
      
      alert('Lançamento movido para o próximo mês!');
      loadData();
    } catch (err) {
      alert('Erro ao clonar lançamento.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReplicate() {
    if (curMonth === null) return;
    
    const nextMonth = (curMonth + 1) % 12;
    const nextYear = curMonth === 11 ? curYear + 1 : curYear;

    if (!confirm(`Deseja copiar os lançamentos de ${months[curMonth]} para ${months[nextMonth]} de ${nextYear}?`)) return;

    setLoading(true);
    try {
        // 1. Pegamos o que já existe no próximo mês para comparar
        const existingNextMonth = await FinanLitoService.getAll(undefined, nextYear, token);
        const nextMonthItems = existingNextMonth.filter((t: any) => new Date(t.date).getMonth() === nextMonth);

        // 2. Filtramos os itens do mês atual
        const currentMonthItems = transactions.filter(t => new Date(t.date).getMonth() === curMonth);

        // 3. Analisamos duplicados
        for (const item of currentMonthItems) {
            // REGRA: Se for parcelado, não replica (padrão de título: "Nome (1/10)")
            if (item.title.match(/\(\d+\/\d+\)$/)) continue;

            const isDuplicate = nextMonthItems.find((n: any) => 
                n.title.toLowerCase().trim() === item.title.toLowerCase().trim() &&
                n.amount === item.amount
            );

            if (isDuplicate) {
                const action = window.confirm(
                    `O lançamento "${item.title}" (R$ ${item.amount}) já existe em ${months[nextMonth]}.\n\nClique em [OK] para REPLICAR NOVAMENTE ou [CANCELAR] para PULAR.`
                );
                if (!action) continue;
            }

            // Replica o item individualmente (ajustando a data e evitando transbordo)
            const newDate = new Date(item.date);
            const originalDay = newDate.getDate();
            newDate.setMonth(newDate.getMonth() + 1);
            
            if (newDate.getDate() !== originalDay) {
                newDate.setDate(0); // Ajusta para o último dia do mês correto (ex: 28/02)
            }
            
            // REGRA: Se for 'paid', volta pra 'pending'. Se for 'overdue' ou 'pending', mantém o status.
            const nextStatus = item.status === 'paid' ? 'pending' : item.status;

            // REGRA CEO: Mantém a data de origem para o rastro de atraso
            const originalDateToPreserve = item.dateReplicated || item.date;

            await FinanLitoService.create({
                ...item,
                status: nextStatus as 'pending' | 'paid' | 'overdue',
                date: newDate.toISOString(),
                isReplicated: true,
                dateReplicated: originalDateToPreserve
            }, token);

            // REGRA CEO: Somente move (exclui o original) se o item estiver ATRASADO.
            // Se for Pendente ou Concluido, o sistema apenas cria uma cópia no mês seguinte.
            if (item.status === 'overdue') {
                await FinanLitoService.delete(item._id || item.id || '', token);
            }
        }

        alert('Processo de replicação concluído!');
        loadData();
    } catch (error) {
        alert('Erro ao replicar transações.');
    } finally {
        setLoading(false);
    }
  }

  async function handleClearMonth() {
    if (curMonth === null) return;
    
    const confirmClear = window.confirm(`ATENÇÃO: Deseja EXCLUIR os lançamentos de ${months[curMonth]}? Parcelamentos serão removidos apenas deste mês e re-indexados nos demais.`);
    if (!confirmClear || !window.confirm("Confirma a exclusão definitiva?")) return;

    setLoading(true);
    try {
      const idsToDelete = monthFiltered.map(t => t._id || t.id || '');
      const installmentsInMonth = monthFiltered.filter(t => t.title.match(/\(\d+\/\d+\)$/));

      // 1. Deleta tudo o que está na tela do mês atual
      await Promise.all(idsToDelete.map(id => FinanLitoService.delete(id, token)));

      // 2. Se havia parcelas, precisamos re-indexar os grupos afetados
      if (installmentsInMonth.length > 0) {
        const allTransactions = await FinanLitoService.getAll(undefined, undefined, token);
        
        for (const item of installmentsInMonth) {
          const match = item.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
          if (!match) continue;

          const baseTitle = match[1];
          const originalDenominator = match[3];

          const siblingsLeft = allTransactions.filter(t => {
            const sMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
            return sMatch && sMatch[1] === baseTitle && sMatch[3] === originalDenominator && !idsToDelete.includes(t._id || t.id || '');
          }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          if (siblingsLeft.length === 0) continue;

          const newTotal = siblingsLeft.length;
          const anchorDate = new Date(siblingsLeft[0].date);
          const originalDay = anchorDate.getDate();

          const updates = siblingsLeft.map((s, idx) => {
            const newDate = new Date(anchorDate);
            newDate.setMonth(anchorDate.getMonth() + idx);
            if (newDate.getDate() !== originalDay) newDate.setDate(0);

            // REGRA CEO: Usa os dados do próprio item 's' para manter categoria e valores
            return FinanLitoService.update(s._id || s.id || '', { 
              ...s,
              title: `${baseTitle} (${idx + 1}/${newTotal})`,
              date: newDate.toISOString()
            }, token);
          });
          await Promise.all(updates);
        }
      }

      alert("Mês limpo e parcelamentos remanescentes atualizados.");
      loadData();
    } catch (err) {
      alert('Erro ao limpar o mês.');
    } finally {
      setLoading(false);
    }
  }

  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormAmount(currencyMask(e.target.value));
  };

  const handleAmountFocus = () => {
    if (formAmount.includes('R$')) setFormAmount(formAmount.replace('R$', '').trim());
  }

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    if (isoVal) {
        const d = new Date(isoVal);
        const pad = (n: number) => n.toString().padStart(2, '0');
        setFormDate(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  };

  const monthFiltered = useMemo(() => {
    if (curMonth === null) return [];
    
    return transactions.filter(t => {
      const d = new Date(t.date);
      
      // 1. Filtro de Data (Mês/Ano)
      const matchesDate = d.getMonth() === curMonth && d.getFullYear() === curYear;
      
      // 2. Filtro de Termo de Busca (Input)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = t.title.toLowerCase().includes(searchLower) || 
                           (t.description?.toLowerCase().includes(searchLower));
      
      // 3. Filtro de Categoria (Dropdown) - Buscamos a tag exata na descrição
      const categoryTag = `[${selectedCategory}]`;
      const matchesCategory = selectedCategory === 'Todas' || t.category === selectedCategory;
      
      return matchesDate && matchesSearch && matchesCategory;
    });
  }, [transactions, curMonth, curYear, searchTerm, selectedCategory]); // Adicionamos selectedCategory aqui

  // REGRA CEO: Checa se as setas devem aparecer ao carregar dados ou redimensionar janela
  useEffect(() => {
    const timer = setTimeout(checkScroll, 300); // Delay para esperar o render do DOM
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [monthFiltered, curMonth]);

  const statsMonth = useMemo(() => {
    let inc = 0, exp = 0, paidExp = 0, pendingExp = 0, creditExp = 0;
    
    monthFiltered.forEach(t => {
      if (t.type === 'income') {
        inc += t.amount;
      } else {
        exp += t.amount;
        
        // Soma despesas pagas no cartão (independente de status, pois já é uma dívida assumida)
        if (t.isCreditCard) {
          creditExp += t.amount;
        }
        
        // Se for pago e NÃO for cartão, abate do saldo atual
        if (t.status === 'paid' && !t.isCreditCard) {
          paidExp += t.amount;
        }
        
        // Se NÃO estiver pago (pendente ou atrasado), soma no saldo devedor
        if (t.status !== 'paid') {
          pendingExp += t.amount;
        }
      }
    });

    return { inc, exp, bal: inc - paidExp, pending: pendingExp, creditExp };
  }, [monthFiltered]);

  const scrollStats = (direction: 'left' | 'right') => {
  if (statsScrollRef.current) {
    const scrollAmount = 200;
    statsScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }
};

  const checkScroll = () => {
      if (kanbanScrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = kanbanScrollRef.current;
          setCanScrollLeft(scrollLeft > 20);
          // Margem de 5px para evitar bugs de arredondamento em telas high-dpi
          setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
      }
  };

  const scrollKanban = (direction: 'left' | 'right') => {
      if (kanbanScrollRef.current) {
          const scrollAmount = kanbanScrollRef.current.clientWidth * 0.8;
          kanbanScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      }
  };

  const categoryStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    monthFiltered.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Outros';
      stats[cat] = (stats[cat] || 0) + t.amount;
    });
    return Object.entries(stats)
      .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value);
  }, [monthFiltered]);

  if (!token) return null;

  return (
    // Estilo Dinâmico: Cor de Fundo
    <div style={{ backgroundColor: colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
    /* Removida a restrição de esconder: Agora o texto é SEMPRE visível */
    .btn-label { 
        display: inline; 
        font-weight: 700;
        font-size: 0.9rem;
        white-space: nowrap;
    }
    
    @keyframes fadeIn { from { opacity: 0; transform: scaleY(0); } to { opacity: 1; transform: scaleY(1); } }
    
    .ghost-placeholder {
        animation: fadeIn 0.15s ease-out forwards;
        background-color: rgba(203, 213, 225, 0.4);
        border: 2px dashed #94a3b8;
        border-radius: 8px;
        margin-bottom: 0.8rem;
        height: 100px;
    }

    .action-grid {
        display: grid;
        grid-template-columns: 1fr auto; 
        gap: 0.8rem;
        margin-bottom: 1rem;
        align-items: center;
        width: 100%;
    }

    .button-group {
        display: flex;
        gap: 0.5rem;
    }

    @media (max-width: 768px) {
        .action-grid {
            grid-template-columns: 1fr; 
        }
        
        .button-group {
            display: grid;
            grid-template-columns: 1fr 1fr; 
            width: 100%;
        }

        /* Ajuste de fonte para o texto não 'estourar' o botão no iPhone */
        .btn-label {
            font-size: 0.75rem;
        }
    }
`}</style>

      {/* HEADER DINÂMICO */}
      <header style={{ background: '#fff', padding: '0.8rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: colors.primary, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ ...btnBase, background: '#e2e8f0', color: '#475569', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}> <MdArrowBack /> </button>
          <i className="fas fa-chart-line"></i> {terms.appName}
        </div>
        <div style={{ textAlign: 'right' }}>
          <label style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>Saldo Geral {curYear}</label>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: globalBalance >= 0 ? colors.income : colors.expense }}>{fmtCurrency(globalBalance)}</h2>
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {curMonth === null && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '50px', width: 'fit-content', marginInline: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
              <button onClick={() => setCurYear(curYear - 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}><MdChevronLeft /></button>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, minWidth: '80px', textAlign: 'center', margin: 0 }}>{curYear}</h2>
              <button onClick={() => setCurYear(curYear + 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}><MdChevronRight /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {yearData.map(m => (
                <div key={m.index} onClick={() => openMonth(m.index)}
                  style={{ 
                    background: '#fff', borderRadius: '10px', padding: '1.5rem', cursor: 'pointer', 
                    border: '1px solid #e2e8f0', 
                    // Borda dinâmica baseada nas cores do tema
                    borderTop: `4px solid ${m.count > 0 ? (m.bal >= 0 ? colors.income : colors.expense) : '#cbd5e1'}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{m.name}</span><span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#64748b' }}>{m.count}</span></div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: colors.income, fontWeight: 600 }}>{terms.income}</span>
                      <span>{fmtCurrency(m.inc)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: colors.expense, fontWeight: 600 }}>{terms.expense}</span>
                      <span>{fmtCurrency(m.exp)}</span>
                    </div>
                    {/* NOVOS CAMPOS ABAIXO */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.2rem', borderBottom: '1px solid #f1f5f9' }}>
                      <div className="flex items-center gap-1">
                        <span className={m.overdue > 0 ? "font-bold text-orange-300" : ""}>Atrasados</span>
                        {m.overdue > 0 && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-200"></span>
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 800, color: colors.expense }}>{fmtCurrency(m.overdue)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: colors.expense, fontWeight: 800 }}>Saldo Devedor</span>
                      <span style={{ fontWeight: 800, color: colors.expense }}>{fmtCurrency(m.pending)}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #e2e8f0', fontWeight: 800, fontSize: '1.1rem', textAlign: 'right', color: m.bal >= 0 ? colors.income : colors.expense }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Saldo Mês</span><br />
                    {fmtCurrency(m.bal)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {curMonth !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button onClick={goHome} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MdArrowBack /> Voltar</button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, flex: 1 }}>{months[curMonth]} de {curYear}</h2>
              
              {/* Botão Limpar Mês (Novo) */}
              {!isSelectionMode && monthFiltered.length > 0 && (
                <button 
                  onClick={handleClearMonth} 
                  style={{ ...btnBase, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
                >
                  <MdDelete /> <span className="desktop-only">Limpar Mês</span>
                </button>
              )}

              <button 
                onClick={toggleSelectionMode} 
                style={{ ...btnBase, background: isSelectionMode ? '#64748b' : 'white', color: isSelectionMode ? 'white' : '#64748b', border: '1px solid #cbd5e1' }}
              >
                {isSelectionMode ? <><MdClose /> Cancelar Seleção</> : <><MdChecklist /> Excluir Vários</>}
              </button>

              {isSelectionMode && selectedIds.length > 0 && (
                  <button 
                    onClick={handleDeleteBulk} 
                    style={{ ...btnBase, background: colors.expense, color: 'white' }}
                  >
                    <MdDelete /> Excluir Selecionados ({selectedIds.length})
                  </button>
              )}
            </div>
            
            {/* Gráfico de Distribuição de Despesas */}
            {categoryStats.length > 0 && <PieChart data={categoryStats} />}

            {/* StatCards com Labels Dinâmicos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', position: 'relative' }}>
              <button 
                onClick={() => scrollStats('left')} 
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 2 }}
              >
                <MdChevronLeft size={24} color="#64748b" />
              </button>

              <div 
                ref={statsScrollRef}
                style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '5px 0', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <StatCard label={`${terms.income} (Mês)`} value={statsMonth.inc} color={colors.income} />
                <StatCard label={`${terms.expense} (Mês)`} value={statsMonth.exp} color={colors.expense} />
                <StatCard label="Saldo (Mês)" value={statsMonth.bal} color={statsMonth.bal >= 0 ? colors.income : colors.expense} />
                
                {/* NOVO CARD: GASTO NO CARTÃO */}
                <StatCard 
                  label="Gasto no Cartão" 
                  value={statsMonth.creditExp} 
                  color="#6366f1" // Cor Indigo para diferenciar do saldo comum
                />

                <StatCard label="Saldo Devedor" value={statsMonth.pending} color={colors.expense} />
              </div>

              <button 
                onClick={() => scrollStats('right')} 
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 2 }}
              >
                <MdChevronRight size={24} color="#64748b" />
              </button>
            </div>

             {/* 1. ÁREA DEDICADA PARA O SCANNER (Aparece no topo sem quebrar os botões) */}
              {isTutoScanning && (
                  <GuiaSefaz onClose={() => setTutoScanning(false)} />
              )}
              
              {isScanning && (
                  <ScannerCustom onClose={() => setIsScanning(false)} onScanSuccess={handleScanSuccess} />
              )}

              {/* 2. BARRA DE AÇÕES (BUSCA E BOTÕES) */}
              <div className="action-grid">
                {/* INPUT DE BUSCA */}
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '10px' }}>
                  <MdSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 10 }} size={22} />
                  <input 
                    type="text" 
                    placeholder="Buscar no mês atual..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none', fontSize: '16px', boxSizing: 'border-box' }} 
                  />
                </div>
                
                {/* GRUPO DE BOTÕES - Agora limpo e alinhado */}
                {!isSelectionMode && (
                  <div className="button-group">
                    {/* Botão de Scanner (Apenas o gatilho) */}
                    <button 
                      onClick={() => setTutoScanning(true)} 
                      style={{ 
                        background: '#f8fafc', color: colors.primary, border: '1px solid #cbd5e1', 
                        borderRadius: '10px', fontWeight: 600, cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', 
                        minHeight: '48px', padding: '0 1rem' 
                      }}
                    >
                      <i className="fas fa-qrcode"></i> 
                      <span className="btn-label">Tutorial como escanear nota</span>
                    </button>
                    {/* Botão de Scanner (Apenas o gatilho) */}
                    <button 
                      onClick={() => setIsScanning(true)} 
                      style={{ 
                        background: '#f8fafc', color: colors.primary, border: '1px solid #cbd5e1', 
                        borderRadius: '10px', fontWeight: 600, cursor: 'pointer', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', 
                        minHeight: '48px', padding: '0 1rem' 
                      }}
                    >
                      <i className="fas fa-qrcode"></i> 
                      <span className="btn-label">Escanear QR Code</span>
                    </button>

                    {/* Botão Novo */}
                    <button 
                      onClick={() => handleOpenModal()} 
                      style={{ 
                        background: colors.primary, color: 'white', border: 'none', borderRadius: '10px', 
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', gap: '0.4rem', minHeight: '48px', padding: '0 1.5rem'
                      }}
                    >
                      <MdAdd size={24} /> 
                      <span className="btn-label">Novo</span>
                    </button>
                  </div>
                )}
              </div> {/* FECHAMENTO DO action-grid */}

            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', alignItems: 'center', background: '#fff', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>FILTRAR POR:</span>
              <div style={{ position: 'relative', minWidth: '200px' }} ref={filterDropdownRef}>
                <div 
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    style={{ 
                        padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', 
                        cursor: 'pointer', background: '#f8fafc', color: colors.primary, 
                        fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' 
                    }}
                >
                    <span>{selectedCategory === 'Todas' ? 'Todas as Categorias' : selectedCategory}</span>
                    <MdChevronRight style={{ transform: isFilterDropdownOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                </div>

                {isFilterDropdownOpen && (
                    <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', zIndex: 100, maxHeight: '250px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                        {/* Opção padrão "Todas" */}
                        <div 
                            style={{ padding: '0.7rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b', fontWeight: selectedCategory === 'Todas' ? 800 : 400 }}
                            onClick={() => { setSelectedCategory('Todas'); setIsFilterDropdownOpen(false); }}
                        >
                            Todas as Categorias
                        </div>

                        {userCategories.map(cat => {
                            const isDefault = DEFAULT_CATEGORIES.includes(cat) && cat !== 'Outros';
                            return (
                                <div 
                                    key={cat}
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selectedCategory === cat ? '#f1f5f9' : 'transparent' }}
                                    onClick={() => { setSelectedCategory(cat); setIsFilterDropdownOpen(false); }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#6366f1' }} />
                                        <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>{cat}</span>
                                    </div>
                                    
                                    {!isDefault && cat !== 'Outros' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <MdEdit size={16} color="#64748b" onClick={(e) => { e.stopPropagation(); handleRenameUserCategory(cat); }} />
                                            <MdDelete size={16} color="#ef4444" onClick={(e) => { e.stopPropagation(); handleDeleteUserCategory(cat); }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
          </div>
              
              {selectedCategory !== 'Todas' && (
                <button onClick={() => setSelectedCategory('Todas')} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  Limpar Filtro
                </button>
              )}
            </div>

              <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    
                    {/* SETAS FIXAS (Acompanham a rolagem vertical perfeitamente) */}
                    {canScrollLeft && (
                        <button 
                            onClick={() => scrollKanban('left')} 
                            style={{ ...arrowOverlayStyle, left: '0px' }}
                            aria-label="Rolar para esquerda"
                        >
                            <MdChevronLeft size={32} color={colors.primary} />
                        </button>
                    )}

                    {canScrollRight && (
                        <button 
                            onClick={() => scrollKanban('right')} 
                            style={{ ...arrowOverlayStyle, right: '1px' }}
                            aria-label="Rolar para direita"
                        >
                            <MdChevronRight size={32} color={colors.primary} />
                        </button>
                    )}

                  <div 
                    ref={kanbanScrollRef}
                    onScroll={checkScroll} // Gatilho para esconder/mostrar as setas
                    style={{ 
                        flex: 1, 
                        overflowX: 'auto', 
                        paddingBottom: '0.5rem', 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        padding: '0 10px'
                    }}
                  >
                    <div style={{ 
                        display: 'flex', 
                        gap: '0.8rem', 
                        height: '100%', 
                        minWidth: '100%', 
                        width: 'max-content', 
                        padding: '10px 0',
                        justifyContent: 'flex-start', // REGRA CEO: Centraliza colunas em telas grandes
                        flexWrap: 'nowrap' 
                    }}>
                      <KanbanColumn 
                          title="Pendente" status="pending" 
                          items={monthFiltered.filter(t => t.status === 'pending')} 
                          totalAmount={monthFiltered.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount, 0)}
                          bg="#fef9c3" color="#854d0e" 
                          onClickItem={handleOpenModal} 
                          onCloneItem={handleCloneToNextMonth}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDrop={handleDrop}
                          onDragOverColumn={onDragOverColumn}
                          onDragOverCard={onDragOverCard}
                          dropPlaceholder={dropPlaceholder}
                          draggedItem={draggedItem}
                          colors={colors} terms={terms}
                          isSelectionMode={isSelectionMode}
                          selectedIds={selectedIds}
                          onToggleSelect={handleToggleSelect}
                          style={{ 
                              scrollSnapAlign: 'start', 
                              flex: '1 1 320px', // REGRA CEO: Permite crescer (flex-grow) e define base de 320px
                              maxWidth: '450px', // Evita que as colunas fiquem excessivamente largas em monitores UltraWide
                              minWidth: 'min(320px, 85vw)' 
                          }}
                      />
                      <KanbanColumn 
                          title="Atrasado" status="overdue" 
                          items={monthFiltered.filter(t => t.status === 'overdue')} 
                          totalAmount={monthFiltered.filter(t => t.status === 'overdue').reduce((acc, t) => acc + t.amount, 0)}
                          bg="#fee2e2" color="#991b1b" 
                          onClickItem={handleOpenModal}
                          onCloneItem={handleCloneToNextMonth}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDrop={handleDrop}
                          onDragOverColumn={onDragOverColumn}
                          onDragOverCard={onDragOverCard}
                          dropPlaceholder={dropPlaceholder}
                          draggedItem={draggedItem}
                          colors={colors} terms={terms}
                          isSelectionMode={isSelectionMode}
                          selectedIds={selectedIds}
                          onToggleSelect={handleToggleSelect}
                          style={{ 
                              scrollSnapAlign: 'start', 
                              flex: '1 1 320px', // REGRA CEO: Permite crescer (flex-grow) e define base de 320px
                              maxWidth: '450px', // Evita que as colunas fiquem excessivamente largas em monitores UltraWide
                              minWidth: 'min(320px, 85vw)' 
                          }}
                      />
                      <KanbanColumn 
                          title="Concluído" status="paid" 
                          items={monthFiltered.filter(t => t.status === 'paid')} 
                          totalAmount={monthFiltered.filter(t => t.status === 'paid').reduce((acc, t) => acc + t.amount, 0)}
                          bg="#dcfce7" color="#166534" 
                          onClickItem={handleOpenModal} 
                          onCloneItem={handleCloneToNextMonth}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onDrop={handleDrop}
                          onDragOverColumn={onDragOverColumn}
                          onDragOverCard={onDragOverCard}
                          dropPlaceholder={dropPlaceholder}
                          draggedItem={draggedItem}
                          colors={colors} terms={terms}
                          isSelectionMode={isSelectionMode}
                          selectedIds={selectedIds}
                          onToggleSelect={handleToggleSelect}
                          style={{ 
                              scrollSnapAlign: 'start', 
                              flex: '1 1 320px', // REGRA CEO: Permite crescer (flex-grow) e define base de 320px
                              maxWidth: '450px', // Evita que as colunas fiquem excessivamente largas em monitores UltraWide
                              minWidth: 'min(320px, 85vw)' 
                          }}
                      />
                    </div>
                  </div>
                </div>
              </div>
          </div>
        )}
      </div>

      {/* MODAL ORIGINAL INTEGRALMENTE PRESERVADO */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backdropFilter: 'blur(2px)', overflowY: 'auto', padding: '20px 0' }}>
          <div style={{ 
                background: 'white', 
                width: '95%', 
                maxWidth: '500px', 
                padding: '1.5rem', // Reduzi um pouco o padding para ganhar espaço
                borderRadius: '12px', 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                maxHeight: 'min-content', // Ajusta ao conteúdo
                position: 'relative',
                margin: 'auto' // Garante centralização com o flex-start do pai
              }}>
            <h3 style={{ marginBottom: '1rem' }}>{formId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
            <form onSubmit={handleSave} style={{ 
                  display: 'grid', 
                  gap: '1rem', 
                  maxHeight: '70vh', // Limita a altura do formulário em telas pequenas
                  overflowY: 'auto', // Ativa o scroll interno no formulário
                  paddingRight: '5px', // Espaço para a barra de rolagem não cobrir o input
                  WebkitOverflowScrolling: 'touch' // Suaviza o scroll no iOS
                }}>
              {/* BOTÃO DE IMPORTAÇÃO SAAS DE ELITE */}
              <div style={{ marginBottom: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={processSefazPaste}
                  style={{ 
                    width: '100%', padding: '1rem', background: '#f0f9ff', color: '#0369a1', 
                    border: '2px dashed #0ea5e9', borderRadius: '10px', fontWeight: 800, 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem'
                  }}
                >
                  <i className="fas fa-file-import"></i>
                  CLIQUE AQUI APÓS COPIAR OS DADOS DA SEFAZ
                </button>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', textAlign: 'center' }}>
                  Dica: No site da Fazenda, dê um <b>Ctrl+A</b> e <b>Ctrl+C</b> e clique no botão acima.
                </p>
              </div>
              <div><label style={lblStyle}>Título</label><input required style={inpStyle} value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
              <div>
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <div 
                      onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                      style={{ ...inpStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}
                  >
                      <span>{formCategory === 'Outros' ? (formCustomCategory || 'Outros') : formCategory}</span>
                      <MdChevronRight style={{ transform: isCatDropdownOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                  </div>

                  {isCatDropdownOpen && (
                      <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, background: '#fff', maxHeight: '90vh', border: '1px solid #cbd5e1', borderRadius: '8px', zIndex: 100, flexDirection: 'column', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                          {userCategories.map(cat => {
                              const isDefault = DEFAULT_CATEGORIES.includes(cat) && cat !== 'Outros';
                              return (
                                  <div 
                                      key={cat}
                                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                      onClick={() => {
                                          setFormCategory(cat);
                                          if (cat !== 'Outros') setFormCustomCategory('');
                                          setIsCatDropdownOpen(false);
                                      }}
                                  >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: CATEGORY_COLORS[cat] || '#6366f1' }} />
                                          <span style={{ fontSize: '0.9rem', color: '#1e293b' }}>{cat}</span>
                                      </div>
                                      
                                      {!isDefault && cat !== 'Outros' && (
                                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                                              <MdEdit size={16} color="#64748b" onClick={(e) => { e.stopPropagation(); handleRenameUserCategory(cat); }} />
                                              <MdDelete size={16} color="#ef4444" onClick={(e) => { e.stopPropagation(); handleDeleteUserCategory(cat); }} />
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
                
                {/* Caixa para nome personalizado se 'Outros' for selecionado */}
                {formCategory === 'Outros' && (
                  <input 
                    placeholder="Nome da nova categoria..." 
                    style={{ ...inpStyle, marginTop: '0.5rem', border: `1px solid ${colors.primary}` }}
                    value={formCustomCategory}
                    onChange={e => setFormCustomCategory(e.target.value)}
                    required
                  />
                )}
              </div>
              <div><label style={lblStyle}>Descrição</label><textarea style={inpStyle} rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={lblStyle}>Valor</label><input type="tel" required style={inpStyle} value={formAmount} onChange={handleChangeAmount} onFocus={handleAmountFocus} placeholder="R$ 0,00" /></div>
                <div>
                    <label style={lblStyle}>Tipo</label>
                    <select style={inpStyle} value={formType} onChange={e => setFormType(e.target.value as any)}>
                        <option value="expense">{terms.expense}</option>
                        <option value="income">{terms.income}</option>
                    </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lblStyle}>Data</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                    <input type="text" required style={inpStyle} value={formDate} onChange={e => setFormDate(e.target.value)} placeholder="DD/MM/AAAA HH:MM" />
                    <div style={{ position: 'relative', width: '45px', height: '42px' }}>
                        <button 
                          type="button" 
                          // Removido onClick para não conflitar no iOS
                          style={{ background: '#e2e8f0', border: 'none', width: '100%', height: '100%', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <MdCalendarToday size={20} />
                        </button>
                        <input 
                          ref={nativeDateInputRef}
                          type="datetime-local" 
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '100%', 
                            opacity: 0, 
                            cursor: 'pointer',
                            zIndex: 10 // Garante que o input esteja acima do botão para receber o toque
                          }} 
                          onChange={handleNativeDateChange} 
                        />
                    </div>
                  </div>
                </div>
                <div><label style={lblStyle}>Status</label><select style={inpStyle} value={formStatus} onChange={e => setFormStatus(e.target.value as any)}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="overdue">Atrasado</option></select></div>
              </div>

              {/* --- INSERÇÃO DO CHECKBOX DE CARTÃO DE CRÉDITO AQUI --- */}
              {formType === 'expense' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    id="isCreditCard"
                    checked={formIsCreditCard} 
                    onChange={e => setFormIsCreditCard(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isCreditCard" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>
                    Pago via Cartão de Crédito (Não abate do saldo)
                  </label>
                </div>
              )}

              {/* --- NOVO: SEÇÃO DE PARCELAMENTO --- */}
              {!formId && (
                  <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#f0f9ff', borderRadius: '8px', border: '1px dashed #bae6fd' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input 
                              type="checkbox" 
                              id="isInstallment"
                              checked={isInstallment} 
                              onChange={e => setIsInstallment(e.target.checked)} 
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <label htmlFor="isInstallment" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: '#0369a1' }}>
                              É uma despesa/receita parcelada?
                          </label>
                      </div>

                      {isInstallment && (
                          <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <label style={{ fontSize: '0.85rem', color: '#0369a1' }}>Quantidade de parcelas:</label>
                              <input 
                                  type="number" 
                                  min="2" 
                                  max="360"
                                  value={totalInstallments}
                                  onChange={e => setTotalInstallments(Number(e.target.value))}
                                  style={{ ...inpStyle, width: '80px', padding: '0.4rem' }}
                              />
                              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                  (Serão criados {totalInstallments} lançamentos mensais)
                              </span>
                          </div>
                      )}
                  </div>
              )}

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                {formId && <button type="button" onClick={handleDelete} style={{ ...btnBase, background: '#fee2e2', color: '#991b1b', marginRight: 'auto' }}><MdDelete /> Excluir</button>}
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnBase, background: 'white', border: '1px solid #cbd5e1', color: '#64748b' }}>Cancelar</button>
                <button type="submit" style={{ ...btnBase, background: colors.income, color: 'white' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, color }: any) => (
  <div style={{ background: 'white', padding: '0.8rem 1.2rem', borderRadius: '10px', flex: 1, minWidth: '150px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
    <small style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</small>
    <strong style={{ fontSize: '1.3rem', color }}>{fmtCurrency(value)}</strong>
  </div>
);

    // --- KANBAN COLUMN ATUALIZADA ---

    const KanbanColumn = ({ 
        title, items, totalAmount, onClickItem, 
        onDragStart, onDragEnd, onDrop, onDragOverColumn, onDragOverCard, 
        dropPlaceholder, draggedItem, status,
        colors, terms,
        isSelectionMode, selectedIds, onToggleSelect,
        onCloneItem,
        style // <--- Inclua apenas esta palavra aqui
    }: any) => {

        const isPlaceholderInThisColumn = dropPlaceholder?.status === status;

        return (
            <div 
        onDragOver={(e) => onDragOverColumn(e, status, items.length)}
        onDrop={(e) => onDrop(e, status)} 
        style={{ 
            flex: 1, 
            background: '#e2e8f0', 
            borderRadius: '10px', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '0.8rem', 
            minWidth: '280px', 
            transition: 'background 0.2s',
            ...style // <--- Isso aqui mescla os estilos padrão com os novos que enviamos
        }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <span>{title}</span>
                    {/* BADGE COM SOMA TOTAL DA COLUNA */}
                    <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount || 0)}
                    </span>
                    {/* CONTADOR DE CARDS */}
                <span style={{ opacity: 0.6 }}>{items.length} itens</span>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
                    {items.map((t: ITransactionExtended, index: number) => {
                        const id = t._id || t.id || '';
                        const isBeingDragged = draggedItem && (draggedItem._id === t._id || draggedItem.id === t.id);
                        const showPlaceholderBefore = isPlaceholderInThisColumn && dropPlaceholder.index === index;
                        const isSelected = selectedIds.includes(id);
                        
                        return (
                            <React.Fragment key={id}>
                                {showPlaceholderBefore && <div className="ghost-placeholder"></div>}
                                
                                <div 
                                    draggable={!isSelectionMode} 
                                    onDragStart={(e) => onDragStart(e, t)}
                                    onDragEnd={onDragEnd}
                                    onDragOver={(e) => onDragOverCard(e, index, status)}
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (isSelectionMode) onToggleSelect(id);
                                      else onClickItem(t); 
                                    }} 
                                    style={{ 
                                        background: 'white', padding: '0.8rem', borderRadius: '8px', 
                                        boxShadow: isSelected ? `0 0 0 2px ${colors.primary}` : '0 1px 2px rgba(0,0,0,0.1)', 
                                        cursor: isSelectionMode ? 'pointer' : 'grab', 
                                        borderLeft: `4px solid ${t.type === 'income' ? colors.income : colors.expense}`,
                                        marginBottom: '0.8rem',
                                        opacity: isBeingDragged ? 0.3 : 1,
                                        transform: isBeingDragged ? 'scale(0.95)' : 'scale(1)',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    {/* CHECKBOX QUE APARECE NO MODO SELEÇÃO */}
                                    {isSelectionMode && (
                                      <div style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 5 }}>
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected} 
                                          readOnly 
                                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', pointerEvents: 'none' , gap: '10px'}}>
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', textOverflow: 'ellipsis', flex: 1, minWidth: 0, paddingRight: isSelectionMode ? '25px' : '0' }}>{t.title}</span>
                                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: t.type === 'income' ? colors.income : colors.expense, display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, }}>
                                            {/* Trocado para MdCreditCard para funcionar com sua biblioteca de ícones */}
                                            {t.isCreditCard && <MdCreditCard size={18} title="Cartão de Crédito" style={{ color: '#64748b' }} />}
                                            {t.type === 'expense' ? '-' : '+'} {fmtCurrency(t.amount)}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', pointerEvents: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', pointerEvents: 'none' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontWeight: 600 }}>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                            {/* REGRA CEO: Label de atraso com data de criação */}
                                            {t.status === 'overdue' && (
                                                <span style={{ 
                                                    fontSize: '0.65rem', 
                                                    color: '#ef4444', 
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    background: '#fee2e2',
                                                    padding: '2px 4px',
                                                    borderRadius: '4px',
                                                    width: 'fit-content',
                                                    marginTop: '4px'
                                                }}>
                                                    {/* REGRA CEO: Se movido, usa a data original preservada */}
                                                    Atrasada desde: {new Date(t.dateReplicated || t.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        {/* Botão de clonagem unitária inserido aqui */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {/* REGRA CEO: Esconde o botão se for um card de parcelas */}
                                        {!t.title.match(/\(\d+\/\d+\)$/) && (
                                          <button 
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); onCloneItem(t); }} 
                                              style={{ 
                                                  background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '4px 8px', 
                                                  color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', 
                                                  gap: '4px', fontSize: '0.65rem', pointerEvents: 'auto' 
                                              }}
                                          >
                                              <MdContentCopy size={16} /> Jogar p/ Próx. Mês
                                          </button>
                                        )}

                                        {t.category && t.category !== 'Outros' && (
                                          <div style={{ 
                                              display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, 
                                              color: '#fff', background: getCategoryColor(t.category) || '#94a3b8', whiteSpace: 'nowrap'
                                          }}>
                                              {t.category.toUpperCase()}
                                          </div>
                                        )}
                                    </div>
                                    </div>
                                    <span>{t.type === 'income' ? terms.income.substring(0,3).toUpperCase() : terms.expense.substring(0,4).toUpperCase()}</span>
                                </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                    {isPlaceholderInThisColumn && dropPlaceholder.index === items.length && (
                        <div className="ghost-placeholder"></div>
                    )}
                </div>
            </div>
        );
    };

const inpStyle = { width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '1rem' };
const lblStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' };
const btnBase: any = { padding: '0.7rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' };
const arrowOverlayStyle: any = {
    position: 'absolute', // 🚀 Agora relativo ao container pai, não à tela toda
    top: '50%',          // 🚀 Sempre no meio da altura do Kanban
    transform: 'translateY(-50%)',
    zIndex: 10,          // Suficiente para ficar sobre o Kanban, mas abaixo de modais
    
    // Design Mantido
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease-in-out',
    pointerEvents: 'auto',
};
const PieChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    if (total === 0) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {data.map((d, i) => {
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += d.value / total;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                        const largeArcFlag = d.value / total > 0.5 ? 1 : 0;
                        const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                        return <path key={i} d={pathData} fill={d.color} stroke="#fff" strokeWidth="0.01" />;
                    })}
                </svg>
            </div>
            <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: '0.4rem 0.8rem', 
                  flex: 1,
                  width: '100%' 
              }}>
                {data.map((d, i) => (
                    <div key={i} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.4rem', 
                          fontSize: '0.7rem', 
                          padding: '2px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                      }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}:</span>
                        <span style={{ color: '#64748b', fontSize: '0.65rem' }}>{((d.value / total) * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
