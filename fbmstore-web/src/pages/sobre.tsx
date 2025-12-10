// src/app/sobre.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "@/components/ui/Menu";
import { MdMenu } from "react-icons/md";
import { useClient } from "@/contexts/ClientContext";

const styles = {
  page: { minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" as const },
  header: {
    background: "#000",
    color: "#fff",
    padding: "24px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "0.5px solid #ddd",
  },
  titleHeader: { fontSize: 20, fontWeight: 600 as const, color: "#ff69b4", margin: 0 },
  content: { padding: 16, maxWidth: 900, width: "100%", margin: "0 auto", flex: 1 },
  h1: { fontSize: 22, fontWeight: 700 as const, marginBottom: 12, color: "#111" },
  p: { fontSize: 16, color: "#333", marginBottom: 16, textAlign: "justify" as const, lineHeight: "22px" },
  b: { fontWeight: 700 as const },
  signature: { marginTop: 12, fontSize: 16, color: "#555", fontStyle: "italic" as const },
};

const SobrePage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();
  const [menuVisible, setMenuVisible] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const name = loggedClient?.client.name;
    if (name) setUserName(name);
  }, []);

  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    switch (option) {
      case "Produtos":
        navigate("/");
        break;
      case "Minha Conta":
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case "Meus Pedidos":
        navigate(`/store/orders/${false}`);
        break;
      case "Pop":
        navigate('/politica-privacidade');
        break;
      case "Contacts":
        navigate("/contacts");
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
      case 'Pedidos':
        navigate('/store/orders');
        break;
      case 'Clientes':
        navigate('/clientes');
        break;
      default:
        break;
    }
  };

  return (
    <div style={styles.page}>
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

        <h1 style={styles.titleHeader}>Sobre</h1>

        <span style={{ width: 30 }} />
      </header>

      {/* Conteúdo */}
      <main style={styles.content}>
    <h2 style={styles.h1}>Sobre a FBMStore</h2>

    <p style={styles.p}>
      A <span style={styles.b}>FBMStore</span> iniciou sua jornada oficialmente em <span style={styles.b}>16/12/2025</span>,
      fundada pelo especialista <span style={styles.b}>Genildo Gonçalves de Lima Araujo</span>. 
      O que começou como um laboratório de ideias e inovação, rapidamente identificou uma lacuna no mercado:
      a necessidade de softwares que unem <span style={styles.b}>alta performance</span> com <span style={styles.b}>inteligência de negócios</span>.
    </p>

    <p style={styles.p}>
      Com o crescimento acelerado da demanda digital, tomamos a decisão estratégica de
      dedicação integral à <span style={styles.b}>Engenharia de Software</span>. 
      Deixamos de ser apenas desenvolvedores para nos tornarmos arquitetos de soluções. 
      Desde então, a FBMStore evoluiu seu stack tecnológico, especializando-se na criação de 
      <span style={styles.b}> Sites Otimizados (SEO)</span>, <span style={styles.b}>Sistemas Web Complexos (SaaS)</span>, 
      <span style={styles.b}>Aplicativos</span> e <span style={styles.b}>APIs Escaláveis</span>.
    </p>

    <p style={styles.p}>
      Nosso propósito é claro: transformar códigos em <span style={styles.b}>ativos digitais valiosos</span>. 
      Seja automatizando processos corporativos ou lançando novos produtos digitais, 
      entregamos tecnologia robusta preparada para colocar o seu negócio no topo.
    </p>

    <p style={styles.signature}>— CEO, FBMStore</p>
</main>

      {/* Menu lateral */}
      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={isAdmin}
        onProducts={() => handleMenuOption("Produtos")}
        onMinhaConta={() => handleMenuOption("Minha Conta")}
        onPoliticaPrivacidade={() => handleMenuOption("Pop")}
        onMeusPedidos={() => handleMenuOption("Meus Pedidos")}
        onSobre={() => handleMenuOption("")}
        onContatos={() => handleMenuOption("Contacts")}
        onCadProduct={() => handleMenuOption('CadProduct')}
        onCadCategory={() => handleMenuOption('CadCategory')}
        onCadSupplier={() => handleMenuOption('CadSupplier')}
        onAllClients={() => handleMenuOption('Clientes')}
        onAllOrders={() => handleMenuOption('Pedidos')}
        onSair={logoutClient}
        // extras futuros:
        onTermos={() => {}}
        onAvaliar={() => {}}
        onPreferencias={() => {}}
        onTutorial={() => {}}
        onAssistenteVirtual={() => {}}
      />
    </div>
  );
};

export default SobrePage;
