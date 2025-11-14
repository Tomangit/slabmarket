import { useEffect, useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cartService } from "@/services/cartService";
import { slabService } from "@/services/slabService";
import { shippingService } from "@/services/shippingService";

type CheckoutForm = {
  fullName: string;
  email: string;
  shippingAddress: string;
  paymentMethod: "card" | "bank_transfer" | "crypto";
  notes?: string;
};

export default function CheckoutPage() {
  const t = useTranslations();
  const router = useRouter();
  const { items, total, clearCart, isSyncing } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    defaultValues: {
      paymentMethod: "card",
    },
  });

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

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
    } else {
      // Calculate shipping cost for all items
      calculateShippingCost();
    }
  }, [items, router, calculateShippingCost]);

  useEffect(() => {
    if (profile?.full_name) {
      setValue("fullName", profile.full_name);
    }
    if (user?.email) {
      setValue("email", user.email);
    }
  }, [profile, user, setValue]);

  const onSubmit = async (data: CheckoutForm) => {
    if (!user) {
      toast({
        title: t('checkout.checkoutFailed'),
        description: "Please sign in to complete checkout",
        variant: "destructive",
      });
      router.push("/auth/signin");
      return;
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items,
          total: total + shippingCost, // Include shipping in total
          shippingCost,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to complete checkout");
      }

      // Clear cart from Supabase
      if (user.id) {
        try {
          await cartService.clearCartItems(user.id);
        } catch (syncError) {
          console.warn("Failed to clear Supabase cart after checkout:", syncError);
        }
      }
      
      // Clear local cart
      clearCart();

      toast({
        title: t('checkout.checkoutComplete'),
        description: result.message || t('checkout.checkoutCompleteDesc'),
      });

      // Redirect to dashboard with success message
      router.push("/dashboard?checkout=success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error during checkout";
      toast({
        title: t('checkout.checkoutFailed'),
        description: message,
        variant: "destructive",
      });
    }
  };

  const paymentMethod = watch("paymentMethod");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="checkout" />

      <div className="container mx-auto px-4 py-10 flex-1 max-w-5xl w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">{t('checkout.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('checkout.subtitle')}
          </p>
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="secondary">{items.length} {items.length === 1 ? t('checkout.items') : t('checkout.itemsPlural')}</Badge>
            <Badge variant="outline">{t('checkout.total')} ${total.toFixed(2)}</Badge>
            {isSyncing && (
              <Badge variant="outline">Synchronizing cart with Supabase…</Badge>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('checkout.buyerDetails')}</CardTitle>
              <CardDescription>
                {t('checkout.buyerDetailsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTitle>{t('checkout.sandboxCheckout')}</AlertTitle>
                <AlertDescription>
                  {t('checkout.sandboxCheckoutDesc')}
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('checkout.fullName')}</Label>
                  <Input
                    id="fullName"
                    placeholder={t('checkout.fullNamePlaceholder')}
                    {...register("fullName", { required: t('checkout.fullNameRequired') })}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('checkout.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('checkout.emailPlaceholder')}
                    {...register("email", {
                      required: t('checkout.emailRequired'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('checkout.emailInvalid'),
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingAddress">{t('checkout.shippingAddress')}</Label>
                <Textarea
                  id="shippingAddress"
                  rows={4}
                  placeholder={t('checkout.shippingAddressPlaceholder')}
                  {...register("shippingAddress", {
                    required: t('checkout.shippingAddressRequired'),
                    minLength: { value: 10, message: t('checkout.shippingAddressMinLength') },
                  })}
                />
                {errors.shippingAddress && (
                  <p className="text-sm text-red-500">{errors.shippingAddress.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>{t('checkout.paymentMethod')}</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setValue("paymentMethod", value as CheckoutForm["paymentMethod"])
                  }
                  className="grid gap-4 md:grid-cols-3"
                >
                  <label className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-colors">
                    <RadioGroupItem value="card" />
                    <div>
                      <p className="font-medium">{t('checkout.card')}</p>
                      <p className="text-xs text-slate-500">{t('checkout.cardDesc')}</p>
                    </div>
                  </label>
                  <label className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-colors">
                    <RadioGroupItem value="bank_transfer" />
                    <div>
                      <p className="font-medium">{t('checkout.bankTransfer')}</p>
                      <p className="text-xs text-slate-500">{t('checkout.bankTransferDesc')}</p>
                    </div>
                  </label>
                  <label className="border rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-colors">
                    <RadioGroupItem value="crypto" />
                    <div>
                      <p className="font-medium">{t('checkout.crypto')}</p>
                      <p className="text-xs text-slate-500">{t('checkout.cryptoDesc')}</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('checkout.orderNotes')}</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder={t('checkout.orderNotesPlaceholder')}
                  {...register("notes")}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/cart">{t('checkout.backToCart')}</Link>
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? t('checkout.processing') : t('checkout.confirmStubPayment')}
              </Button>
            </CardFooter>
          </Card>

          <Card className="h-max">
            <CardHeader>
              <CardTitle>{t('checkout.orderSummary')}</CardTitle>
              <CardDescription>{t('checkout.orderSummaryDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>
                    {loadingShipping ? (
                      <span className="text-slate-400">Calculating...</span>
                    ) : (
                      `$${shippingCost.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('checkout.protectionEscrow')}</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t pt-3 flex items-center justify-between font-semibold">
                  <span>{t('checkout.total')}</span>
                  <span className="text-xl text-blue-600">
                    ${(total + shippingCost).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}

