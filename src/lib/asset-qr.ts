import { Asset } from "@/lib/store";

export function getAssetDetailsPath(asset: Pick<Asset, "id">) {
  return `/patrimonio/detalhes?id=${encodeURIComponent(asset.id)}`;
}

export function getAssetQrValue(asset: Pick<Asset, "id" | "code">) {
  const path = getAssetDetailsPath(asset);

  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}${path}`;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return `${appUrl.replace(/\/$/, "")}${path}`;

  return path;
}

export function getPatrimonioRouteFromQr(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.pathname === "/patrimonio/detalhes") {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Raw asset codes from older labels are handled below.
  }

  if (value.startsWith("/patrimonio/detalhes")) return value;

  return `/patrimonio/detalhes?code=${encodeURIComponent(value)}`;
}
