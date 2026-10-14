export type BoqStatus = "draft" | "final";

export type Boq = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: BoqStatus;
  positions: number;
  totalValue: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
};
