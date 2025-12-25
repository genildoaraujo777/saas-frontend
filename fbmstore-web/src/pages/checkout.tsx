// fbmstore-web/src/pages/checkout.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import { useCart } from '@/contexts/CartContext';
import { useOrder } from '@/contexts/OrderContext';
import { useStock } from '@/contexts/StockContext';
import { useModal } from '@/contexts/ModalContext';
import { processPayment } from '@/services/PaymentService';
import { checkTokenValidity, searchAccountData } from '@/services/AuthenticationService';
import { brlToNumber, numberToBRL } from '@/utils/currency';
import { CartItem } from '@/types';
import { useClient } from '@/contexts/ClientContext';

// Variável global para o SDK do Mercado Pago
// A variável 'mp' será inicializada dentro do useEffect
let mp: any = null;

const CheckoutScreen: React.FC = () => {
    const navigate = useNavigate();
    const { clients, fetchClients, loggedClient, isAdmin } = useClient();
    const { cartItems, clearCart } = useCart();
    const { createOrder, searchOrders } = useOrder();
    const { updateStock } = useStock();
    const { showModal, hideModal } = useModal();
    
    const [isLoading, setIsLoading] = useState(false);
    const [installments, setInstallments] = useState('1');

    // Dados do Pagador (pegamos do localStorage/conta)
    const [payerEmail, setPayerEmail] = useState('');
    const [payerName, setPayerName] = useState(loggedClient?.client.name || '');
    // 🟢 NOVO ESTADO PARA O CPF (OU DOCUMENTO DE IDENTIFICAÇÃO)
    const [payerIdentification, setPayerIdentification] = useState(''); 
    
    // 🟢 ESTADOS REAIS DO CARTÃO (PARA COLETA E TOKENIZAÇÃO)
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    

    // 🟢 EFEITO PARA INICIALIZAR O MP SDK (CORRIGIDO)
    useEffect(() => {
        // Usa a chave pública do ambiente (definida em .env e tipada em vite-env.d.ts)
        // @ts-ignore
        const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY; 

        // O MP SDK (V2) injeta a classe `MercadoPago` no `window`.
        if (window.MercadoPago && publicKey && !mp) {
            console.log('window.MercadoPago: ',window.MercadoPago);
            console.log('mp no useeffect antes: ',mp);
            try {
                // SOLUÇÃO: Inicialize o SDK apenas com a chave pública.
                // Isso garante o uso correto do mp.card.createToken (Core Methods / V2).
                mp = new window.MercadoPago(publicKey);
                console.log('mp no useeffect depois: ',mp);
                
                // Verificação de segurança para debug:
                if (mp && typeof mp.createCardToken === 'function') { // <--- MUDANÇA AQUI
                     console.log("✅ Mercado Pago SDK (Core Methods) inicializado com sucesso.");
                } else {
                     console.error("⚠️ SDK inicializado, mas o método createCardToken não está disponível."); // <--- MUDANÇA AQUI
                }

            } catch (error) {
                console.error("Erro ao inicializar o Mercado Pago SDK:", error);
                alert("Erro ao carregar o SDK de pagamento. Verifique a chave pública.");
            }
        }
    }, []);

    const formatCardNumber = (value: string): string => {
        // 1. Remove tudo que não for dígito
        const numericValue = value.replace(/\D/g, '');

        // 2. Aplica a máscara, inserindo espaço a cada 4 dígitos
        let formattedValue = '';
        for (let i = 0; i < numericValue.length && i < 16; i++) {
            formattedValue += numericValue[i];
            if ((i + 1) % 4 === 0 && i !== numericValue.length - 1) {
                formattedValue += ' ';
            }
        }
        return formattedValue;
    };

    // 🟢 NOVO: Função para formatar o CPF no padrão XXX.XXX.XXX-XX
    const formatCPF = (value: string): string => {
        const numericValue = value.replace(/\D/g, ''); // Remove tudo que não for dígito
        let formattedValue = numericValue;

        // 000.000.000-00 (11 dígitos)
        if (formattedValue.length > 3) {
            formattedValue = formattedValue.replace(/^(\d{3})/, '$1.');
        }
        if (formattedValue.length > 7) {
            formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
        }
        if (formattedValue.length > 11) {
            formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
        }
        
        // Limita o tamanho total (11 dígitos + 3 pontos + 1 traço = 14)
        return formattedValue.substring(0, 14);
    };

    // 🟢 NOVO: Função para formatar a data de vencimento no padrão MM/AA
    const formatExpiryDate = (value: string): string => {
        const numericValue = value.replace(/\D/g, ''); // Remove tudo que não for dígito
        let formattedValue = numericValue;

        // MM/AA (4 dígitos)
        if (formattedValue.length > 2) {
            formattedValue = formattedValue.replace(/^(\d{2})/, '$1/');
        }
        // Limita o tamanho total (2 dígitos + 1 barra + 2 dígitos = 5)
        return formattedValue.substring(0, 5);
    };

    // Calcula o valor total do pedido
    const totalPrice = cartItems.reduce((sum, item: CartItem) => {
        const rawValue = item.price ?? item.unitPrice;
        const numericPrice = brlToNumber(rawValue);
        return sum + numericPrice * item.quantity;
    }, 0);

    const formatCurrency = (value: number) => numberToBRL(value);

    // Validação básica do carrinho
    const isCartValid = useMemo(() => cartItems.length > 0 && totalPrice > 0, [cartItems.length, totalPrice]);
    
    // 🟢 VALIDAÇÃO DE CAMPOS DO CARTÃO (ATUALIZADA com CPF)
    const isCardDataValid = useMemo(() => {
        // Remove caracteres não numéricos e espaços do CPF
        const cleanedId = payerIdentification.replace(/[^\d]+/g, ''); 
        console.log('cleanedId: ',cleanedId);
        
        return (
            payerEmail.length > 5 && payerEmail.includes('@') && 
            cardNumber.replace(/\s/g, '').length >= 13 && // Pelo menos 13 dígitos
            cardHolder.length > 0 &&
            expiryDate.match(/^\d{2}\/\d{2}$/) && // Formato MM/AA
            securityCode.length >= 3 &&
            parseInt(installments) > 0 &&
            cleanedId.length === 11 // 🟢 CPF (11 dígitos) é obrigatório no MP
        );
    }, [payerEmail, payerIdentification, cardNumber, cardHolder, expiryDate, securityCode, installments]);

    // 🟢 FUNÇÃO DE TOKENIZAÇÃO (Cria o Token)
    const tokenizeCard = async (): Promise<string | null> => {
        if (!mp) {
            alert("SDK do Mercado Pago não está carregado. Tente recarregar a página.");
            return null;
        }
        
        if (typeof mp.createCardToken !== 'function') {
            // Este alerta deve sumir após a correção do código
            console.error("Módulo 'createCardToken' não encontrado no objeto mp. Verifique o console.");
            alert("Falha de ambiente. O módulo de cartão do MP não está disponível. Tente recarregar.");
            return null;
        }

        try {
             // Formato do MP: MM/YY
             const [month, year] = expiryDate.split('/');
             console.log('month: ',month);
             console.log('year: ',year);
             console.log('payerIdentification no tokenizecard: ',payerIdentification);
             
             // Limpa o CPF/CNPJ antes de enviar
             const cleanedId = payerIdentification.replace(/[^\d]+/g, ''); 
             console.log('cleanedId2: ',cleanedId);
             
             // NOTA: Para inputs customizados no Core Methods, o MP usa o 'card' object.
             const cardTokenData = {
                  cardNumber: cardNumber.replace(/\s/g, ''),
                  cardholderName: cardHolder,
                  cardExpirationMonth: month,
                  cardExpirationYear: year, // MP espera 2 dígitos do ano no SDK V2 para tokenização Core.
                  securityCode: securityCode,
                  identificationType: 'CPF', 
                  identificationNumber: cleanedId, 
             };
             
             console.log('cardTokenData: ',cardTokenData);
             // mp.card.createToken é o método Core (V2) para tokenização
             const tokenResponse = await mp.createCardToken(cardTokenData);
             console.log('tokenResponse: ',tokenResponse);
             console.log('tokenResponseid: ',tokenResponse.id);

             // O token é o ID da resposta (o card_token_id que queremos)
             return tokenResponse.id; 
            
        } catch (error) {
            console.error("Erro na tokenização do cartão:", error);
            // @ts-ignore
            const errorMsg = error.message || 'Erro desconhecido na tokenização.';
            alert(`Falha na tokenização: ${errorMsg}. Verifique os dados do cartão.`);
            return null;
        }
    };

    // 🛑 CORREÇÃO: Função que busca ID do método (bandeira) E o ID do emissor (issuerId)
    const getPaymentDetails = async (cardBin: string): Promise<{ paymentMethodId: string | null, issuerId: string | null }> => {
        console.log('cardBinAntes: ', cardBin);
        const bin = cardBin.replace(/\s/g, '').substring(0, 6);
        console.log('cardBinDepois: ', bin);
        if (!mp || bin.length < 6) {
            return { paymentMethodId: null, issuerId: null };
        }

        try {
            // mp.getPaymentMethods retorna a bandeira e o emissor padrão (issuer)
            const paymentMethods = await mp.getPaymentMethods({ bin });
            console.log(
                'paymentMethods no getPaymentDetails (JSON): ', 
                JSON.stringify(paymentMethods, null, 2)
            );

            if (paymentMethods && paymentMethods.results.length > 0) {
                const method = paymentMethods.results[0];
                const defaultIssuer = method.issuer ? method.issuer.id : null; 
                const paymentMethodId = method.id; // <-- ID da bandeira (ex: visa, master)
                
                if (paymentMethodId) {
                    console.log(`✅ Bandeira encontrada: ${paymentMethodId}. Emissor ID: ${defaultIssuer}`);
                    return { paymentMethodId, issuerId: defaultIssuer };
                }
            }
            
            console.warn("⚠️ Bandeira/Emissor não encontrado ou BIN inválido para o MP.");
            return { paymentMethodId: null, issuerId: null };

        } catch (error) {
            console.error("Erro ao buscar detalhes do cartão:", error);
            return { paymentMethodId: null, issuerId: null };
        }
    };

    const handleFinalizeAndPay = async () => {
        // Certifique-se de que o issuerId foi encontrado antes de tokenizar!
        if (!isCartValid || !isCardDataValid) {
            alert("Por favor, preencha corretamente o carrinho e os dados obrigatórios do cartão.");
            return;
        }

        const tokenAuth = localStorage.getItem('token');
        if (!tokenAuth || !(await checkTokenValidity(tokenAuth))) {
            alert("Sessão expirou. Por favor, entre novamente.");
            navigate('/login', { replace: true });
            return;
        }

        setIsLoading(true);

        try {
            // 💡 PASSO 1: BUSCAR DETALHES DO PAGAMENTO (BANDEIRA E EMISSOR)
            const { paymentMethodId, issuerId: fetchedIssuerId } = await getPaymentDetails(cardNumber); // 🛑 MUDANÇA AQUI
            console.log('paymentMethodId: ', paymentMethodId);
            console.log('fetchedIssuerId: ', fetchedIssuerId);

            if (!paymentMethodId) { // Agora verifica se a bandeira foi encontrada
                alert("Não foi possível identificar a bandeira e o banco emissor. Verifique o número do cartão.");
                return;
            }

            // 2. GERAR O TOKEN DO CARTÃO
            const generatedToken = await tokenizeCard();
            
            if (!generatedToken) { 
                return; 
            }
            console.log('generatedToken: ',generatedToken);
            console.log('payerIdentification: ',payerIdentification);

            // 3. CHAMA O MICROSSERVIÇO PAGTO COM O TOKEN REAL
            const cleanedPayerIdentification = payerIdentification.replace(/[^\d]+/g, '');

            // 4. CHAMA O MICROSSERVIÇO PAGTO COM OS DADOS CORRETOS
            const paymentResult = await processPayment(tokenAuth, {
                orderId: `ORDER-${Date.now()}`, 
                transactionAmount: totalPrice,
                paymentMethodId: paymentMethodId, // 🛑 USAR A BANDEIRA ENCONTRADA (EX: 'visa', 'master')
                token: generatedToken, 
                issuerId: fetchedIssuerId, 
                payer: { 
                    email: payerEmail,
                    name: cardHolder, // Passa o nome do cardHolder para o backend
                    identification: {
                        type: 'CPF', 
                        number: cleanedPayerIdentification,
                    }
                },
                installments: parseInt(installments, 10),
            });
            console.log('paymentResult no handleFinalizeAndPay: ', paymentResult);

            if (paymentResult.success && paymentResult.status === 'processed' && paymentResult.message === 'accredited') {
                
                await createLocalOrder(tokenAuth, paymentResult.status);
                
                showModal('Sucesso!', (
                    <p style={{ color: 'green' }}>Pagamento APROVADO! Seu pedido está sendo processado.</p>
                ), <button style={styles.buttonBlueLarge} onClick={() => { hideModal(); clearCart(); navigate('/store/orders'); }}>Ver Assinaturas</button>);

            } else {
                const statusMsg = paymentResult.status === 'pending' ? 'em análise' : 'rejeitado';
                await createLocalOrder(tokenAuth, statusMsg);
                showModal('Atenção', (
                    <p style={{ color: paymentResult.status === 'pending' ? 'orange' : 'red' }}>
                        Pagamento {statusMsg}. Detalhes: {paymentResult.message || paymentResult.errorMsg}
                    </p>
                ), <button style={styles.buttonBlueLarge} onClick={hideModal}>Tentar Novamente</button>);
            }
        } catch (error) {
            alert(`Erro no pagamento: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Função refatorada para criar o pedido APÓS o pagamento
    const createLocalOrder = async (tokenAuth: string, paymentStatus: string) => {
        let totalOrderItems = 0;

        const itemsOrderForContext = cartItems.map((item: CartItem) => { 
            updateStock(item._id!!, -item.quantity); 
            totalOrderItems += item.quantity;
            return item; 
        });

        const orders = await searchOrders(tokenAuth, isAdmin);
        const lastOrder = orders.length > 0 ? orders[0] : undefined;

        const clientID = loggedClient?.client?._id;

        const newOrder = {
            numberOrder: (lastOrder?.numberOrder ?? 0) + 1,
            createdAt: new Date().toISOString(),
            itemsOrder: itemsOrderForContext, 
            totalPrice: totalPrice,
            quantityItems: totalOrderItems,
            statusOrder: paymentStatus, 
            client: clientID,
        };

        await createOrder(newOrder, tokenAuth);
    }


    const handleBackToCart = () => navigate('/cart');

    return (
        <div style={styles.page}>
            <header style={styles.header as React.CSSProperties}>
                <button onClick={handleBackToCart} style={styles.backBtn as React.CSSProperties}>
                    Voltar ao Carrinho
                </button>
                <h1 style={styles.headerTitle as React.CSSProperties}>Finalizar Compra</h1>
                <span style={{ width: 60 }} />
            </header>

            <main style={styles.main}>
                <div style={styles.formContainer}>
                    <h2 style={styles.sectionTitle}>Resumo do Pedido</h2>
                    <div style={styles.summaryContainer}>
                        <div style={styles.summaryRow}>
                            <span>Itens:</span>
                            <span>{cartItems.length}</span>
                        </div>
                        <div style={styles.summaryRow}>
                            <span style={styles.summaryTotalLabel}>Total a Pagar:</span>
                            <span style={styles.summaryTotalValue}>{formatCurrency(totalPrice)}</span>
                        </div>
                    </div>
                    
                    <h2 style={styles.sectionTitle}>Dados de Pagamento</h2>

                    {/* 1. INPUT DE E-MAIL */}
                    <FloatingLabelInput
                        label="E-mail do Pagador"
                        value={payerEmail}
                        onChangeText={setPayerEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        containerWidth={'100%'}
                    />
                    
                    {/* 🟢 NOVO INPUT PARA O CPF */}
                    <FloatingLabelInput
                        label="CPF do Pagador (Somente números)"
                        value={payerIdentification}
                        onChangeText={(text) => setPayerIdentification(formatCPF(text))}
                        keyboardType="numeric"
                        containerWidth={'100%'}
                        maxLength={14}
                    />

                    {/* 2. COLETA DE DADOS DO CARTÃO (REAL) */}
                    <h3 style={styles.subSectionTitle}>Informações do Cartão de Crédito (Teste)</h3>
                    
                    <FloatingLabelInput
                        label="Número do Cartão: Ex: 4000 1234 5678 9010"
                        value={cardNumber}
                        onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                        keyboardType="numeric"
                        containerWidth={'100%'}
                    />

                    <FloatingLabelInput
                        label="Nome no Cartão"
                        value={cardHolder}
                        onChangeText={setCardHolder}
                        containerWidth={'100%'}
                    />
                    
                    {/* Linha com Vencimento e CVV */}
                    <div style={styles.row}>
                        <FloatingLabelInput
                            label="Vencimento (MM/AA)"
                            value={expiryDate}
                            onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                            containerWidth={'48%'}
                        />
                         <FloatingLabelInput
                            label="CVV"
                            value={securityCode}
                            onChangeText={setSecurityCode}
                            keyboardType="numeric"
                            containerWidth={'48%'}
                            secureTextEntry 
                        />
                    </div>
                    
                    <FloatingLabelInput
                        label="Parcelas"
                        value={installments}
                        onChangeText={setInstallments}
                        keyboardType="numeric"
                        containerWidth={'100%'}
                    />
                    

                    <button
                        onClick={handleFinalizeAndPay}
                        disabled={isLoading || !isCartValid || !isCardDataValid}
                        style={{
                            ...styles.buttonBlueLarge,
                            opacity: isLoading || !isCartValid || !isCardDataValid ? 0.7 : 1,
                            cursor: isLoading || !isCartValid || !isCardDataValid ? 'not-allowed' : 'pointer',
                            marginTop: 20,
                        }}
                    >
                        <span style={styles.buttonText}>
                            {isLoading ? 'Processando Pagamento...' : `Pagar ${formatCurrency(totalPrice)}`}
                        </span>
                    </button>

                </div>
            </main>
        </div>
    );
};

export default CheckoutScreen;


const styles: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' as const },
   header: {
    background: "#0f172a", 
    color: "#fff",
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1e293b",
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  headerTitle: { fontSize: 20, fontWeight: 700 as const, color: "#fff", margin: 0, letterSpacing: '0.5px' },
    backBtn: {
        background: 'transparent',
        border: 0,
        color: '#e799a6',
        fontSize: 16,
        cursor: 'pointer',
    },
    main: { flex: 1, display: 'flex', justifyContent: 'center', padding: 24, boxSizing: 'border-box' as const },
    formContainer: {
        width: '100%',
        maxWidth: 540,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px',
        alignItems: 'center',
    },
    sectionTitle: { fontSize: 20, fontWeight: 700 as const, color: '#e799a6', margin: '10px 0', textAlign: 'center' },
    
    summaryContainer: {
        width: '100%',
        padding: 15,
        border: '1px solid #ddd',
        borderRadius: 8,
        marginBottom: 20,
        backgroundColor: '#fafafa',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        paddingBottom: 5,
        borderBottom: '1px dashed #eee',
    },
    summaryTotalLabel: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    summaryTotalValue: {
        fontWeight: 'bold',
        fontSize: 18,
        color: '#e799a6',
    },
    
    buttonBlueLarge: {
        backgroundColor: '#e799a6',
        padding: '14px 16px',
        borderRadius: 8,
        border: 0,
        fontWeight: 700 as const,
        width: '100%',
        boxSizing: 'border-box',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    subSectionTitle: {
        fontSize: 16, 
        fontWeight: 600 as const, 
        color: '#333', 
        marginBottom: 10,
        width: '100%',
        textAlign: 'left' as const,
    },
    row: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
};