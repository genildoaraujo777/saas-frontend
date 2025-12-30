// src/routes/Routes.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ambas funcionam */}
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

         {/* Novas Rotas de Cadastro */}
        <Route path="/cad-product" element={<CadProductPage />} />
        <Route path="/cad-category" element={<CadCategoryPage />} />
        <Route path="/cad-supplier" element={<CadSupplierPage />} />
        
        <Route path="/clientes" element={<ClientsScreen />} />
        <Route path="/store/account/:adminClientId" element={<AccountScreen />} />

        <Route path="/checkout" element={<CheckoutScreen />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

        {/* Nova rota do FinanLito */}
        <Route path="/finanlito" element={<FinanLitoPage />} />
        <Route path="/subscribe/:productId" element={<SubscriptionPage />} />
      </Routes>
    </BrowserRouter>
  );
}
