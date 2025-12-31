import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { register } from "@/services/AuthenticationService";
import { Address, Person, Register } from "@/types";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png";
import { useDocument } from "@/hooks/useDocument";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const numberInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS ---
  // MUDANÇA: Agora aceita 1, 2 ou 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Credenciais
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Dados Pessoais
  const doc = useDocument(); // Hook do CPF/CNPJ
  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  
  // Step 3: Endereço
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // --- UTILITÁRIOS ---
  const showToast = (title: string, message: string) => {
    alert(`${title}\n\n${message}`);
  };

  const validatePasswordComplexity = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
    return regex.test(pass);
  };

  // --- HANDLERS AUXILIARES (CEP, Phone, UF) ---
  const handleCep = async (value: string) => {
    let text = value.replace(/\D/g, ""); 
    text = text.slice(0, 8); 
    text = text.replace(/^(\d{5})(\d)/, "$1-$2");
    setCep(text);

    if (text.length === 9) {
      const cleanCep = text.replace("-", "");
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (data.erro) {
            showToast("CEP não encontrado", "Verifique o número digitado.");
            return;
        }
        setStreet(data.logradouro);
        setNeighborhood(data.bairro);
        setCity(data.localidade);
        setUf(data.uf);
        // Opcional: focar no número se desejar
        // setTimeout(() => numberInputRef.current?.focus(), 100);
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

  // --- NAVEGAÇÃO DO WIZARD (A Lógica Central) ---

  const handleNextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Validação para sair da Etapa 1
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        showToast("Campos vazios", "Preencha todos os dados de acesso.");
        return;
      }
      if (password !== confirmPassword) {
        showToast("Erro na senha", "As senhas não coincidem.");
        return;
      }
      if (!validatePasswordComplexity(password)) {
        showToast("Senha fraca", "A senha deve conter Maiúscula, Minúscula, Número e Caracter Especial.");
        return;
      }
      setStep(2);
      return;
    }

    // Validação para sair da Etapa 2
    if (step === 2) {
       if (!name) {
          showToast("Nome obrigatório", "Por favor, informe seu nome completo.");
          return;
       }
       // Validação do Hook de Documento
       if (!doc.isValid && doc.rawValue.length > 0) {
          showToast("Documento Inválido", "Corrija o CPF/CNPJ antes de continuar.");
          return;
       }
       if (doc.rawValue.length === 0) {
         showToast("Documento Obrigatório", "Informe seu CPF ou CNPJ.");
         return;
       }
       setStep(3);
       return;
    }
  };

  const handlePrevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  // --- SUBMISSÃO FINAL (Apenas na Etapa 3) ---
  const handleRegister = async () => {
    // Validações Finais (Apenas do que sobrou: Endereço)
    const cleanCep = cep.replace(/\D/g, "");
    const cleanPhone = telephone.replace(/\D/g, "");

    if (!cleanCep || !street || !number || !city || !uf) {
        showToast("Endereço incompleto", "Preencha os campos obrigatórios do endereço.");
        return;
    }

    // Montagem dos Objetos
    const loginData: Register = { email, password, confirmPassword };
    // OBS: Adicione o documento ao objeto Person se sua API esperar isso aqui
    const person: Person = { name, telephone: cleanPhone, document: doc.rawValue }; 
    const address: Address = { street, number, cep: cleanCep, city, uf, neighborhood, complement };

    try {
      setSubmitting(true);
      const result = await register(loginData, person, address);

      if (result && result.feito) {
        navigate("/account-active", { state: { email: email } });
      } else {
        showToast("Erro", result?.msg ?? "Falha ao cadastrar.");
      }
    } catch (e) {
      showToast("Erro inesperado", "Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- UI AUXILIAR: BARRA DE PROGRESSO ---
  const ProgressBar = () => (
    <div style={styles.progressContainer}>
      {/* Passo 1 */}
      <div style={{...styles.stepIndicator, background: step >= 1 ? '#4f46e5' : '#e2e8f0', color: step >= 1 ? '#fff' : '#64748b'}}>1</div>
      <div style={{...styles.stepLine, background: step >= 2 ? '#4f46e5' : '#e2e8f0'}} />
      
      {/* Passo 2 */}
      <div style={{...styles.stepIndicator, background: step >= 2 ? '#4f46e5' : '#e2e8f0', color: step >= 2 ? '#fff' : '#64748b'}}>2</div>
      <div style={{...styles.stepLine, background: step >= 3 ? '#4f46e5' : '#e2e8f0'}} />
      
      {/* Passo 3 */}
      <div style={{...styles.stepIndicator, background: step === 3 ? '#4f46e5' : '#e2e8f0', color: step === 3 ? '#fff' : '#64748b'}}>3</div>
    </div>
  );


  return (
    <div style={styles.page}>
       {/* HEADER */}
       <header style={styles.header as React.CSSProperties}>
          <button onClick={() => navigate(-1)} style={styles.backBtn as React.CSSProperties}>
             &larr; Sair
          </button>
          <h1 style={styles.headerTitle as React.CSSProperties}>Cadastro</h1>
          <span style={{ width: 60 }} />
       </header>

      <main style={styles.main}>
          <img src={LOGO} alt="FBM Personalizados" style={styles.logo} />

          {/* INDICADOR DE PROGRESSO ATUALIZADO */}
          <ProgressBar />

          <div style={styles.form}>
            
            {/* ================= ETAPA 1: DADOS DE ACESSO ================= */}
            {step === 1 && (
              <div style={styles.stepContainer}>
                <h2 style={styles.sectionTitle}>Credenciais</h2>
                <p style={styles.subTitle}>Defina seu e-mail e senha de acesso.</p>

                <FloatingLabelInput label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect="off" />

                <div style={{ position: "relative" }}>
                  <FloatingLabelInput label="Senha" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCorrect="off" />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                    {showPassword ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <FloatingLabelInput label="Confirmar Senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoCorrect="off" />
                  <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} style={styles.eyeBtn}>
                    {showConfirmPassword ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
                  </button>
                </div>

                <button onClick={handleNextStep} style={{...styles.submitBtn, marginTop: 16}}>
                  Continuar &rarr;
                </button>
              </div>
            )}

            {/* ================= ETAPA 2: DADOS PESSOAIS ================= */}
            {step === 2 && (
              <div style={styles.stepContainer}>
                <h2 style={styles.sectionTitle}>Dados Pessoais</h2>
                <p style={styles.subTitle}>Conte-nos um pouco sobre você.</p>

                <FloatingLabelInput label="Nome Completo" value={name} onChangeText={setName} />
                
                {/* HOOK DO DOCUMENTO AQUI */}
                <div style={{ position: "relative" }}>
                    <FloatingLabelInput 
                        label="CPF ou CNPJ" 
                        value={doc.value} 
                        onChangeText={doc.onChangeText} 
                        onBlur={doc.onBlur} 
                        error={!!doc.error} 
                        maxLength={18}
                        keyboardType="numeric"
                    />
                    {doc.error && <span style={{ color: '#d32f2f', fontSize: 12, marginLeft: 4, marginTop: -4, display:'block' }}>{doc.error}</span>}
                </div>
                
                <FloatingLabelInput label="Telefone / WhatsApp" value={telephone} onChangeText={handlePhone} keyboardType="phone-pad" maxLength={15} />

                {/* BOTÕES DE NAVEGAÇÃO (Voltar / Avançar) */}
                <div style={styles.buttonGroup}>
                    <button onClick={handlePrevStep} style={styles.secondaryBtn}>&larr; Voltar</button>
                    <button onClick={handleNextStep} style={styles.submitBtn}>Continuar &rarr;</button>
                </div>
              </div>
            )}

            {/* ================= ETAPA 3: ENDEREÇO ================= */}
            {step === 3 && (
              <div style={styles.stepContainer}>
                <h2 style={styles.sectionTitle}>Endereço</h2>
                <p style={styles.subTitle}>Onde podemos te encontrar?</p>

                <div style={{ position: "relative" }}>
                    <FloatingLabelInput 
                        label={loadingCep ? "Buscando..." : "CEP"} 
                        value={cep} 
                        onChangeText={handleCep} 
                        keyboardType="numeric" 
                        maxLength={9} 
                    />
                    {loadingCep && <span style={{ position: 'absolute', right: 10, top: 15, fontSize: 12 }}>⌛</span>}
                </div>

                <FloatingLabelInput label="Logradouro" value={street} onChangeText={setStreet} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <FloatingLabelInput 
                        label="Número" 
                        value={number} 
                        onChangeText={setNumber} 
                        keyboardType="numeric" 
                        ref={numberInputRef} 
                    />
                    <FloatingLabelInput label="Complemento" value={complement} onChangeText={setComplement} />
                </div>

                <FloatingLabelInput label="Bairro" value={neighborhood} onChangeText={setNeighborhood} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                    <FloatingLabelInput label="UF" value={uf} onChangeText={handleUf} maxLength={2} />
                    <FloatingLabelInput label="Cidade" value={city} onChangeText={setCity} />
                </div>

                {/* BOTÕES DE NAVEGAÇÃO (Voltar / Finalizar) */}
                <div style={styles.buttonGroup}>
                    <button onClick={handlePrevStep} style={styles.secondaryBtn}>&larr; Voltar</button>
                    <button 
                      onClick={handleRegister} 
                      disabled={submitting || loadingCep} 
                      style={{ 
                        ...styles.submitBtn, 
                        opacity: (submitting || loadingCep) ? 0.7 : 1 
                      }}
                    >
                      {submitting ? "Finalizando..." : "Concluir Cadastro ✅"}
                    </button>
                </div>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Link to="/login" style={styles.link}>Já tenho uma conta</Link>
            </div>
          </div>
      </main>
    </div>
  );
};

// --- STYLES ATUALIZADOS PARA 3 ETAPAS E LAYOUT MAIS LIMPO ---
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" as const },
  header: { background: "#0f172a", color: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  headerTitle: { fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 },
  backBtn: { background: "transparent", border: 0, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 600 },
  
  main: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" },
  logo: { width: 140, height: 140, objectFit: "contain", marginBottom: 20 },
  
  // Progress Bar Styles (Ajustado para 3 items)
  progressContainer: { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, width: "100%", maxWidth: 360 },
  stepIndicator: { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14, transition: "background 0.3s, color 0.3s", flexShrink: 0 },
  stepLine: { height: 2, flex: 1, margin: "0 8px", transition: "background 0.3s" },

  form: { width: "100%", maxWidth: 500, background: "#fff", padding: "32px 24px", borderRadius: 16, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)" },
  stepContainer: { display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.3s ease-in" },
  
  sectionTitle: { fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0", textAlign: "center" },
  subTitle: { fontSize: 15, color: "#64748b", margin: "0 0 16px 0", textAlign: "center" },
  
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, cursor: "pointer", padding: 4, color: "#64748b", zIndex: 10 },
  
  buttonGroup: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginTop: 24 },
  submitBtn: { width: "100%", padding: "14px", background: "#4f46e5", color: "#fff", borderRadius: 8, border: 0, fontWeight: 700, cursor: "pointer", fontSize: 16, transition: "background 0.2s, opacity 0.2s" },
  secondaryBtn: { width: "100%", padding: "14px", background: "#f1f5f9", color: "#475569", borderRadius: 8, border: "1px solid #cbd5e1", fontWeight: 600, cursor: "pointer", fontSize: 16, transition: "background 0.2s" },
  
  link: { color: "#4f46e5", textDecoration: "none", fontWeight: 600, fontSize: 14 },
};

export default RegisterPage;