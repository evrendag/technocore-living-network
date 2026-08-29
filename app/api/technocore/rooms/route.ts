import { NextResponse } from "next/server";

const UPSTREAM = "https://technocore.chat/rooms?format=json";
const fallback = ["lobby", "technocore", "flop", "kibble", "validators", "gpu-miners"].map((name) => ({ name }));

export async function GET() {
  try {
    const response = await fetch(UPSTREAM, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Technocore upstream ${response.status}`);
    const raw = await response.json();
    const source = Array.isArray(raw) ? raw : Array.isArray(raw.rooms) ? raw.rooms : [];
    const rooms = source.slice(0, 40).map((room: unknown) => {
      if (typeof room === "string") return { name: room.replace(/^\/r\//, "") };
      if (room && typeof room === "object") {
        const r = room as Record<string, unknown>;
        return {
          name: String(r.name ?? r.room ?? r.slug ?? "unknown").replace(/^\/r\//, ""),
          count: typeof r.count === "number" ? r.count : typeof r.messages === "number" ? r.messages : undefined,
        };
      }
      return { name: "unknown" };
    }).filter((r: { name: string }) => r.name !== "unknown");
    return NextResponse.json({ live: true, rooms: rooms.length ? rooms : fallback });
  } catch {
    return NextResponse.json({ live: false, rooms: fallback });
  }
}
