import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { validateActivationCode } from "@/services/AuthenticationService";
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png"; 

const AccountActive: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Recupera o email passado pelo navigate do registro (para UX)
  const userEmail = location.state?.email || "seu e-mail";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    if (!code || code.length < 4) {
      setError("Por favor, digite o código completo recebido.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await validateActivationCode(code);

      if (result && result.isValidCode) {
        setSuccess(true);
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        setError(result?.msg || "Código inválido ou expirado.");
      }
    } catch (e) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <img src={LOGO} alt="Logo" style={styles.logo} />

        <div style={styles.card}>
          {!success ? (
            <>
              <h1 style={styles.title}>Ative sua conta 🔐</h1>
              <p style={styles.text}>
                Enviamos um código de confirmação para: <br />
                <strong style={{ color: "#4f46e5" }}>{userEmail}</strong>
              </p>
              <p style={styles.subText}>
                Verifique sua caixa de entrada (e spam) e insira o código abaixo.
              </p>

              <div style={{ marginTop: 24 }}>
                <FloatingLabelInput
                  label="Código de Ativação"
                  value={code}
                  onChangeText={(txt) => {
                    setCode(txt);
                    if(error) setError("");
                  }}
                  containerWidth="100%"
                  style={{ textAlign: 'center', letterSpacing: 4, fontSize: 20 }}
                  maxLength={10} // Ajuste conforme o tamanho do seu código
                />
              </div>

              {error && (
                <div style={styles.errorBox}>
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleValidate}
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "wait" : "pointer"
                }}
              >
                {loading ? "Validando..." : "Ativar Conta"}
              </button>
            </>
          ) : (
            <div style={styles.successContainer}>
              <div style={styles.checkmarkWrapper}>
                ✅
              </div>
              <h2 style={styles.successTitle}>Conta Ativada!</h2>
              <p style={styles.text}>
                Tudo pronto. Você será redirecionado para o login em instantes...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Estilos mantendo a identidade visual do FBMSTORE
const styles: Record<string, React.CSSProperties> = {
  page: { 
    minHeight: "100vh", 
    background: "#f1f5f9", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  main: { 
    width: "100%", 
    display: "flex", 
    flexDirection: "column", 
    alignItems: "center", 
    padding: 20 
  },
  logo: { 
    width: 120, 
    height: 120, 
    objectFit: "contain", 
    marginBottom: 24 
  },
  card: { 
    width: "100%", 
    maxWidth: 440, 
    background: "#fff", 
    padding: "40px 32px", 
    borderRadius: 16, 
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)", 
    textAlign: "center" 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 800, 
    color: "#0f172a", 
    marginBottom: 16 
  },
  text: { 
    fontSize: 16, 
    color: "#334155", 
    lineHeight: 1.5, 
    marginBottom: 8 
  },
  subText: { 
    fontSize: 14, 
    color: "#64748b", 
    marginBottom: 16 
  },
  button: { 
    width: "100%", 
    padding: "16px", 
    background: "#4f46e5", 
    color: "#fff", 
    borderRadius: 8, 
    border: 0, 
    fontWeight: 700, 
    fontSize: 16, 
    marginTop: 24,
    transition: "background 0.2s" 
  },
  errorBox: {
    background: "#fef2f2",
    color: "#ef4444",
    padding: "10px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    marginTop: 16
  },
  successContainer: {
    animation: "fadeIn 0.5s ease-out"
  },
  checkmarkWrapper: {
    fontSize: 48,
    marginBottom: 16
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#16a34a", // Verde sucesso
    marginBottom: 12
  }
};

export default AccountActive;