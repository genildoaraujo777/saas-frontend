// fbmstore-web/src/services/PaymentService.ts
import api from "./api";

// O endpoint do microsserviço 'pagto' é /checkout/process (conforme pagto/src/router.ts)
const CHECKOUT_ENDPOINT = "/pagto/checkout/process"; 

/**
 * Payload para o serviço de pagamento (deve ser tipado conforme o MercadoPagoService do pagto).
 */
interface CheckoutPayload {
    orderId: string;
    transactionAmount: number;
    paymentMethodId: string;
    token: string; // Token do cartão gerado no frontend
    issuerId: string | null;
    payer: {
        email: string;
        name: string;
        // 🟢 ADICIONE O OBJETO DE IDENTIFICAÇÃO AQUI
        identification?: { 
            type: string; // Ex: 'CPF'
            number: string; // O número do CPF
        };
        // Adicione outros campos se necessário (ex: nome, CPF, endereço)
    };
    installments: number;
}

/**
 * Resposta do serviço de pagamento.
 */
interface CheckoutResponse {
    status: string; // 'approved', 'pending', 'rejected', etc.
    message: string; // Detalhe do status
    // Adicione outros dados de retorno do MP
}


/**
 * Processa o pagamento através do microserviço de Pagamentos.
 * @param tokenAuth O token JWT do usuário.
 * @param payload Os dados do pagamento (incluindo o token do cartão).
 * @returns Um objeto com o status do pagamento ou um erro.
 */
export async function processPayment(tokenAuth: string, payload: CheckoutPayload): Promise<{ success: boolean, status?: string, message?: string, errorMsg?: string }> {
  try {
    const result = await api.post<CheckoutResponse>(
      CHECKOUT_ENDPOINT, 
      payload, 
      { headers: { Authorization: `Bearer ${tokenAuth}` } }
    );
    
    // O microsserviço `pagto` retorna 200/OK, o status real está no corpo.
    return { 
      success: true, 
      status: result.data.status, 
      message: result.data.message 
    };

  } catch (error) {
    console.error("[PaymentService] Erro ao processar pagamento:", error);
    // @ts-ignore
    const errorMsg = error.response?.data?.error || error.message || "Erro de conexão ao processar pagamento.";
    
    return { 
      success: false, 
      errorMsg 
    };
  }
}