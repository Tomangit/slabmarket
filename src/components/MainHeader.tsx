
import { useState, useEffect } from "react";
import Image from "next/image";
import enMessages from "../../messages/en.json";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, Bell, Heart, ShoppingCart, User, LogOut, Settings, ShieldCheck, MessageSquare, DollarSign, Wallet } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useRouter } from "next/router";
import { notificationService } from "@/services/notificationService";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import type { Database } from "@/integrations/supabase/types";
import { walletService } from "@/services/walletService";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

interface MainHeaderProps {
  currentPage?: string;
}

export function MainHeader({ currentPage }: MainHeaderProps) {
  const t = (key: string): string => {
    const parts = key.split(".");
    let node: any = enMessages as any;
    for (const p of parts) {
      node = node?.[p];
      if (node == null) break;
    }
    return typeof node === "string" ? node : key;
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure consistent SSR/CSR behavior by using mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use router.pathname for consistent SSR/CSR behavior
  // Fallback to currentPage prop if router.pathname is not available during SSR
  const isActive = (page: string) => {
    if (!mounted) {
      // During SSR, use currentPage prop to avoid hydration mismatch
      return currentPage === page;
    }
    const pathname = router.pathname || '';
    const pagePath = page === 'home' ? '/' : `/${page}`;
    return pathname === pagePath || pathname.startsWith(`${pagePath}/`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const loadBalance = async () => {
      if (!user) {
        setWalletBalance(null);
        return;
      }
      try {
        const data = await walletService.getBalance(user.id);
        if (active) setWalletBalance(data.balance);
      } catch {
        if (active) setWalletBalance(null);
      }
    };
    loadBalance();
    const interval = setInterval(loadBalance, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setNotificationsLoading(true);
      const [notificationsData, count] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getUnreadCount(user.id),
      ]);
      setNotifications(notificationsData || []);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
    
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logosm6.png?v=2"
              alt="SLab Market logo"
              width={40}
              height={40}
              priority
              className="h-9 w-9 md:h-10 md:w-10 object-contain"
            />
            <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Slab Market
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <HoverCard openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    isActive("marketplace") ? "text-blue-600" : "hover:text-blue-600"
                  }`}
                >
                  {t('common.marketplace')}
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </HoverCardTrigger>
              <HoverCardContent align="start" className="w-80 px-4 pb-4 pt-2">
                <div>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/marketplace?category=pokemon-tcg"
                      className="group relative aspect-square rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <Image
                          src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
                          alt="Pokemon TCG"
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-center">
                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Pokemon TCG</span>
                      </div>
                    </Link>
                    <Link
                      href="/marketplace?category=disney-lorcana"
                      className="group relative aspect-square rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg overflow-hidden"
                    >
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <Image
                          src="/Disney_Lorcana_Logo.png"
                          alt="Disney Lorcana"
                          fill
                          className="object-contain p-4"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-center">
                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Disney Lorcana</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isActive("dashboard") ? "text-blue-600" : "hover:text-blue-600"
              }`}
            >
              {t('common.dashboard')}
            </Link>
            <Link
              href="/trends"
              className={`text-sm font-medium transition-colors ${
                isActive("trends") ? "text-blue-600" : "hover:text-blue-600"
              }`}
            >
              {t('trends.title')}
            </Link>
            <Link
              href="/verification"
              className={`text-sm font-medium transition-colors ${
                isActive("verification") ? "text-blue-600" : "hover:text-blue-600"
              }`}
            >
              {t('verification.title')}
            </Link>
            <Link
              href="/help"
              className={`text-sm font-medium transition-colors ${
                isActive("help") ? "text-blue-600" : "hover:text-blue-600"
              }`}
            >
              Help
            </Link>
            {user && (
              <Link
                href="/messages"
                className={`text-sm font-medium transition-colors ${
                  isActive("messages") ? "text-blue-600" : "hover:text-blue-600"
                }`}
              >
                {t('messages.title')}
              </Link>
            )}
            
            <div className="flex items-center space-x-2">
              {/* Theme Switch */}
              <ThemeSwitch />
              
              {/* Currency Selector */}
              <CurrencySelector />
              
              {/* Wallet (icon + balance) */}
              {user && (
                <Link href="/wallet" className="flex items-center gap-1 px-2 py-1 rounded hover:text-blue-600">
                  <Wallet className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    {walletBalance !== null ? walletBalance.toFixed(2) : "—"}
                  </span>
                </Link>
              )}
              
              {user && (
                <>
                  <Button variant="ghost" size="icon" asChild title="Wishlists">
                    <Link href="/wishlists">
                      <Heart className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="end">
                      <DropdownMenuLabel className="flex items-center justify-between">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={handleMarkAllAsRead}
                          >
                            Mark all as read
                          </Button>
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notificationsLoading ? (
                        <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No notifications
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.slice(0, 5).map((notification) => (
                            <DropdownMenuItem
                              key={notification.id}
                              className="flex flex-col items-start p-3 cursor-pointer"
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start justify-between w-full mb-1">
                                <span className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}>
                                  {notification.title}
                                </span>
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-blue-600 ml-2 flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <span className="text-xs text-slate-500 line-clamp-2">
                                {notification.message}
                              </span>
                              {notification.created_at && (
                                <span className="text-xs text-slate-400 mt-1">
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </span>
                              )}
                            </DropdownMenuItem>
                          ))}
                          {notifications.length > 5 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href="/notifications" className="w-full text-center">
                                  View all notifications
                                </Link>
                              </DropdownMenuItem>
                            </>
                          )}
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              {loading ? (
                <div className="h-9 w-20 animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
              ) : user ? (
                <>
                  <Button size="sm" asChild>
                    <Link href="/sell">{t('common.sell')}</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || "User"} />
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {profile?.full_name || "User"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>{t('common.myProfile')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>{t('common.dashboard')}</span>
                        </Link>
                      </DropdownMenuItem>
                      {(profile?.role === "moderator" || profile?.role === "admin") && (
                        <DropdownMenuItem asChild>
                          <Link href="/support/disputes">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>Support Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('common.signOut')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button size="sm" asChild>
                    <Link href="/sell">{t('common.sell')}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/signin">{t('common.signIn')}</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <nav className="flex flex-col space-y-4 mt-8">
                <div className="space-y-2">
                  <div className="text-lg font-medium">{t('common.marketplace')}</div>
                  <div className="pl-4 space-y-2">
                    <Link
                      href="/marketplace?category=pokemon-tcg"
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Image
                        src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg"
                        alt="Pokemon"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span>Pokemon TCG</span>
                    </Link>
                    <Link
                      href="/marketplace?category=disney-lorcana"
                      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Image
                        src="/Disney_Lorcana_Logo.png"
                        alt="Disney Lorcana"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                      <span>Disney Lorcana</span>
                    </Link>
                  </div>
                </div>
                <Link
                  href="/dashboard"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.dashboard')}
                </Link>
                <Link
                  href="/trends"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('trends.title')}
                </Link>
                <Link
                  href="/verification"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('verification.title')}
                </Link>
                <Link
                  href="/help"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Help
                </Link>
                {user && (
                  <Link
                    href="/messages"
                    className="text-lg font-medium hover:text-blue-600 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('messages.title')}
                  </Link>
                )}
                
                {/* Mobile Theme & Currency Selectors */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Theme:</span>
                    <ThemeSwitch />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Currency:</span>
                    <CurrencySelector />
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  {user && (
                    <div className="flex items-center justify-center pb-2">
                      <Button variant="ghost" size="icon" asChild className="h-10 w-10" title="Wishlists">
                        <Link href="/wishlists" onClick={() => setMobileMenuOpen(false)}>
                          <Heart className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  )}
                  {loading ? (
                    <div className="h-10 w-full animate-pulse bg-slate-200 dark:bg-slate-700 rounded" />
                  ) : user ? (
                    <>
                      <div className="flex items-center space-x-3 px-2 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || user.email || "User"} />
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {profile?.full_name || "User"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                          <User className="mr-2 h-4 w-4" />
                          {t('common.myProfile')}
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="mr-2 h-4 w-4" />
                          {t('common.dashboard')}
                        </Link>
                      </Button>
                      <Button className="w-full" onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('common.signOut')}
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/sell" onClick={() => setMobileMenuOpen(false)}>
                          {t('common.startSelling')}
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/sell" onClick={() => setMobileMenuOpen(false)}>
                          {t('common.startSelling')}
                        </Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                          {t('common.signIn')}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function CurrencySelector() {
  const { currency, setCurrency, supportedCurrencies } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden sm:inline">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedCurrencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={async () => {
              try {
                await setCurrency(curr.code);
                setOpen(false);
              } catch (error) {
                console.error("Error updating currency:", error);
              }
            }}
            className={currency === curr.code ? "bg-slate-100 dark:bg-slate-800" : ""}
          >
            <span className="flex items-center gap-2 w-full">
              <span className="font-medium">{curr.symbol}</span>
              <span className="flex-1">{curr.name}</span>
              <span className="text-sm text-slate-500">{curr.code}</span>
              {currency === curr.code && (
                <span className="text-blue-600">✓</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
