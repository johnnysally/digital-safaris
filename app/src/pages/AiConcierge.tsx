import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Compass } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { aiConciergeApi } from "../api";
import { useAuth } from "../context/authContext";
import { useToast } from "../context/toastContext";
import { classNames } from "../utils/helpers";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

const SUGGESTIONS = [
  "What restaurants are in Nairobi?",
  "Where can I stay in Naivasha?",
  "How do I order food?",
  "Recommend a weekend trip",
];

export default function AiConcierge() {
  const { customer } = useAuth();
  const { error: toastError } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: `Jambo${customer ? `, ${customer.firstName}` : ""}! I'm your Digital Safaris concierge. How can I help you plan your journey today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: clean,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await aiConciergeApi.chat({ message: clean });
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text:
            res.reply ||
            "I'm not sure how to answer that. Try asking differently.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          sender: "bot",
          text: "Sorry, I could not reach the concierge right now. Please try again shortly.",
        },
      ]);
      toastError("Concierge unavailable");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
          <Compass className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-text-primary">
            Digital Safaris Concierge
          </h1>
          <p className="truncate text-xs text-text-muted">
            Ask about stays, food, transport, or anything travel-related.
          </p>
        </div>
      </div>

      <Card
        padded={false}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={classNames(
                "flex",
                m.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.sender === "bot" && (
                <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              )}
              <div
                className={classNames(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:px-4 sm:py-2.5",
                  m.sender === "user"
                    ? "rounded-br-none bg-secondary-500 text-white"
                    : "rounded-bl-none border border-border bg-surface text-text-primary"
                )}
              >
                {m.text}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-center">
              <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-500/10 text-secondary-600">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-none border border-border bg-surface px-3.5 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary-500 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary-500 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-secondary-500" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {messages.length <= 1 && !sending && (
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-border px-3 py-3 sm:px-4">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full bg-surface-alt px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-secondary-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex shrink-0 items-center gap-2 border-t border-border bg-surface p-2.5 sm:p-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the concierge…"
            className="min-w-0 flex-1 rounded-full border border-border bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/30 sm:px-4 sm:py-2.5"
          />
          <Button
            type="submit"
            disabled={!input.trim() || sending}
            className="shrink-0"
            leftIcon={sending ? undefined : <Send className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}