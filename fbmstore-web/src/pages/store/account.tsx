// src/routes/AccountScreen.tsx
import React, { useEffect, useState } from 'react'; // Removido useMemo
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import { searchAccountData, updateRegister } from '@/services/AuthenticationService';
import { Address, Person } from '@/types';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png";

// No web, substitui AsyncStorage por localStorage
const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const AccountScreen: React.FC = () => {
  const { adminClientId } = useParams<{ adminClientId: string }>();
  const [clientId, setClientId] = useState('');
  const [idAddress, setIdAddress] = useState('');
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');

  const navigation = useNavigate();

  useEffect(() => {
    searchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchToken = async () => {
    const token = getToken();
    if (token) {
      const { client } = await searchAccountData(adminClientId || "", token);
      setClientId(client._id);
      setIdAddress(client.address._id);
      setName(client.name);
      setTelephone(client.telephone);
      setCep(client.address.cep);
      setStreet(client.address.street);
      setNumber(String(client.address.number));
      setComplement(client.address.complement);
      setNeighborhood(client.address.neighborhood);
      setCity(client.address.city);
      setUf(client.address.uf);
    } else {
      showToast('error', 'Deu ruim!', 'Sua sessão possivelmente expirou');
    }
  };

  const handleUpdateRegister = async () => {
    const person: Person = { name, telephone };
    const address: Address = {
      _id: idAddress,
      street,
      number,
      cep,
      city,
      uf,
      neighborhood,
      complement,
    };
    const result = await updateRegister(clientId, person, address);
    if (result && result === 204) {
      showToast('success', 'Ok!', 'Dados atualizados com sucesso!');
    } else {
      showToast('error', 'Deu ruim!', 'Erro ao tentar atualizar os dados, tente novamente mais tarde.');
    }
  };

  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    toast[type](
      <div>
        <strong>{title}</strong>
        <div>{message}</div>
      </div>
    );
  };

  // Substitui Dimensions.get('window').width * 0.9
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth * 0.9 : 800));
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth * 0.9);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Platform equivalente: se precisar ajustar layout iOS vs outros
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
       {/* HEADER SIMPLIFICADO */}
      <header style={styles.header as React.CSSProperties}>
        <button onClick={() => navigation(-1)} style={styles.backBtn as React.CSSProperties}>
          Voltar
        </button>
        <h1 style={styles.headerTitle as React.CSSProperties}>Minha conta</h1>
        <span style={{ width: 60 }} />
      </header>
      {/* FIM HEADER */}

      <div style={styles.scrollContainer as React.CSSProperties}>
        {/* CONTAINER DO FORMULÁRIO */}
        <div style={styles.formContainer as React.CSSProperties}>
          <img
            src={LOGO}
            alt="SPG Personalizados"
            style={styles.logo as React.CSSProperties}
          />

          <div style={styles.separator as React.CSSProperties} />
          <h2 style={styles.sectionTitle as React.CSSProperties}>Dados Pessoais</h2>
          <div style={styles.separator as React.CSSProperties} />

          {/* INPUTS - Removido containerWidth={vw} */}
          <FloatingLabelInput label="Nome" value={name} onChangeText={setName} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="Telefone" value={telephone} onChangeText={setTelephone} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="CEP" value={cep} onChangeText={setCep} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="Logradouro (Rua, Avenida, etc.)" value={street} onChangeText={setStreet} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="Número" value={number} onChangeText={setNumber} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="Complemento" value={complement} onChangeText={setComplement} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="Bairro" value={neighborhood} onChangeText={setNeighborhood} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="Estado (UF)" value={uf} onChangeText={setUf} autoCapitalize="none" autoCorrect="off" />
          <FloatingLabelInput label="Cidade" value={city} onChangeText={setCity} autoCapitalize="none" autoCorrect="off" />

          <button style={styles.button as React.CSSProperties} onClick={handleUpdateRegister}>
            <span style={styles.buttonText as React.CSSProperties}>Salvar Alterações</span>
          </button>
        </div>
      </div>
      <ToastContainer position="bottom-center" newestOnTop closeOnClick />
    </>
  );
};

export default AccountScreen;

const styles: Record<string, React.CSSProperties> = {
  // --- HEADER STYLES (Consistente com Login/Cadastro) ---
  header: {
    background: '#000',
    color: '#fff',
    padding: '24px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '0.5px solid #ddd',
  },
  backBtn: {
    background: 'transparent',
    border: 0,
    color: '#e799a6',
    fontSize: 16,
    cursor: 'pointer',
  },
  headerTitle: { fontSize: 20, fontWeight: 600, color: '#e799a6', margin: 0 },

  // --- CONTENT/FORM STYLES ---
  scrollContainer: {
    minHeight: 'calc(100vh - 72px)', // Ajustado para ser responsivo
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start', // Alinha o conteúdo ao topo
    padding: '30px 24px', // Padding uniforme
    backgroundColor: '#f5f5f5', // Cor de fundo consistente
    overflowY: 'auto',
  },
  formContainer: {
    width: '100%',
    maxWidth: 720, // Define uma largura máxima para o formulário
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 30px rgba(0,0,0,.08)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px', // Espaçamento uniforme entre todos os elementos do formulário
    alignItems: 'center', // Centraliza a logo e outros elementos
  },

  // Estilos de container e iOS removidos (substituídos por formContainer)
  // container: {},
  // containerIos: {},

  logo: {
    width: 200,
    height: 200,
    objectFit: 'cover',
    margin: '0 auto 10px', // Centraliza a logo
    borderRadius: 8,
  },
  
  // Input style removido, já que você está usando o FloatingLabelInput
  // input: {},

  separator: {
    border: 0,
    borderTop: '1px solid #e799a6',
    width: '100%',
    margin: '10px 0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e799a6',
    textAlign: 'center', // Centraliza o título
    width: '100%', // Ocupa a largura total para centralização
    margin: 0,
  },
  button: {
    width: '100%', // Ocupa 100% da largura
    padding: '14px 16px',
    backgroundColor: '#e799a6',
    borderRadius: 8,
    border: 0,
    marginTop: 4,
    cursor: 'pointer',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700', // Usando 700 em vez de 'bold' para consistência
    fontSize: 16,
  },
};
