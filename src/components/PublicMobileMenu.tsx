"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  Home,
  Info,
  LogIn,
  Mail,
  Menu,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type PublicNavItem = {
  href: string;
  label: string;
};

const navIcons: Record<string, LucideIcon> = {
  "/": Home,
  "/features": Boxes,
  "/seguranca": ShieldCheck,
  "/sobre": Info,
  "/contato": Mail,
};

export function PublicMobileMenu({ items }: { items: PublicNavItem[] }) {
  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-accent hover:text-accent-foreground md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[86vw] max-w-xs border-border bg-background/95 px-0 backdrop-blur-xl"
      >
        <div className="h-1 bg-primary" />
        <SheetHeader className="border-b border-border px-6 py-6 text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/davus-logo.svg"
              alt="Sis Davus"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div>
              <SheetTitle className="text-sm uppercase tracking-[0.18em]">
                Sis Davus
              </SheetTitle>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Controle de estoque
              </p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex flex-col gap-2 px-4 py-5">
          {items.map((item) => {
            const Icon = navIcons[item.href] ?? Menu;

            return (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className="group flex min-h-12 items-center gap-3 rounded-md border border-transparent px-3 py-3 text-base font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary transition-colors group-hover:border-primary/30 group-hover:bg-background">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border p-4">
          <SheetClose asChild>
            <Link
              href="/login"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
