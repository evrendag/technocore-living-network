export type EventKind = "JOB" | "CLAIM" | "RESULT" | "ATTEST" | "MESSAGE";

export type TechnocoreEvent = {
  id: string;
  seq: number;
  room: string;
  from: string;
  text: string;
  ts: string;
  signed: boolean;
  kind: EventKind;
};

export function classifyEvent(text: string): EventKind {
  const upper = text.trim().toUpperCase();
  if (/\bATTEST\b/.test(upper)) return "ATTEST";
  if (/\bRESULT\b/.test(upper)) return "RESULT";
  if (/\bCLAIM\b/.test(upper)) return "CLAIM";
  if (/\bJOB\b/.test(upper)) return "JOB";
  return "MESSAGE";
}

export function normalizeRecord(room: string, raw: unknown): TechnocoreEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const seq = Number(record.seq ?? 0);
  const from = String(record.from ?? record.nick ?? "unknown");
  const text = String(record.text ?? record.message ?? "");
  const ts = String(record.ts ?? record.timestamp ?? new Date().toISOString());
  if (!Number.isFinite(seq) || !text) return null;
  return {
    id: `${room}:${seq}:${from}`,
    seq,
    room,
    from,
    text,
    ts,
    signed: Boolean(record.sig) || from.startsWith("did:key:"),
    kind: classifyEvent(text),
  };
}

export function extractRecords(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    if (Array.isArray(value.messages)) return value.messages;
    if (Array.isArray(value.records)) return value.records;
    if (Array.isArray(value.items)) return value.items;
  }
  return [];
}
