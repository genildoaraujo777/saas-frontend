// Máscara para formatar string como dd/mm/aaaa durante a digitação
export const maskDate = (value: string): string => {
  return value
    .replace(/\D/g, "") // Remove tudo que não é número
    .replace(/(\d{2})(\d)/, "$1/$2") // Coloca a primeira barra
    .replace(/(\d{2})(\d)/, "$1/$2") // Coloca a segunda barra
    .replace(/(\d{4})(\d)/, "$1") // Limita a 10 caracteres (dd/mm/aaaa)
    .substring(0, 10);
};

// Opcional: Validar se a data é real (ex: evitar 32/13/2024)
export const isValidDate = (dateStr: string): boolean => {
  if (dateStr.length !== 10) return false;
  const [day, month, year] = dateStr.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// Converte yyyy-mm-dd para dd/mm/aaaa
export const nativeToMaskedDate = (date: string): string => {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};