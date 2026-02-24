import { YearData } from "@/types";
import { fmtCurrency } from "@/utils/currency";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

export const YearDashboard = (
        yearData: YearData[],
        {
        curYear,
        setCurYear,
        onOpenMonth,
        colors,
        terms }: any) => (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '50px', width: 'fit-content', marginInline: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <button onClick={() => setCurYear(curYear - 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}><MdChevronLeft /></button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, minWidth: '80px', textAlign: 'center', margin: 0 }}>{curYear}</h2>
                    <button onClick={() => setCurYear(curYear + 1)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}><MdChevronRight /></button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {yearData.map(m => (
                        <div key={m.index} onClick={() => onOpenMonth(m.index)}
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
);