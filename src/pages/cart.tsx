import { useState, useEffect, useCallback } from "react";
import { useTranslations } from 'next-intl';
import Link from "next/link";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { slabService } from "@/services/slabService";
import { shippingService } from "@/services/shippingService";

export default function CartPage() {
  const t = useTranslations();
  const { items, total, updateQuantity, removeItem, isSyncing, lastSyncError } = useCart();
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const isEmpty = items.length === 0;

  const calculateShippingCost = useCallback(async () => {
    try {
      setLoadingShipping(true);
      let totalShipping = 0;

      // Get shipping costs for each item from slabs
      for (const item of items) {
        try {
          // Extract slab ID from item.id
          const slabId = item.id.replace(/^(slab-|listing-)/, "");
          
          // Get slab details to get shipping_cost
          const slab = await slabService.getSlabById(slabId);
          
          if (slab?.shipping_cost) {
            // Use shipping cost from slab if available
            totalShipping += slab.shipping_cost * item.quantity;
          } else if (slab?.price) {
            // Calculate shipping cost if not set in slab
            const shipping = shippingService.getSlabShippingCost(
              slab.price,
              slab.shipping_insured || false,
              slab.shipping_temperature_controlled || false
            );
            totalShipping += shipping.totalCost * item.quantity;
          } else {
            // Default shipping cost if no price available
            totalShipping += 15.00 * item.quantity;
          }
        } catch (error) {
          console.error(`Error calculating shipping for item ${item.id}:`, error);
          // Use default shipping cost if error
          totalShipping += 15.00 * item.quantity;
        }
      }

      setShippingCost(totalShipping);
    } catch (error) {
      console.error("Error calculating shipping cost:", error);
      // Use default shipping cost
      setShippingCost(items.length * 15.00);
    } finally {
      setLoadingShipping(false);
    }
  }, [items]);

  // Calculate shipping cost when items change
  useEffect(() => {
    if (items.length > 0) {
      calculateShippingCost();
    } else {
      setShippingCost(0);
    }
  }, [items, calculateShippingCost]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="cart" />

      <div className="container mx-auto px-4 py-10 flex-1 w-full max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            {t('cart.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('cart.subtitle')}
          </p>

          <div className="flex items-center gap-3 mt-4">
            <Badge variant="secondary">{items.length} {items.length === 1 ? t('cart.items') : t('cart.itemsPlural')}</Badge>
            {isSyncing && (
              <Badge variant="outline">Synchronizing with Supabase…</Badge>
            )}
          </div>
        </div>

        {isEmpty ? (
          <Card className="text-center">
            <CardHeader>
              <CardTitle>{t('cart.empty')}</CardTitle>
              <CardDescription>
                {t('cart.emptyDesc')}
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center pb-8">
              <Button asChild>
                <Link href="/marketplace">{t('cart.browseMarketplace')}</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-6 flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-40">
                      <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">🃏</span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold">{item.name}</h2>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            #{item.cardId}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.gradingCompany && (
                              <Badge variant="outline">{item.gradingCompany}</Badge>
                            )}
                            {item.grade && <Badge variant="secondary">Grade {item.grade}</Badge>}
                            {item.sellerName && (
                              <Badge variant="outline">Seller: {item.sellerName}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            ${(item.price * item.quantity).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-xs text-slate-500">(${item.price.toFixed(2)} {t('cart.each')})</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center border rounded-lg overflow-hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="px-4 text-sm font-medium">{item.quantity}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('common.remove')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="sticky top-24 h-max">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  Shipping and taxes are calculated during the checkout stub.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>{t('cart.subtotal')}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Shipping</span>
                  <span>
                    {loadingShipping ? (
                      <span className="text-slate-400">Calculating...</span>
                    ) : (
                      `$${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>{t('cart.buyerProtection')}</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-4 flex items-center justify-between font-semibold">
                  <span>{t('cart.total')}</span>
                  <span className="text-xl text-blue-600">
                    ${(total + shippingCost).toFixed(2)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full" asChild>
                  <Link href="/checkout">{t('cart.proceedToCheckout')}</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/marketplace">{t('cart.continueShopping')}</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

