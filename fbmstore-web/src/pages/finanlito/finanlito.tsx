import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdChevronLeft, MdChevronRight, MdDelete, MdChecklist, MdClose, MdContentCopy, MdCalculate } from 'react-icons/md';

// Contextos e Hooks
import { useTenant } from '../../contexts/TenantContext';
import { useFinanLitoTransactions } from '../../hooks/useFinanLitoTransactions';

// Componentes UI
import { GuiaSefaz } from '@/components/ui/GuiaSefaz';
import { ScannerCustom } from '@/components/ui/ScannerCustom';
import { KanbanColumn } from '@/components/ui/finanlito/Kanban';
import { PieChart } from '@/components/ui/finanlito/PieChart';
import { StatCard } from '@/components/ui/finanlito/StatCard';
import { TransactionModal } from '@/components/ui/finanlito/TransactionModal';
import { YearDashboard } from '@/components/ui/finanlito/YearDashboard';
import { FinanLitoToolbar } from '@/components/ui/finanlito/FinanLitoToolbar';

// Utils e Serviços
import { ITransaction, ITransactionExtended } from '@/types';
import { CATEGORY_COLORS, MONTHS } from '@/utils/constantes';
import { fmtCurrency } from '@/utils/currency';
import { btnBase } from '@/utils/finanlito/finanlitoConstsCss';
import { FinanLitoService } from '@/services/FinanLitoService';

// {/* COMPONENTE PRINCIPAL - FBMSTORE ARCHITECTURE */}
export default function FinanLitoPage() {
  const { colors, terms } = useTenant();
  const token = localStorage.getItem('token') || "";
  const navigate = useNavigate();

  // 1. INJEÇÃO DE DEPENDÊNCIAS (REGRAS DE NEGÓCIO)
  const {
    transactions, loadData,
    curYear, setCurYear, debouncedYear,
    curMonth, setCurMonth,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    userCategories, monthFiltered, currentMonthTransactions,
    yearData, statsMonth,
    isSelectionMode, toggleSelectionMode,
    selectedIds, handleToggleSelect, deleteBulk,
    validateBalanceForPayment, updateTransactionPosition,
    handleRenameUserCategory,
    handleDeleteUserCategory, cloneBulkToNextMonth
  } = useFinanLitoTransactions(token, terms);

  // 2. ESTADOS EXCLUSIVOS DE INTERFACE (UI)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isTutoScanning, setTutoScanning] = useState(false);
  
  const [draggedItem, setDraggedItem] = useState<ITransactionExtended | null>(null);
  const [dropPlaceholder, setDropPlaceholder] = useState<{ status: string, index: number } | null>(null);

  // --- NOVA LÓGICA: SOMA FLUTUANTE EM TEMPO REAL ---
  const [showSumBadge, setShowSumBadge] = useState(false);

  // Fecha o modal de soma automaticamente se o usuário cancelar a seleção
  useEffect(() => {
    if (!isSelectionMode || selectedIds.length === 0) {
      setShowSumBadge(false);
    }
  }, [isSelectionMode, selectedIds.length]);

  // Calcula a soma em tempo real: Receitas (+) e Despesas (-)
  const selectedSum = useMemo(() => {
    return transactions
      .filter(t => selectedIds.includes(t._id || t.id || ''))
      .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
  }, [transactions, selectedIds]);
  // --------------------------------------------------

  // 3. REFERÊNCIAS DE DOM E SCROLL
  const statsScrollRef = useRef<HTMLDivElement>(null);
  const kanbanScrollRef = useRef<HTMLDivElement>(null);
  const [, setCanScrollLeft] = useState(false);
  const [, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!token) {
        alert(`Você precisa estar logado para acessar o ${terms.appName}.`);
        navigate('/login', { state: { from: '/finanlito' } });
    }
  }, [token, navigate, terms.appName]);

  // 4. CÁLCULOS PURAMENTE VISUAIS (Não afetam regras de negócio globais)
  const globalBalance = useMemo(() => {
    return transactions
      .filter(t => new Date(t.date).getFullYear() === debouncedYear)
      .reduce((acc, t) => {
        const isInstallment = t.title.match(/\(\d+\/\d+\)$/);
        const isFutureProjection = t.isReplicated || isInstallment;
        if (t.status === 'overdue' || (isFutureProjection && t.status !== 'paid')) return acc;
        if (t.type === 'expense' && t.isCreditCard && t.status === 'paid') return acc;
        return t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
      }, 0);
  }, [transactions, debouncedYear]);

  const categoryStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    // CORREÇÃO: O gráfico agora olha para TODAS as transações do mês, ignorando o filtro da tela
    currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Outros';
      stats[cat] = (stats[cat] || 0) + t.amount;
    });
    return Object.entries(stats)
      .map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label] || '#94a3b8' }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions]); // <-- Dependência atualizada

  // 5. FUNÇÕES DE NAVEGAÇÃO INTERNA E SCROLL
  const openMonth = (idx: number) => setCurMonth(idx);
  const goHome = () => setCurMonth(null);
  const handleOpenModal = (t?: ITransaction) => {
    if (isSelectionMode) return;
    setFormId(t ? (t._id || t.id || '') : null);
    setIsModalOpen(true);
  };

  const scrollStats = (direction: 'left' | 'right') => {
    if (statsScrollRef.current) {
      statsScrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const scrollKanban = (direction: 'left' | 'right') => {
    if (kanbanScrollRef.current) {
      const scrollAmount = kanbanScrollRef.current.clientWidth * 0.8;
      kanbanScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const checkScroll = () => {
    if (kanbanScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = kanbanScrollRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  // 6. FUNÇÕES DE DRAG AND DROP DA UI
  const handleDragStart = (e: React.DragEvent, item: ITransactionExtended) => {
    if (isSelectionMode) return;
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item._id || item.id || '');
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => { setDraggedItem(null); setDropPlaceholder(null); };
  
  const onDragOverCard = (e: React.DragEvent, targetIndex: number, status: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!draggedItem || isSelectionMode) return;
    const targetRect = e.currentTarget.getBoundingClientRect();
    const targetMiddleY = targetRect.top + targetRect.height / 2;
    let newIndex = e.clientY > targetMiddleY ? targetIndex + 1 : targetIndex;
    if (!dropPlaceholder || dropPlaceholder.index !== newIndex || dropPlaceholder.status !== status) {
      setDropPlaceholder({ status, index: newIndex });
    }
  };

  const onDragOverColumn = (e: React.DragEvent, status: string, listLength: number) => {
    e.preventDefault();
    if (isSelectionMode) return;
    if (!dropPlaceholder || dropPlaceholder.status !== status) setDropPlaceholder({ status, index: listLength });
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault(); e.stopPropagation();
    if (isSelectionMode) return;
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId || !dropPlaceholder) { handleDragEnd(); return; }
    
    // Chama o hook de regra de negócio
    await updateTransactionPosition(draggedId, status, dropPlaceholder.index);
    handleDragEnd();
  };

  // 7. FUNÇÕES SECUNDÁRIAS (SCANNER / LIMPAR MÊS / CLONAR)
  const handleScanSuccess = async (decodedUrl: string) => {
    if (!decodedUrl || !decodedUrl.startsWith('http')) return;
    if (!/fazenda|sefaz|nfe/i.test(decodedUrl)) return;
    setIsScanning(false); 
    alert("Nota Fiscal Detectada! \n\n1. O site da Fazenda vai abrir.\n2. Resolva o Captcha.\n3. Copie os dados.\n4. Volte aqui e cole no card.");
    window.open(decodedUrl, "_blank", "noopener,noreferrer");
    handleOpenModal();
  };

  const handleClearMonth = async () => {
    if (curMonth === null) return;
    if (!window.confirm(`Deseja EXCLUIR os lançamentos de ${MONTHS[curMonth]}?`) || !window.confirm("Confirma?")) return;
    
    // Simplificado: Chama deleção em massa dos itens visíveis
    const idsToDelete = monthFiltered.map(t => t._id || t.id || '');
    await Promise.all(idsToDelete.map(id => FinanLitoService.delete(id, token)));
    loadData();
  };

  const handleCloneToNextMonth = async (t: ITransactionExtended) => {
    if (!confirm(`Deseja clonar "${t.title}" para o próximo mês?`)) return;
    const date = new Date(t.date);
    const originalDay = date.getDate();
    date.setMonth(date.getMonth() + 1);
    if (date.getDate() !== originalDay) date.setDate(0);

    const payload = {
      title: t.title, description: t.description, amount: t.amount, type: t.type,
      status: t.status === 'paid' ? 'pending' : t.status as 'pending' | 'paid' | 'overdue',
      date: date.toISOString(), isCreditCard: !!t.isCreditCard, category: t.category || 'Outros'
    };

    try {
      await FinanLitoService.create({ ...payload, isReplicated: true, dateReplicated: t.dateReplicated || t.date }, token);
      if (t.status === 'overdue') await FinanLitoService.delete(t._id || t.id || '', token);
      loadData();
    } catch (err) { alert('Erro ao clonar lançamento.'); }
  };


  if (!token) return null;

  return (
    <div style={{ backgroundColor: colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>
      <style>{`
        .btn-label { display: inline; font-weight: 700; font-size: 0.9rem; white-space: nowrap; }
        @keyframes fadeIn { from { opacity: 0; transform: scaleY(0); } to { opacity: 1; transform: scaleY(1); } }
        .ghost-placeholder { animation: fadeIn 0.15s ease-out forwards; background-color: rgba(203, 213, 225, 0.4); border: 2px dashed #94a3b8; border-radius: 8px; margin-bottom: 0.8rem; height: 100px; }
        .action-grid { display: grid; grid-template-columns: 1fr auto; gap: 0.8rem; margin-bottom: 1rem; align-items: center; width: 100%; }
        .button-group { display: flex; gap: 0.5rem; }
        @media (max-width: 768px) {
            .action-grid { grid-template-columns: 1fr; }
            .button-group { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
            .btn-label { font-size: 0.75rem; }
        }
        /* KANBAN RESPONSIVO FBMSTORE */
        .kanban-wrapper {
            display: flex;
            gap: 1rem;
            height: 100%;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE */
            -webkit-overflow-scrolling: touch;
            padding-bottom: 10px;
            box-sizing: border-box;
        }

        .kanban-wrapper::-webkit-scrollbar {
            display: none; /* Chrome/Safari */
        }

        /* O SEGREDO PARA A ÚLTIMA COLUNA NÃO CORTAR: Um pseudo-elemento invisível */
        .kanban-wrapper::after {
            content: '';
            flex: 0 0 1px;
        }

        .kanban-column-responsive {
            scroll-snap-align: center;
            flex: 0 0 100%; /* Mobile: Força 1 coluna por tela exata */
            max-width: 100%; 
            height: 100%;
            min-width: 0; /* Previne que o conteúdo flex quebre o grid */
            box-sizing: border-box; /* OBRIGATÓRIO: Mantém o padding da coluna dentro dos 100% */
        }

        @media (min-width: 768px) {
            .kanban-column-responsive {
                flex: 1 1 320px; /* Desktop: Cresce/encolhe com limite */
                min-width: 320px;
                max-width: 450px;
                scroll-snap-align: start;
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
          <YearDashboard yearData={yearData} curYear={curYear} setCurYear={setCurYear} onOpenMonth={openMonth} colors={colors} terms={terms} />
        )}

        {curMonth !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* TOPO DO MÊS */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button onClick={goHome} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.5rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MdArrowBack /> Voltar</button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, flex: 1 }}>{MONTHS[curMonth]} de {curYear}</h2>
              
              {!isSelectionMode && monthFiltered.length > 0 && (
                <button onClick={handleClearMonth} style={{ ...btnBase, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
                  <MdDelete /> <span className="desktop-only">Limpar Mês</span>
                </button>
              )}

              <button onClick={toggleSelectionMode} style={{ ...btnBase, background: isSelectionMode ? '#64748b' : 'white', color: isSelectionMode ? 'white' : '#64748b', border: '1px solid #cbd5e1' }}>
                {isSelectionMode ? <><MdClose /> Cancelar</> : <><MdChecklist /> Selecionar</>}
              </button>

              {/* NOVOS BOTÕES DE AÇÃO EM MASSA LADO A LADO */}
              {isSelectionMode && selectedIds.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* NOVO: Botão de Somar */}
                    <button onClick={() => setShowSumBadge(!showSumBadge)} style={{ ...btnBase, background: '#10b981', color: 'white' }}>
                      <MdCalculate /> Somar
                    </button>
                    
                    <button onClick={cloneBulkToNextMonth} style={{ ...btnBase, background: colors.primary, color: 'white' }}>
                      <MdContentCopy /> Clonar ({selectedIds.length})
                    </button>
                    <button onClick={deleteBulk} style={{ ...btnBase, background: colors.expense, color: 'white' }}>
                      <MdDelete /> Excluir ({selectedIds.length})
                    </button>
                  </div>
              )}
            </div>
            
            {/* GRÁFICO E CARDS */}
            {categoryStats.length > 0 && <PieChart data={categoryStats} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', position: 'relative' }}>
              <button onClick={() => scrollStats('left')} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 2 }}>
                <MdChevronLeft size={24} color="#64748b" />
              </button>

              <div ref={statsScrollRef} style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '5px 0', flex: 1, scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <StatCard label={`${terms.income} (Mês)`} value={statsMonth.inc} color={colors.income} />
                <StatCard label={`${terms.expense} (Mês)`} value={statsMonth.exp} color={colors.expense} />
                <StatCard label="Saldo (Mês)" value={statsMonth.bal} color={statsMonth.bal >= 0 ? colors.income : colors.expense} />
                <StatCard label="Gasto no Cartão" value={statsMonth.creditExp} color="#6366f1" />
                <StatCard label="Saldo Devedor" value={statsMonth.pending} color={colors.expense} />
              </div>

              <button onClick={() => scrollStats('right')} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', zIndex: 2 }}>
                <MdChevronRight size={24} color="#64748b" />
              </button>
            </div>

            {/* BARRA DE AÇÕES (FILTROS E SCANNER) */}
            {isTutoScanning && <GuiaSefaz onClose={() => setTutoScanning(false)} />}
            {isScanning && <ScannerCustom onClose={() => setIsScanning(false)} onScanSuccess={handleScanSuccess} />}

            <FinanLitoToolbar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                selectedCategory={selectedCategory} 
                setSelectedCategory={setSelectedCategory} 
                userCategories={userCategories} 
                onNewTransaction={() => handleOpenModal()} 
                onScanClick={() => setIsScanning(true)} 
                onTutoScanClick={() => setTutoScanning(true)} 
                isSelectionMode={isSelectionMode}
                colors={colors}
                handleRenameUserCategory={handleRenameUserCategory}
                handleDeleteUserCategory={handleDeleteUserCategory}
              />

            {/* 3. KANBAN BOARD */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <div ref={kanbanScrollRef} onScroll={checkScroll} className="kanban-wrapper">
                  
                  <KanbanColumn 
                      className="kanban-column-responsive"
                      title="Pendente" status="pending" 
                      items={monthFiltered.filter(t => t.status === 'pending')} 
                      totalAmount={monthFiltered.filter(t => t.status === 'pending' && t.type === 'expense' && !t.isCreditCard).reduce((acc, t) => acc + t.amount, 0)}
                      onScrollRight={() => scrollKanban('right')}
                      bg="#fef9c3" color="#854d0e" 
                      onClickItem={handleOpenModal} onCloneItem={handleCloneToNextMonth}
                      onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop}
                      onDragOverColumn={onDragOverColumn} onDragOverCard={onDragOverCard}
                      dropPlaceholder={dropPlaceholder} draggedItem={draggedItem}
                      colors={colors} terms={terms} isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect}
                  />
                  
                  <KanbanColumn 
                      className="kanban-column-responsive"
                      title="Atrasado" status="overdue" 
                      items={monthFiltered.filter(t => t.status === 'overdue')} 
                      totalAmount={monthFiltered.filter(t => t.status === 'overdue' && t.type === 'expense' && !t.isCreditCard).reduce((acc, t) => acc + t.amount, 0)}
                      onScrollLeft={() => scrollKanban('left')} onScrollRight={() => scrollKanban('right')}
                      bg="#fee2e2" color="#991b1b" 
                      onClickItem={handleOpenModal} onCloneItem={handleCloneToNextMonth}
                      onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop}
                      onDragOverColumn={onDragOverColumn} onDragOverCard={onDragOverCard}
                      dropPlaceholder={dropPlaceholder} draggedItem={draggedItem}
                      colors={colors} terms={terms} isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect}
                  />
                  
                  <KanbanColumn 
                      className="kanban-column-responsive"
                      title="Pagos" status="paid" 
                      items={monthFiltered.filter(t => t.status === 'paid')} 
                      totalAmount={monthFiltered.filter(t => t.status === 'paid' && t.type === 'expense' && !t.isCreditCard).reduce((acc, t) => acc + t.amount, 0)}
                      onScrollLeft={() => scrollKanban('left')}
                      bg="#dcfce7" color="#166534" 
                      onClickItem={handleOpenModal} onCloneItem={handleCloneToNextMonth}
                      onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDrop={handleDrop}
                      onDragOverColumn={onDragOverColumn} onDragOverCard={onDragOverCard}
                      dropPlaceholder={dropPlaceholder} draggedItem={draggedItem}
                      colors={colors} terms={terms} isSelectionMode={isSelectionMode} selectedIds={selectedIds} onToggleSelect={handleToggleSelect}
                  />

                </div>
              </div>
          </div>
        )}
      </div>

      {/* 8. MODAL DE TRANSAÇÕES DESACOPLADO */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionId={formId}
        transactions={transactions}
        userCategories={userCategories}
        validateBalance={validateBalanceForPayment}
        onSuccess={loadData}
        curYear={curYear}
        curMonth={curMonth}
      />

      {/* 9. WIDGET FLUTUANTE DE SOMA EM TEMPO REAL */}
      {showSumBadge && isSelectionMode && selectedIds.length > 0 && (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a', /* Cor escura premium */
            color: 'white',
            padding: '0.8rem 1.5rem',
            borderRadius: '50px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontWeight: 800,
            fontSize: '1.1rem',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <MdCalculate size={28} color="#10b981" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Total Selecionado ({selectedIds.length})
                </span>
                <span style={{ color: selectedSum >= 0 ? '#10b981' : '#ef4444' }}>
                    {/* Se for negativo (despesa pura), a cor vermelha já evidencia. O fmtCurrency cuida da formatação BR */}
                    {fmtCurrency(selectedSum)}
                </span>
            </div>
            <button 
                onClick={() => setShowSumBadge(false)} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 0 0 10px', marginLeft: '10px', borderLeft: '1px solid #334155', display: 'flex', alignItems: 'center' }}
            >
                <MdClose size={22} />
            </button>
        </div>
      )}
    </div>
  );
}