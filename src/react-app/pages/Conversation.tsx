import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/react-app/auth";
import { useLanguage } from "../contexts/LanguageContext";
import { MessageSquare, ArrowLeft, Send, ExternalLink, Languages, Loader2, X } from "lucide-react";

interface Message {
  id: number;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Translation {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface ConversationData {
  id: number;
  listing_id: number;
  listing_title: string;
  listing_image: string | null;
  listing_price: number;
  buyer_id: string;
  seller_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_picture: string | null;
}

export default function ConversationPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [translations, setTranslations] = useState<Record<number, Translation>>({});
  const [translating, setTranslating] = useState<Record<number, boolean>>({});
  const [autoTranslate, setAutoTranslate] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
      return;
    }

    if (user && id) {
      fetchMessages();
    }
  }, [user, isPending, id, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data.conversation);
        setMessages(data.messages);
      } else if (res.status === 404) {
        navigate("/messages");
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString();
  };

  const translateMessage = async (messageId: number, content: string) => {
    if (translations[messageId]) {
      // Toggle off translation
      setTranslations((prev) => {
        const newTranslations = { ...prev };
        delete newTranslations[messageId];
        return newTranslations;
      });
      return;
    }

    setTranslating((prev) => ({ ...prev, [messageId]: true }));
    
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content,
          targetLanguage: language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTranslations((prev) => ({
          ...prev,
          [messageId]: data,
        }));
      }
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setTranslating((prev) => ({ ...prev, [messageId]: false }));
    }
  };

  const translateAllMessages = async () => {
    const untranslated = messages.filter((msg) => !translations[msg.id] && msg.sender_id !== user?.id);
    for (const msg of untranslated) {
      await translateMessage(msg.id, msg.content);
    }
  };

  useEffect(() => {
    if (autoTranslate && messages.length > 0) {
      translateAllMessages();
    }
  }, [messages, autoTranslate]);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((msg) => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen p-4" style={{ background: "hsl(180 60% 45%)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="panel-raised p-4">
            <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-retro-dark">
              <MessageSquare className="w-5 h-5" />
              <span className="font-pixel text-sm">{t("messages.titleBar")}</span>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="font-pixel text-retro-dark animate-pulse">
                {t("messages.loading")}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(180 60% 45%)" }}>
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col p-4">
        {/* Header */}
        <div className="panel-raised p-3 mb-4">
          <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-retro-dark">
            <MessageSquare className="w-5 h-5" />
            <span className="font-pixel text-sm">{t("messages.titleBar")}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/messages")}
              className="btn-retro flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("messages.backToInbox")}
            </button>
            
            <div className="flex items-center gap-3 flex-1">
              {conversation.other_user_picture ? (
                <img
                  src={conversation.other_user_picture}
                  alt={conversation.other_user_name}
                  className="w-10 h-10 rounded-sm border-2 border-retro-dark object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-sm border-2 border-retro-dark bg-retro-gray flex items-center justify-center">
                  <span className="font-pixel text-lg text-retro-dark">
                    {conversation.other_user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-pixel text-retro-dark">
                {conversation.other_user_name}
              </span>
            </div>
            
            {/* Auto-translate toggle */}
            <button
              onClick={() => setAutoTranslate(!autoTranslate)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-pixel transition-colors ${
                autoTranslate 
                  ? "bg-retro-teal text-white border-2 border-retro-dark" 
                  : "panel-raised hover:bg-retro-gray/50"
              }`}
              title={t("translate.autoTranslateHint")}
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{t("translate.autoTranslate")}</span>
            </button>
          </div>
        </div>

        {/* Listing Info Card */}
        <div className="panel-raised p-3 mb-4">
          <p className="text-xs text-retro-dark/70 mb-2">{t("messages.aboutListing")}</p>
          <div className="flex items-center gap-3">
            {conversation.listing_image && (
              <img
                src={conversation.listing_image}
                alt={conversation.listing_title}
                className="w-16 h-16 object-cover border-2 border-retro-dark"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-pixel text-sm text-retro-dark truncate">
                {conversation.listing_title}
              </p>
              <p className="text-retro-gold font-pixel">
                ${(conversation.listing_price / 100).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => navigate(`/marketplace/listing/${conversation.listing_id}`)}
              className="btn-retro flex items-center gap-1 text-xs"
            >
              <ExternalLink className="w-3 h-3" />
              {t("messages.viewListing")}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="panel-inset flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-retro-dark/60 text-sm">
                {t("messages.startConversation")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 bg-retro-gray/50 rounded text-xs text-retro-dark/70">
                      {group.date}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      const translation = translations[msg.id];
                      const isTranslating = translating[msg.id];
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] p-3 ${
                              isMe
                                ? "bg-retro-gold border-2 border-retro-dark"
                                : "panel-raised"
                            }`}
                          >
                            <p className="text-sm text-retro-dark whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            {translation && (
                              <div className="mt-2 pt-2 border-t border-retro-dark/20">
                                <p className="text-xs text-retro-teal font-bold mb-1">
                                  {t("translate.translated")}
                                </p>
                                <p className="text-sm text-retro-dark whitespace-pre-wrap">
                                  {translation.translatedText}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1 gap-2">
                              <p className={`text-xs ${isMe ? "text-retro-dark/70" : "text-retro-dark/50"}`}>
                                {isMe ? t("messages.you") : conversation.other_user_name} • {formatTime(msg.created_at)}
                              </p>
                              {!isMe && (
                                <button
                                  onClick={() => translateMessage(msg.id, msg.content)}
                                  disabled={isTranslating}
                                  className="text-xs flex items-center gap-1 text-retro-teal hover:text-retro-dark transition-colors disabled:opacity-50"
                                  title={translation ? t("translate.hideTranslation") : t("translate.translateMessage")}
                                >
                                  {isTranslating ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : translation ? (
                                    <X className="w-3 h-3" />
                                  ) : (
                                    <Languages className="w-3 h-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="panel-raised p-3 mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t("messages.typeMessage")}
              className="flex-1 px-3 py-2 panel-inset text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="btn-gold flex items-center gap-2 px-4 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="font-pixel text-sm">
                {sending ? t("messages.sending") : t("messages.send")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
