// Máscara dinâmica para CPF ou CNPJ
export const maskCpfCnpj = (value: string) => {
  const clean = value.replace(/\D/g, "");
  
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }

  return clean
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

// Remove caracteres não numéricos
const cleanString = (value: string) => value.replace(/\D/g, "");

// Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
const isRepeated = (value: string) => {
  const first = value[0];
  return value.split("").every((char) => char === first);
};

// Algoritmo de validação do dígito verificador (Módulo 11)
const calcDigit = (digits: string, factor: number) => {
  let total = 0;
  let multiplier = factor;

  for (let i = 0; i < digits.length; i++) {
    total += parseInt(digits[i]) * multiplier--;
    if (multiplier < 2) multiplier = 9;
  }

  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

// Validação específica de CPF
const isValidCPF = (cpf: string): boolean => {
  if (cpf.length !== 11 || isRepeated(cpf)) return false;

  const digit1 = calcDigit(cpf.slice(0, 9), 10);
  const digit2 = calcDigit(cpf.slice(0, 9) + digit1, 11);

  return cpf.slice(9) === `${digit1}${digit2}`;
};

// Validação específica de CNPJ
const isValidCNPJ = (cnpj: string): boolean => {
  if (cnpj.length !== 14 || isRepeated(cnpj)) return false;

  // O fator inicial para CNPJ muda (começa em 5 e 6)
  const digit1 = calcDigit(cnpj.slice(0, 12), 5);
  const digit2 = calcDigit(cnpj.slice(0, 12) + digit1, 6);

  return cnpj.slice(12) === `${digit1}${digit2}`;
};

// --- FUNÇÃO PRINCIPAL EXPORTADA ---
export const validateCpfCnpj = (value: string): boolean => {
  const cleanValue = cleanString(value);

  if (cleanValue.length === 11) return isValidCPF(cleanValue);
  if (cleanValue.length === 14) return isValidCNPJ(cleanValue);

  return false; // Tamanho inválido (nem CPF nem CNPJ)
};