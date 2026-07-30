import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { useAuthStore } from "@/features/auth/store/authStore";

function App() {
  useEffect(() => {
    // Browsers can restore a page from bfcache (back/forward cache) — e.g. reopening a
    // tab, or navigating back/forward — which resumes the exact frozen JS state (still
    // "logged in" in memory) WITHOUT re-running any boot code. event.persisted marks that
    // case, so we force the session back to logged-out to keep "always start at login" true.
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        useAuthStore.getState().clearSession();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return <RouterProvider router={router} />;
}

export default App;
