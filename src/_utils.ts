import { promises as fs } from "node:fs";
import { networkInterfaces } from "node:os";
import { cyan, underline, bold } from "colorette";
import type { Certificate, HTTPSOptions } from "./types";

export async function resolveCert(
  options: HTTPSOptions,
  host?: string,
): Promise<Certificate> {
  // Use cert if provided
  if (options.key && options.cert) {
    const isInline = (s = "") => s.startsWith("--");
    const r = (s: string) => (isInline(s) ? s : fs.readFile(s, "utf8"));
    return {
      key: await r(options.key),
      cert: await r(options.cert),
    };
  }

  // Use auto generated cert
  const { generateCA, generateSSLCert } = await import("./cert");
  const ca = await generateCA();
  const cert = await generateSSLCert({
    caCert: ca.cert,
    caKey: ca.key,
    domains:
      options.domains ||
      (["localhost", "127.0.0.1", "::1", host].filter(Boolean) as string[]),
    validityDays: options.validityDays || 1,
  });
  return cert;
}

export function getNetworkInterfaces(v4Only = true): string[] {
  const addrs = new Set<string>();
  for (const details of Object.values(networkInterfaces())) {
    if (details) {
      for (const d of details) {
        if (
          !d.internal &&
          !(d.mac === "00:00:00:00:00:00") &&
          !d.address.startsWith("fe80::") &&
          !(v4Only && (d.family === "IPv6" || +d.family === 6))
        ) {
          addrs.add(formatAddress(d));
        }
      }
    }
  }
  return [...addrs].sort();
}

export function formatAddress(addr: {
  family: string | number;
  address: string;
}) {
  return addr.family === "IPv6" || addr.family === 6
    ? `[${addr.address}]`
    : addr.address;
}

export function formatURL(url: string) {
  return cyan(
    underline(decodeURI(url).replace(/:(\d+)\//g, `:${bold("$1")}/`)),
  );
}