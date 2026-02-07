/**
 * Tipos CPQ (Configure, Price, Quote)
 */

export type CpqQuoteStatus = "draft" | "sent" | "approved" | "rejected";

export interface CpqCargo {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CpqRol {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CpqPuestoTrabajo {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CpqPosition {
  id: string;
  quoteId: string;
  puestoTrabajoId: string;
  customName?: string | null;
  description?: string | null;
  weekdays: string[];
  startTime: string;
  endTime: string;
  numGuards: number;
  cargoId: string;
  rolId: string;
  baseSalary: number;
  afpName: string;
  healthSystem: string;
  healthPlanPct?: number | null;
  employerCost: number;
  netSalary?: number | null;
  monthlyPositionCost: number;
  payrollSnapshot?: any;
  payrollVersionId?: string | null;
  calculatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  puestoTrabajo?: CpqPuestoTrabajo;
  cargo?: CpqCargo;
  rol?: CpqRol;
}

export interface CpqQuote {
  id: string;
  tenantId: string;
  code: string;
  status: CpqQuoteStatus;
  clientName?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  totalPositions: number;
  totalGuards: number;
  monthlyCost: number;
  createdAt: string;
  updatedAt: string;
  positions?: CpqPosition[];
}

export interface CreateQuoteInput {
  clientName?: string;
  validUntil?: string;
  notes?: string;
}

export interface UpdateQuoteInput {
  status?: CpqQuoteStatus;
  clientName?: string;
  validUntil?: string;
  notes?: string;
}

export interface CreatePositionInput {
  puestoTrabajoId: string;
  customName?: string;
  description?: string;
  weekdays: string[];
  startTime: string;
  endTime: string;
  numGuards: number;
  cargoId: string;
  rolId: string;
  baseSalary: number;
  afpName?: string;
  healthSystem?: string;
  healthPlanPct?: number | null;
}

export interface UpdatePositionInput extends Partial<CreatePositionInput> {}

export interface QuoteDetailResponse {
  quote: CpqQuote;
  positions: CpqPosition[];
}
