// Messages page - list of conversations
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService, type Conversation } from "@/services/messageService";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function MessagesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    loadConversations();
  }, [user, router]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await messageService.getUserConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.other_user?.full_name?.toLowerCase().includes(query) ||
      conv.other_user?.email?.toLowerCase().includes(query) ||
      conv.last_message?.content?.toLowerCase().includes(query)
    );
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Wczoraj";
    } else if (days < 7) {
      return `${days} dni temu`;
    } else {
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader currentPage="messages" />

      <div className="container mx-auto px-4 py-10 flex-1 w-full max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Wiadomości
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Zarządzaj swoimi konwersacjami z innymi użytkownikami
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Konwersacje</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Szukaj konwersacji..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Ładowanie konwersacji...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery
                    ? "Nie znaleziono konwersacji"
                    : "Brak konwersacji. Rozpocznij rozmowę z innym użytkownikiem!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={conv.other_user?.avatar_url || undefined}
                        />
                        <AvatarFallback>
                          {conv.other_user?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || conv.other_user?.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate">
                            {conv.other_user?.full_name ||
                              conv.other_user?.email ||
                              "Nieznany użytkownik"}
                          </h3>
                          <span className="text-xs text-slate-500 ml-2">
                            {formatTime(conv.last_message_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {conv.last_message
                            ? conv.last_message.content
                            : "Brak wiadomości"}
                        </p>
                      </div>

                      {conv.unread_count && conv.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

