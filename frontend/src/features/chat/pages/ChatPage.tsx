import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ConversationSidebar } from "@/features/chat/components/ConversationSidebar";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { ChatComposer } from "@/features/chat/components/ChatComposer";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useMessages,
  useSendMessage,
} from "@/features/chat/api/queries";
import { getApiErrorMessage } from "@/lib/errors";
import type { Conversation } from "@/types/chat";
import type { WeatherLocation } from "@/types/weather";

export default function ChatPage() {
  const conversationsQuery = useConversations();
  const conversations = conversationsQuery.data ?? [];

  const [activeId, setActiveId] = useState<number | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<Conversation | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (activeId === null && conversationsQuery.data && conversationsQuery.data.length > 0) {
      setActiveId(conversationsQuery.data[0].id);
    }
  }, [activeId, conversationsQuery.data]);

  const messagesQuery = useMessages(activeId);
  const messages = messagesQuery.data ?? [];

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage(activeId);

  async function handleCreateConversation() {
    const conversation = await createConversation.mutateAsync();
    setActiveId(conversation.id);
  }

  function handleConfirmDelete() {
    if (!deletingConversation) return;
    deleteConversation.mutate(deletingConversation.id, {
      onSuccess: () => {
        if (activeId === deletingConversation.id) setActiveId(null);
        setDeletingConversation(null);
      },
    });
  }

  async function handleSend(content: string, location: WeatherLocation | null) {
    setSendError(null);
    try {
      await sendMessage.mutateAsync({ content, location });
    } catch (error) {
      setSendError(getApiErrorMessage(error, "Mesaj gönderilemedi"));
    }
  }

  return (
    <div className="flex h-[calc(100svh-4rem)] gap-4">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={handleCreateConversation}
        onDelete={setDeletingConversation}
        isCreating={createConversation.isPending}
      />

      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">AI Sohbet</h1>
          <p className="text-sm text-text-muted">Bugün ne giyeceğinizi anlatın, size özel bir kombin önerelim.</p>
        </div>

        {activeId === null ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={<MessageCircle size={22} />}
              title="Sohbete henüz başlamadınız"
              description="Örneğin: “Yarın iş görüşmem var, ne giymeliyim?” yazabilirsiniz."
              action={
                <Button onClick={handleCreateConversation} isLoading={createConversation.isPending}>
                  Yeni Sohbet
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {messagesQuery.isLoading ? (
                <>
                  <Skeleton className="h-14 w-2/3" />
                  <Skeleton className="ml-auto h-10 w-1/2" />
                </>
              ) : (
                messages.map((message) => <MessageBubble key={message.id} message={message} />)
              )}
              {sendMessage.isPending ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-text-muted">
                    Yazıyor...
                  </div>
                </div>
              ) : null}
            </div>

            {sendError ? <p className="text-sm text-danger">{sendError}</p> : null}
            <ChatComposer onSend={handleSend} isSending={sendMessage.isPending} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deletingConversation)}
        onClose={() => setDeletingConversation(null)}
        onConfirm={handleConfirmDelete}
        title="Sohbeti sil"
        description="Bu sohbeti kalıcı olarak silmek istediğinize emin misiniz?"
        isConfirming={deleteConversation.isPending}
      />
    </div>
  );
}
