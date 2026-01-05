import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FinanLitoService, ITransaction } from '../services/FinanLitoService';
import { MdAdd, MdArrowBack, MdChevronLeft, MdChevronRight, MdDelete, MdSearch, MdCalendarToday, MdContentCopy } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

// --- UTILITÁRIOS ---

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

const toNativeInputFormat = (isoDate: string) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

interface ITransactionExtended extends ITransaction {
    order?: number; 
}

// --- COMPONENTE PRINCIPAL ---

export default function FinanLitoPage() {
  const [transactions, setTransactions] = useState<ITransactionExtended[]>([]);
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados Drag and Drop Visual (Trello Style)
  const [draggedItem, setDraggedItem] = useState<ITransactionExtended | null>(null);
  const [dropPlaceholder, setDropPlaceholder] = useState<{ status: string, index: number } | null>(null);

  // Estados do Modal / Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState(''); 
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formStatus, setFormStatus] = useState<'pending' | 'paid' | 'overdue'>('pending');
  const [formDate, setFormDate] = useState('');
  
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('token') || "";
  const navigate = useNavigate();

  // --- SEGURANÇA: CHECAGEM DE LOGIN ---
  useEffect(() => {
    // Se não tiver token, ALERTA e TCHAU
    if (!token) {
        alert("Você precisa estar logado para acessar o FBM Finanças.");
        // Redireciona enviando o state 'from', assim seu Login pode mandar o usuário
        // de volta pra cá depois de autenticar (boa UX!)
        navigate('/login', { state: { from: '/finanlito' } });
    }
  }, [token, navigate]);

  useEffect(() => {
    loadData();
  }, [curYear, curMonth, token]);

  async function checkAndMigrateOverdue(list: ITransactionExtended[]) {
    const now = new Date();
    // AQUI ESTÁ A CORREÇÃO:
    // Zeramos a hora para considerar o início do dia de hoje.
    // Assim, qualquer hora de "hoje" será maior ou igual a "hoje 00:00", e não cairá no atrasado.
    now.setHours(0, 0, 0, 0); 

    const updates: Promise<any>[] = [];
    let hasChanges = false;

    const updatedList = list.map(t => {
      if (t.status === 'pending') {
        const tDate = new Date(t.date);
        
        // Se a data da transação for MENOR que o início do dia de hoje
        // significa que é de ontem para trás.
        if (tDate < now) {
          hasChanges = true;
          updates.push(
            FinanLitoService.update(t._id || t.id || '', { status: 'overdue' }, token)
              .catch(err => console.error(`Falha ao auto-atualizar transação ${t.title}`, err))
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
      const data = await FinanLitoService.getAll(undefined, curYear, token);
      
      let dataWithOrder = data.map((t: any, index: number) => ({
          ...t,
          order: t.order !== undefined ? t.order : index
      }));
      dataWithOrder.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const sanitizedData = await checkAndMigrateOverdue(dataWithOrder);
      setTransactions(sanitizedData);
    } catch (error) {
      console.error("Erro ao carregar finanças", error);
    } finally {
      setLoading(false);
    }
  }

  // --- DRAG AND DROP LÓGICA VISUAL ---

  const handleDragStart = (e: React.DragEvent, item: ITransactionExtended) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item._id || item.id || '');
    e.dataTransfer.effectAllowed = "move";
    
    // Imagem fantasma padrão do browser (opcional, podemos deixar o browser gerar)
    // Mas setamos o estado para renderizar o placeholder
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropPlaceholder(null);
  };

  // Evento disparado quando arrastamos SOBRE um card ou coluna
  const onDragOverCard = (e: React.DragEvent, targetIndex: number, status: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedItem) return;

      // Cálculo mágico: Pega a altura do card alvo
      const targetRect = e.currentTarget.getBoundingClientRect();
      const clientY = e.clientY;
      const targetMiddleY = targetRect.top + targetRect.height / 2;

      // Se mouse estiver ACIMA da metade, insere ANTES (index atual)
      // Se mouse estiver ABAIXO da metade, insere DEPOIS (index + 1)
      let newIndex = targetIndex;
      if (clientY > targetMiddleY) {
          newIndex = targetIndex + 1;
      }

      // Só atualiza o estado se mudou (para evitar re-renders excessivos)
      if (!dropPlaceholder || dropPlaceholder.index !== newIndex || dropPlaceholder.status !== status) {
          setDropPlaceholder({ status, index: newIndex });
      }
  };

  const onDragOverColumn = (e: React.DragEvent, status: string, listLength: number) => {
      e.preventDefault();
      // Se arrastou para a área vazia da coluna, joga pro final
      if (!dropPlaceholder || dropPlaceholder.status !== status) {
         setDropPlaceholder({ status, index: listLength });
      }
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!draggedId || !dropPlaceholder) {
          handleDragEnd();
          return;
      }

      // Usa o índice visual calculado pelo placeholder
      const finalIndex = dropPlaceholder.index;
      await updateTransactionPosition(draggedId, status, finalIndex);
      
      handleDragEnd();
  };

  const updateTransactionPosition = async (draggedId: string, newStatus: string, visualIndex: number) => {
    const allItems = [...transactions];
    const draggedItemIndex = allItems.findIndex(t => (t._id === draggedId || t.id === draggedId));
    if (draggedItemIndex === -1) return;

    const item = { ...allItems[draggedItemIndex] };
    
    // 1. Remove da lista original
    allItems.splice(draggedItemIndex, 1);
    
    // 2. Atualiza status
    item.status = newStatus as any;

    // 3. Traduzir o "Visual Index" (dentro da coluna filtrada) para o "Real Index" (no array global)
    // Precisamos achar onde inserir no array global 'allItems'
    // Filtramos os itens visíveis daquela coluna para achar o vizinho
    const columnItems = allItems.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === curMonth && d.getFullYear() === curYear && t.status === newStatus;
    });

    let globalInsertIndex = allItems.length; // Default: final

    if (columnItems.length > 0) {
        if (visualIndex >= columnItems.length) {
            // Inserir após o último item da coluna
            const lastItem = columnItems[columnItems.length - 1];
            globalInsertIndex = allItems.indexOf(lastItem) + 1;
        } else {
            // Inserir antes do item que está na posição visualIndex
            const targetItem = columnItems[visualIndex];
            globalInsertIndex = allItems.indexOf(targetItem);
        }
    }

    // Ajuste de segurança
    if (globalInsertIndex < 0) globalInsertIndex = 0;
    if (globalInsertIndex > allItems.length) globalInsertIndex = allItems.length;

    // 4. Insere
    allItems.splice(globalInsertIndex, 0, item);

    // 5. Reindexar
    const reorderedItems = allItems.map((t, idx) => ({ ...t, order: idx }));

    setTransactions(reorderedItems);

    // 6. Persistir
    try {
        const orderPayload = reorderedItems.map(t => ({ id: t._id || t.id || '', order: t.order || 0 }));
        FinanLitoService.updateOrder(orderPayload, token).catch(e => console.warn(e));
        if (item.status !== transactions[draggedItemIndex].status) {
            await FinanLitoService.update(draggedId, { status: item.status }, token);
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
        return d.getMonth() === idx && d.getFullYear() === curYear;
      });
      const inc = items.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount), 0);
      const exp = items.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
      return { name: m, index: idx, count: items.length, inc, exp, bal: inc - exp };
    });
  }, [transactions, curYear]);

  const globalBalance = useMemo(() => {
    return transactions
      .filter(t => new Date(t.date).getFullYear() === curYear)
      .reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0);
  }, [transactions, curYear]);

  function openMonth(idx: number) { setCurMonth(idx); }
  function goHome() { setCurMonth(null); }

  const currencyMask = (value: string) => {
    if (!value) return "";
    const onlyDigits = value.replace(/\D/g, "");
    const numberValue = Number(onlyDigits) / 100;
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  function handleOpenModal(t?: ITransaction) {
    if (t) {
      setFormId(t._id || t.id || '');
      setFormTitle(t.title);
      setFormDesc(t.description || '');
      setFormAmount(t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      setFormType(t.type);
      setFormStatus(t.status);
      setFormDate(parseISOToDateBR(t.date));
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
    }
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    
    // --- INÍCIO DA VERIFICAÇÃO DE DUPLICIDADE ---
    // Só verificamos se for uma NOVA criação (!formId)
    if (!formId) {
        // 1. Descobrir o mês/ano da data que o usuário digitou no form
        // A função parseDateBRToISO já existe no seu código, vamos usá-la
        const isoDateTemp = parseDateBRToISO(formDate);
        const dateObj = new Date(isoDateTemp);
        const targetMonth = dateObj.getMonth();
        const targetYear = dateObj.getFullYear();

        // 2. Normalizar o título que está sendo digitado (sem espaços, minúsculo)
        const cleanNewTitle = formTitle.trim().toLowerCase();

        // 3. Procurar nos cards JÁ EXISTENTES (apenas do mesmo mês/ano)
        const possibleDuplicate = transactions.find(t => {
            const tDate = new Date(t.date);
            // Verifica se é do mesmo mês/ano
            if (tDate.getMonth() !== targetMonth || tDate.getFullYear() !== targetYear) return false;

            const cleanExistingTitle = t.title.trim().toLowerCase();
            
            // Verifica semelhança: "Mercado" parece com "Supermercado"? Sim.
            // Verifica se um está contido no outro
            return cleanExistingTitle.includes(cleanNewTitle) || cleanNewTitle.includes(cleanExistingTitle);
        });

        // 4. Se achou, pergunta pro chefe (o usuário)
        if (possibleDuplicate) {
            const confirmDup = window.confirm(
                `Atenção: Já existe um card semelhante neste mês: \n\n"${possibleDuplicate.title}" (R$ ${fmtCurrency(possibleDuplicate.amount)})\n\nDeseja incluir este novo mesmo assim?`
            );
            // Se o usuário clicar em CANCELAR, paramos a função aqui.
            if (!confirmDup) return; 
        }
    }
    // --- FIM DA VERIFICAÇÃO ---

    const val = parseCurrencyToFloat(formAmount);
    const isoDate = parseDateBRToISO(formDate);
    
    const payload = {
      title: formTitle, description: formDesc, amount: val, type: formType, status: formStatus, date: isoDate
    };

    try {
      if (formId) await FinanLitoService.update(formId, payload, token);
      else await FinanLitoService.create(payload, token);
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert('Erro ao salvar'); }
  }

  async function handleDelete() {
    if (!formId || !confirm('Excluir transação?')) return;
    try {
      await FinanLitoService.delete(formId, token);
      setIsModalOpen(false);
      loadData();
    } catch (err) { alert('Erro ao excluir'); }
  }

  async function handleReplicate() {
    if (curMonth === null) return;
    if (!confirm(`Deseja copiar todos os lançamentos de ${months[curMonth]} para o próximo mês?`)) return;
    setLoading(true);
    try {
        const res = await FinanLitoService.replicate(curMonth, curYear, token);
        alert(res.message);
        loadData();
    } catch (error) { alert('Erro ao replicar transações.'); } finally { setLoading(false); }
  }

  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormAmount(currencyMask(e.target.value));
  };

  const handleAmountFocus = () => {
    if (formAmount.includes('R$')) setFormAmount(formAmount.replace('R$', '').trim());
  }

  const openCalendar = () => {
    if (hiddenDateInputRef.current) hiddenDateInputRef.current.showPicker ? hiddenDateInputRef.current.showPicker() : hiddenDateInputRef.current.focus();
  };

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
      return d.getMonth() === curMonth && d.getFullYear() === curYear &&
        (t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description?.toLowerCase().includes(searchTerm.toLowerCase())));
    });
  }, [transactions, curMonth, curYear, searchTerm]);

  const statsMonth = useMemo(() => {
    let inc = 0, exp = 0;
    monthFiltered.forEach(t => t.type === 'income' ? inc += t.amount : exp += t.amount);
    return { inc, exp, bal: inc - exp };
  }, [monthFiltered]);

  if (!token) return null;
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        .desktop-only { display: none; }
        @media (min-width: 768px) { .desktop-only { display: inline; } }
        /* Animação do placeholder */
        @keyframes fadeIn { from { opacity: 0; transform: scaleY(0); } to { opacity: 1; transform: scaleY(1); } }
        .ghost-placeholder {
            animation: fadeIn 0.15s ease-out forwards;
            background-color: rgba(203, 213, 225, 0.4);
            border: 2px dashed #94a3b8;
            border-radius: 8px;
            margin-bottom: 0.8rem;
            height: 100px; /* Altura média de um card */
        }
      `}</style>

      {/* HEADER */}
      <header style={{ background: '#fff', padding: '0.8rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ ...btnBase, background: '#e2e8f0', color: '#475569', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}> <MdArrowBack /> Voltar</button>
          <i className="fas fa-chart-line"></i> FBM Finanças
        </div>
        <div style={{ textAlign: 'right' }}>
          <label style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>Saldo Geral {curYear}</label>
          <h2 style={{ fontSize: '1.2rem', margin: 0, color: globalBalance >= 0 ? '#0f172a' : '#dc2626' }}>{fmtCurrency(globalBalance)}</h2>
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
        {curMonth === null && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
             {/* ... CÓDIGO DO ANO (MANTIDO IGUAL) ... */}
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
                    border: '1px solid #e2e8f0', borderTop: `4px solid ${m.count > 0 ? (m.bal >= 0 ? '#16a34a' : '#dc2626') : '#cbd5e1'}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{m.name}</span><span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#64748b' }}>{m.count}</span></div>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#16a34a', fontWeight: 600 }}>Receitas</span><span>{fmtCurrency(m.inc)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#dc2626', fontWeight: 600 }}>Despesas</span><span>{fmtCurrency(m.exp)}</span></div>
                  </div>
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #e2e8f0', fontWeight: 800, fontSize: '1.1rem', textAlign: 'right', color: m.bal >= 0 ? '#0f172a' : '#dc2626' }}>{fmtCurrency(m.bal)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {curMonth !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <button onClick={goHome} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MdArrowBack /> Voltar</button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{months[curMonth]} de {curYear}</h2>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '5px' }}>
              <StatCard label="Receitas (Mês)" value={statsMonth.inc} color="#16a34a" />
              <StatCard label="Despesas (Mês)" value={statsMonth.exp} color="#dc2626" />
              <StatCard label="Saldo (Mês)" value={statsMonth.bal} color={statsMonth.bal >= 0 ? '#16a34a' : '#dc2626'} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <MdSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type="text" placeholder="Buscar no mês atual..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none' }} />
              </div>
              <button onClick={handleReplicate} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MdContentCopy /> <span className="desktop-only">Replicar</span></button>
              <button onClick={() => handleOpenModal()} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MdAdd /> Novo</button>
            </div>

            <div style={{ flex: 1, overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', height: '100%', minWidth: '900px' }}>
                <KanbanColumn 
                    title="Pendente" status="pending" 
                    items={monthFiltered.filter(t => t.status === 'pending')} 
                    bg="#fef9c3" color="#854d0e" 
                    onClickItem={handleOpenModal} 
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onDragOverColumn={onDragOverColumn}
                    onDragOverCard={onDragOverCard}
                    dropPlaceholder={dropPlaceholder}
                    draggedItem={draggedItem}
                />
                <KanbanColumn 
                    title="Atrasado" status="overdue" 
                    items={monthFiltered.filter(t => t.status === 'overdue')} 
                    bg="#fee2e2" color="#991b1b" 
                    onClickItem={handleOpenModal}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onDragOverColumn={onDragOverColumn}
                    onDragOverCard={onDragOverCard}
                    dropPlaceholder={dropPlaceholder}
                    draggedItem={draggedItem}
                />
                <KanbanColumn 
                    title="Concluído" status="paid" 
                    items={monthFiltered.filter(t => t.status === 'paid')} 
                    bg="#dcfce7" color="#166534" 
                    onClickItem={handleOpenModal} 
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onDragOverColumn={onDragOverColumn}
                    onDragOverCard={onDragOverCard}
                    dropPlaceholder={dropPlaceholder}
                    draggedItem={draggedItem}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL (Mantido igual) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', width: '95%', maxWidth: '500px', padding: '2rem', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ marginBottom: '1rem' }}>{formId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
              <div><label style={lblStyle}>Título</label><input required style={inpStyle} value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
              <div><label style={lblStyle}>Descrição</label><textarea style={inpStyle} rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={lblStyle}>Valor</label><input type="tel" required style={inpStyle} value={formAmount} onChange={handleChangeAmount} onFocus={handleAmountFocus} placeholder="R$ 0,00" /></div>
                <div><label style={lblStyle}>Tipo</label><select style={inpStyle} value={formType} onChange={e => setFormType(e.target.value as any)}><option value="expense">Despesa</option><option value="income">Receita</option></select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lblStyle}>Data</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                    
                    {/* Input de Texto (Visual apenas) */}
                    <input 
                        type="text" 
                        required 
                        style={inpStyle} 
                        value={formDate} 
                        onChange={e => setFormDate(e.target.value)} 
                        placeholder="DD/MM/AAAA HH:MM" 
                    />

                    {/* Botão com o Ícone (Visual) + Input Nativo (Funcional Invisível) */}
                    <div style={{ position: 'relative', width: '45px', height: '42px' }}>
                        {/* O Ícone fica embaixo */}
                        <button 
                            type="button" 
                            style={{ 
                                background: '#e2e8f0', border: 'none', 
                                width: '100%', height: '100%',
                                borderRadius: '6px', color: '#475569',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <MdCalendarToday size={20} />
                        </button>

                        {/* O Input Nativo fica por cima, invisível, mas clicável */}
                        <input 
                            type="datetime-local" 
                            style={{ 
                                position: 'absolute', 
                                top: 0, left: 0, 
                                width: '100%', height: '100%', 
                                opacity: 0, 
                                cursor: 'pointer',
                                zIndex: 10 // Garante que fica na frente do botão
                            }} 
                            onChange={handleNativeDateChange} 
                        />
                    </div>

                  </div>
                </div>
                <div><label style={lblStyle}>Status</label><select style={inpStyle} value={formStatus} onChange={e => setFormStatus(e.target.value as any)}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="overdue">Atrasado</option></select></div>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                {formId && <button type="button" onClick={handleDelete} style={{ ...btnBase, background: '#fee2e2', color: '#991b1b', marginRight: 'auto' }}><MdDelete /> Excluir</button>}
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnBase, background: 'white', border: '1px solid #cbd5e1', color: '#64748b' }}>Cancelar</button>
                <button type="submit" style={{ ...btnBase, background: '#16a34a', color: 'white' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ label, value, color }: any) => (
  <div style={{ background: 'white', padding: '0.8rem 1.2rem', borderRadius: '10px', flex: 1, minWidth: '180px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
    <small style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</small>
    <strong style={{ fontSize: '1.3rem', color }}>{fmtCurrency(value)}</strong>
  </div>
);

// --- KANBAN COLUMN ATUALIZADA COM "GHOST PLACEHOLDER" ---

const KanbanColumn = ({ 
    title, items, onClickItem, 
    onDragStart, onDragEnd, onDrop, onDragOverColumn, onDragOverCard, 
    dropPlaceholder, draggedItem, status 
}: any) => {

    const isPlaceholderInThisColumn = dropPlaceholder?.status === status;

    return (
        <div 
            onDragOver={(e) => onDragOverColumn(e, status, items.length)}
            onDrop={(e) => onDrop(e, status)} 
            style={{ flex: 1, background: '#e2e8f0', borderRadius: '10px', display: 'flex', flexDirection: 'column', padding: '0.8rem', minWidth: '280px', transition: 'background 0.2s' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <span>{title}</span><span>{items.length}</span>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
                {items.map((t: ITransactionExtended, index: number) => {
                    const isBeingDragged = draggedItem && (draggedItem._id === t._id || draggedItem.id === t.id);
                    
                    // Lógica para renderizar o Placeholder no lugar certo
                    const showPlaceholderBefore = isPlaceholderInThisColumn && dropPlaceholder.index === index;
                    
                    return (
                        <React.Fragment key={t._id || t.id}>
                            {showPlaceholderBefore && <div className="ghost-placeholder"></div>}
                            
                            <div 
                                draggable={true} 
                                onDragStart={(e) => onDragStart(e, t)}
                                onDragEnd={onDragEnd}
                                onDragOver={(e) => onDragOverCard(e, index, status)}
                                onClick={(e) => { e.stopPropagation(); onClickItem(t); }} 
                                style={{ 
                                    background: 'white', padding: '0.8rem', borderRadius: '8px', 
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)', cursor: 'grab', 
                                    borderLeft: `4px solid ${t.type === 'income' ? '#16a34a' : '#dc2626'}`,
                                    marginBottom: '0.8rem',
                                    opacity: isBeingDragged ? 0.3 : 1, // Se for o item arrastado, fica transparente
                                    transform: isBeingDragged ? 'scale(0.95)' : 'scale(1)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', pointerEvents: 'none' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{t.title}</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: t.type === 'income' ? '#16a34a' : '#dc2626' }}>{t.type === 'expense' ? '-' : '+'} {fmtCurrency(t.amount)}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', pointerEvents: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', pointerEvents: 'none' }}>
                                    <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                    <span>{t.type === 'income' ? 'REC' : 'DESP'}</span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                {/* Caso especial: Placeholder no final da lista */}
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