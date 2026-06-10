export type CustomerSavedSegmentSummary = {
  id: string;
  name: string;
  description: string | null;
  customerCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSavedSegmentInput = {
  name: string;
  description?: string;
  customerIds?: string[];
};
