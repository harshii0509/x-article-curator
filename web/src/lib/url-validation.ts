import { resolve4, resolve6 } from "node:dns/promises";
import { isIP } from "node:net";

const PRIVATE_RANGES_V4 = [
  { prefix: "127.", mask: null },
  { prefix: "10.", mask: null },
  { prefix: "0.", mask: null },
  { prefix: "169.254.", mask: null },
  { prefix: "192.168.", mask: null },
];

function isPrivateV4(ip: string): boolean {
  if (
    PRIVATE_RANGES_V4.some((r) => ip.startsWith(r.prefix))
  ) {
    return true;
  }

  // 172.16.0.0/12
  const parts = ip.split(".");
  if (parts[0] === "172") {
    const second = Number(parts[1]);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd");
}

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateV4(ip);
  if (isIP(ip) === 6) return isPrivateV6(ip);
  return false;
}

export function validateHttpUrl(url: string): { valid: true; parsed: URL } | { valid: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, reason: "Only HTTP(S) URLs are allowed" };
  }

  return { valid: true, parsed };
}

/**
 * Resolves the hostname and checks that it doesn't point to a private/internal IP.
 * Throws if the hostname resolves to a blocked address.
 */
export async function assertPublicHostname(hostname: string): Promise<void> {
  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error("URL points to a private/internal address");
    }
    return;
  }

  let addresses: string[] = [];
  try {
    const v4 = await resolve4(hostname).catch(() => [] as string[]);
    const v6 = await resolve6(hostname).catch(() => [] as string[]);
    addresses = [...v4, ...v6];
  } catch {
    throw new Error("Could not resolve hostname");
  }

  if (addresses.length === 0) {
    throw new Error("Could not resolve hostname");
  }

  for (const addr of addresses) {
    if (isPrivateIP(addr)) {
      throw new Error("URL points to a private/internal address");
    }
  }
}
