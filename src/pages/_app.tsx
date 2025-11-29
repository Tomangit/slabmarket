import type { AppProps } from "next/app";
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import "@/styles/globals.css";

import messages from '../../messages/en.json';

export default function App({ Component, pageProps }: AppProps) {
  // For Pages Router, we'll use a simple approach without locale routing
  // Messages will be loaded from the default locale (en)

  return (
    <NextIntlClientProvider 
      locale="en" 
      messages={messages}
      timeZone="UTC"
      now={new Date()}
    >
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <Component {...pageProps} />
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
