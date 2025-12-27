import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdCheckCircle, MdRocketLaunch, MdArrowBack, MdCancel, MdAutorenew, MdEventBusy } from 'react-icons/md';
import api from '../../services/api';
import { useClient } from '../../contexts/ClientContext'; 
import { useOrder } from '../../contexts/OrderContext';
import { checkTokenValidity } from '../../services/AuthenticationService'; 
import { brlToNumber } from '../../utils/currency';

interface ProductType {
    _id: string;
    name: string;
    description: string;
    price: number | string;
    imagePaths: string[];
    code?: string;
}

export default function SubscriptionPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const { loggedClient, logoutClient } = useClient();
  const { createOrder, ordersClient } = useOrder();

  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // @ts-ignore
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // Busca os dados do produto
  useEffect(() => {
    async function loadProduct() {
        try {
            const response = await api.get(`/fbm/products/${productId}`);
            setProduct(response.data);
        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            alert("Produto não encontrado.");
            navigate('/');
        } finally {
            setLoading(false);
        }
    }
    loadProduct();
  }, [productId, navigate]);

  // 1. LÓGICA BLINDADA: Verifica se já assina e Pega o Pedido Completo
  const activeSubscription = useMemo(() => {
    if (!ordersClient || !product) return null;

    return ordersClient.find(order => {
        const status = order.statusOrder?.toUpperCase();
        // Inclui CANCELED aqui para podermos mostrar o botão de "Assinatura Inativa" ou data final se necessário
        const isValidOrder = ['DONE', 'PAID', 'SUCCESS', 'ACTIVE', 'CANCELED'].includes(status);
        if (!isValidOrder) return false;

        return order.itemsOrder.some((item: any) => {
            if (!item) return false;
            const itemId = typeof item === 'string' ? item : item.product?._id || item._id;
            if (itemId === productId) return true;
            if (product.code && typeof item !== 'string' && item.product?.code === product.code) return true;
            return false;
        });
    });
  }, [ordersClient, productId, product]);

  // Variaveis de Estado da Assinatura
  const isCancelScheduled = (activeSubscription as any)?.cancelAtPeriodEnd === true;
  // Se estiver cancelado, mas não agendado (ou seja, já expirou ou foi cancelado manual imediato)
  const isFullyCanceled = activeSubscription?.statusOrder?.toUpperCase() === 'CANCELED';
  // Verifica se ainda tem acesso (Ativo OU Cancelado com Agendamento)
  const hasAccess = ['DONE', 'PAID', 'SUCCESS', 'ACTIVE'].includes(activeSubscription?.statusOrder?.toUpperCase() || '');

  // 2. Função de Cancelar Assinatura
  async function handleCancelSubscription() {
    if (!activeSubscription) return;
    if(!confirm("Deseja cancelar a renovação automática? Você continuará com acesso até o fim do período atual.")) return;

    setProcessing(true);
    try {
        const token = localStorage.getItem('token');
        const response = await api.post('/pagto/subscription/cancel', {
            orderId: activeSubscription._id
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const serverDate = response.data?.expirationDate;
        const dateStr = serverDate ? new Date(serverDate).toLocaleDateString('pt-BR') : 'o fim do ciclo';
        
        alert(`Assinatura cancelada! Seu acesso continua válido até ${dateStr}.`);
        window.location.reload(); // Recarrega para atualizar o estado do botão
    } catch (error) {
        console.error(error);
        alert("Erro ao cancelar assinatura.");
    } finally {
        setProcessing(false);
    }
  }

  // 3. Função de Reativar Assinatura (NOVA)
  async function handleReactivateSubscription() {
    if (!activeSubscription) return;
    if(!confirm("Deseja desfazer o cancelamento e manter sua assinatura ativa?")) return;

    setProcessing(true);
    try {
        const token = localStorage.getItem('token');
        await api.post('/pagto/subscription/reactivate', {
            orderId: activeSubscription._id
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        alert("Assinatura reativada com sucesso!");
        window.location.reload(); 
    } catch (error) {
        console.error(error);
        alert("Erro ao reativar assinatura.");
    } finally {
        setProcessing(false);
    }
  }

  // 4. Função de Assinar (Nova Compra)
  async function handleSubscribe() {
    // Se tiver acesso ativo, bloqueia nova compra
    if (activeSubscription && hasAccess && !isFullyCanceled) {
        alert("Você já possui uma assinatura ativa para este produto.");
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!loggedClient || !token) {
        alert("Você precisa estar logado para assinar.");
        navigate('/login', { state: { from: `/subscribe/${productId}` } }); 
        return;
    }

    setProcessing(true);

    try {
        const isTokenValid = await checkTokenValidity(token);
        if (!isTokenValid) {
            alert("Sua sessão expirou. Faça login novamente.");
            logoutClient();
            navigate('/login', { state: { from: `/subscribe/${productId}` } });
            return;
        }

        let finalPrice = 0;
        if (typeof product?.price === 'string') {
            finalPrice = brlToNumber(product.price);
        } else {
            finalPrice = Number(product?.price || 0);
        }

        const newOrderData: any = {
            numberOrder: Math.floor(Math.random() * 999999999) + 1,
            createdAt: new Date(),
            itemsOrder: [{ ...product, quantity: 1 }],
            totalPrice: finalPrice,
            quantityItems: 1,
            stateOrder: 'WAITING',
            client: loggedClient.client._id,
            payments: []
        };

        const createdOrder = await createOrder(newOrderData, token);

        if (!createdOrder || !createdOrder._id) {
            throw new Error("Falha ao criar o pedido. Tente novamente.");
        }

        const userEmail = (loggedClient.client as any).email || "cliente@fbmstore.com";
        const checkoutPayload = {
            provider: 'stripe',
            amount: finalPrice, 
            productName: product?.name || product?.description,
            productDescription: product?.description,
            orderId: createdOrder._id, 
            clientEmail: userEmail
        };

        const paymentResponse = await api.post('/pagto/checkout/process', checkoutPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (paymentResponse.data.url) {
            window.location.href = paymentResponse.data.url;
        } else {
            alert("Erro ao gerar link de pagamento.");
        }

    } catch (error) {
        console.error("Erro no processamento da assinatura:", error);
        alert("Ocorreu um erro ao processar. Tente novamente.");
    } finally {
        setProcessing(false);
    }
  }

  // --- RENDERIZAÇÃO ---

  if (loading) {
    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            Carregando detalhes...
        </div>
    );
  }

  if (!product) return null;

  const displayPrice = typeof product.price === 'number' 
      ? `R$ ${product.price.toFixed(2).replace('.', ',')}`
      : product.price;

  const features = [
      "Acesso Imediato ao Sistema",
      "Suporte Técnico Especializado",
      "Atualizações Constantes",
      "Cancelamento a qualquer momento",
      "Segurança de Dados Garantida"
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <button 
            onClick={() => navigate(-1)} 
            style={{ 
                background: 'transparent', 
                border: '1px solid #334155', 
                color: '#94a3b8', 
                padding: '8px 16px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px' 
            }}
        >
            <MdArrowBack /> Voltar
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
        <span style={{ color: '#6366f1', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
          Plano Selecionado
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginTop: '1rem', lineHeight: 1.1 }}>
          Impulsione seus resultados com <br/>
          <span style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {product.name || "Conta Premium"}
          </span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1.5rem', maxWidth: '600px', marginInline: 'auto', lineHeight: '1.6' }}>
            {product.description}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ 
            background: '#1e293b', 
            borderRadius: '24px', 
            padding: '3rem', 
            width: '100%', 
            maxWidth: '450px',
            border: '1px solid #334155',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
        }}>
            {product.imagePaths && product.imagePaths.length > 0 && (
                <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                      <img 
                        src={`${BASE_URL}/files/image?fileName=${product.imagePaths[0]}`} 
                        alt={product.description}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', justifyContent: 'center' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-1px' }}>
                      {displayPrice}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>/mês</span>
            </div>
            
            {/* Lógica de Assinatura Existente */}
            {(activeSubscription && hasAccess) ? (
                <>
                    {/* AVISO DE DATA DE VALIDADE (ACIMA DO BOTÃO) */}
                    {(isCancelScheduled) && (activeSubscription as any).currentPeriodEnd && (
                        <div style={{
                            marginTop: '2rem',
                            padding: '12px',
                            backgroundColor: 'rgba(255, 237, 213, 0.1)', // Fundo laranja transparente pra combinar com tema dark
                            borderRadius: '8px',
                            border: '1px solid #f97316',
                            color: '#fb923c',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '0.9rem'
                        }}>
                             <MdEventBusy size={20} />
                             <span>
                                Acesso até <strong>{new Date((activeSubscription as any).currentPeriodEnd).toLocaleDateString('pt-BR')}</strong>
                             </span>
                        </div>
                    )}

                    {/* BOTÃO DUPLO: CANCELAR OU REATIVAR */}
                    <button 
                        onClick={isCancelScheduled ? handleReactivateSubscription : handleCancelSubscription}
                        disabled={processing}
                        style={{
                            width: '100%', padding: '1.2rem', marginTop: '1rem',
                            // Se agendado: VERDE (Reativar) | Se normal: VERMELHO (Cancelar)
                            background: isCancelScheduled ? '#10b981' : '#ef4444', 
                            color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem'
                        }}
                    >
                        {processing ? 'Processando...' : isCancelScheduled ? (
                            <><MdAutorenew size={22} /> Reativar Assinatura</>
                        ) : (
                            <><MdCancel size={22} /> Cancelar Assinatura</>
                        )}
                    </button>
                </>
            ) : (
                /* BOTÃO DE ASSINAR (NOVA COMPRA) */
                <button 
                    onClick={handleSubscribe}
                    disabled={processing}
                    style={{
                        width: '100%', padding: '1.2rem', marginTop: '2.5rem',
                        background: processing ? '#4b5563' : '#4f46e5',
                        color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.8rem',
                        transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)'
                    }}
                >
                    {processing ? 'Criando assinatura...' : <><MdRocketLaunch size={22} /> Assinar Agora</>}
                </button>
            )}
            
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', marginTop: '1.2rem' }}>
                <i className="fas fa-lock"></i> Pagamento 100% seguro via Stripe
            </p>

            <div style={{ marginTop: '2.5rem', borderTop: '1px solid #334155', paddingTop: '2rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '1.2rem', color: '#f8fafc' }}>O que está incluso no plano:</p>
                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
                    {features.map((feat: string, i: number) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#cbd5e1', fontSize: '0.95rem' }}>
                            <MdCheckCircle color="#10b981" size={20} /> {feat}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}