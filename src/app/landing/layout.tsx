import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "SIS DAVUS - Sistema de Controle de Estoque e Patrimônio",
  description: "Sistema interno de controle de estoque e patrimônio. Gerencie bens, produtos e movimentações da sua empresa de forma simples e eficiente.",
};

export const viewport: Viewport = {
  themeColor: "#ff5d38",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
