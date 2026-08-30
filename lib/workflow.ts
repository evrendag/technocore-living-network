import type { TechnocoreEvent } from "./technocore";

export type WorkflowStage = "JOB" | "CLAIM" | "RESULT" | "ATTEST";

export type CorrelatedWorkflow = {
  id: string;
  room: string;
  key: string;
  confidence: number;
  events: TechnocoreEvent[];
  stages: Partial<Record<WorkflowStage, TechnocoreEvent>>;
  agents: string[];
  complete: boolean;
};

const STAGES: WorkflowStage[] = ["JOB", "CLAIM", "RESULT", "ATTEST"];
const STOP = new Set(["this","that","with","from","into","then","than","have","will","your","their","about","task","work","agent","job","claim","result","attest"]);

function tokens(text: string) {
  return text.toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[^a-z0-9_-]+/g, " ").split(/\s+/).filter(t => t.length >= 4 && !STOP.has(t)).slice(0, 18);
}

function explicitKey(text: string) {
  const patterns = [
    /(?:job|task|work|request)[\s_-]*(?:id)?\s*[:#=]\s*([a-z0-9._-]{3,64})/i,
    /\b(?:ref|job|task)[\s_-]+([a-z0-9][a-z0-9._-]{4,63})\b/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match?.[1]) return match[1].toLowerCase();
  }
  return null;
}

function similarity(a: TechnocoreEvent, b: TechnocoreEvent) {
  const ak = explicitKey(a.text), bk = explicitKey(b.text);
  if (ak && bk && ak === bk) return 1;
  const A = new Set(tokens(a.text)), B = new Set(tokens(b.text));
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const token of A) if (B.has(token)) shared++;
  return shared / Math.max(A.size, B.size);
}

export function correlateWorkflows(events: TechnocoreEvent[]): CorrelatedWorkflow[] {
  const relevant = events.filter(e => STAGES.includes(e.kind as WorkflowStage)).sort((a,b) => a.seq - b.seq);
  const workflows: CorrelatedWorkflow[] = [];

  for (const event of relevant) {
    const stage = event.kind as WorkflowStage;
    const key = explicitKey(event.text);
    let best: CorrelatedWorkflow | undefined;
    let bestScore = -1;

    for (const flow of workflows) {
      if (flow.room !== event.room || flow.stages[stage]) continue;
      const last = flow.events[flow.events.length - 1];
      const seqGap = Math.max(0, event.seq - last.seq);
      if (seqGap > 80) continue;
      let score = similarity(last, event);
      if (key && flow.key === key) score += 1.5;
      if (stageOrder(stage) > stageOrder(last.kind as WorkflowStage)) score += 0.25;
      if (flow.agents.includes(event.from)) score += 0.1;
      score -= Math.min(0.3, seqGap / 250);
      if (score > bestScore) { best = flow; bestScore = score; }
    }

    if (!best || bestScore < 0.18 || stage === "JOB") {
      const idKey = key ?? `${event.room}-${event.seq}`;
      workflows.push({
        id: `wf:${idKey}`,
        room: event.room,
        key: idKey,
        confidence: key ? 1 : 0.45,
        events: [event],
        stages: { [stage]: event },
        agents: [event.from],
        complete: false,
      });
      continue;
    }

    best.events.push(event);
    best.stages[stage] = event;
    if (!best.agents.includes(event.from)) best.agents.push(event.from);
    best.confidence = Math.max(best.confidence, Math.min(1, bestScore));
    best.complete = STAGES.every(s => Boolean(best!.stages[s]));
  }

  return workflows.map(flow => ({ ...flow, complete: STAGES.every(s => Boolean(flow.stages[s])) }));
}

export function workflowEdges(workflows: CorrelatedWorkflow[]) {
  return workflows.flatMap(flow => {
    const ordered = STAGES.map(stage => flow.stages[stage]).filter(Boolean) as TechnocoreEvent[];
    return ordered.slice(1).map((event, i) => ({
      id: `${flow.id}:${i}`,
      workflowId: flow.id,
      from: ordered[i].from,
      to: event.from,
      kind: event.kind,
      confidence: flow.confidence,
    }));
  });
}

function stageOrder(stage: WorkflowStage) { return STAGES.indexOf(stage); }
