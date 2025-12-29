// src/app/register.tsx
import React, { useState, useRef } from "react"; // Adicionei useRef
import { Link, useNavigate } from "react-router-dom";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { register } from "@/services/AuthenticationService";
import { Address, Person, Register } from "@/types";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Refs para focar campos automaticamente
  const numberInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [telephone, setTelephone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false); // Feedback visual simples

  const showToast = (title: string, message: string) => {
    alert(`${title}\n\n${message}`);
  };

  const validatePasswordComplexity = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
    return regex.test(pass);
  };

  // --- MÁSCARAS E HANDLERS ---

  // Integração ViaCEP dentro do handler
  const handleCep = async (value: string) => {
    let text = value.replace(/\D/g, ""); 
    text = text.slice(0, 8); 
    text = text.replace(/^(\d{5})(\d)/, "$1-$2");
    
    setCep(text);

    // Se completou o CEP (formato 00000-000 tem 9 chars), busca na API
    if (text.length === 9) {
      const cleanCep = text.replace("-", "");
      setLoadingCep(true);
      
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (data.erro) {
            showToast("CEP não encontrado", "Verifique o número digitado.");
            // Limpa campos para permitir preenchimento manual se quiser
            return;
        }

        // Preenchimento Automático
        setStreet(data.logradouro);
        setNeighborhood(data.bairro);
        setCity(data.localidade);
        setUf(data.uf);

        // UX: Foca automaticamente no campo "Número"
        // (Assumindo que seu FloatingLabelInput repassa a ref para o input nativo, 
        // caso contrário o usuário só clica no número, mas os dados já estarão lá)
        // numberInputRef.current?.focus(); 

      } catch (error) {
        console.error("Erro ViaCEP", error);
        // Não bloqueamos o usuário, ele pode preencher manualmente se a API falhar
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

  // ---------------------------

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      showToast("Deu ruim!", "As senhas não coincidem.");
      return;
    }

    if (!validatePasswordComplexity(password)) {
      showToast("Senha fraca", "A senha deve conter:\n- Letra Maiúscula\n- Letra Minúscula\n- Número\n- Caractere Especial");
      return;
    }

    const cleanPhone = telephone.replace(/\D/g, "");
    const cleanCep = cep.replace(/\D/g, "");

    // Validação básica de campos obrigatórios
    if (!name || !email || !cleanCep || !street || !number) {
        showToast("Atenção", "Preencha todos os campos obrigatórios.");
        return;
    }

    const loginData: Register = { email, password, confirmPassword };
    const person: Person = { name, telephone: cleanPhone };
    const address: Address = { street, number, cep: cleanCep, city, uf, neighborhood, complement };

    try {
      setSubmitting(true);
      const result = await register(loginData, person, address);

      if (result && result.isActiveted) {
        showToast("Oba!", result.msg ?? "Cadastro realizado com sucesso.");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      } else {
        showToast("Deu ruim!", result?.msg ?? "Erro ao cadastrar.");
      }
    } catch (e) {
      showToast("Erro inesperado", "Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
       {/* HEADER */}
       <header style={styles.header as React.CSSProperties}>
          <button onClick={() => navigate(-1)} style={styles.backBtn as React.CSSProperties}>Voltar</button>
          <h1 style={styles.headerTitle as React.CSSProperties}>Tela de cadastro</h1>
          <span style={{ width: 60 }} />
       </header>

      <main style={styles.main}>
          <img src={LOGO} alt="FBM Personalizados" style={styles.logo} />

          <div style={styles.form}>
            <h2 style={styles.sectionTitle}>Dados Login</h2>

            <FloatingLabelInput label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect="off" containerWidth={"100%"} />

            <div style={{ position: "relative" }}>
              <FloatingLabelInput label="Senha" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCorrect="off" containerWidth={"100%"} />
              <button type="button" onClick={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                {showPassword ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <FloatingLabelInput label="Confirmar Senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} autoCorrect="off" containerWidth={"100%"} />
              <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} style={styles.eyeBtn}>
                {showConfirmPassword ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
              </button>
            </div>

            <hr style={styles.separator} />
            <h2 style={styles.sectionTitle}>Dados Pessoais</h2>
            <hr style={styles.separator} />

            <FloatingLabelInput label="Nome" value={name} onChangeText={setName} containerWidth={"100%"} />
            
            <FloatingLabelInput label="Telefone" value={telephone} onChangeText={handlePhone} keyboardType="phone-pad" containerWidth={"100%"} maxLength={15} />

            {/* INPUT CEP COM INTEGRAÇÃO */}
            <div style={{ position: "relative" }}>
                <FloatingLabelInput 
                    label={loadingCep ? "Buscando CEP..." : "CEP"} 
                    value={cep} 
                    onChangeText={handleCep} 
                    keyboardType="numeric" 
                    containerWidth={"100%"} 
                    maxLength={9} 
                />
                {loadingCep && <span style={{ position: 'absolute', right: 10, top: 15, fontSize: 12, color: '#4f46e5' }}>⌛</span>}
            </div>

            <FloatingLabelInput label="Logradouro" value={street} onChangeText={setStreet} containerWidth={"100%"} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FloatingLabelInput 
                    label="Número" 
                    value={number} 
                    onChangeText={setNumber} 
                    keyboardType="numeric" 
                    containerWidth={"100%"} 
                    // Se o seu componente aceitar ref, descomente abaixo
                    // ref={numberInputRef} 
                />
                <FloatingLabelInput label="Complemento" value={complement} onChangeText={setComplement} containerWidth={"100%"} />
            </div>

            <FloatingLabelInput label="Bairro" value={neighborhood} onChangeText={setNeighborhood} containerWidth={"100%"} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                <FloatingLabelInput label="UF" value={uf} onChangeText={handleUf} containerWidth={"100%"} maxLength={2} />
                <FloatingLabelInput label="Cidade" value={city} onChangeText={setCity} containerWidth={"100%"} />
            </div>

            <button onClick={handleRegister} disabled={submitting || loadingCep} style={{ ...styles.submitBtn, opacity: (submitting || loadingCep) ? 0.7 : 1, cursor: (submitting || loadingCep) ? "not-allowed" : "pointer" }}>
              {submitting ? "Cadastrando..." : "Cadastrar"}
            </button>

            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Link to="/login" style={styles.link}>Já tenho conta</Link>
            </div>
        </div>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f5f5", display: "flex", flexDirection: "column" as const },
  header: { background: "#0f172a", color: "#fff", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", width: "100%", boxSizing: "border-box", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
  headerTitle: { fontSize: 20, fontWeight: 700 as const, color: "#fff", margin: 0, letterSpacing: '0.5px' },
  backBtn: { background: "transparent", border: 0, color: "#fff", fontSize: 16, cursor: "pointer" },
  main: { flex: 1, display: "grid", placeItems: "center", padding: 24, boxSizing: "border-box" },
  logo: { width: 200, height: 200, objectFit: "cover", display: "block", margin: "0 auto 10px" },
  form: { width: "100%", maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" },
  sectionTitle: { fontSize: 18, fontWeight: 700 as const, color: "#0f172a", margin: "10px 0", textAlign: "center" },
  separator: { border: 0, borderTop: "1px solid #4f46e5", margin: "10px 0" },
  eyeBtn: { position: "absolute" as const, right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, cursor: "pointer", padding: 4 },
  submitBtn: { width: "100%", padding: "14px 16px", background: "#4f46e5", color: "#fff", borderRadius: 8, border: 0, fontWeight: 700 as const, marginTop: 10, boxSizing: "border-box" },
  link: { color: "#4f46e5", textDecoration: "none", fontWeight: 600 as const },
};

export default RegisterPage;