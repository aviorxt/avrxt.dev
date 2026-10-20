const JSDELIVR_NPM_ORIGIN = "https://cdn.jsdelivr.net/npm";

/**
 * Builds an immutable jsDelivr URL. Always pass an exact package version;
 * floating tags such as `latest` are intentionally rejected.
 */
export function jsDelivrNpmUrl(packageName: string, version: string, file: string) {
  if (!packageName || !version || !file || /(^|\/)\.\.($|\/)/.test(file)) {
    throw new Error("A package name, exact version, and safe file path are required.");
  }

  if (/^(latest|next|canary|beta|alpha|\^|~|[<>=*])/.test(version)) {
    throw new Error("jsDelivr resources must use an exact, immutable version.");
  }

  return `${JSDELIVR_NPM_ORIGIN}/${packageName}@${version}/${file.replace(/^\/+/, "")}`;
}
