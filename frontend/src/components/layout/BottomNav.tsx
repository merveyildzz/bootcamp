import Link from "next/link";
import { Home, MessageSquare, Settings, Shirt } from "lucide-react";

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 sm:absolute sm:bottom-0 left-0 right-0 border-t border-slate-200 bg-white/80 backdrop-blur-md pb-safe">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-900">
          <Home className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Ana Sayfa</span>
        </Link>
        <Link href="/chat" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-900">
          <MessageSquare className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Sohbet</span>
        </Link>
        <Link href="/wardrobe" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-900">
          <Shirt className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Dolabım</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center justify-center w-full h-full text-slate-500 hover:text-slate-900">
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">Ayarlar</span>
        </Link>
      </div>
    </nav>
  );
}
