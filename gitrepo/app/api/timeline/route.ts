import { NextRequest, NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github";
import { processRepos } from "@/lib/process";
import { generateTimelineSVG, generateErrorSVG } from "@/lib/svg-generator";
import { Theme, Mode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // ── Parse query params ──
  const username = searchParams.get("username");
  const theme = (searchParams.get("theme") ?? "dark") as Theme;
  const mode = (searchParams.get("mode") ?? "mini") as Mode;
  const maxRepos = Math.min(
    Math.max(parseInt(searchParams.get("max") ?? "5", 10) || 5, 1),
    10
  );
  
  // Force cache busting in development
  const isDevelopment = process.env.NODE_ENV === "development";
  const timestamp = Date.now();
  const cacheKey = `${username}-${theme}-${mode}-${maxRepos}-${timestamp}`;

  // Validate theme and mode
  const validTheme: Theme = theme === "light" ? "light" : "dark";
  const validMode: Mode = mode === "full" ? "full" : "mini";

  // ── Validate username ──
  if (!username || username.trim().length === 0) {
    const svg = generateErrorSVG("Missing required parameter: username", validTheme);
    return new NextResponse(svg, {
      status: 400,
      headers: svgHeaders(0, `error-${Date.now()}`),
    });
  }

  // Sanitize username
  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9\-]/g, "");
  if (sanitizedUsername.length === 0 || sanitizedUsername.length > 39) {
    const svg = generateErrorSVG("Invalid GitHub username", validTheme);
    return new NextResponse(svg, {
      status: 400,
      headers: svgHeaders(0, `error-${Date.now()}`),
    });
  }

  try {
    // ── Fetch & process data ──
    const repos = await fetchUserRepos(sanitizedUsername);
    const processed = await processRepos(repos, sanitizedUsername, maxRepos);

    // ── Generate SVG ──
    const svg = generateTimelineSVG(processed, sanitizedUsername, validTheme, validMode);

    return new NextResponse(svg, {
      status: 200,
      headers: svgHeaders(process.env.NODE_ENV === "development" ? 0 : 86400, cacheKey), // No cache in dev, 24h in prod
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    const svg = generateErrorSVG(message, validTheme);

    return new NextResponse(svg, {
      status: 500,
      headers: svgHeaders(0, `error-${Date.now()}`), // Never cache errors
    });
  }
}

function svgHeaders(maxAge: number, cacheKey?: string): HeadersInit {
  const isDevelopment = process.env.NODE_ENV === "development";
  const timestamp = Date.now();
  
  if (isDevelopment || maxAge === 0) {
    return {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, private",
      "Pragma": "no-cache",
      "Expires": "Thu, 01 Jan 1970 00:00:00 GMT",
      "Last-Modified": new Date().toUTCString(),
      "ETag": `"${cacheKey || timestamp}"`,
      "Vary": "*",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-Cache-Status": "MISS",
    };
  }
  
  return {
    "Content-Type": "image/svg+xml",
    "Cache-Control": `public, s-maxage=${maxAge}, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    "ETag": `"${cacheKey || timestamp}"`,
    "X-Content-Type-Options": "nosniff",
  };
}
