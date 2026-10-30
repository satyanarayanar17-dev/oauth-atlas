export type EvidenceLevel = "documented" | "estimate" | "unverified";

export interface Source {
  id: string;
  title: string;
  url: string;
  checkedAt: string;
}

export interface GuideStep {
  id: string;
  title: string;
  detail: string;
  owner: "developer" | "agent" | "provider";
  evidence: EvidenceLevel;
  sourceIds: string[];
  actionUrl?: string;
}

export interface Guide {
  id: string;
  name: string;
  domain: string;
  category: string;
  difficulty:
    | "Straightforward"
    | "Conditional review"
    | "Significant review"
    | "Needs investigation";
  summary: string;
  setupTime: string;
  waitTime: string;
  timeNote: string;
  review: string;
  scopeNote: string;
  recommendedScopes: string[];
  prerequisites: string[];
  steps: GuideStep[];
  blockers: {
    title: string;
    detail: string;
    resolution: string;
    sourceIds: string[];
  }[];
  agentCan: string[];
  humanMust: string[];
  sources: Source[];
  validation: { checked: string[]; notChecked: string[]; correction?: string };
  updatedAt: string;
  generated?: boolean;
  researchMode?: "agent" | "source-scan";
  intent?: string;
}

export interface ResearchTrace {
  label: string;
  detail: string;
  status: "done" | "warning";
}
