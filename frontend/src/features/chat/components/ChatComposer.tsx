import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { readCachedLocation } from "@/lib/weatherLocationStorage";
import type { WeatherLocation } from "@/types/weather";

interface ChatComposerProps {
  onSend: (content: string, location: WeatherLocation | null) => void;
  isSending: boolean;
  disabled?: boolean;
}

export function ChatComposer({ onSend, isSending, disabled }: ChatComposerProps) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed, readCachedLocation());
    setValue("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl border border-border bg-surface px-4 py-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Mesajınızı yazın..."
        className="flex-1 resize-none bg-transparent text-sm text-text outline-none placeholder:text-text-subtle disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={disabled || isSending || !value.trim()}
        aria-label="Gönder"
        className="shrink-0 text-accent disabled:cursor-not-allowed disabled:text-text-subtle"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
