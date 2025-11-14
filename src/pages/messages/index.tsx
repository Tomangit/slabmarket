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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Search, Loader2, Send, Inbox } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService, type Conversation } from "@/services/messageService";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type MessageTab = "all" | "sent" | "received";

export default function MessagesPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [sentConversations, setSentConversations] = useState<Conversation[]>([]);
  const [receivedConversations, setReceivedConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MessageTab>("all");

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
      const [all, sent, received] = await Promise.all([
        messageService.getUserConversations(user.id),
        messageService.getSentConversations(user.id),
        messageService.getReceivedConversations(user.id),
      ]);
      setAllConversations(all);
      setSentConversations(sent);
      setReceivedConversations(received);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveConversations = (): Conversation[] => {
    switch (activeTab) {
      case "sent":
        return sentConversations;
      case "received":
        return receivedConversations;
      default:
        return allConversations;
    }
  };

  const filteredConversations = getActiveConversations().filter((conv) => {
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
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return t("messages.yesterday");
    } else if (days < 7) {
      return t("messages.daysAgo", { days });
    } else {
      return date.toLocaleDateString("en-US", {
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
            {t("messages.title")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t("messages.subtitle")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>{t("messages.conversations")}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t("messages.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MessageTab)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t("messages.all")}
                  {allConversations.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {allConversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {t("messages.sent")}
                  {sentConversations.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {sentConversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="received" className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  {t("messages.received")}
                  {receivedConversations.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {receivedConversations.length}
                    </Badge>
                  )}
                  {receivedConversations.some((c) => (c.unread_count || 0) > 0) && (
                    <Badge variant="destructive" className="ml-1">
                      {receivedConversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">{t("messages.loading")}</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery
                    ? t("messages.noConversations")
                    : activeTab === "sent"
                    ? t("messages.noSentMessages")
                    : activeTab === "received"
                    ? t("messages.noReceivedMessages")
                    : t("messages.noConversationsDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => {
                  const isSent = conv.last_message?.sender_id === user?.id;
                  return (
                    <Link
                      key={conv.id}
                      href={`/messages/${conv.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700">
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
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">
                                {conv.other_user?.full_name ||
                                  conv.other_user?.email ||
                                  t("messages.unknownUser")}
                              </h3>
                              {/* Show badge only in "all" tab to indicate message direction */}
                              {activeTab === "all" && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    isSent 
                                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                                      : "bg-green-50 text-green-700 border-green-200"
                                  }`}
                                >
                                  {isSent ? (
                                    <>
                                      <Send className="h-3 w-3 mr-1" />
                                      {t("messages.sentLabel")}
                                    </>
                                  ) : (
                                    <>
                                      <Inbox className="h-3 w-3 mr-1" />
                                      {t("messages.receivedLabel")}
                                    </>
                                  )}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 ml-2">
                              {formatTime(conv.last_message_at)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            {conv.last_message
                              ? conv.last_message.content
                              : t("messages.noMessages")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Show unread count only for received messages */}
                          {conv.unread_count && conv.unread_count > 0 && !isSent && (
                            <Badge variant="destructive" className="ml-auto">
                              {conv.unread_count}
                            </Badge>
                          )}
                          {/* Show read status for sent messages */}
                          {isSent && conv.last_message?.read_at && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                              ✓ {t("messages.read")}
                            </Badge>
                          )}
                          {/* Show unread indicator for sent messages that weren't read */}
                          {isSent && !conv.last_message?.read_at && activeTab === "sent" && (
                            <Badge variant="outline" className="text-xs text-slate-500">
                              {t("messages.unread")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

