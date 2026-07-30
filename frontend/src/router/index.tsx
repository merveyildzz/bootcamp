import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/router/ProtectedRoute";
import { PublicOnlyRoute } from "@/router/PublicOnlyRoute";
import { Spinner } from "@/shared/ui/Spinner";

const AuthLayout = lazy(() => import("@/layouts/AuthLayout"));
const AppLayout = lazy(() => import("@/layouts/AppLayout"));

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage"));
const ProfilePage = lazy(() => import("@/features/auth/pages/ProfilePage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const WardrobePage = lazy(() => import("@/features/wardrobe/pages/WardrobePage"));
const ChatPage = lazy(() => import("@/features/chat/pages/ChatPage"));
const EventsPage = lazy(() => import("@/features/events/pages/EventsPage"));
const StatsPage = lazy(() => import("@/features/stats/pages/StatsPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function PageFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner />
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  { index: true, element: <Navigate to="/dashboard" replace /> },
  {
    element: withSuspense(
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>,
    ),
    children: [
      { path: "/login", element: withSuspense(<LoginPage />) },
      { path: "/register", element: withSuspense(<RegisterPage />) },
    ],
  },
  {
    element: withSuspense(
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>,
    ),
    children: [
      { path: "/dashboard", element: withSuspense(<DashboardPage />) },
      { path: "/wardrobe", element: withSuspense(<WardrobePage />) },
      { path: "/chat", element: withSuspense(<ChatPage />) },
      { path: "/events", element: withSuspense(<EventsPage />) },
      { path: "/stats", element: withSuspense(<StatsPage />) },
      { path: "/profile", element: withSuspense(<ProfilePage />) },
    ],
  },
  { path: "*", element: withSuspense(<NotFoundPage />) },
]);
