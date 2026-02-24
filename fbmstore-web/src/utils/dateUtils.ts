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

export const parseISOToDateBR = (isoStr: string) => {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); 
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    } catch { return ''; }
};

export const parseDateBRToISO = (str: string) => {
    if (!str || str.length < 10) return new Date().toISOString();
    try {
        const [datePart, timePart] = str.split(' ');
        const [d, m, y] = datePart.split('/').map(Number);
        let h = 0, min = 0;
        if (timePart) { [h, min] = timePart.split(':').map(Number); }
        if (!y || !m || !d) throw new Error("Data inválida");
        return new Date(y, m - 1, d, h || 0, min || 0).toISOString();
    } catch (e) {
        return new Date().toISOString();
    }
};