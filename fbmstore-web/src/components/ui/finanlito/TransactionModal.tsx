import { CATEGORY_COLORS, DEFAULT_CATEGORIES } from "@/utils/constantes";
import { btnBase, inpStyle, lblStyle } from "@/utils/finanlitoConstsCss";
import { MdCalendarToday, MdChevronRight, MdDelete, MdEdit } from "react-icons/md";

export const TransactionModal = ({ 
        isOpen, 
        onClose, 
        transactionId, 
        onSuccess  }: any) => (
    <>
      {isOpen && (
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
            <h3 style={{ marginBottom: '1rem' }}>{onSuccess ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
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
              {!transactionId && (
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
                {transactionId && <button type="button" onClick={handleDelete} style={{ ...btnBase, background: '#fee2e2', color: '#991b1b', marginRight: 'auto' }}><MdDelete /> Excluir</button>}
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...btnBase, background: 'white', border: '1px solid #cbd5e1', color: '#64748b' }}>Cancelar</button>
                <button type="submit" style={{ ...btnBase, background: colors.income, color: 'white' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
);      