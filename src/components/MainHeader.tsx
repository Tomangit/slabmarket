
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Menu, Bell, Heart, ShoppingCart, User, LogOut, Settings, ShieldCheck, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { notificationService } from "@/services/notificationService";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

interface MainHeaderProps {
  currentPage?: string;
}

export function MainHeader({ currentPage }: MainHeaderProps) {
  const t = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const isActive = (page: string) => currentPage === page;

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
            <div className="relative">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-blue-600"
              >
                {/* Slab base */}
                <rect
                  x="4"
                  y="6"
                  width="24"
                  height="20"
                  rx="2"
                  fill="url(#slabGradient)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                {/* Card inside slab */}
                <rect
                  x="6"
                  y="8"
                  width="20"
                  height="16"
                  rx="1"
                  fill="white"
                  className="dark:fill-slate-800"
                />
                {/* Card details */}
                <rect
                  x="8"
                  y="10"
                  width="16"
                  height="12"
                  rx="0.5"
                  fill="url(#cardGradient)"
                  opacity="0.3"
                />
                {/* Corner accent */}
                <circle cx="24" cy="10" r="2" fill="currentColor" opacity="0.6" />
                <defs>
                  <linearGradient id="slabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Slab Market
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/marketplace"
              className={`text-sm font-medium transition-colors ${
                isActive("marketplace") ? "text-blue-600" : "hover:text-blue-600"
              }`}
            >
              {t('common.marketplace')}
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                isActive("dashboard") ? "text-blue-600" : "hover:text-blue-600"
              }`}
            >
              {t('common.dashboard')}
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors ${
                isActive("about") ? "text-blue-600" : "hover:text-blue-600"
              }`}
            >
              {t('common.howItWorks')}
            </Link>
            
            <div className="flex items-center space-x-2">
              {user && (
                <>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="/watchlist">
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
                      <DropdownMenuItem asChild>
                        <Link href="/messages">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Wiadomości</span>
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
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/auth/signin">{t('common.signIn')}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/sell">{t('common.sell')}</Link>
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
                <Link
                  href="/marketplace"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.marketplace')}
                </Link>
                <Link
                  href="/dashboard"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.dashboard')}
                </Link>
                <Link
                  href="/watchlist"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.watchlist')}
                </Link>
                <Link
                  href="/about"
                  className="text-lg font-medium hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('common.howItWorks')}
                </Link>
                <div className="pt-4 border-t space-y-3">
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
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/messages" onClick={() => setMobileMenuOpen(false)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Wiadomości
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
                      <Button className="w-full" asChild>
                        <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                          {t('common.signIn')}
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/sell" onClick={() => setMobileMenuOpen(false)}>
                          {t('common.startSelling')}
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
