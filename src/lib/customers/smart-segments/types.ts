export type CustomerSmartSegment = {
  id: string;
  name: string;
  description: string;
  customerIds: string[];
  rationale?: string;
};

export type CustomerSmartSegmentCard = {
  id: string;
  name: string;
  description: string;
  customerCount: number;
  averageTicket: string;
  lastActivityRelative: string;
  rationale?: string;
};

export type CustomerSmartSegmentsMeta = {
  source: "ai" | "rules";
  generatedAt: string | null;
};
