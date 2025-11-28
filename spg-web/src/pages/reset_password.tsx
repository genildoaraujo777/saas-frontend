// src/app/reset_password.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  resetRegister,
  searchCodeReset,
  sendResetPasswordCode,
} from "@/services/AuthenticationService";
// @ts-ignore
import LOGO from "@/assets/images/LOGO.png";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [enableInputsCode, setEnableInputsCode] = useState(false);
  const [enableInputsPassword, setEnableInputsPassword] = useState(false);

  const showToast = (title: string, message: string) => {
    // substitui o react-native-toast-message; se quiser, troco por react-hot-toast depois
    alert(`${title}\n\n${message}`);
  };

  const handleResetPassword = async (emailDigitado: string) => {
    try {
      const result = await sendResetPasswordCode(emailDigitado);
      if (result?.isValid) {
        showToast("Código enviado!", result.msg ?? "Verifique seu e-mail.");
        setEnableInputsCode(true);
      } else {
        localStorage.removeItem("token");
        showToast("Deu ruim!", result?.msg || "Erro ao enviar código.");
      }
    } catch {
      showToast("Erro inesperado", "Tente novamente em instantes.");
    }
  };

  const handleVerifyCode = async (code: number) => {
    try {
      const responseCodeReset = await searchCodeReset(String(code));
      if (responseCodeReset?.isValidCode) {
        showToast("Ok!", responseCodeReset.msg ?? "Código verificado.");
        setEnableInputsPassword(true);
      } else {
        showToast("Deu ruim!", responseCodeReset?.msg || "Código inválido.");
      }
    } catch {
      showToast("Erro inesperado", "Tente novamente em instantes.");
    }
  };

  const handleResetRegister = async () => {
    if (password !== confirmPassword) {
      showToast("Deu ruim!", "As senhas não coincidem.");
      return;
    }

    try {
      const result = await resetRegister({ email, password, confirmPassword });
      if (result?.isReseted) {
        showToast("Oba!", result.msg ?? "Senha redefinida com sucesso.");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      } else {
        showToast("Deu ruim!", result?.msg || "Erro ao redefinir senha.");
      }
    } catch {
      showToast("Erro inesperado", "Tente novamente em instantes.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img
          src={LOGO}
          alt="SPG Personalizados"
          style={styles.logo as React.CSSProperties}
        />

        <input
          style={styles.input as React.CSSProperties}
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
        <button
          style={styles.buttonBlue as React.CSSProperties}
          onClick={() => handleResetPassword(email)}
          disabled={email.length < 6}
        >
          Enviar Código
        </button>

        <input
          style={styles.input as React.CSSProperties}
          placeholder="Código de 6 dígitos numéricos"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          disabled={!enableInputsCode}
        />
        <button
          style={styles.buttonBlue as React.CSSProperties}
          onClick={() => handleVerifyCode(Number(inputCode))}
          disabled={inputCode.length < 6}
        >
          Verificar Código
        </button>

        <input
          style={styles.input as React.CSSProperties}
          placeholder="Nova Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          disabled={!enableInputsPassword}
        />
        <input
          style={styles.input as React.CSSProperties}
          placeholder="Confirmar Nova Senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          disabled={!enableInputsPassword}
        />

        <button
          style={styles.button as React.CSSProperties}
          onClick={handleResetRegister}
          disabled={!enableInputsPassword}
        >
          Salvar Nova Senha
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f5f5f5",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,.08)",
    padding: 24,
    textAlign: "center" as const,
  },
  logo: { width: 260, height: 260, objectFit: "cover", marginBottom: 24 },
  input: {
    width: "100%",
    padding: "10px 12px",
    margin: "10px 0",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    background: "#0288d1",
    color: "#fff",
    borderRadius: 8,
    border: 0,
    fontWeight: 700 as const,
    marginTop: 10,
    cursor: "pointer",
  },
  buttonBlue: {
    background: "#00A8FF",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 6,
    border: 0,
    fontWeight: 700 as const,
    marginTop: 6,
    cursor: "pointer",
  },
};

export default ResetPasswordPage;
