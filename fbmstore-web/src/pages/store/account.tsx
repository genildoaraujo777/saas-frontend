// src/routes/AccountScreen.tsx
import React, { useEffect, useState } from 'react';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import { searchAccountData, updateRegister } from '@/services/AuthenticationService';
import { Address, Person } from '@/types';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png";
// IMPORTANTE: Importando o hook que criamos
import { useDocument } from "@/hooks/useDocument";

const getToken = () => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const AccountScreen: React.FC = () => {
  const { adminClientId } = useParams<{ adminClientId: string }>();
  const navigation = useNavigate();

  // --- HOOKS & STATES ---
  const doc = useDocument(); // Hook inteligente para CPF/CNPJ
  
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

  const [loadingCep, setLoadingCep] = useState(false);

  // --- CARREGAMENTO DE DADOS ---
  useEffect(() => {
    searchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchToken = async () => {
    const token = getToken();
    if (token) {
      try {
        const { client } = await searchAccountData(adminClientId || "", token);
        
        if (client) {
            setClientId(client._id);
            setIdAddress(client.address._id);
            setName(client.name);
            
            // Aplica máscara no telefone vindo do banco
            handlePhone(client.telephone || ""); 

            // POPULA O DOCUMENTO (CPF/CNPJ)
            // Tenta pegar de document, cpf ou cnpj (dependendo de como o back retorna)
            const existingDoc = client.document || client.cpf || client.cnpj || "";
            doc.onChangeText(existingDoc); // Atualiza o hook com o valor existente

            // Endereço
            handleCep(client.address.cep || ""); // Já aplica máscara
            setStreet(client.address.street);
            setNumber(String(client.address.number));
            setComplement(client.address.complement);
            setNeighborhood(client.address.neighborhood);
            setCity(client.address.city);
            setUf(client.address.uf);
        }
      } catch (error) {
         showToast('error', 'Erro', 'Falha ao carregar dados do perfil.');
      }
    } else {
      showToast('error', 'Sessão Expirada', 'Faça login novamente.');
      setTimeout(() => navigation('/login'), 2000);
    }
  };

  // --- HANDLERS COM MÁSCARAS (IGUAL AO REGISTER) ---
  
  const handleCep = async (value: string) => {
    let text = value.replace(/\D/g, ""); 
    text = text.slice(0, 8); 
    text = text.replace(/^(\d{5})(\d)/, "$1-$2");
    setCep(text);

    // Busca automática ao digitar novo CEP (Apenas se usuário estiver digitando, 
    // mas aqui reutilizamos a lógica para preenchimento. 
    // Se quiser buscar só na digitação manual, precisaria de uma flag, 
    // mas deixar assim não faz mal pois preenche os campos com o que já tem).
    if (text.length === 9) {
      const cleanCep = text.replace("-", "");
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
            setStreet(data.logradouro);
            setNeighborhood(data.bairro);
            setCity(data.localidade);
            setUf(data.uf);
        }
      } catch (error) {
        console.error("Erro ViaCEP", error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handlePhone = (value: string) => {
    let text = value.replace(/\D/g, "");
    text = text.slice(0, 11); 
    text = text.replace(/^(\d{2})(\d)/g, "($1) $2");
    text = text.replace(/(\d)(\d{4})$/, "$1-$2");
    setTelephone(text);
  };

  const handleUf = (value: string) => {
    let text = value.toUpperCase();
    text = text.replace(/[^A-Z]/g, ""); 
    text = text.slice(0, 2); 
    setUf(text);
  };

  // --- AÇÃO DE ATUALIZAR ---

  const handleUpdateRegister = async () => {
    // Validações básicas
    if (!name || !doc.rawValue || !telephone || !street) {
        showToast('warning', 'Atenção', 'Preencha os campos obrigatórios.');
        return;
    }

    // Validação do Documento
    if (!doc.isValid) {
        showToast('error', 'Documento Inválido', 'Verifique o CPF ou CNPJ digitado.');
        return;
    }

    const cleanPhone = telephone.replace(/\D/g, "");
    const cleanCep = cep.replace(/\D/g, "");

    const person: Person = { 
        name, 
        telephone: cleanPhone,
        document: doc.rawValue
    };

    const address: Address = {
      _id: idAddress,
      street,
      number,
      cep: cleanCep,
      city,
      uf,
      neighborhood,
      complement,
    };

    try {
        const result = await updateRegister(clientId, person, address);
        
        // --- CORREÇÃO DO ERRO DE BUILD AQUI ---
        // Usamos (result as any) para evitar o erro "Property status does not exist on type number"
        const isSuccess = 
            result === 204 || 
            result === 200 || 
            (typeof result === 'object' && (result as any)?.status === 200);

        if (isSuccess) {
            showToast('success', 'Sucesso', 'Dados atualizados com sucesso!');
        } else {
            showToast('error', 'Erro', 'Não foi possível atualizar os dados.');
        }
    } catch (e) {
        showToast('error', 'Erro', 'Falha na comunicação com o servidor.');
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

  return (
    <>
       {/* HEADER */}
      <header style={styles.header as React.CSSProperties}>
        <button onClick={() => navigation(-1)} style={styles.backBtn as React.CSSProperties}>
          Voltar
        </button>
        <h1 style={styles.headerTitle as React.CSSProperties}>Minha Conta</h1>
        <span style={{ width: 60 }} />
      </header>

      <div style={styles.scrollContainer as React.CSSProperties}>
        <div style={styles.formContainer as React.CSSProperties}>
          <img
            src={LOGO}
            alt="FBM Personalizados"
            style={styles.logo as React.CSSProperties}
          />

          <div style={styles.separator as React.CSSProperties} />
          <h2 style={styles.sectionTitle as React.CSSProperties}>Dados Pessoais</h2>
          <div style={styles.separator as React.CSSProperties} />

          <FloatingLabelInput 
            label="Nome Completo" 
            value={name} 
            onChangeText={setName} 
            autoCapitalize="words" 
          />
          
          {/* NOVO CAMPO CPF/CNPJ */}
          <div style={{ position: "relative", width: '100%' }}>
            <FloatingLabelInput 
                label="CPF ou CNPJ" 
                value={doc.value} 
                onChangeText={doc.onChangeText} 
                onBlur={doc.onBlur} 
                error={!!doc.error} 
                maxLength={18}
                keyboardType="numeric"
            />
            {doc.error && <span style={{ color: '#d32f2f', fontSize: 12, marginLeft: 4 }}>{doc.error}</span>}
          </div>

          <FloatingLabelInput 
            label="Telefone" 
            value={telephone} 
            onChangeText={handlePhone} 
            maxLength={15}
            keyboardType="phone-pad" 
          />

          <div style={styles.separator as React.CSSProperties} />
          <h2 style={styles.sectionTitle as React.CSSProperties}>Endereço</h2>
          <div style={styles.separator as React.CSSProperties} />

          <div style={{ position: "relative", width: '100%' }}>
            <FloatingLabelInput 
                label={loadingCep ? "Buscando..." : "CEP"} 
                value={cep} 
                onChangeText={handleCep} 
                maxLength={9}
                keyboardType="numeric" 
            />
            {loadingCep && <span style={{ position: 'absolute', right: 10, top: 15, fontSize: 12 }}>⌛</span>}
          </div>

          <FloatingLabelInput label="Logradouro" value={street} onChangeText={setStreet} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
            <FloatingLabelInput label="Número" value={number} onChangeText={setNumber} keyboardType="numeric" />
            <FloatingLabelInput label="Complemento" value={complement} onChangeText={setComplement} />
          </div>
          
          <FloatingLabelInput label="Bairro" value={neighborhood} onChangeText={setNeighborhood} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', width: '100%' }}>
            <FloatingLabelInput label="UF" value={uf} onChangeText={handleUf} maxLength={2} />
            <FloatingLabelInput label="Cidade" value={city} onChangeText={setCity} />
          </div>

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
  backBtn: {
    background: 'transparent',
    border: 0,
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 600,
  },
  scrollContainer: {
    minHeight: 'calc(100vh - 72px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '30px 24px',
    backgroundColor: '#f5f5f5',
    overflowY: 'auto',
  },
  formContainer: {
    width: '100%',
    maxWidth: 720,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 30px rgba(0,0,0,.08)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  logo: {
    width: 150, // Ajustei levemente para ficar mais harmônico no mobile
    height: 150,
    objectFit: 'contain',
    margin: '0 auto 10px',
  },
  separator: {
    border: 0,
    borderTop: '1px solid #e2e8f0', // Mais suave que o preto total
    width: '100%',
    margin: '5px 0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    width: '100%',
    margin: 0,
  },
  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    border: 0,
    marginTop: 16,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
};