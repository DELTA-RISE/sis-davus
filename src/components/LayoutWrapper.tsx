"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { DesktopTopBar } from "@/components/DesktopTopBar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";

import { ScrollProgress } from "@/components/ScrollProgress";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, mustChangePassword } = useAuth();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const isChangePasswordPage = pathname === "/change-password";
  const isTVMode = pathname?.includes("/dashboard/tv");
  const isWikiPage = pathname?.startsWith("/wiki");

  // Public pages that shouldn't have the system HUD
  const publicPaths = [
    "/", "/features", "/seguranca", "/roadmap",
    "/enterprise", "/sobre", "/carreiras", "/blog",
    "/contato", "/privacidade", "/termos"
  ];
  const isPublicPage = publicPaths.includes(pathname || "");

  const { isCollapsed } = useSidebar();

  useEffect(() => {
    if (!isLoading && pathname === "/" && user) {
      router.replace(mustChangePassword ? "/change-password" : "/dashboard");
      return;
    }

    if (!isLoading && !isPublicPage && !isLoginPage && !isWikiPage) {
      if (!user) {
        router.replace("/login"); // Redirect to login if not authenticated
      } else if (mustChangePassword && !isChangePasswordPage) {
        router.replace("/change-password"); // Force password change
      }
    }
  }, [user, isLoading, pathname, isPublicPage, isLoginPage, isWikiPage, isChangePasswordPage, mustChangePassword, router]);

  useEffect(() => {
    if (isPublicPage || isLoginPage || isTVMode || isChangePasswordPage || isWikiPage) return;

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.querySelector("main")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [pathname, isPublicPage, isLoginPage, isTVMode, isChangePasswordPage, isWikiPage]);

  if (pathname === "/" && (isLoading || user)) {
    return <DashboardSkeleton />;
  }

  if (isPublicPage || isLoginPage || isTVMode || isChangePasswordPage || isWikiPage) {
    return (
      <div className="relative">
        {pathname === "/" && <ScrollProgress />}
        {children}
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background relative">
      <Sidebar />

      <main
        className={`flex-1 transition-all duration-300 pt-14 md:pt-16 pb-20 md:pb-0 min-w-0 overflow-x-hidden ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}
      >
        <div className="md:hidden">
          <TopBar />
        </div>
        <DesktopTopBar />

        {/* Content Animation Wrapper */}
        <div className="w-full max-w-7xl mx-auto h-full overflow-x-hidden">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <LayoutContent>
          {children}
        </LayoutContent>
      </SidebarProvider>
    </AuthProvider>
  );
}
