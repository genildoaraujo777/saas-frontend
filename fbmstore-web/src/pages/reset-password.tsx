import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png";
import { 
  sendResetPasswordCode, 
  validateResetCode, 
  updatePassword 
} from "@/services/AuthenticationService";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  
  // Dados
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");

  // --- UTILS ---
  const showToast = (msg: string) => alert(msg); // Substitua pelo seu toast favorito

  const validatePasswordComplexity = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
    return regex.test(pass);
  };

  // --- ACTIONS ---

  // Passo 1: Enviar E-mail
  const handleSendCode = async () => {
    if (!email) {
      setError("Digite seu e-mail.");
      return;
    }
    setLoading(true);
    setError("");
    
    try {
      const res = await sendResetPasswordCode(email);
      // Ajuste conforme o retorno real da sua API (ex: res.success ou res.msg)
      if (res && (res.success || res.message)) {
        setStep(2); // Avança
      } else {
        setError(res?.msg || "E-mail não encontrado.");
      }
    } catch (e) {
      setError("Erro ao conectar.");
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Validar Código
  const handleValidateCode = async () => {
    if (!code || code.length < 4) {
      setError("Código inválido.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await validateResetCode(code);
      if (res && res.isValidCode) { // Assumindo que a API retorna isValidCode: true
        setStep(3); // Avança para nova senha
      } else {
        setError("Código incorreto ou expirado.");
      }
    } catch (e) {
      setError("Erro ao validar código.");
    } finally {
      setLoading(false);
    }
  };

  // Passo 3: Salvar Nova Senha
  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!validatePasswordComplexity(newPassword)) {
      alert("A senha deve conter Maiúscula, Minúscula, Número e Caracter Especial.");
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword({
        email,
        code,
        password: newPassword, // Ajuste para o nome que o backend espera
        confirmPassword: confirmPassword
      });

      if (res && (res.success || res.feito)) {
        showToast("Senha alterada com sucesso! Faça login.");
        navigate("/login", { replace: true });
      } else {
        setError(res?.msg || "Erro ao atualizar senha.");
      }
    } catch (e) {
      setError("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img src={LOGO} alt="Logo" style={styles.logo} />
        
        <h2 style={styles.title}>Recuperar Senha</h2>
        
        {/* --- CONTEÚDO DINÂMICO DOS PASSOS --- */}
        <div style={styles.form}>
          
          {/* STEP 1: E-MAIL */}
          {step === 1 && (
            <>
              <p style={styles.text}>Informe seu e-mail para receber o código.</p>
              <FloatingLabelInput 
                label="E-mail" 
                value={email} 
                onChangeText={(t) => { setEmail(t.toLowerCase()); setError(""); }} 
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <button onClick={handleSendCode} disabled={loading} style={styles.button}>
                {loading ? "Enviando..." : "Enviar Código"}
              </button>
            </>
          )}

          {/* STEP 2: CÓDIGO */}
          {step === 2 && (
            <>
              <p style={styles.text}>
                Enviamos um código para <strong>{email}</strong>.
              </p>
              <FloatingLabelInput 
                label="Código de 6 dígitos" 
                value={code} 
                onChangeText={(t) => { setCode(t); setError(""); }} 
                keyboardType="numeric"
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: 4, fontSize: 18 }}
              />
              <button onClick={handleValidateCode} disabled={loading} style={styles.button}>
                {loading ? "Verificando..." : "Validar Código"}
              </button>
              <button onClick={() => setStep(1)} style={styles.linkButton}>Reenviar E-mail</button>
            </>
          )}

          {/* STEP 3: NOVA SENHA */}
          {step === 3 && (
            <>
              <p style={styles.text}>Crie sua nova senha.</p>
              
              <div style={{ position: "relative" }}>
                <FloatingLabelInput 
                  label="Nova Senha" 
                  value={newPassword} 
                  onChangeText={setNewPassword} 
                  secureTextEntry={!showPassword} 
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                  {showPassword ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <FloatingLabelInput 
                  label="Confirmar Nova Senha" 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword} 
                  secureTextEntry={!showConfirm} 
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)} style={styles.eyeBtn}>
                  {showConfirm ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
                </button>
              </div>

              <button onClick={handleUpdatePassword} disabled={loading} style={styles.button}>
                {loading ? "Salvando..." : "Alterar Senha"}
              </button>
            </>
          )}

          {/* MENSAGEM DE ERRO GLOBAL */}
          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.footer}>
            <Link to="/login" style={styles.link}>Voltar para o Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES (Mesmo padrão do Login) ---
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f5f5", padding: 24 },
  card: { width: "100%", maxWidth: 480, background: "#fff", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,.08)", padding: "32px 24px", textAlign: "center" },
  logo: { width: 160, height: 160, objectFit: "contain", margin: "0 auto 16px" },
  title: { fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 16 },
  text: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  button: { width: "100%", padding: 14, background: "#4f46e5", color: "#fff", borderRadius: 8, border: 0, fontWeight: 700, cursor: "pointer", transition: "0.2s" },
  linkButton: { background: "none", border: "none", color: "#4f46e5", cursor: "pointer", marginTop: 8, fontSize: 14 },
  link: { color: "#4f46e5", textDecoration: "none", fontWeight: 600 },
  footer: { marginTop: 24, borderTop: "1px solid #f1f5f9", paddingTop: 16 },
  error: { color: "#ef4444", fontSize: 14, marginTop: 8, background: "#fef2f2", padding: 8, borderRadius: 4 },
  eyeBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, cursor: "pointer", padding: 4, color: "#64748b" },
};

export default ResetPasswordPage;