import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/auth";
import { useLanguage } from "../contexts/LanguageContext";
import { MessageSquare, ArrowLeft, ChevronRight } from "lucide-react";

interface Conversation {
  id: number;
  listing_id: number;
  listing_title: string;
  listing_image: string | null;
  other_user_id: string;
  other_user_name: string;
  other_user_picture: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export default function MessagesPage() {
  const { t } = useLanguage();
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchConversations();
    }
  }, [user, isPending, navigate]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        // Ensure we always set an array
        setConversations(Array.isArray(data) ? data : data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "now";
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
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

  return (
    <div className="min-h-screen p-4" style={{ background: "hsl(180 60% 45%)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="panel-raised p-4 mb-4">
          <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-retro-dark">
            <MessageSquare className="w-5 h-5" />
            <span className="font-pixel text-sm">{t("messages.titleBar")}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/marketplace")}
              className="btn-retro flex items-center gap-2 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("seller.backToMarketplace")}
            </button>
            <h1 className="font-pixel text-xl text-retro-gold">
              {t("messages.inbox")}
            </h1>
            <div className="w-32" />
          </div>
        </div>

        {/* Conversations List */}
        <div className="panel-raised p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-retro-dark/40" />
              <h2 className="font-pixel text-lg text-retro-dark mb-2">
                {t("messages.noConversations")}
              </h2>
              <p className="text-retro-dark/70 text-sm max-w-md mx-auto">
                {t("messages.noConversationsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className="w-full panel-inset p-3 hover:bg-retro-light/50 transition-colors flex items-center gap-3 text-left"
                >
                  {/* User Avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.other_user_picture ? (
                      <img
                        src={conv.other_user_picture}
                        alt={conv.other_user_name}
                        className="w-12 h-12 rounded-sm border-2 border-retro-dark object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-sm border-2 border-retro-dark bg-retro-gray flex items-center justify-center">
                        <span className="font-pixel text-lg text-retro-dark">
                          {conv.other_user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {conv.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-retro-gold border border-retro-dark rounded-full flex items-center justify-center">
                        <span className="font-pixel text-xs text-retro-dark">
                          {conv.unread_count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-pixel text-sm text-retro-dark truncate">
                        {conv.other_user_name}
                      </span>
                      <span className="text-xs text-retro-dark/60">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-retro-dark/80 truncate">
                      {conv.last_message}
                    </p>
                    <p className="text-xs text-retro-dark/50 truncate mt-1">
                      Re: {conv.listing_title}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-retro-dark/40 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
