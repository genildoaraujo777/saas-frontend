import React, { useState, useRef, useEffect } from "react";
import { CATEGORY_COLORS, DEFAULT_CATEGORIES } from "@/utils/constantes";
import { MdAdd, MdChevronRight, MdDelete, MdEdit, MdSearch } from "react-icons/md";

// 1. CONTRATO DE PROPS DO COMPONENTE
interface FinanLitoToolbarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  userCategories: string[];
  onNewTransaction: () => void;
  onScanClick: () => void;
  onTutoScanClick: () => void;
  isSelectionMode: boolean;
  colors: any;
  handleRenameUserCategory: (cat: string) => void;
  handleDeleteUserCategory: (cat: string) => void;
}

export const FinanLitoToolbar = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  userCategories,
  onNewTransaction,
  onScanClick,
  onTutoScanClick,
  isSelectionMode,
  colors,
  handleRenameUserCategory,
  handleDeleteUserCategory
}: FinanLitoToolbarProps) => {
  
  // 2. ESTADOS LOCAIS PARA O DROPDOWN DE FILTRO
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // 3. EFEITO PARA FECHAR O DROPDOWN AO CLICAR FORA
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
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
            {/* Botão de Tutorial */}
            <button
              onClick={onTutoScanClick}
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
            
            {/* Botão de Scanner */}
            <button
              onClick={onScanClick}
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
              onClick={onNewTransaction}
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
      </div>

      {/* ÁREA DE FILTRO POR CATEGORIA */}
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
    </>
  );
};