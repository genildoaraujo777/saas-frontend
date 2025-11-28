declare module '*.png' {
  const value: string;
  export default value;
}

interface ImportMetaEnv {
  // O prefixo VITE_ é obrigatório para variáveis de ambiente públicas no Vite
  readonly VITE_BASE_URL: string;
  // 🟢 NOVIDADE: Chave pública do Mercado Pago
  readonly VITE_MP_PUBLIC_KEY: string; 
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 🟢 NOVIDADE: Tipagem global para o SDK do Mercado Pago
declare global {
  interface Window {
    MercadoPago: any; // O objeto global injetado pelo script
  }
}

// CRÍTICO: Exporta um objeto vazio para forçar o arquivo a ser tratado como um MÓDULO,
// garantindo que as declarações globais sejam injetadas corretamente no seu projeto Vite.
export {};