"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { DesktopTopBar } from "@/components/DesktopTopBar";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "./ui/button";

import { ScrollProgress } from "@/components/ScrollProgress";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, mustChangePassword } = useAuth();
  const router = useRouter();
  const isLandingPage = pathname === "/";
  const isLoginPage = pathname === "/login";
  const isChangePasswordPage = pathname === "/change-password";
  const isTVMode = pathname?.includes("/dashboard/tv");
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    if (!isLoading && !isLandingPage && !isLoginPage) {
      if (!user) {
        router.push("/login"); // Redirect to login if not authenticated
      } else if (mustChangePassword && !isChangePasswordPage) {
        router.push("/change-password"); // Force password change
      }
    }
  }, [user, isLoading, isLandingPage, isLoginPage, isChangePasswordPage, mustChangePassword, router]);

  if (isLandingPage || isLoginPage || isTVMode || isChangePasswordPage) {
    return (
      <>
        {isLandingPage && <ScrollProgress />}
        {children}
      </>
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
        className={`flex-1 transition-all duration-300 pt-14 md:pt-16 pb-20 md:pb-0 ${isCollapsed ? "md:ml-20" : "md:ml-64"}`}
      >
        <div className="md:hidden">
          <TopBar />
        </div>
        <DesktopTopBar />

        {/* Content Animation Wrapper */}
        <div className="container mx-auto max-w-7xl h-full">
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
        <LayoutContent>{children}</LayoutContent>
      </SidebarProvider>
    </AuthProvider>
  );
}