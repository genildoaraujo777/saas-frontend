// src/app/pop.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "@/components/ui/Menu";
import { MdMenu } from "react-icons/md";
import { useClient } from "@/contexts/ClientContext";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";

const PopPage: React.FC = () => {
  const { hasActiveFinance } = useSubscriptionCheck();
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
        window.location.href = '/';
        break;
      case "Minha Conta":
        navigate(`/store/account/${loggedClient?.client._id}`);
        break;
      case "Minhas Assinaturas":
        navigate(`/store/orders/${false}`);
        break;
      case "Contacts":
        navigate("/contacts");
        break;
      case "Sobre":
        navigate("/sobre");
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

        <h1 style={styles.headerTitle}>Política de privacidade</h1>

        <span style={{ width: 30 }} />
      </header>

      {/* Conteúdo */}
      <main style={styles.contentWrap}>
        <p style={styles.paragraph}>
          A sua privacidade é importante para nós. É política da FBMSTORE respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site da FBMSTORE, e outros sites que possuímos e operamos.
        </p>

        <p style={styles.paragraph}>
          Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.
        </p>

        <p style={styles.paragraph}>
          Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.
        </p>

        <p style={styles.paragraph}>
          Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.
        </p>

        <p style={styles.paragraph}>
          O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.
        </p>
        
        <p style={styles.paragraph}>
          Você é livre para recusar a nossa solicitação de informações pessoais, entendendo que talvez não possamos fornecer alguns dos serviços desejados.
        </p>
        
        <p style={styles.paragraph}>
          O uso continuado de nosso site será considerado como aceitação de nossas práticas em torno de privacidade e informações pessoais. Se você tiver alguma dúvida sobre como lidamos com dados do usuário e informações pessoais, entre em contacto connosco.
        </p>
        
        <ul>
            <li><span style={styles.liSpan}>O serviço Google AdSense que usamos para veicular publicidade usa
                    um cookie DoubleClick para veicular anúncios mais relevantes em toda a Web e limitar o número de
                    vezes que um determinado anúncio é exibido para você.</span></li>
            <li><span style={styles.liSpan}>Para mais informações sobre o Google AdSense, consulte as FAQs
                    oficiais sobre privacidade do Google AdSense.</span></li>
            <li><span style={styles.liSpan}>Utilizamos anúncios para compensar os custos de funcionamento
                    deste site e fornecer financiamento para futuros desenvolvimentos. Os cookies de publicidade
                    comportamental usados ​​por este site foram projetados para garantir que você forneça os anúncios
                    mais relevantes sempre que possível, rastreando anonimamente seus interesses e apresentando coisas
                    semelhantes que possam ser do seu interesse.</span></li>
            <li><span style={styles.liSpan}>Vários parceiros anunciam em nosso nome e os cookies de
                    rastreamento de afiliados simplesmente nos permitem ver se nossos clientes acessaram o site através
                    de um dos sites de nossos parceiros, para que possamos creditá-los adequadamente e, quando
                    aplicável, permitir que nossos parceiros afiliados ofereçam qualquer promoção que pode fornecê-lo
                    para fazer uma compra.</span></li>
        </ul>

        <h3>
          <span style={styles.liSpan}>Compromisso do Usuário</span>
        </h3>

        <p style={styles.paragraph}>
          O usuário se compromete a fazer uso adequado dos conteúdos e da informação que a FBMSTORE oferece no site e com caráter enunciativo, mas não limitativo:
        </p>

        <ul>
            <li><span style={styles.liSpan}>A) Não se envolver em atividades que sejam ilegais ou contrárias à boa fé a à ordem pública;</span></li>
            <li><span style={styles.liSpan}>B) Não difundir propaganda ou conteúdo de natureza racista, xenofóbica, jogos de sorte ou azar, qualquer tipo de pornografia ilegal, de apologia ao terrorismo ou contra os direitos humanos;</span></li>
            <li><span style={styles.liSpan}>C) Não causar danos aos sistemas físicos (hardwares) e lógicos (softwares) da FBMSTORE, de seus fornecedores ou terceiros, para introduzir ou disseminar vírus informáticos ou quaisquer outros sistemas de hardware ou software que sejam capazes de causar danos anteriormente mencionados.</span></li>
        </ul>

        <h3>
          <span style={styles.liSpan}>Mais informações</span>
        </h3>

        <p style={styles.paragraph}>
          Esperemos que esteja esclarecido e, como mencionado anteriormente, se houver algo que você não tem certeza se precisa ou não, geralmente é mais seguro deixar os cookies ativados, caso interaja com um dos recursos que você usa em nosso site.
        </p>

        <p style={styles.paragraph}>
          Esta política é efetiva a partir de <strong>1 Agosto 2025 17:20</strong>.
        </p>
      </main>

      {/* Menu lateral */}
      <Menu
        visible={menuVisible}
        setVisible={setMenuVisible}
        userName={loggedClient?.client.name}
        userDoc=""
        userAdmin={isAdmin}
        hasFinancialAccess={hasActiveFinance}
        onProducts={() => handleMenuOption("Produtos")}
        onMinhaConta={() => handleMenuOption("Minha Conta")}
        onPoliticaPrivacidade={() => handleMenuOption("")}
        onMinhasAssinaturas={() => handleMenuOption("Minhas Assinaturas")}
        onSobre={() => handleMenuOption("Sobre")}
        onContatos={() => handleMenuOption("Contacts")}
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

export default PopPage;

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
  contentWrap: { padding: 16, maxWidth: 900, width: "100%", margin: "0 auto", flex: 1, boxSizing: "border-box" },
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