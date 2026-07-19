"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const mutation = useMutation({
    mutationFn: ({ text, history }: { text: string; history: { role: string; content: string }[] }) =>
      apiClient.post("/generate", { prompt: text, history: history }),
    onSuccess: (data: any) => {
      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    },
    // The axios interceptor already handles sonner toast on error
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, mutation?.isPending]); // Re-run when messages or loading state changes

  const handleSend = () => {
    if (!prompt.trim()) return;
    const userMessage = prompt;
    
    // Geçmişi (mevcut mesajlar) yolla
    const currentHistory = [...messages];
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setPrompt("");
    mutation.mutate({ text: userMessage, history: currentHistory });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm sticky top-0 z-10">
        <h2 className="font-semibold text-lg">AI Stil Asistanı</h2>
      </div>

      <ScrollArea className="flex-1 p-4 h-full">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-10 text-sm">
              Sohbete başlamak için bir mesaj yazın...
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] rounded-2xl p-3 text-sm overflow-x-auto ${
                msg.role === "user"
                  ? "bg-slate-900 text-white ml-auto rounded-tr-none"
                  : "bg-white border border-slate-200 text-slate-800 mr-auto rounded-tl-none shadow-sm prose prose-sm prose-slate max-w-none"
              }`}
            >
              {msg.role === "user" ? (
                msg.content
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          ))}
          {mutation.isPending && (
            <div className="max-w-[85%] rounded-2xl p-4 text-sm bg-white border border-slate-200 text-slate-800 mr-auto rounded-tl-none shadow-sm flex space-x-2 items-center">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-3 bg-white border-t sticky bottom-0 z-10 pb-safe">
        <div className="flex items-center space-x-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ne tarz bir kombin istiyorsun?"
            className="rounded-full bg-slate-100 border-none"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={mutation.isPending}
          />
          <Button
            size="icon"
            className="rounded-full bg-slate-900 shrink-0"
            onClick={handleSend}
            disabled={mutation.isPending || !prompt.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
