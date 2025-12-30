// src/hooks/useDocument.ts
import { useState, useCallback } from "react";
import { validateCpfCnpj } from "@/utils/validators"; // Certifique-se de ter criado esse arquivo conforme conversamos antes

export const useDocument = (initialValue: string = "") => {
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);

  // Valor limpo para enviar ao Back-end
  const rawValue = value.replace(/\D/g, "");

  // Adaptado para receber direto a STRING (padrão do seu FloatingLabelInput)
  const onChangeText = useCallback((text: string) => {
    // 1. Limpa erro ao digitar (Melhor UX)
    if (error) setError(null);

    let cleanText = text.replace(/\D/g, "");
    cleanText = cleanText.slice(0, 14); // Limite CNPJ

    // Lógica da Máscara
    if (cleanText.length <= 11) {
      cleanText = cleanText.replace(/(\d{3})(\d)/, "$1.$2");
      cleanText = cleanText.replace(/(\d{3})(\d)/, "$1.$2");
      cleanText = cleanText.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      cleanText = cleanText.replace(/^(\d{2})(\d)/, "$1.$2");
      cleanText = cleanText.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      cleanText = cleanText.replace(/\.(\d{3})(\d)/, ".$1/$2");
      cleanText = cleanText.replace(/(\d{4})(\d)/, "$1-$2");
    }

    setValue(cleanText);
  }, [error]);

  const onBlur = useCallback(() => {
    // Valida apenas se tiver dados
    if (rawValue.length > 0 && !validateCpfCnpj(rawValue)) {
      setError("Documento inválido.");
    }
  }, [rawValue]);

  return {
    value,
    rawValue,
    error,
    onChangeText, // Encaixa direto no seu componente
    onBlur,
    isValid: !error && rawValue.length >= 11
  };
};