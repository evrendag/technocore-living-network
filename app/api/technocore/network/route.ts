import { NextResponse } from "next/server";
import { extractRecords, normalizeRecord, type TechnocoreEvent } from "@/lib/technocore";

export const dynamic = "force-dynamic";

const ROOMS = ["lobby", "technocore", "flop", "kibble", "validators", "gpu-miners"] as const;

async function readRoom(room: string) {
  const url = new URL(`https://technocore.chat/r/${encodeURIComponent(room)}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "40");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json", "user-agent": "technocore-living-network/0.2" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { room, live: false, status: response.status, events: [] as TechnocoreEvent[] };
    const payload = await response.json();
    const events = extractRecords(payload)
      .map(record => normalizeRecord(room, record))
      .filter((event): event is TechnocoreEvent => Boolean(event))
      .sort((a, b) => a.seq - b.seq)
      .slice(-40);
    return { room, live: true, status: response.status, events };
  } catch {
    return { room, live: false, status: 0, events: [] as TechnocoreEvent[] };
  }
}

export async function GET() {
  const startedAt = Date.now();
  const rooms = await Promise.all(ROOMS.map(readRoom));
  const events = rooms.flatMap(r => r.events).sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)).slice(-180);
  const agents = new Set(events.map(event => event.from));
  const liveRooms = rooms.filter(room => room.live).length;

  return NextResponse.json({
    live: liveRooms > 0,
    liveRooms,
    totalRooms: rooms.length,
    agentCount: agents.size,
    eventCount: events.length,
    latencyMs: Date.now() - startedAt,
    rooms: rooms.map(room => ({ room: room.room, live: room.live, status: room.status, eventCount: room.events.length })),
    events,
  }, { headers: { "cache-control": "no-store" } });
}
