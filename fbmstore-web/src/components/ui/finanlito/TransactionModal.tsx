import React, { useState, useEffect, useRef } from 'react';
import { CATEGORY_COLORS, DEFAULT_CATEGORIES, MONTHS } from '@/utils/constantes';
import { MdCalendarToday, MdChevronRight, MdClose, MdDelete, MdEdit } from 'react-icons/md';
import { useTenant } from '@/contexts/TenantContext';
import { FinanLitoService } from '@/services/FinanLitoService';
import { parseDateBRToISO, parseISOToDateBR } from '@/utils/dateUtils';
import { currencyMask, fmtCurrency, parseCurrencyToFloat } from '@/utils/currency';
import { ITransactionExtended } from '@/types';
import { btnBase, inpStyle, lblStyle } from '@/utils/finanlito/finanlitoConstsCss';

// 1. DEFINIÇÃO CLARA DE PROPS (Contrato do Componente)
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
  transactions: ITransactionExtended[];
  userCategories: string[];
  validateBalance: (amount: number, isCreditCard: boolean, formId?: string | null) => Promise<boolean>;
  onSuccess: () => void;
  curYear: number;
  curMonth: number | null;
}

export const TransactionModal = ({ 
  isOpen, 
  onClose, 
  transactionId, 
  transactions,
  userCategories,
  validateBalance,
  onSuccess,
  curYear,
  curMonth
}: TransactionModalProps) => {

  const { colors, terms } = useTenant();
  const token = localStorage.getItem('token') || '';

  // 2. ESTADOS ISOLADOS DO FORMULÁRIO
  const [loading, setLoading] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formAmount, setFormAmount] = useState(''); 
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formStatus, setFormStatus] = useState<'pending' | 'paid' | 'overdue'>('pending');
  const [formDate, setFormDate] = useState('');
  const [formIsCreditCard, setFormIsCreditCard] = useState(false);
  
  // Estados de Parcelamento
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(2);

  // Estados de UI (Dropdowns e Refs)
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  // 3. EFEITO: FECHAR DROPDOWN AO CLICAR FORA
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. EFEITO: PREENCHIMENTO DO FORMULÁRIO (NOVO vs EDIÇÃO)
  useEffect(() => {
    if (!isOpen) return;

    if (transactionId) {
      const t = transactions.find(x => x._id === transactionId || x.id === transactionId);
      if (t) {
        setFormTitle(t.title);
        setFormDesc(t.description || '');
        const cat = t.category || 'Outros';
        
        if (userCategories.includes(cat)) {
          setFormCategory(cat);
          setFormCustomCategory('');
        } else {
          setFormCategory('Outros');
          setFormCustomCategory(cat);
        }
        
        setFormAmount(t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        setFormType(t.type);
        setFormStatus(t.status as any);
        setFormDate(parseISOToDateBR(t.date));
        setFormIsCreditCard(t.isCreditCard === true);
        setIsInstallment(false);
        setTotalInstallments(2);
      }
    } else {
      // Reset para Novo Lançamento
      setFormTitle('');
      setFormDesc('');
      setFormAmount('');
      setFormType('expense');
      setFormStatus('pending');
      setFormCategory('Outros');
      setFormCustomCategory('');
      
      const now = new Date();
      now.setFullYear(curYear);
      if (curMonth !== null) now.setMonth(curMonth);
      setFormDate(parseISOToDateBR(now.toISOString()));
      
      setFormIsCreditCard(false);
      setIsInstallment(false);
      setTotalInstallments(2);
    }
  }, [isOpen, transactionId, transactions, curYear, curMonth, userCategories]);

  // 5. HELPERS DE INPUT
  const handleChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormAmount(currencyMask(e.target.value));
  };

  const handleAmountFocus = () => {
    if (formAmount.includes('R$')) setFormAmount(formAmount.replace('R$', '').trim());
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    if (isoVal) {
      const d = new Date(isoVal);
      const pad = (n: number) => n.toString().padStart(2, '0');
      setFormDate(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`);
    }
  };

  // 6. PARSER SAAS SEFAZ
  const processSefazPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || text.length < 50) return;

      const fullText = text.replace(/\s+/g, ' ');
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      setFormTitle("CUPOM FISCAL ELETRÔNICO");
      setFormCategory('Outros');
      setFormCustomCategory('');
      setFormType('expense');

      const totalMatch = fullText.match(/(?:Valor a pagar R\$|VALOR A PAGAR)\s*:?\s*([\d.]{1,},[\d]{2})/i);
      if (totalMatch) setFormAmount(currencyMask(totalMatch[1].replace(/\D/g, '')));

      const dateMatch = fullText.match(/Emissão:\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}:\d{2})/i);
      if (dateMatch) setFormDate(`${dateMatch[1]} ${dateMatch[2]}`);

      const allItems: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toUpperCase().includes("QTDE")) {
          let rawName = lines[i - 1] || "Item";
          const cleanName = rawName.replace(/^[\d,.]*/, '').split('(')[0].trim();
          const unitMatch = lines[i].match(/Vl\. Unit\.:\s*([\d,.]+)/i);
          const unitPrice = unitMatch ? unitMatch[1].trim() : "0,00";
          const nextLine = lines[i + 1] || "";
          const itemTotalMatch = nextLine.match(/^([\d,.]+)/);
          const itemTotal = itemTotalMatch ? itemTotalMatch[1] : unitPrice;
          const qtyMatch = lines[i].match(/Qtde\.:?([\d,.]+)/i);
          const qty = qtyMatch ? qtyMatch[1] : "1";

          if (cleanName && cleanName.length > 2 && !cleanName.includes("VALOR TOTAL")) {
            allItems.push(`${qty}x ${cleanName} UN(R$ ${unitPrice}) TOTAL(R$ ${itemTotal})`);
          }
        }
      }

      if (allItems.length > 0) {
        setFormDesc(`Resumo SEFAZ (${allItems.length} itens): ${allItems.join(' | ')}`);
        alert("Sucesso! Valor e itens importados.");
      } else {
        setFormDesc("Nota lida, verifique os itens.");
      }
    } catch (err) {
      alert("Erro ao ler clipboard. Verifique se copiou corretamente da SEFAZ.");
    }
  };

  // 7. FUNÇÃO DE SALVAR (CRIAÇÃO / EDIÇÃO / PARCELAMENTO)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = formCategory === 'Outros' ? (formCustomCategory || 'Outros') : formCategory;
    const val = parseCurrencyToFloat(formAmount);
    const isoDate = parseDateBRToISO(formDate);

    try {
      // 7.1 LÓGICA DE PARCELAMENTO (APENAS NOVOS)
      if (!transactionId && isInstallment && totalInstallments > 1) {
        const baseDate = new Date(isoDate);
        const promises = [];

        for (let i = 0; i < totalInstallments; i++) {
          const currentDate = new Date(baseDate);
          currentDate.setMonth(baseDate.getMonth() + i);
          if (currentDate.getDate() !== baseDate.getDate()) currentDate.setDate(0); 

          const installmentTitle = `${formTitle} (${i + 1}/${totalInstallments})`;
          let currentStatus = i > 0 ? 'pending' : formStatus; // Apenas a 1ª pode nascer paga

          const payload = {
            title: installmentTitle, description: formDesc, amount: val, type: formType,
            status: currentStatus, date: currentDate.toISOString(), isCreditCard: !!formIsCreditCard,
            category: finalCategory
          };
          promises.push(FinanLitoService.create(payload, token));
        }

        await Promise.all(promises);
        alert(`${totalInstallments} lançamentos gerados com sucesso!`);
        onSuccess();
        onClose();
        return;
      }

      // 7.2 VALIDAÇÃO DE DUPLICIDADE / TRAVA DE GRUPO
      const targetMonth = new Date(isoDate).getMonth();
      const targetYear = new Date(isoDate).getFullYear();
      const currentMatch = formTitle.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
      
      if (currentMatch) {
        const baseTitle = currentMatch[1].trim().toLowerCase();
        const denominator = currentMatch[3];
        const hasSiblingInMonth = transactions.some(t => {
          if (transactionId && (t._id === transactionId || t.id === transactionId)) return false;
          const tDate = new Date(t.date);
          const tMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
          return tMatch && tMatch[1].trim().toLowerCase() === baseTitle && tMatch[3] === denominator && 
                 tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear;
        });

        if (hasSiblingInMonth) {
          alert(`Operação cancelada: Já existe uma parcela do grupo "${currentMatch[1]}" neste mês.`);
          setLoading(false);
          return; 
        }
      }

      // 7.3 VALIDAÇÃO DE SALDO
      if (formStatus === 'paid' && formType === 'expense') {
        const isOk = await validateBalance(val, formIsCreditCard, transactionId);
        if (!isOk) {
          setLoading(false);
          return;
        }
      }

      const payload = {
        title: formTitle, description: formDesc, amount: val, type: formType, 
        status: formStatus, date: isoDate, isCreditCard: !!formIsCreditCard, category: finalCategory
      };

      // 7.4 ATUALIZAÇÃO OU CRIAÇÃO SIMPLES
      if (transactionId) {
        // Sincronização de valores de parcelas filhas
        const originalItem = transactions.find(t => t._id === transactionId || t.id === transactionId);
        const match = originalItem?.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);

        if (match && val !== originalItem?.amount) {
          const baseTitle = match[1];
          if (window.confirm(`Você alterou o valor desta parcela. Deseja atualizar o valor de TODAS as outras parcelas do grupo "${baseTitle}" para ${formAmount}?`)) {
            const allTransactions = await FinanLitoService.getAll(undefined, undefined, token);
            const siblings = allTransactions.filter(t => {
              const sMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
              return sMatch && sMatch[1] === baseTitle && sMatch[3] === match[3] && (t._id || t.id) !== transactionId;
            });
            await Promise.all(siblings.map(s => 
              FinanLitoService.update(s._id || s.id || '', { amount: val, category: finalCategory }, token)
            ));
          }
        }
        await FinanLitoService.update(transactionId, payload, token);
      } else {
        await FinanLitoService.create(payload, token);
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  // 8. FUNÇÃO DE EXCLUSÃO (ÚNICA OU RE-INDEXAÇÃO)
  const handleDelete = async () => {
    if (!transactionId) return;
    const currentItem = transactions.find(t => (t._id === transactionId || t.id === transactionId));
    if (!currentItem) return;

    const match = currentItem.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
    setLoading(true);
    
    try {
      if (!match) {
        if (!confirm('Deseja realmente excluir este lançamento?')) { setLoading(false); return; }
        await FinanLitoService.delete(transactionId, token);
      } else {
        const baseTitle = match[1];
        const originalDenominator = match[3];
        if (!confirm(`Deseja excluir "${currentItem.title}"? As parcelas restantes serão reajustadas.`)) { setLoading(false); return; }

        const allTransactions = await FinanLitoService.getAll(undefined, undefined, token);
        const siblings = allTransactions.filter(t => {
          const sMatch = t.title.match(/^(.*)\s\((\d+)\/(\d+)\)$/);
          return sMatch && sMatch[1] === baseTitle && sMatch[3] === originalDenominator;
        });

        const survivors = siblings
          .filter(t => (t._id || t.id) !== transactionId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const newTotal = survivors.length;
        const updatePromises = survivors.map((item, idx) => {
          const anchorDate = new Date(survivors[0].date);
          const newDate = new Date(anchorDate);
          const originalDay = anchorDate.getDate();
          newDate.setMonth(anchorDate.getMonth() + idx);
          if (newDate.getDate() !== originalDay) newDate.setDate(0); 
          
          return FinanLitoService.update(item._id || item.id || '', { 
            ...item, title: `${baseTitle} (${idx + 1}/${newTotal})`, date: newDate.toISOString() 
          }, token);
        });

        await FinanLitoService.delete(transactionId, token);
        await Promise.all(updatePromises);
        alert(`Parcela removida. ${newTotal} itens foram re-indexados.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao excluir/re-indexar.');
    } finally {
      setLoading(false);
    }
  };

 if (!isOpen) return null;

  return (
    <div 
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backdropFilter: 'blur(2px)', overflowY: 'auto', padding: '20px 0' }}
      onClick={onClose}
    >
      {/* MODAL CONTAINER: IMPEDE A PROPAGAÇÃO DO CLIQUE PARA O BACKDROP */}
      <div 
        style={{ background: 'white', width: '95%', maxWidth: '500px', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: 'min-content', position: 'relative', margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* HEADER DO MODAL: TÍTULO E BOTÃO FECHAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>{transactionId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', borderRadius: '50%', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <MdClose size={24} />
          </button>
        </div>
        
        {/* Usando opacity para evitar desabilitar inputs brutamente se estiver em loading */}
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '5px', WebkitOverflowScrolling: 'touch', opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
          
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" onClick={processSefazPaste} style={{ width: '100%', padding: '1rem', background: '#f0f9ff', color: '#0369a1', border: '2px dashed #0ea5e9', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
              <i className="fas fa-file-import"></i> COLAR DADOS DA SEFAZ
            </button>
          </div>

          <div><label style={lblStyle}>Título</label><input required style={inpStyle} value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
          
          {/* Categoria */}
          <div>
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} style={{ ...inpStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                  <span>{formCategory === 'Outros' ? (formCustomCategory || 'Outros') : formCategory}</span>
                  <MdChevronRight style={{ transform: isCatDropdownOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
              </div>

              {isCatDropdownOpen && (
                  <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, background: '#fff', maxHeight: '250px', border: '1px solid #cbd5e1', borderRadius: '8px', zIndex: 100, flexDirection: 'column', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      {userCategories.map(cat => (
                          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
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
                          </div>
                      ))}
                  </div>
              )}
            </div>
            {formCategory === 'Outros' && (
              <input placeholder="Nome da nova categoria..." style={{ ...inpStyle, marginTop: '0.5rem', border: `1px solid ${colors.primary}` }} value={formCustomCategory} onChange={e => setFormCustomCategory(e.target.value)} required />
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
                    <button type="button" style={{ background: '#e2e8f0', border: 'none', width: '100%', height: '100%', borderRadius: '6px', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <MdCalendarToday size={20} />
                    </button>
                    <input ref={nativeDateInputRef} type="datetime-local" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} onChange={handleNativeDateChange} />
                </div>
              </div>
            </div>
            <div>
                <label style={lblStyle}>Status</label>
                <select style={inpStyle} value={formStatus} onChange={e => setFormStatus(e.target.value as any)}>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Atrasado</option>
                </select>
            </div>
          </div>

          {formType === 'expense' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input type="checkbox" id="isCreditCard" checked={formIsCreditCard} onChange={e => setFormIsCreditCard(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label htmlFor="isCreditCard" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Pago via Cartão de Crédito</label>
            </div>
          )}

          {!transactionId && (
              <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: '#f0f9ff', borderRadius: '8px', border: '1px dashed #bae6fd' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" id="isInstallment" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <label htmlFor="isInstallment" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', color: '#0369a1' }}>É uma despesa/receita parcelada?</label>
                  </div>
                  {isInstallment && (
                      <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <label style={{ fontSize: '0.85rem', color: '#0369a1' }}>Qtd parcelas:</label>
                          <input type="number" min="2" max="360" value={totalInstallments} onChange={e => setTotalInstallments(Number(e.target.value))} style={{ ...inpStyle, width: '80px', padding: '0.4rem' }} />
                      </div>
                  )}
              </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
            {transactionId && <button type="button" onClick={handleDelete} style={{ ...btnBase, background: '#fee2e2', color: '#991b1b', marginRight: 'auto' }}><MdDelete /> Excluir</button>}
            <button type="button" onClick={onClose} style={{ ...btnBase, background: 'white', border: '1px solid #cbd5e1', color: '#64748b' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ ...btnBase, background: colors.income, color: 'white' }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};