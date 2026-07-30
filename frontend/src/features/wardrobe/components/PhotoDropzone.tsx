import { useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/shared/ui/Spinner";

interface PhotoDropzoneProps {
  onFileSelected: (file: File) => void;
  isAnalyzing: boolean;
}

export function PhotoDropzone({ onFileSelected, isAnalyzing }: PhotoDropzoneProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      onClick={() => !isAnalyzing && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-150",
        isDraggingOver ? "border-accent bg-accent-muted" : "border-border hover:border-border-hover hover:bg-surface-hover",
        isAnalyzing && "pointer-events-none opacity-60",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = "";
        }}
      />
      {isAnalyzing ? (
        <>
          <Spinner />
          <p className="text-sm text-text-muted">Fotoğraf analiz ediliyor...</p>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
            <UploadCloud size={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-text">Fotoğrafı buraya sürükleyin</p>
            <p className="text-sm text-text-muted">veya seçmek için tıklayın — JPEG, PNG veya WEBP</p>
          </div>
        </>
      )}
    </div>
  );
}
