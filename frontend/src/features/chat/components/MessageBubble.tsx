import { cn } from "@/lib/cn";
import { OutfitCard } from "@/features/chat/components/OutfitCard";
import type { ChatMessage } from "@/types/chat";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", isUser ? "bg-accent text-white" : "bg-surface text-text border border-border")}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.outfit ? <OutfitCard outfit={message.outfit} /> : null}
      </div>
    </div>
  );
}
