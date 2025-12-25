import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdCheckCircle, MdRocketLaunch, MdArrowBack } from 'react-icons/md';
import api from '../../services/api';
import { useClient } from '../../contexts/ClientContext'; 
import { useOrder } from '../../contexts/OrderContext'; //
import { checkTokenValidity } from '../../services/AuthenticationService'; 
import { brlToNumber, numberToBRL } from '../../utils/currency';

// Interface para tipar o produto
interface ProductType {
    _id: string;
    name: string;
    description: string;
    price: number;
    imagePaths: string[];
}

export default function SubscriptionPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const { loggedClient, logoutClient } = useClient();
  const { createOrder } = useOrder(); //

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

  async function handleSubscribe() {
    // A. Verifica login e Token
    const token = localStorage.getItem('token'); //

    if (!loggedClient || !token) {
        alert("Você precisa estar logado para assinar.");
        navigate('/login', { state: { from: `/subscribe/${productId}` } }); 
        return;
    }

    setProcessing(true);

    try {
        // B. Valida a sessão
        const isTokenValid = await checkTokenValidity(token);
        if (!isTokenValid) {
            alert("Sua sessão expirou. Faça login novamente.");
            logoutClient();
            navigate('/login', { state: { from: `/subscribe/${productId}` } });
            return;
        }

        // --- 1. CRIAÇÃO DO PEDIDO VIA CONTEXTO (Igual ao checkout.tsx) ---
        
        // Monta o objeto de pedido. 
        // Nota: O backend createOrder.ts itera sobre itemsOrder e espera que cada item tenha ._id e .quantity
        const newOrderData: any = {
            numberOrder: Math.floor(Math.random() * 999999999) + 1, // Gera número aleatório se o back não gerar
            createdAt: new Date(),
            itemsOrder: [
                { 
                    ...product, // Espalha props do produto (inclui _id, name, price)
                    quantity: 1 
                }
            ],
            totalPrice: brlToNumber(product?.price),
            quantityItems: 1,
            stateOrder: 'WAITING', // Status inicial
            client: loggedClient.client._id, // Vincula ao cliente
            payments: []
        };

        // Chama o método do Contexto, que deve tratar a comunicação com a API
        // Isso garante que o estado global de pedidos seja atualizado se necessário
        const createdOrder = await createOrder(newOrderData, token);

        if (!createdOrder || !createdOrder._id) {
            throw new Error("Falha ao criar o pedido. Tente novamente.");
        }

        console.log("Pedido criado via Contexto:", createdOrder._id);

        // --- 2. PAGAMENTO (Integração Stripe) ---

        const userEmail = (loggedClient.client as any).email || "cliente@fbmstore.com";

        const checkoutPayload = {
            provider: 'stripe',
            amount: product?.price,
            productName: product?.name || product?.description,
            productDescription: product?.description,
            
            // Usa o ID retornado pelo método createOrder
            orderId: createdOrder._id, 
            
            clientEmail: userEmail
        };

        // Chama API de Pagamento
        const paymentResponse = await api.post('/pagto/checkout/process', checkoutPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Redireciona para Stripe
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

  if (loading) {
    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            Carregando detalhes...
        </div>
    );
  }

  if (!product) return null;

  const features = [
      "Acesso Imediato ao Sistema",
      "Suporte Técnico Especializado",
      "Atualizações Constantes",
      "Cancelamento a qualquer momento",
      "Segurança de Dados Garantida"
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem', textAlign: 'center' }}>
        <span style={{ color: '#6366f1', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>
          Plano Selecionado
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginTop: '1rem', lineHeight: 1.1 }}>
          Impulsione seus resultados com <br/>
          <span style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {product.name || "MicroSaaS Premium"}
          </span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '1.5rem', maxWidth: '600px', marginInline: 'auto', lineHeight: '1.6' }}>
            {product.description}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
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
                     {product.price}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '1.2rem' }}>/mês</span>
            </div>
            
            <button 
                onClick={handleSubscribe}
                disabled={processing}
                style={{
                    width: '100%',
                    padding: '1.2rem',
                    marginTop: '2.5rem',
                    background: processing ? '#4b5563' : '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: processing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.8rem',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)'
                }}
            >
                {processing ? 'Criando assinatura...' : <><MdRocketLaunch size={22} /> Assinar Agora</>}
            </button>
            
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