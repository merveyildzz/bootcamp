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
    <div className="flex shrink-0 flex-col gap-3 lg:w-64 lg:border-r lg:border-border lg:pr-4">
      <Button size="sm" onClick={onCreate} isLoading={isCreating} className="shrink-0">
        <Plus size={16} />
        Yeni Sohbet
      </Button>

      <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-y-auto lg:overflow-x-visible">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "group flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer lg:shrink",
              conversation.id === activeId ? "bg-accent-muted text-accent" : "text-text-muted hover:bg-surface-hover",
            )}
            onClick={() => onSelect(conversation.id)}
          >
            <MessageCircle size={14} className="shrink-0" />
            <span className="max-w-40 truncate lg:max-w-none lg:flex-1">{conversation.title ?? "Yeni Sohbet"}</span>
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
