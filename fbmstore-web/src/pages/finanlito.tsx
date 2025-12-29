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

// Estendendo interface para garantir order no componente local
interface ITransactionExtended extends ITransaction {
    order?: number; 
}

// --- COMPONENTE PRINCIPAL ---

export default function FinanLitoPage() {
  const [transactions, setTransactions] = useState<ITransactionExtended[]>([]);
  const [curYear, setCurYear] = useState(new Date().getFullYear());
  const [curMonth, setCurMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadData();
  }, [curYear, curMonth]);

  // --- FUNÇÃO DE AUTO-CORREÇÃO DE ATRASADOS ---
  async function checkAndMigrateOverdue(list: ITransactionExtended[]) {
    const now = new Date();
    const updates: Promise<any>[] = [];
    let hasChanges = false;

    const updatedList = list.map(t => {
      // Regra: Se está pendente E a data é anterior a agora
      if (t.status === 'pending') {
        const tDate = new Date(t.date);
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

    if (updates.length > 0) {
      // Executa updates em background
      Promise.all(updates); 
    }

    return updatedList;
  }

  async function loadData() {
    setLoading(true);
    try {
      const data = await FinanLitoService.getAll(undefined, curYear, token);
      
      // Garante que todos tenham order e ordena por ela
      let dataWithOrder = data.map((t: any, index: number) => ({
          ...t,
          order: t.order !== undefined ? t.order : index
      }));

      // Ordenação inicial baseada no order
      dataWithOrder.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      // Verifica e migra atrasados
      const sanitizedData = await checkAndMigrateOverdue(dataWithOrder);
      setTransactions(sanitizedData);
    } catch (error) {
      console.error("Erro ao carregar finanças", error);
    } finally {
      setLoading(false);
    }
  }

  // --- DRAG AND DROP LÓGICA ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = "move";
  };

  /**
   * Drop na COLUNA (Fundo cinza).
   * Correção: Se soltar no fundo, move para o FINAL daquela coluna.
   */
  const handleDropColumn = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    // Se o evento chegou aqui, não foi tratado pelo Card (stopPropagation), então é final da lista
    updateTransactionPosition(draggedId, newStatus, null); 
  };

  /**
   * Drop no CARD.
   * Insere na posição exata daquele card.
   */
  const handleDropCard = (e: React.DragEvent, targetId: string, status: string) => {
      e.preventDefault();
      e.stopPropagation(); // IMPORTANTE: Impede o evento de subir para a Coluna
      const draggedId = e.dataTransfer.getData('text/plain');
      
      if (draggedId === targetId) return;
      updateTransactionPosition(draggedId, status, targetId);
  }

  const updateTransactionPosition = async (draggedId: string, newStatus: string, targetId: string | null) => {
    const allItems = [...transactions];
    const draggedItemIndex = allItems.findIndex(t => (t._id === draggedId || t.id === draggedId));
    if (draggedItemIndex === -1) return;

    const draggedItem = { ...allItems[draggedItemIndex] };
    
    // 1. Remove item da posição atual
    allItems.splice(draggedItemIndex, 1);
    
    // 2. Atualiza status local
    draggedItem.status = newStatus as any;

    let insertIndex = -1;

    if (targetId) {
        // Encontra o índice do alvo no array global
        const targetIndex = allItems.findIndex(t => (t._id === targetId || t.id === targetId));
        if (targetIndex !== -1) {
             insertIndex = targetIndex; 
        }
    } else {
        // CORREÇÃO MOVER PARA FINAL:
        // Se targetId é null, queremos inserir após o último item VISÍVEL desta coluna (mês atual + status atual)
        // Para simplificar e funcionar genericamente: jogamos para o final do array.
        // Como o sort visual respeita a ordem do array, isso funciona como "final da lista".
        insertIndex = allItems.length; 
    }

    // 3. Insere na nova posição
    if (insertIndex !== -1 && insertIndex <= allItems.length) {
        allItems.splice(insertIndex, 0, draggedItem);
    } else {
        allItems.push(draggedItem);
    }

    // 4. Reindexar ordem (0, 1, 2...)
    const reorderedItems = allItems.map((item, index) => ({
        ...item,
        order: index
    }));

    // Atualiza UI instantaneamente
    setTransactions(reorderedItems);

    // 5. PERSISTÊNCIA NO BACKEND
    try {
        // Prepara payload leve apenas com id e order
        const orderPayload = reorderedItems.map(t => ({ id: t._id || t.id || '', order: t.order || 0 }));
        
        // Dispara o update de ordem (Endpoint novo)
        FinanLitoService.updateOrder(orderPayload, token).catch(e => console.warn("Erro ao salvar ordem no servidor", e));

        // Se mudou de status, salva o status individualmente também para garantir
        if (draggedItem.status !== transactions[draggedItemIndex].status) {
            await FinanLitoService.update(draggedId, { status: draggedItem.status }, token);
        }
    } catch (error) {
        console.error("Erro ao sincronizar movimento", error);
    }
  };

  // --- CÁLCULOS E MEMOS ---

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
    const val = parseCurrencyToFloat(formAmount);
    const isoDate = parseDateBRToISO(formDate);

    const payload = {
      title: formTitle,
      description: formDesc,
      amount: val,
      type: formType,
      status: formStatus,
      date: isoDate
    };

    try {
      if (formId) {
        await FinanLitoService.update(formId, payload, token);
      } else {
        await FinanLitoService.create(payload, token);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Erro ao salvar');
    }
  }

  async function handleDelete() {
    if (!formId || !confirm('Excluir transação?')) return;
    try {
      await FinanLitoService.delete(formId, token);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Erro ao excluir');
    }
  }

  async function handleReplicate() {
    if (curMonth === null) return;
    if (!confirm(`Deseja copiar todos os lançamentos de ${months[curMonth]} para o próximo mês?`)) return;
    setLoading(true);
    try {
        const res = await FinanLitoService.replicate(curMonth, curYear, token);
        alert(res.message);
        loadData();
    } catch (error) {
        alert('Erro ao replicar transações.');
    } finally {
        setLoading(false);
    }
  }

  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = currencyMask(e.target.value);
    setFormAmount(masked);
  };

  const handleAmountFocus = () => {
    if (formAmount.includes('R$')) {
        const raw = formAmount.replace('R$', '').trim();
        setFormAmount(raw);
    }
  }

  const openCalendar = () => {
    if (hiddenDateInputRef.current) {
        if (typeof hiddenDateInputRef.current.showPicker === 'function') {
            hiddenDateInputRef.current.showPicker();
        } else {
            hiddenDateInputRef.current.focus(); 
            hiddenDateInputRef.current.click();
        }
    }
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    if (isoVal) {
        const d = new Date(isoVal);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const brStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setFormDate(brStr);
    }
  };

  const monthFiltered = useMemo(() => {
    if (curMonth === null) return [];
    
    // Apenas filtra, mantendo a ordem do array (transactions)
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

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        .desktop-only { display: none; }
        @media (min-width: 768px) {
          .desktop-only { display: inline; }
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
        
        {/* VIEW HOME (ANUAL) */}
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
                    border: '1px solid #e2e8f0', borderTop: `4px solid ${m.count > 0 ? (m.bal >= 0 ? '#16a34a' : '#dc2626') : '#cbd5e1'}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{m.name}</span>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#64748b' }}>{m.count}</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#16a34a', fontWeight: 600 }}>Receitas</span><span>{fmtCurrency(m.inc)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#dc2626', fontWeight: 600 }}>Despesas</span><span>{fmtCurrency(m.exp)}</span></div>
                  </div>
                  <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #e2e8f0', fontWeight: 800, fontSize: '1.1rem', textAlign: 'right', color: m.bal >= 0 ? '#0f172a' : '#dc2626' }}>
                    {fmtCurrency(m.bal)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW MENSAL */}
        {curMonth !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <button onClick={goHome} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdArrowBack /> Voltar
              </button>
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
                <input 
                  type="text" 
                  placeholder="Buscar no mês atual..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none' }}
                />
              </div>

              <button onClick={handleReplicate} title="Copiar lançamentos para o próximo mês" style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdContentCopy /> <span className="desktop-only">Replicar</span>
              </button>

              <button onClick={() => handleOpenModal()} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '0 1.5rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdAdd /> Novo
              </button>
            </div>

            <div style={{ flex: 1, overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', height: '100%', minWidth: '900px' }}>
                <KanbanColumn 
                    title="Pendente" status="pending" 
                    items={monthFiltered.filter(t => t.status === 'pending')} 
                    bg="#fef9c3" color="#854d0e" 
                    onClickItem={handleOpenModal} 
                    onDropColumn={handleDropColumn}
                    onDropCard={handleDropCard}
                    onDragStart={handleDragStart} 
                />
                <KanbanColumn 
                    title="Atrasado" status="overdue" 
                    items={monthFiltered.filter(t => t.status === 'overdue')} 
                    bg="#fee2e2" color="#991b1b" 
                    onClickItem={handleOpenModal} 
                    onDropColumn={handleDropColumn}
                    onDropCard={handleDropCard} 
                    onDragStart={handleDragStart} 
                />
                <KanbanColumn 
                    title="Concluído" status="paid" 
                    items={monthFiltered.filter(t => t.status === 'paid')} 
                    bg="#dcfce7" color="#166534" 
                    onClickItem={handleOpenModal} 
                    onDropColumn={handleDropColumn}
                    onDropCard={handleDropCard} 
                    onDragStart={handleDragStart} 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', width: '95%', maxWidth: '500px', padding: '2rem', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ marginBottom: '1rem' }}>{formId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
            <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
              <div><label style={lblStyle}>Título</label><input required style={inpStyle} value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
              <div><label style={lblStyle}>Descrição</label><textarea style={inpStyle} rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lblStyle}>Valor</label>
                  <input 
                    type="tel" 
                    required 
                    style={inpStyle} 
                    value={formAmount} 
                    onChange={handleChangeAmount} 
                    onFocus={handleAmountFocus}
                    placeholder="R$ 0,00" 
                  />
                </div>
                <div><label style={lblStyle}>Tipo</label>
                  <select style={inpStyle} value={formType} onChange={e => setFormType(e.target.value as any)}>
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={lblStyle}>Data</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            required 
                            style={inpStyle} 
                            value={formDate} 
                            onChange={e => setFormDate(e.target.value)} 
                            placeholder="DD/MM/AAAA HH:MM"
                        />
                        <button type="button" onClick={openCalendar} style={{ background: '#e2e8f0', border: 'none', padding: '0.7rem', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}>
                            <MdCalendarToday size={20} />
                        </button>
                        <input 
                            type="datetime-local" 
                            ref={hiddenDateInputRef}
                            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px' }}
                            defaultValue={parseDateBRToISO(formDate) ? toNativeInputFormat(parseDateBRToISO(formDate)) : ''}
                            onChange={handleNativeDateChange}
                        />
                    </div>
                </div>
                <div><label style={lblStyle}>Status</label>
                  <select style={inpStyle} value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Atrasado</option>
                  </select>
                </div>
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

const KanbanColumn = ({ title, items, bg, color, onClickItem, onDropColumn, onDropCard, onDragStart, status }: any) => (
  <div 
    onDragOver={(e) => {
        e.preventDefault();
        // Permite o drop no container
    }}
    onDrop={(e) => onDropColumn(e, status)} 
    style={{ flex: 1, background: '#e2e8f0', borderRadius: '10px', display: 'flex', flexDirection: 'column', padding: '0.8rem', minWidth: '280px' }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontWeight: 700, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase' }}>
      <span>{title}</span><span>{items.length}</span>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', minHeight: '100px' }}>
      {items.map((t: ITransactionExtended) => (
        <div 
          key={t._id || t.id} 
          draggable={true} 
          onDragStart={(e) => onDragStart(e, t._id || t.id)}
          onDrop={(e) => onDropCard(e, t._id || t.id, status)}
          onDragOver={(e) => e.preventDefault()} 
          onClick={(e) => {
             e.stopPropagation();
             onClickItem(t);
          }} 
          style={{ 
            background: 'white', padding: '0.8rem', borderRadius: '8px', 
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)', cursor: 'grab', 
            borderLeft: `4px solid ${t.type === 'income' ? '#16a34a' : '#dc2626'}`,
            transition: 'transform 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
      ))}
    </div>
  </div>
);

const inpStyle = { width: '100%', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontSize: '1rem' };
const lblStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' };
const btnBase: any = { padding: '0.7rem 1.2rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' };