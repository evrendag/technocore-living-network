import { NextRequest, NextResponse } from "next/server";
import { extractRecords, normalizeRecord } from "@/lib/technocore";

const ROOM_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export async function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get("room") ?? "kibble";
  const since = Math.max(0, Number(request.nextUrl.searchParams.get("since") ?? 0) || 0);
  if (!ROOM_PATTERN.test(room)) return NextResponse.json({ error: "invalid_room" }, { status: 400 });

  const upstream = new URL(`https://technocore.chat/r/${encodeURIComponent(room)}`);
  upstream.searchParams.set("format", "json");
  upstream.searchParams.set("limit", "100");
  if (since > 0) upstream.searchParams.set("since", String(since));

  try {
    const response = await fetch(upstream, {
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "technocore-living-network/0.1" },
      signal: AbortSignal.timeout(6500),
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    const payload = await response.json();
    const events = extractRecords(payload)
      .map((record) => normalizeRecord(room, record))
      .filter((event): event is NonNullable<typeof event> => Boolean(event))
      .sort((a, b) => a.seq - b.seq);
    const cursor = events.reduce((max, event) => Math.max(max, event.seq), since);
    return NextResponse.json({ live: true, room, cursor, events }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ live: false, room, cursor: since, events: [] }, { headers: { "cache-control": "no-store" } });
  }
}
