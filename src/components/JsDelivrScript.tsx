"use client";

import Script from "next/script";
import { jsDelivrNpmUrl } from "@/lib/jsdelivr";

type JsDelivrScriptProps = {
  id: string;
  packageName: string;
  version: string;
  file: string;
  /** SHA-384 or SHA-512 SRI hash for the exact CDN asset. */
  integrity: string;
  strategy?: "afterInteractive" | "lazyOnload";
};

/**
 * Opt-in loader for small, browser-only libraries. Keep React, Next.js, and
 * application packages in npm so they remain part of the tested build.
 */
export default function JsDelivrScript({
  id,
  packageName,
  version,
  file,
  integrity,
  strategy = "lazyOnload",
}: JsDelivrScriptProps) {
  return (
    <Script
      id={id}
      src={jsDelivrNpmUrl(packageName, version, file)}
      integrity={integrity}
      crossOrigin="anonymous"
      strategy={strategy}
    />
  );
}
