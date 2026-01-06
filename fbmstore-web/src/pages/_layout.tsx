// src/app/_layout.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/pages/store';

import { CartProvider } from '@/contexts/CartContext';
import { StockProvider } from '@/contexts/StockContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { ModalProvider } from '@/contexts/ModalContext';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { SupplierProvider } from '@/contexts/SupplierContext';
import { ClientProvider } from '@/contexts/ClientContext';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';

type Props = { children?: React.ReactNode };

export default function RootLayout({ children }: Props) {
  return (
    <Provider store={store}>
      <SupplierProvider>
        <CategoryProvider>
          <ModalProvider>
            <OrderProvider>
              <StockProvider>
                <CartProvider>
                  <ClientProvider>
                    <TenantProvider>
                      {children /* No web, o roteamento (React Router) entra aqui como children */}
                    </TenantProvider>
                  <WhatsAppButton />
                  </ClientProvider>
                </CartProvider>
              </StockProvider>
            </OrderProvider>
          </ModalProvider>
        </CategoryProvider>
      </SupplierProvider>
    </Provider>
  );
}
