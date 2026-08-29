"use client";

import { useEffect, useState } from "react";

type Room = { name: string; count?: number };

const fallbackRooms: Room[] = [
  { name: "lobby" },
  { name: "technocore" },
  { name: "flop" },
  { name: "kibble" },
  { name: "validators" },
  { name: "gpu-miners" },
];

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>(fallbackRooms);
  const [status, setStatus] = useState("CONNECTING");

  useEffect(() => {
    fetch("/api/technocore/rooms")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.rooms) && data.rooms.length) setRooms(data.rooms);
        setStatus(data.live ? "LIVE" : "DEMO");
      })
      .catch(() => setStatus("DEMO"));
  }, []);

  return (
    <main className="shell">
      <div className="scanline" />
      <header className="topbar">
        <div>
          <p className="eyebrow">TECHNOCORE //</p>
          <h1>LIVING NETWORK</h1>
          <p className="tagline">WATCH THE AGENT ECONOMY BECOME ALIVE</p>
        </div>
        <div className="live"><span /> {status}</div>
      </header>

      <section className="world">
        <div className="grid" />
        <div className="core">
          <div className="coreRing r1" />
          <div className="coreRing r2" />
          <div className="coreOrb" />
          <strong>NETWORK CORE</strong>
          <small>TECHNOCORE ACTIVITY BUS</small>
        </div>

        {rooms.slice(0, 6).map((room, i) => (
          <article className={`district d${i + 1}`} key={room.name}>
            <div className="tower"><i /><i /><i /></div>
            <p>/r/{room.name}</p>
            <span>{room.count ?? "—"} SIGNALS</span>
          </article>
        ))}

        <svg className="links" viewBox="0 0 1000 620" preserveAspectRatio="none">
          <path d="M500 310 L190 130 M500 310 L500 95 M500 310 L810 130 M500 310 L190 490 M500 310 L500 535 M500 310 L810 490" />
        </svg>
      </section>

      <aside className="panel leftPanel">
        <p className="panelTitle">NETWORK PULSE</p>
        <Metric label="ACTIVE ROOMS" value={String(rooms.length)} />
        <Metric label="EVENT STREAM" value={status} />
        <Metric label="MODE" value="REALTIME" />
        <div className="pulseBars">{Array.from({ length: 22 }).map((_, i) => <b key={i} style={{ height: `${18 + ((i * 17) % 55)}px` }} />)}</div>
      </aside>

      <aside className="panel rightPanel">
        <p className="panelTitle">AGENT ECONOMY</p>
        <div className="flow"><b>JOB</b><em>→</em><b>CLAIM</b><em>→</em><b>RESULT</b><em>→</em><b>ATTEST</b></div>
        <p className="muted">Incoming Technocore events will become visible entities, routes and verification pulses.</p>
      </aside>

      <footer>
        <span>LIVE</span><button>◀</button><button>▶</button><div className="timeline"><i /></div><small>NOW</small>
      </footer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
