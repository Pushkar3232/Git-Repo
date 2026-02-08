import { NextRequest, NextResponse } from "next/server";
import { fetchUserRepos } from "@/lib/github";
import { processRepos } from "@/lib/process";
import { generateTimelineSVG, generateErrorSVG } from "@/lib/svg-generator";
import { Theme, Mode } from "@/lib/types";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // ── Parse query params ──
  const username = searchParams.get("username");
  const theme = (searchParams.get("theme") ?? "dark") as Theme;
  const mode = (searchParams.get("mode") ?? "full") as Mode;
  const maxRepos = Math.min(
    Math.max(parseInt(searchParams.get("max") ?? "8", 10) || 8, 1),
    15
  );

  // Validate theme and mode
  const validTheme: Theme = theme === "light" ? "light" : "dark";
  const validMode: Mode = mode === "compact" ? "compact" : "full";

  // ── Validate username ──
  if (!username || username.trim().length === 0) {
    const svg = generateErrorSVG("Missing required parameter: username", validTheme);
    return new NextResponse(svg, {
      status: 400,
      headers: svgHeaders(0),
    });
  }

  // Sanitize username
  const sanitizedUsername = username.trim().replace(/[^a-zA-Z0-9\-]/g, "");
  if (sanitizedUsername.length === 0 || sanitizedUsername.length > 39) {
    const svg = generateErrorSVG("Invalid GitHub username", validTheme);
    return new NextResponse(svg, {
      status: 400,
      headers: svgHeaders(0),
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
      headers: svgHeaders(86400), // Cache 24h
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    const svg = generateErrorSVG(message, validTheme);

    return new NextResponse(svg, {
      status: 500,
      headers: svgHeaders(300), // Cache errors for 5 min
    });
  }
}

function svgHeaders(maxAge: number): HeadersInit {
  return {
    "Content-Type": "image/svg+xml",
    "Cache-Control": `public, s-maxage=${maxAge}, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    "X-Content-Type-Options": "nosniff",
  };
}
