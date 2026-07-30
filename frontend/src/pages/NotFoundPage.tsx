import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh items-center justify-center bg-base p-4">
      <EmptyState
        icon={<Compass size={22} />}
        title="Sayfa bulunamadı"
        description="Aradığınız sayfa taşınmış veya hiç var olmamış olabilir."
        action={<Button onClick={() => navigate("/")}>Panele dön</Button>}
      />
    </div>
  );
}
