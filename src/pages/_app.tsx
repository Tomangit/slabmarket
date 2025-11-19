import type { AppProps } from "next/app";
import { IntlProvider } from 'next-intl';
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  // For Pages Router, we'll use a simple approach without locale routing
  // Messages will be loaded from the default locale (en)
  const messages = require('../../messages/en.json');

  return (
    <IntlProvider locale="en" messages={messages}>
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <Component {...pageProps} />
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </IntlProvider>
  );
}
