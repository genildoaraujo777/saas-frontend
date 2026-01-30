// Formata o CEP para 00000-000 enquanto o usuário digita
export const formatCep = (value: string) => {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
};

// Busca dados na API ViaCEP
export const fetchAddressByCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, "");
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    return data.erro ? null : data;
  } catch (error) {
    console.error("Erro ViaCEP:", error);
    return null;
  }
};