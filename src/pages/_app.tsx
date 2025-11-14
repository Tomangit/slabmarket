import type { AppProps } from "next/app";
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  // For Pages Router, we'll use a simple approach without locale routing
  // Messages will be loaded from the default locale (en)
  const messages = require('../../messages/en.json');

  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Component {...pageProps} />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
