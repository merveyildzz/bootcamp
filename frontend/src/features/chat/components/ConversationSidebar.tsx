import { Plus, Trash2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/shared/ui/Button";
import type { Conversation } from "@/types/chat";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onDelete: (conversation: Conversation) => void;
  isCreating: boolean;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  isCreating,
}: ConversationSidebarProps) {
  return (
    <div className="flex w-64 flex-col gap-3 border-r border-border pr-4">
      <Button size="sm" onClick={onCreate} isLoading={isCreating}>
        <Plus size={16} />
        Yeni Sohbet
      </Button>

      <div className="flex flex-col gap-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer",
              conversation.id === activeId ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-surface-hover",
            )}
            onClick={() => onSelect(conversation.id)}
          >
            <MessageCircle size={14} className="shrink-0" />
            <span className="flex-1 truncate">{conversation.title ?? "Yeni Sohbet"}</span>
            <button
              type="button"
              aria-label="Sohbeti sil"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation);
              }}
              className="hidden shrink-0 text-text-subtle hover:text-danger group-hover:block"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
