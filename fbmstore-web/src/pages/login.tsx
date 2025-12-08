// src/app/login.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { clientSession, login, searchAccountData } from "@/services/AuthenticationService";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

// Se preferir import estático:
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png";
import { useClient } from "@/contexts/ClientContext";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const { clients, fetchClients, loggedClient, fetchLoggedUserProfile, isAdmin, logoutClient } = useClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleEmail = (text: string) => setEmail(text.toLowerCase());

  const showToast = (title: string, message: string) => {
    // substituto simples p/ react-native-toast-message
    // (se quiser, troco por react-hot-toast depois)
    alert(`${title}\n\n${message}`);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast("Campos obrigatórios", "Informe e-mail e senha.");
      return;
    }

    try {
      setSubmitting(true);

      const result = await login(email, password);
      if (result && result.token) {
        localStorage.setItem("token", result.token);

        await fetchLoggedUserProfile(result.token);
        
        navigate("/", { replace: true });
      } else {
        localStorage.removeItem("token");
        showToast("Deu ruim!", result?.msg ?? "Erro ao autenticar.");
      }
    } catch (e) {
      localStorage.removeItem("token");
      showToast("Erro inesperado", "Tente novamente em instantes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img
          src={LOGO}
          alt="FBM Personalizados"
          style={styles.logo as React.CSSProperties}
        />

        {/* Adicionado um div para envolver os inputs e botões */}
        <div style={styles.form}>
          <FloatingLabelInput
            label="E-mail"
            value={email}
            onChangeText={handleEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect="off"
            containerWidth={"100%"}
          />

          <div style={{ position: "relative" }}>
            <FloatingLabelInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCorrect="off"
              containerWidth={"100%"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              style={styles.eyeBtn}
            >
              {showPassword ? <MdVisibility size={22} /> : <MdVisibilityOff size={22} />}
            </button>
          </div>

          <button
            onClick={handleLogin}
            disabled={submitting}
            style={{
              ...styles.button,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>

          <div style={styles.linksWrap}>
            <Link to="/reset_password" style={styles.link}>
              Esqueci a senha
            </Link>
            <Link to="/register" style={styles.link}>
              Não tem conta? Criar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f5f5f5",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,.08)",
    padding: "28px 24px 24px",
    textAlign: "center" as const,
  },
  logo: {
    width: 220,
    height: 220,
    objectFit: "cover",
    margin: "0 auto 24px",
    borderRadius: 8,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
    maxWidth: 420,
    margin: "0 auto",
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    background: "#e799a6",
    color: "#fff",
    borderRadius: 8,
    border: 0,
    fontWeight: 700 as const,
    boxSizing: "border-box",
  },
  link: {
    color: "#e799a6",
    textDecoration: "none",
    fontWeight: 600 as const,
  },
  linksWrap: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
  },
  eyeBtn: {
    position: "absolute" as const,
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    padding: 4,
  },
};

export default LoginPage;