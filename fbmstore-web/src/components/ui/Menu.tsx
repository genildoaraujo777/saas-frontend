// src/components/ui/Menu.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import {
  MdAccountBalanceWallet,
  MdStorefront,
  MdPersonOutline,
  MdAssignment,
  MdPolicy,
  MdContacts,
  MdInfoOutline,
  MdLogout,
  MdInventory2,
  MdCategory,
  MdHandshake,
  MdPeopleAlt,
  MdListAlt
} from 'react-icons/md';

export type MenuProps = {
  // controle de visibilidade
  visible: boolean;
  setVisible: (v: boolean) => void;

  // dados do usuário (opcional)
  userName?: string;
  userDoc?: string;
  userAdmin: boolean;

  // callbacks obrigatórios
  onProducts: () => void;
  onMinhaConta: () => void;
  onMeusPedidos: () => void;
  onSair: () => void;

  // callbacks opcionais (deixe sem usar se não tiver rota)
  onPoliticaPrivacidade?: () => void;
  onTermos?: () => void;
  onAvaliar?: () => void;
  onPreferencias?: () => void;
  onTutorial?: () => void;
  onAssistenteVirtual?: () => void;
  onContatos?: () => void;
  onSobre?: () => void;
  onCadProduct?: () => void;
  onCadCategory?: () => void;
  onCadSupplier?: () => void;
  onAllClients?: () => void;
  onAllOrders?: () => void;

  // opcional: estilo do contêiner raiz (para ajustar zIndex no layout da tela)
  containerStyle?: CSSProperties;
};

// 🚀 SOLUÇÃO: Definindo a largura máxima e calculando a largura final

const MAX_DRAWER_WIDTH = 450; // Limite máximo para o menu em desktop (em pixels)
const MOBILE_PERCENTAGE = 0.85; // 85% para telas pequenas

const getDrawerWidth = () => {
  if (typeof window === 'undefined') {
    return MAX_DRAWER_WIDTH;
  }
  const windowWidth = window.innerWidth;
  const percentageWidth = windowWidth * MOBILE_PERCENTAGE;
  
  // A largura final será o MENOR valor entre a largura máxima (450px) e os 85% da tela.
  return Math.round(Math.min(MAX_DRAWER_WIDTH, percentageWidth));
};

const DRAWER_WIDTH = getDrawerWidth();

// FIM DA SOLUÇÃO 🚀

const Menu: React.FC<MenuProps> = ({
  visible,
  setVisible,
  userName,
  userDoc,
  userAdmin,
  onProducts,
  onMinhaConta,
  onMeusPedidos,
  onSair,
  onPoliticaPrivacidade,
  onTermos,
  onAvaliar,
  onPreferencias,
  onTutorial,
  onAssistenteVirtual,
  onContatos,
  onSobre,
  containerStyle,
  onCadProduct,
  onCadCategory,
  onCadSupplier,
  onAllClients,
  onAllOrders
}) => {
  const [tx, setTx] = useState<number>(-DRAWER_WIDTH);
  const mounted = useRef(false);
  
  // 💡 ATENÇÃO: Re-calculamos a largura no useEffect para garantir a responsividade em resize
  // Para simplificar, vou usar o valor estático de DRAWER_WIDTH no estado, e a animação
  // funcionará. Se o usuário redimensionar a tela, a largura será re-calculada no próximo mount.
  
  // Se você realmente precisa de atualização dinâmica no resize, a variável DRAWER_WIDTH
  // precisaria ser um estado, mas para web isso geralmente não é necessário, pois a largura
  // é recalculada no refresh ou no mount.

  // quando o menu ficar visível, anima de -DRAWER_WIDTH para 0
  useEffect(() => {
    if (visible) {
      // Usamos o valor recalculado no momento da abertura
      const currentDrawerWidth = getDrawerWidth(); 
      setTx(-currentDrawerWidth);
      const id = requestAnimationFrame(() => setTx(0));
      return () => cancelAnimationFrame(id);
    }
    mounted.current = false;
  }, [visible]);

  const close = () => setVisible(false);

  const Item: React.FC<{
    icon: React.ReactNode;
    label: string;
    onPress?: () => void;
    danger?: boolean;
  }> = ({ icon, label, onPress, danger }) => (
    <button
      type="button"
      onClick={() => {
        close();
        onPress && onPress();
      }}
      style={styles.menuItemRow}
    >
      <span style={styles.menuIcon}>{icon}</span>
      <span style={{ ...styles.menuLabel, ...(danger ? { color: '#b00020' } : null) }}>{label}</span>
    </button>
  );

  if (!visible) return null;

  const statusBarHeight = 0; // web não tem StatusBar

  const currentDrawerWidth = getDrawerWidth(); // Obtém a largura correta para renderização

  return (
    <div style={{ ...styles.root, ...(containerStyle ?? {}) }}>
      {/* backdrop */}
      <div style={styles.backdrop} onClick={close} />

      {/* sheet */}
      <div
        style={{
          ...styles.drawer,
          width: currentDrawerWidth, // 💡 USANDO A LARGURA CORRETA
          paddingTop: statusBarHeight + 12,
          transform: `translateX(${tx}px)`,
          transition: 'transform 220ms ease-out',
        }}
      >
        {/* Cabeçalho usuário */}
        <div style={styles.userHeader}>
          <div style={styles.userAvatar}>
            <MdAccountBalanceWallet size={28} color="#1f2a44" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.userName} title={userName ? userName : "Entrar"}>
              {/* Lógica modificada usando <Link> */}
              {userName ? (
                // Se houver userName, exibe o nome
                userName
              ) : (
                // Se não houver userName, exibe "Entrar" dentro de um <Link>
                <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                  Entrar
                </Link>
              )}
            </div>
            <div style={styles.userDoc}>{userDoc}</div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Seção 1 */}
        <Item icon={<MdStorefront size={22} color="#343a40" />} label="Produtos" onPress={onProducts} />
        <Item icon={<MdPersonOutline size={22} color="#343a40" />} label="Minha Conta" onPress={onMinhaConta} />
        <Item icon={<MdAssignment size={22} color="#343a40" />} label="Meus Pedidos" onPress={onMeusPedidos} />
        <Item icon={<MdPolicy size={22} color="#343a40" />} label="Política de Privacidade" onPress={onPoliticaPrivacidade} />
        
        <div style={styles.divider} />

        {/* Seção 2 */}
        <Item icon={<MdContacts size={22} color="#343a40" />} label="Contatos" onPress={onContatos} />
        <Item icon={<MdInfoOutline size={22} color="#343a40" />} label="Sobre" onPress={onSobre} />

        <div style={styles.divider} />

        {/* Seção 3 */}
        {userAdmin ? (
                // Se for userAdmin, exibe os menus de cadastro
                <>
                <Item icon={<MdInventory2 size={22} color="#343a40" />} label="Cadastro de produtos" onPress={onCadProduct} />
                <Item icon={<MdCategory size={22} color="#343a40" />} label="Cadastro de categorias" onPress={onCadCategory} />
                <Item icon={<MdHandshake size={22} color="#343a40" />} label="Cadastro de fornecedores" onPress={onCadSupplier} />

                {/* 🚀 NOVAS OPÇÕES DE ADMIN */}
                <div style={styles.divider} />
                <Item icon={<MdPeopleAlt size={22} color="#343a40" />} label="Gerenciar Clientes" onPress={onAllClients} />
                <Item icon={<MdListAlt size={22} color="#343a40" />} label="Gerenciar Pedidos" onPress={onAllOrders} />
                </>
              ) : (
                // Se não for userAdmin, não exibe as opções de cadastro
                <></>
              )}

        {/* Sair */}
        <Item icon={<MdLogout size={22} color="#b00020" />} label="Sair do app" onPress={onSair} danger />
      </div>
    </div>
  );
};

export default Menu;

const styles: Record<string, CSSProperties> = {
  root: {
    position: 'absolute',
    inset: 0,
    zIndex: 100, // fica sobre a tela
  },
  backdrop: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#f4f2f6',
    paddingInline: 18,
    paddingBottom: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    // "elevation" do RN approximado por box-shadow no web:
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
  },
  userHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#e6ecff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1f2a44',
    lineHeight: 1.2,
  },
  userDoc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e3e3e7',
    margin: '10px 0',
  },
  menuItemRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBlock: 12,
    paddingInline: 0,
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  },
  menuIcon: {
    width: 32,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: '#343a40',
  },
};
