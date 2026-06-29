import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function RetroIntelligence() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t("ai.error") },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("ai.error") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all hover:scale-105"
        style={{
          background: "linear-gradient(135deg, hsl(330 80% 65%), hsl(280 70% 60%))",
          border: "2px solid hsl(330 80% 50%)",
          color: "white",
        }}
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-bold text-sm">RETRO INTELLIGENCE</span>
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 shadow-2xl transition-all duration-300 ${
        isMinimized ? "bottom-6 right-6 w-72" : "bottom-6 right-6 w-96 h-[500px]"
      }`}
      style={{
        border: "2px solid hsl(330 60% 40%)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-move"
        style={{
          background: "linear-gradient(90deg, hsl(330 80% 55%), hsl(280 70% 50%))",
          borderBottom: "2px solid hsl(330 60% 40%)",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="font-bold text-white text-sm">
            RETRO INTELLIGENCE™
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors"
          >
            <Minimize2 className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/50 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{
              background: "hsl(210 100% 55%)",
              height: "calc(100% - 120px)",
            }}
          >
            {messages.length === 0 && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  background: "rgba(255,255,255,0.95)",
                  border: "2px solid hsl(330 60% 40%)",
                }}
              >
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-pink-500" />
                <p className="font-bold text-gray-800 mb-1">
                  {t("ai.welcome")}
                </p>
                <p className="text-sm text-gray-600">{t("ai.helpText")}</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] p-3 rounded-lg text-sm"
                  style={{
                    background:
                      msg.role === "user"
                        ? "hsl(330 80% 65%)"
                        : "rgba(255,255,255,0.95)",
                    color: msg.role === "user" ? "white" : "hsl(220 20% 20%)",
                    border: `2px solid ${msg.role === "user" ? "hsl(330 60% 50%)" : "hsl(330 60% 40%)"}`,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.95)",
                    border: "2px solid hsl(330 60% 40%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="p-3"
            style={{
              background: "hsl(0 0% 85%)",
              borderTop: "2px solid hsl(330 60% 40%)",
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t("ai.placeholder")}
                className="flex-1 px-3 py-2 text-sm rounded"
                style={{
                  background: "white",
                  border: "2px solid hsl(330 60% 40%)",
                  outline: "none",
                }}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 rounded font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  background: "linear-gradient(135deg, hsl(330 80% 55%), hsl(280 70% 50%))",
                  border: "2px solid hsl(330 60% 40%)",
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
