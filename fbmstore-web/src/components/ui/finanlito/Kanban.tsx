import { ITransactionExtended } from "@/types";
import { fmtCurrency } from "@/utils/currency";
import { getCategoryColor } from "@/utils/finanlito/finanlito";
import React from "react";
import { MdChevronLeft, MdChevronRight, MdContentCopy, MdCreditCard } from "react-icons/md";

// 1. COMPONENTE KANBAN COLUMN
export const KanbanColumn = ({ 
    title, items, totalAmount, onClickItem, 
    onDragStart, onDragEnd, onDrop, onDragOverColumn, onDragOverCard, 
    dropPlaceholder, draggedItem, status,
    colors, terms,
    isSelectionMode, selectedIds, onToggleSelect,
    onCloneItem,
    style,
    className, 
    onScrollLeft,
    onScrollRight
}: any) => {

    const isPlaceholderInThisColumn = dropPlaceholder?.status === status;

    return (
        <div 
            className={className} 
            onDragOver={(e) => onDragOverColumn(e, status, items.length)}
            onDrop={(e) => onDrop(e, status)} 
            style={{ 
                background: '#e2e8f0', 
                borderRadius: '10px', 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '0.6rem',
                transition: 'background 0.2s',
                boxSizing: 'border-box', // <-- PROTEÇÃO 1: Mantém o tamanho real
                ...style 
            }}
        >
            {/* HEADER DA COLUNA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                    {onScrollLeft && (
                        <button onClick={onScrollLeft} style={{ background: '#cbd5e1', border: 'none', borderRadius: '4px', padding: '2px', cursor: 'pointer', marginRight: '4px', flexShrink: 0 }}>
                            <MdChevronLeft size={18} />
                        </button>
                    )}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                    {onScrollRight && (
                        <button onClick={onScrollRight} style={{ background: '#cbd5e1', border: 'none', borderRadius: '4px', padding: '2px', cursor: 'pointer', marginLeft: '4px', flexShrink: 0 }}>
                            <MdChevronRight size={18} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: 800 }}>
                        {fmtCurrency(totalAmount || 0)}
                    </span>
                    <span style={{ opacity: 0.6 }}>{items.length}</span>
                </div>
            </div>
            
            {/* CORPO DA COLUNA COM SCROLL VERTICAL */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '100px', boxSizing: 'border-box' }}>
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
                                    position: 'relative',
                                    boxSizing: 'border-box', // <-- PROTEÇÃO 2: Card não estica coluna
                                    maxWidth: '100%' // <-- PROTEÇÃO 3: Limita largura
                                }}
                            >
                                {isSelectionMode && (
                                    <div style={{ position: 'absolute', right: '10px', top: '10px', zIndex: 5 }}>
                                    <input type="checkbox" checked={isSelected} readOnly style={{ width: '18px', height: '18px', cursor: 'pointer' }}/>
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', pointerEvents: 'none', gap: '8px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0, paddingRight: isSelectionMode ? '25px' : '0' }}>
                                        {t.title}
                                    </span>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: t.type === 'income' ? colors.income : colors.expense, display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                        {t.isCreditCard && <MdCreditCard size={16} style={{ color: '#64748b' }} />}
                                        {t.type === 'expense' ? '-' : '+'} {fmtCurrency(t.amount)}
                                    </span>
                                </div>

                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', pointerEvents: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', pointerEvents: 'none' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontWeight: 600 }}>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                            {t.status === 'overdue' && (
                                                <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', background: '#fee2e2', padding: '2px 4px', borderRadius: '4px', width: 'fit-content', marginTop: '4px' }}>
                                                    Atrasada desde: {new Date(t.dateReplicated || t.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {!t.title.match(/\(\d+\/\d+\)$/) && (
                                                <button type="button" onClick={(e) => { e.stopPropagation(); onCloneItem(t); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '4px', padding: '4px 8px', color: colors.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', pointerEvents: 'auto' }}>
                                                    <MdContentCopy size={16} /> Jogar p/ Próx. Mês
                                                </button>
                                            )}
                                            {t.category && t.category !== 'Outros' && (
                                                <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, color: '#fff', background: getCategoryColor(t.category) || '#94a3b8', whiteSpace: 'nowrap' }}>
                                                    {t.category.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span style={{ flexShrink: 0, marginLeft: '4px' }}>{t.type === 'income' ? terms.income.substring(0,3).toUpperCase() : terms.expense.substring(0,4).toUpperCase()}</span>
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