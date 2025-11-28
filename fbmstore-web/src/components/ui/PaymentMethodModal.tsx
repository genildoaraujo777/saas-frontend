import React, { useMemo, useState } from "react";

type PaymentMap = {
  cheque: boolean;
  boleto: boolean;
  pix: boolean;
  dinheiro: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** dispara quando o usuário confirma (opcional) */
  onConfirm?: (selected: PaymentMap) => void;
  /** valores iniciais (opcional) */
  initial?: Partial<PaymentMap>;
};

const defaultState: PaymentMap = {
  cheque: false,
  boleto: false,
  pix: false,
  dinheiro: false,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.5)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  width: "100%",
  maxWidth: 420,
  borderRadius: 12,
  boxShadow: "0 10px 40px rgba(0,0,0,.2)",
  padding: 20,
};

const footerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  marginTop: 16,
};

const btnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: 0,
  cursor: "pointer",
  fontWeight: 700,
};

const outlineBtn: React.CSSProperties = {
  ...btnStyle,
  background: "#f1f1f1",
};

const primaryBtn: React.CSSProperties = {
  ...btnStyle,
  background: "#e799a6",
  color: "#fff",
};

export default function PaymentMethodModal({
  open,
  onClose,
  onConfirm,
  initial,
}: Props) {
  const initialState = useMemo<PaymentMap>(
    () => ({ ...defaultState, ...initial }),
    [initial]
  );

  const [selected, setSelected] = useState<PaymentMap>(initialState);

  // sempre que abrir, reseta com os valores iniciais
  React.useEffect(() => {
    if (open) setSelected(initialState);
  }, [open, initialState]);

  const toggle = (method: keyof PaymentMap) => {
    setSelected((prev) => ({ ...prev, [method]: !prev[method] }));
  };

  const confirm = () => {
    onConfirm?.(selected);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        // fecha clicando fora do modal
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div style={modalStyle}>
        <h2 id="payment-modal-title" style={{ margin: 0, marginBottom: 12 }}>
          Escolha o método de pagamento
        </h2>

        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={selected.cheque}
              onChange={() => toggle("cheque")}
            />
            Cheque
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={selected.boleto}
              onChange={() => toggle("boleto")}
            />
            Boleto
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={selected.pix}
              onChange={() => toggle("pix")}
            />
            Pix
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={selected.dinheiro}
              onChange={() => toggle("dinheiro")}
            />
            Dinheiro
          </label>
        </div>

        <div style={footerStyle}>
          <button type="button" onClick={onClose} style={outlineBtn}>
            Fechar
          </button>
          <button type="button" onClick={confirm} style={primaryBtn}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
