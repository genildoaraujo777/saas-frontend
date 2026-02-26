import { useState, useEffect, useMemo, useRef } from "react";
import { OSService, IOSProduct } from "@/services/OSService";
import { fetchAddressByCep, formatCep } from "@/utils/addressUtils";
import { maskDate, nativeToMaskedDate } from "@/utils/dateUtils";
import { maskCpfCnpj, validateCpfCnpj } from "@/utils/validators";
import { numberToBRL } from "@/utils/currency";

export const useOSForm = (osId?: string) => {
  const lastSearchedCep = useRef("");
  
  // Estado principal da OS
  const [osData, setOsData] = useState({
    _id: undefined,
    numero: 0,
    dataEmissao: new Date().toLocaleString(),
    status: "AGUARDANDO APROVAÇÃO",
    prioridade: "NORMAL",
    cliente: "",
    documento: "",
    contato: "",
    email: "",
    endereco: {
      cep: "", street: "", number: 0, neighborhood: "",
      city: "", uf: "", complement: ""
    },
    equipamento: "", marcaModelo: "", serialIMEI: "",
    acessorios: "", checklist: "", defeitoRelatado: "",
    diagnosticoTecnico: "", tecnicoResponsavel: "",
    dataDeixouEqp: "", dataRetirouEqp: "", dataPrevistaParaRetirada: "",
    pagamento: "PIX", frete: 0, desconto: 0, valorMaoDeObra: 0,
    termosGarantia: "90 dias de garantia sobre o serviço.",
    obs: "",
    customFields: {
      empresa: [] as { id: string; label: string; value: string }[],
      cliente: [] as { id: string; label: string; value: string }[],
      equipamento: [] as { id: string; label: string; value: string }[],
      servico: [] as { id: string; label: string; value: string }[],
      financeiro: [] as { id: string; label: string; value: string }[],
      encerramento: [] as { id: string; label: string; value: string }[],
    }
  });

  const [itens, setItens] = useState([{ id: Date.now(), qtd: 1, produto: "", preco: 0 }]);
  const [documentoValido, setDocumentoValido] = useState(true);

  // Inicialização (Load Template ou Load OS)
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token') || "";
      try {
        if (osId) {
          const osGravada = await OSService.getOSById(osId, token);
          setOsData(osGravada);
          if (osGravada.itens) setItens(osGravada.itens);
        } else {
          const template = await OSService.getTemplate(token);
          if (template) {
            setOsData(prev => ({
              ...prev,
              customFields: template.customFieldsLayout,
              termosGarantia: template.defaultTermosGarantia || prev.termosGarantia
            }));
          }
        }
      } catch (err) { console.error("Erro ao carregar dados iniciais."); }
    };
    init();
  }, [osId]);

  // Cálculos de Totais
  const totais = useMemo(() => {
    const subtotalItens = itens
      .filter(item => item.produto && item.produto.trim() !== "")
      .reduce((acc, item) => acc + (item.qtd * item.preco), 0);
    
    const base = subtotalItens + (Number(osData.valorMaoDeObra) || 0) + (Number(osData.frete) || 0);
    const valorDesconto = base * ((Number(osData.desconto) || 0) / 100);
    
    return {
      subtotalPeças: subtotalItens,
      subtotalGeral: base,
      total: base - valorDesconto
    };
  }, [itens, osData.frete, osData.desconto, osData.valorMaoDeObra]);

  // Handlers de Input
  const handleInputChange = (e: any) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseFloat(value) || 0 : value;
    setOsData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setOsData(prev => ({ ...prev, endereco: { ...prev.endereco, cep: formatted } }));
    
    const cleanCep = formatted.replace(/\D/g, "");
    if (cleanCep.length === 8 && cleanCep !== lastSearchedCep.current) {
      lastSearchedCep.current = cleanCep;
      const data = await fetchAddressByCep(formatted);
      if (data) {
        setOsData(prev => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            uf: data.uf,
          }
        }));
      }
    }
  };

  return {
    osData, setOsData,
    itens, setItens,
    totais,
    documentoValido, setDocumentoValido,
    handleInputChange,
    handleCepChange
  };
};