import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const response = await fetch("https://technocore.chat/healthz", {
      cache: "no-store",
      headers: { accept: "text/plain", "user-agent": "technocore-living-network/0.1" },
      signal: AbortSignal.timeout(4000),
    });

    return NextResponse.json({
      ok: true,
      app: "technocore-living-network",
      upstream: response.ok ? "reachable" : "degraded",
      upstreamStatus: response.status,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 200, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({
      ok: true,
      app: "technocore-living-network",
      upstream: "unreachable",
      upstreamStatus: null,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 200, headers: { "cache-control": "no-store" } });
  }
}
