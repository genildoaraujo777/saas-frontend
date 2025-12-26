import React, { useEffect, useState } from 'react';
import Menu from '@/components/ui/Menu';
import { useNavigate } from 'react-router-dom';
import { MdMenu, MdChevronRight } from 'react-icons/md';
import { SiInstagram, SiWhatsapp, SiGooglechrome } from 'react-icons/si';
import { useClient } from '@/contexts/ClientContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';

type IconProps = { color?: string; size?: number };
type IconEl = React.ReactElement<IconProps>;

const BRAND_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  tiktok: '#010101',
  whatsapp: '#25D366',
  site: '#1E88E5',
  web: '#1E88E5',
};

const hexToRgba = (hex: string, alpha = 0.12) => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ContactRow: React.FC<{
  icon: IconEl;
  label: string;
  value: string;
  onPress: () => void;
  brand?: 'instagram' | 'tiktok' | 'whatsapp' | 'site' | 'web';
  variant?: 'soft' | 'solid';
  bgColor?: string;
  iconColor?: string;
}> = ({
  icon,
  label,
  value,
  onPress,
  brand,
  variant = 'soft',
  bgColor,
  iconColor,
}) => {
  const key = (brand ?? label).toLowerCase();
  const base = BRAND_COLORS[key] ?? '#111';

  const backgroundColor =
    bgColor ?? (variant === 'solid' ? base : hexToRgba(base, 0.12));
  const color = iconColor ?? (variant === 'solid' ? '#fff' : base);

  const coloredIcon = React.cloneElement<IconProps>(icon, { color });

  return (
    <button
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 12px',
        borderRadius: 10,
        background: '#4f46e5',
        marginBottom: 12,
        width: '100%',
        border: 0,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: backgroundColor,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {coloredIcon}
      </span>

      <span style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: '#999', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 16, color: '#000', fontWeight: 600 }}>
          {value}
        </div>
      </span>

      <MdChevronRight size={24} color="#999" />
    </button>
  );
};

const ContactsPage: React.FC = () => {
  const { hasActiveFinance } = useSubscriptionCheck();
  const navigate = useNavigate();
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    switch (option) {
      case 'Produtos':
        window.location.href = '/';
        break;
      case 'Minha Conta':
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case 'Minhas Assinaturas':
        navigate(`/store/orders/${false}`);
        break;
      case 'Pop':
        navigate('/politica-privacidade');
        break;
      case 'Sobre':
        navigate('/sobre');
        break;
      case 'CadProduct':
        navigate('/cad-product');
        break;
      case 'CadCategory':
        navigate('/cad-category');
        break;
      case 'CadSupplier':
        navigate('/cad-supplier');
        break;
      case 'Assinaturas':
        navigate('/store/orders');
        break;
      case 'Clientes':
        navigate('/clientes');
        break;
      case 'Controle Financeiro':
        navigate('/finanlito');
        break;
      default:
        break;
    }
  };

  const openLink = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      console.warn('Não foi possível abrir:', url);
    }
  };

  const openWhatsApp = (phone: string) => {
    const waWeb = `https://wa.me/${phone}`;
    window.open(waWeb, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={styles.header}>
              <button
                onClick={() => setMenuVisible((p) => !p)}
                style={{ background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}
                aria-label="Abrir menu"
                title="Abrir menu"
              >
                <MdMenu size={30} />
              </button>
      
              <h1 style={styles.headerTitle}>Contatos</h1>
      
              <span style={{ width: 30 }} />
            </header>

      {/* Conteúdo */}
      <main style={{ flex: 1 }}>
        <div style={{ padding: 16, maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#111' }}>
            Fale com a gente
          </h2>

          <p
            style={{
              fontSize: 16,
              color: '#333',
              marginBottom: 20,
              textAlign: 'justify',
              lineHeight: '22px',
            }}
          >
            Escolha um dos canais abaixo para entrar em contato com a FBMStore.
            Estamos prontos para te atender!
          </p>

          <ContactRow
            brand="instagram"
            variant="solid"
            icon={<SiInstagram size={24} />}
            label="Instagram"
            value="@fbmdev"
            onPress={() => openLink('https://instagram.com/fbmdev')}
          />

          <ContactRow
            brand="whatsapp"
            variant="solid"
            icon={<SiWhatsapp size={24} />}
            label="WhatsApp"
            value="+55 11 94468-8144"
            onPress={() => openWhatsApp('5511944688144')}
          />

          <ContactRow
            brand="web"
            variant="solid"
            icon={<SiGooglechrome size={20} />} // ícone de “web/site”
            label="Site"
            value="fbmstore.com.br"
            onPress={() => openLink('https://fbmstore.com.br/')}
          />

          <div style={{ height: 24 }} />
          <p style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>
            Dica: clique em qualquer linha para abrir o canal correspondente.
          </p>
        </div>
      </main>

      {/* Menu lateral */}
      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={isAdmin}
        hasFinancialAccess={hasActiveFinance}
        onProducts={() => handleMenuOption('Produtos')}
        onMinhaConta={() => handleMenuOption('Minha Conta')}
        onPoliticaPrivacidade={() => handleMenuOption('Pop')}
        onMinhasAssinaturas={() => handleMenuOption('Minhas Assinaturas')}
        onSobre={() => handleMenuOption('Sobre')}
        onContatos={() => handleMenuOption('')}
        onCadProduct={() => handleMenuOption('CadProduct')}
        onCadCategory={() => handleMenuOption('CadCategory')}
        onCadSupplier={() => handleMenuOption('CadSupplier')}
        onAllClients={() => handleMenuOption('Clientes')}
        onAllOrders={() => handleMenuOption('Assinaturas')}
        onSair={logoutClient}
        onFinanLito={() => handleMenuOption('Controle Financeiro')}
      />
    </div>
  );
};

export default ContactsPage;

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" as const },
  header: {
    background: "#0f172a", 
    color: "#fff",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1e293b",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  headerTitle: { fontSize: 20, fontWeight: 700 as const, color: "#fff", margin: 0, letterSpacing: '0.5px' },
  title: { fontSize: 20, fontWeight: 600 as const, color: "#e799a6", margin: 0 },
  contentWrap: { padding: 16, maxWidth: 900, width: "100%", margin: "0 auto", flex: 1 },
  paragraph: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    textAlign: "justify" as const,
    lineHeight: "22px",
  },
  liSpan: {
    color: "#444444"
  }
};