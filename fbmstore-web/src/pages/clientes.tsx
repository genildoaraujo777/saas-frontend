// src/screens/ClientsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { MdMenu, MdAdd } from 'react-icons/md';
import { useClient } from '@/contexts/ClientContext';
import { useNavigate } from 'react-router-dom';
import Menu from '@/components/ui/Menu';

const ClientsScreen: React.FC = () => {
    const { clients, fetchClients, loggedClient, isAdmin, logoutClient } = useClient();
    const navigate = useNavigate();
    
    // Estados locais
    const [menuVisible, setMenuVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredClients, setFilteredClients] = useState<any[]>([]);

    const token = localStorage.getItem('token'); 

    useEffect(() => {
        if (token) {
            fetchClients(token);
        }
    }, [token, fetchClients]);

    // Atualiza a lista filtrada sempre que a lista original (clients) mudar
    useEffect(() => {
        setFilteredClients(clients);
    }, [clients]);

    // Lógica de Pesquisa (Nome ou Telefone)
    const handleSearch = (query: string) => {
        setSearchQuery(query);

        if (!query) {
            setFilteredClients(clients);
            return;
        }

        const lower = query.toLowerCase();
        const filtered = clients.filter((client: any) => 
            (client.name && client.name.toLowerCase().includes(lower)) ||
            (client.telephone && client.telephone.includes(lower)) ||
            (client.email && client.email.toLowerCase().includes(lower))
        );

        setFilteredClients(filtered);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setFilteredClients(clients);
    };

    const handleClientClick = (adminClientId: string) => {
        navigate(`/store/account/${adminClientId}`);
    };

    const Header = useMemo(
        () => (
            <div style={styles.headerContainer}>
                <button
                    onClick={() => setMenuVisible((prev) => !prev)}
                    style={styles.menuButton}
                    aria-label="Abrir menu"
                >
                    <MdMenu size={30} color="white" />
                </button>
                <div style={styles.headerTitle}>Clientes</div>
                <div style={{ width: 30 }}></div> 
            </div>
        ),
        []
    );

    const handleMenuOption = (option: string) => {
    switch (option) {
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
      case 'Pedidos':
        navigate(`/store/orders/${isAdmin}`);
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
            {Header}

            <div style={styles.contentWrapper}>
                
                {/* Container de Ações: Busca + Botão Novo */}
                <div style={styles.topControls}>
                    
                    {/* Barra de Busca (Estilo idêntico ao Orders) */}
                    <div style={styles.searchBarContainer}>
                        <input
                            style={styles.searchBar as React.CSSProperties}
                            placeholder="Pesquisar cliente (nome ou tel)..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchQuery.length > 0 && (
                            <button 
                                onClick={clearSearch} 
                                style={styles.clearButton as React.CSSProperties} 
                                aria-label="Limpar busca"
                            >
                                <span style={styles.clearButtonText}>X</span>
                            </button>
                        )}
                    </div>

                    {/* Botão Novo Cliente */}
                    <button 
                        style={styles.buttonNew as React.CSSProperties} 
                        onClick={() => navigate('/cad-client')}
                    >
                        <MdAdd size={22} color="#fff" />
                        <span style={styles.buttonNewText}>Novo</span>
                    </button>
                </div>

                {/* Lista de Clientes Filtrada */}
                <div>
                    {filteredClients.map((client: any) => (
                        <div 
                            key={client._id} 
                            style={styles.clientCard} 
                            onClick={() => handleClientClick(client._id)}
                        >
                            <div style={styles.clientName}>{client._id}</div>
                            <div style={styles.clientName}>{client.name}</div>
                            
                            <div style={styles.clientInfoRow}>
                                <span style={styles.label}>Telefone:</span>
                                <span style={styles.value}>{client.telephone}</span>
                            </div>

                            {client.email && (
                                <div style={styles.clientInfoRow}>
                                    <span style={styles.label}>Email:</span>
                                    <span style={styles.value}>{client.email}</span>
                                </div>
                            )}

                            <div style={styles.buttonContainer}>
                                <span style={styles.linkText}>Ver Detalhes</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                {filteredClients.length === 0 && (
                    <div style={styles.emptyState}>
                        <p>{searchQuery ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}</p>
                    </div>
                )}
            </div>

            <Menu
                visible={menuVisible}
                setVisible={setMenuVisible}
                userName={loggedClient?.client.name}
                userDoc=""
                userAdmin={isAdmin}
                onProducts={() => handleMenuOption("")}
                onMinhaConta={() => handleMenuOption("Minha Conta")}
                onPoliticaPrivacidade={() => handleMenuOption("Pop")}
                onMeusPedidos={() => handleMenuOption("Meus Pedidos")}
                onSobre={() => handleMenuOption("Sobre")}
                onContatos={() => handleMenuOption("Contacts")}
                onCadProduct={() => handleMenuOption('CadProduct')}
                onCadCategory={() => handleMenuOption('CadCategory')}
                onCadSupplier={() => handleMenuOption('CadSupplier')}
                onAllClients={() => handleMenuOption('Clientes')}
                onAllOrders={() => handleMenuOption('Pedidos')}
                onSair={logoutClient}
                // hooks/rotas extras quando existirem:
                onTermos={() => {}}
                onAvaliar={() => {}}
                onPreferencias={() => {}}
                onTutorial={() => {}}
                onAssistenteVirtual={() => {}}
            />
        </div>
    );
}

export default ClientsScreen;

// ESTILOS PADRONIZADOS
const styles: Record<string, React.CSSProperties> = {
    page: {
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
    },
    headerContainer: {
        paddingTop: 30,
        height: 96,
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 16,
        borderBottom: '0.5px solid #ddd',
        width: '100%',
        boxSizing: 'border-box',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 600,
        color: '#e799a6',
    },
    menuButton: {
        background: 'transparent',
        border: 0,
        cursor: 'pointer'
    },
    contentWrapper: {
        paddingTop: 20,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 50,
        flex: 1,
        maxWidth: 800,
        margin: '0 auto',
        width: '100%',
    },
    // Container que segura a Busca e o Botão Novo lado a lado (ou empilhados no mobile muito pequeno)
    topControls: {
        display: 'flex',
        gap: 10,
        marginBottom: 20,
        alignItems: 'center',
    },
    // Estilos da Barra de Busca (Copiados do Orders)
    searchBarContainer: {
        display: 'flex',
        flexDirection: 'row',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#e799a6', // A borda rosa característica
        borderRadius: 5,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingRight: 6,
        flex: 1, // Ocupa o espaço restante
    },
    searchBar: {
        flex: 1,
        height: 40,
        paddingInline: 10,
        border: 0,
        outline: 'none',
        background: 'transparent',
        fontSize: 16,
        width: '100%', // Garante largura em inputs
    },
    clearButton: { 
        paddingInline: 10, 
        display: 'flex', 
        alignItems: 'center', 
        background: 'transparent', 
        border: 0, 
        cursor: 'pointer' 
    },
    clearButtonText: { 
        fontSize: 18, 
        color: 'gray' 
    },
    // Estilo Botão Novo (Compacto para caber ao lado da busca)
    buttonNew: {
        backgroundColor: '#e799a6',
        height: 42, // Mesma altura visual da busca
        padding: '0 15px',
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 0,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap',
    },
    buttonNewText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
        display: 'inline-block', // Pode esconder em telas minúsculas se quiser usar media queries depois
    },
    // Card Style
    clientCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        border: '1px solid transparent',
    },
    clientName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    clientInfoRow: {
        display: 'flex',
        marginBottom: 4,
        fontSize: 16,
        color: '#666',
    },
    label: {
        fontWeight: '600',
        marginRight: 5,
        color: '#555',
    },
    value: {
        color: '#666',
    },
    buttonContainer: {
        marginTop: 10,
        borderTop: '1px solid #eee',
        paddingTop: 10,
        display: 'flex',
        justifyContent: 'flex-end',
    },
    linkText: {
        color: '#e799a6',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyState: {
        textAlign: 'center',
        color: '#999',
        marginTop: 40,
        fontSize: 16,
    }
};