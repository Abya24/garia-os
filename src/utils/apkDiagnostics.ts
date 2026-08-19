/**
 * APK Diagnostics and Network Probe Utility
 * Performs diagnostic network checks on APK download endpoints to inspect
 * Content-Type, Content-Length, HTTP status, and detect truncated or HTML payloads.
 */

export interface ApkDiagnosticResult {
  url: string;
  timestamp: string;
  isBinary: boolean;
  isHtmlError: boolean;
  contentType: string | null;
  contentLength: number | null;
  contentLengthFormatted: string;
  httpStatus: number | null;
  noCorsStatus: string;
  sha256?: string;
  truncated: boolean;
  analysis: string;
  rawHeaders: Record<string, string>;
  sampleBodyText?: string;
}

/**
 * Diagnostic utility function that probes the APK endpoint using both
 * mode: 'no-cors' (as requested for opaque/cross-origin safety inspection)
 * and a standard fetch/HEAD request to inspect Content-Length and Content-Type headers.
 * Logs all values to the console to confirm if the server is serving the actual binary
 * file or an HTML error page.
 */
export async function diagnoseApkEndpoint(
  url: string = "/api/download/apk"
): Promise<ApkDiagnosticResult> {
  const cacheBustedUrl = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
  console.group(`[APK Diagnostic Probe] Analyzing: ${url}`);
  console.log(`[APK Diagnostic] Timestamp: ${new Date().toISOString()}`);
  console.log(`[APK Diagnostic] Target Request URL: ${cacheBustedUrl}`);

  let noCorsStatus = "untested";
  // 1. Fetch request using mode: 'no-cors' as specified
  try {
    const noCorsResponse = await fetch(cacheBustedUrl, {
      method: "GET",
      mode: "no-cors",
      cache: "no-cache",
    });
    noCorsStatus = `Resolved (type: ${noCorsResponse.type}, status: ${noCorsResponse.status})`;
    console.log(`[APK Diagnostic] mode: 'no-cors' response type:`, noCorsResponse.type);
    console.log(`[APK Diagnostic] mode: 'no-cors' response status:`, noCorsResponse.status);
  } catch (err: any) {
    noCorsStatus = `Error: ${err?.message || "Failed"}`;
    console.warn(`[APK Diagnostic] mode: 'no-cors' fetch error:`, err);
  }

  // 2. Inspect headers via standard fetch probe
  let contentType: string | null = null;
  let contentLength: number | null = null;
  let httpStatus: number | null = null;
  const rawHeaders: Record<string, string> = {};
  let sampleBodyText = "";

  try {
    const probeResponse = await fetch(cacheBustedUrl, {
      method: "GET",
      headers: {
        Accept: "application/vnd.android.package-archive, application/octet-stream, */*",
        Range: "bytes=0-1024", // lightweight range probe to inspect headers without full download
      },
      cache: "no-cache",
    });

    httpStatus = probeResponse.status;
    contentType = probeResponse.headers.get("content-type");
    const rawLength =
      probeResponse.headers.get("content-length") ||
      probeResponse.headers.get("content-range")?.split("/")[1] ||
      null;

    if (rawLength) {
      contentLength = parseInt(rawLength, 10);
    }

    probeResponse.headers.forEach((value, key) => {
      rawHeaders[key.toLowerCase()] = value;
    });

    // If text/html or error status, read sample text
    if (probeResponse.status >= 400 || contentType?.includes("text/html") || contentType?.includes("json")) {
      try {
        const text = await probeResponse.text();
        sampleBodyText = text.slice(0, 300);
      } catch (e) {
        // ignore
      }
    }
  } catch (err: any) {
    console.warn(`[APK Diagnostic] Header probe error:`, err);
    sampleBodyText = `Probe failed: ${err?.message || "Network Error"}`;
  }

  const isBinary =
    contentType?.includes("application/vnd.android.package-archive") ||
    contentType?.includes("application/octet-stream") ||
    false;

  const isHtmlError =
    httpStatus === 404 ||
    (httpStatus !== null && httpStatus >= 400) ||
    contentType?.includes("text/html") ||
    contentType?.includes("text/plain") ||
    sampleBodyText.toLowerCase().includes("<!doctype html") ||
    sampleBodyText.toLowerCase().includes("<html") ||
    false;

  // Truncated if < 1.0 MB (a full Android compiled release APK is typically >= 2 MB)
  const truncated = !!(contentLength && contentLength < 1048576);

  let analysis = "";
  if (isHtmlError) {
    analysis = `SERVER SERVING HTML/ERROR PAGE (HTTP ${httpStatus || "unknown"}) INSTEAD OF BINARY APK! Check server routes and fallback handlers.`;
  } else if (truncated) {
    analysis = `PAYLOAD TRUNCATED (${contentLength ? (contentLength / 1024).toFixed(1) + " KB" : "Unknown size"}). Expected > 1.0 MB for valid Android APK.`;
  } else if (isBinary) {
    analysis = "Valid Android Package Archive MIME type confirmed. Binary stream active with zero HTML encapsulation.";
  } else {
    analysis = `Unknown content type: ${contentType || "None"}.`;
  }

  console.log(`[APK Diagnostic] HTTP Status: ${httpStatus}`);
  console.log(`[APK Diagnostic] Content-Type: ${contentType}`);
  console.log(`[APK Diagnostic] Content-Length: ${contentLength} bytes (${contentLength ? (contentLength / 1024 / 1024).toFixed(2) + " MB" : "N/A"})`);
  console.log(`[APK Diagnostic] Payload Classification: ${isBinary ? "VALID_BINARY_APK" : isHtmlError ? "HTML_OR_ERROR_PAGE" : "UNKNOWN"}`);
  console.log(`[APK Diagnostic] Analysis: ${analysis}`);
  console.groupEnd();

  return {
    url,
    timestamp: new Date().toLocaleTimeString(),
    isBinary,
    isHtmlError,
    contentType,
    contentLength,
    contentLengthFormatted: contentLength
      ? `${(contentLength / (1024 * 1024)).toFixed(2)} MB (${contentLength.toLocaleString()} bytes)`
      : "Unknown",
    httpStatus,
    noCorsStatus,
    truncated,
    analysis,
    rawHeaders,
    sampleBodyText,
  };
}

