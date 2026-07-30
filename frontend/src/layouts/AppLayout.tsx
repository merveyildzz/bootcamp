import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "@/layouts/Sidebar";
import { PageTransition } from "@/shared/motion/PageTransition";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-svh bg-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
