import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    const response = await fetch("https://technocore.chat/rooms?format=json", {
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "technocore-living-network/0.1" },
      signal: AbortSignal.timeout(4000),
    });

    return NextResponse.json({
      ok: true,
      app: "technocore-living-network",
      upstream: response.ok ? "reachable" : "degraded",
      upstreamStatus: response.status,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: response.ok ? 200 : 503, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({
      ok: false,
      app: "technocore-living-network",
      upstream: "unreachable",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
