// Conversation detail page - view and send messages
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import { MainHeader } from "@/components/MainHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { messageService, type Message, type Conversation } from "@/services/messageService";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ConversationPage() {
  const t = useTranslations();
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    if (id && typeof id === "string") {
      loadConversation(id);
    }
  }, [user, id, router]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when viewing conversation
    if (conversation && user) {
      messageService.markAsRead(conversation.id, user.id);
    }
  }, [conversation, user]);

  const loadConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const [conversations, messagesData] = await Promise.all([
        messageService.getUserConversations(user.id),
        messageService.getConversationMessages(conversationId, 100),
      ]);

      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        setConversation(conv);
      }

      setMessages(messagesData.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: t("messages.error"),
        description: t("messages.errorLoadingConversation"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !conversation || !messageContent.trim()) return;

    try {
      setSending(true);
      const newMessage = await messageService.sendMessage(user.id, {
        conversationId: conversation.id,
        recipientId:
          conversation.participant_1_id === user.id
            ? conversation.participant_2_id
            : conversation.participant_1_id,
        content: messageContent.trim(),
      });

      setMessages((prev) => [...prev, newMessage]);
      setMessageContent("");
      
      // Reload conversation to update last_message
      await loadConversation(conversation.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: t("messages.error"),
        description: t("messages.errorSendingMessage"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.toDateString() === now.toDateString();
    
    if (isToday) {
      return t("messages.today");
    }
    
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        <MainHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-600">{t("messages.conversationNotFound")}</p>
              <Button asChild className="mt-4">
                <Link href="/messages">{t("messages.backToMessages")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const otherUser = conversation.other_user;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <MainHeader />

      <div className="container mx-auto px-4 py-6 flex-1 w-full max-w-4xl flex flex-col">
        <div className="mb-4">
          <Button variant="ghost" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("messages.backToMessages")}
            </Link>
          </Button>
        </div>

        <Card className="flex-1 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser?.avatar_url || undefined} />
                <AvatarFallback>
                  {otherUser?.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || otherUser?.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {otherUser?.full_name || otherUser?.email || t("messages.unknownUser")}
                </CardTitle>
                <p className="text-sm text-slate-500">
                  {otherUser?.email}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>{t("messages.noMessages")}. {t("messages.noConversationsDesc")}</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.sender_id === user.id;
                  const showDate =
                    index === 0 ||
                    new Date(message.created_at).toDateString() !==
                      new Date(messages[index - 1].created_at).toDateString();

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center text-xs text-slate-500 my-4">
                          {formatDate(message.created_at)}
                        </div>
                      )}
                      <div
                        className={`flex gap-3 ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={otherUser?.avatar_url || undefined}
                            />
                            <AvatarFallback>
                              {otherUser?.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || otherUser?.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn
                                ? "text-blue-100"
                                : "text-slate-500"
                            }`}
                          >
                            {formatTime(message.created_at)}
                            {message.read_at && isOwn && " ✓✓"}
                          </p>
                        </div>
                        {isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback>
                              {user.email?.[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder={t("messages.writeMessage")}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sending}
                  size="icon"
                  className="self-end"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}

