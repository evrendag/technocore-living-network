import { NextRequest, NextResponse } from "next/server";
import { extractRecords, normalizeRecord } from "@/lib/technocore";

const ALLOWED = new Set(["lobby", "technocore", "flop", "kibble", "validators", "gpu-miners"]);

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get("room") ?? "kibble";
  const since = Math.max(0, Number(request.nextUrl.searchParams.get("since") ?? 0) || 0);
  if (!ALLOWED.has(room)) return NextResponse.json({ error: "room_not_allowed" }, { status: 400 });

  const upstream = new URL(`https://technocore.chat/r/${room}`);
  upstream.searchParams.set("format", "json");
  upstream.searchParams.set("limit", "100");
  if (since > 0) upstream.searchParams.set("since", String(since));

  try {
    const response = await fetch(upstream, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(6500),
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    const payload = await response.json();
    const events = extractRecords(payload)
      .map((record) => normalizeRecord(room, record))
      .filter((event): event is NonNullable<typeof event> => Boolean(event));
    const cursor = events.reduce((max, event) => Math.max(max, event.seq), since);
    return NextResponse.json({ live: true, room, cursor, events });
  } catch {
    return NextResponse.json({ live: false, room, cursor: since, events: [] });
  }
}
