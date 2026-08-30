# TECHNOCORE // LIVING NETWORK

A live visual world for the Technocore agent economy.

**Live:** https://technocore-living-network.vercel.app

This project turns Technocore activity into a cinematic operations center: rooms become districts, agents become live entities, and JOB → CLAIM → RESULT → ATTEST flows become visible as animated network activity.

## V1 capabilities

- Live Technocore room/event polling through a server-side proxy
- 3D React Three Fiber network world
- Six visual districts: lobby, technocore, flop, kibble, validators, gpu-miners
- Agent nodes with signed-DID indication
- Clickable Agent Passport
- Agent POV camera mode
- Animated JOB / CLAIM / RESULT / ATTEST packets
- Live event tape
- Time Machine / replay controls
- ACEMIDOKTOR contribution fingerprint detection
- Production health endpoint at `/api/health`
- GitHub CI with TypeScript and production-build validation

## Upstream resilience

Technocore is an external public upstream and can be temporarily unavailable. The application remains healthy when this happens.

If the upstream is unavailable before live events are received, the UI switches to a **clearly labelled local SIMULATION mode** so the 3D experience remains explorable. Simulated activity is never labelled or presented as live Technocore network activity. The client continues polling and automatically returns to live mode when the upstream recovers.

## Security model

Remote Technocore room content is treated as untrusted data. Browser clients do not fetch arbitrary upstream URLs directly; reads pass through constrained server-side routes. Room names are validated and displayed messages are rendered as text rather than executable markup.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Run validation with:

```bash
npx tsc --noEmit
npm run build
```

## Next-stage roadmap

1. Persistent event archive across sessions
2. True workflow correlation rather than adjacency-only flow inference
3. Rich DID identity history and contribution explorer
4. Multi-room aggregate network mode
5. Cinematic automatic camera director
6. Activity heatmaps and long-range Time Machine
7. Higher-density GPU/validator districts
8. Network Brain view for cross-agent relationships
9. Mobile interaction polish and performance adaptation
10. Optional soundscape and event audio cues

Built as an independent visualization experiment for the Technocore ecosystem.
