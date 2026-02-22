// src/routes/Routes.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Login from "@/pages/login";
import SignUp from "@/pages/register";
import HomePage from "@/pages/home";
import AccountScreen from "@/pages/store/account";
import PopPage from "@/pages/pop";
import CartScreen from "@/pages/cart";
import ContactsPage from "@/pages/contacts";
import SobrePage from "@/pages/sobre";
import ProductDetails from "@/pages/product/[productId]";
import OrdersScreen from "@/pages/store/orders";
import OrderDetailsScreen from "@/pages/store/[orderId]";

import CheckoutScreen from "@/pages/checkout";

// Importar os novos componentes
import CadProductPage from "@/pages/cadProduct";
import CadCategoryPage from "@/pages/cadCategory";
import CadSupplierPage from "@/pages/cadSupplier";
import ClientsScreen from "@/pages/clientes";
import FinanLitoPage from "@/pages/finanlito";
import SubscriptionPage from "@/pages/subscription/[productId]";
import AccountActive from "@/pages/account-active";
import ResetPasswordPage from "@/pages/reset-password";
import OSlitoEditorPage from "@/pages/oslito/oslito-editor";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import OSlitoList from "@/pages/oslito/oslito-list";
import DashboardConfig from "@/pages/aglito/DashboardConfig";
import TimerFBM from "@/pages/timer";
import { useTenant } from "@/contexts/TenantContext";

const WhatsAppWrapper = () => {
  const { pathname } = useLocation();
  // Lista de rotas onde o botão NÃO deve aparecer (SaaS)
  const saasPaths = ['/finanlito', '/oslito', '/subscribe'];
  
  const isSaaSPage = saasPaths.some(path => pathname.startsWith(path));

  if (isSaaSPage) return null;
  return <WhatsAppButton />;
};

{/* 2. ROTEAMENTO COM SUPORTE A SUBDOMÍNIO (TENANT) */}
export default function AppRoutes() {
  const { isRoot, tenantSlug } = useTenant();

  return (
    <BrowserRouter>
      {/* O botão de WhatsApp só aparece se NÃO for página de SaaS e se for Root */}
      {isRoot && <WhatsAppWrapper />}
      
      <Routes>
        {/* LÓGICA DE SUBDOMÍNIO (CLIENTE DO SEU CLIENTE) */}
        {!isRoot && tenantSlug ? (
          <>
            {/* Aqui você define a página que o cliente do barbeiro vê */}
            <Route path="/" element={<HomePage />} /> 
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          /* LÓGICA DO DOMÍNIO PRINCIPAL (SITE FBMSTORE / DASHBOARD) */
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account-active" element={<AccountActive />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/politica-privacidade" element={<PopPage />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/reset_password" element={<ResetPasswordPage />} />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/store/orders/:mode?" element={<OrdersScreen />} />
            <Route path="/order/:orderId" element={<OrderDetailsScreen />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/sobre" element={<SobrePage />} />
            <Route path="/cad-product" element={<CadProductPage />} />
            <Route path="/cad-category" element={<CadCategoryPage />} />
            <Route path="/cad-supplier" element={<CadSupplierPage />} />
            <Route path="/clientes" element={<ClientsScreen />} />
            <Route path="/store/account/:adminClientId" element={<AccountScreen />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/timer" element={<TimerFBM />} />
            <Route path="/aglito" element={<DashboardConfig />} />
            <Route path="/oslito" element={<OSlitoList />} />
            <Route path="/oslito/editor/:osId?" element={<OSlitoEditorPage />} />
            <Route path="/finanlito" element={<FinanLitoPage />} />
            <Route path="/subscribe/:productId" element={<SubscriptionPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}
