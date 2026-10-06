import { apiFetch } from "./api";
import type { AnalysisStatusResponse, AnalysisSummaryResponse, DiscrepancyDetailResponse } from "../types/results";

export interface LeadInfo {
  restaurant_name: string;
  contact_email: string;
  whatsapp_number: string;
}

export function fetchAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse> {
  return apiFetch<AnalysisStatusResponse>(`/analyses/${analysisId}`);
}

export function recordLead(analysisId: string, lead: LeadInfo): Promise<void> {
  return apiFetch<void>(`/analyses/${analysisId}/lead`, { method: "POST", body: lead });
}

export function fetchAnalysisSummary(analysisId: string): Promise<AnalysisSummaryResponse> {
  return apiFetch<AnalysisSummaryResponse>(`/analyses/${analysisId}/summary`);
}

export function fetchAnalysisDiscrepancies(analysisId: string): Promise<DiscrepancyDetailResponse[]> {
  return apiFetch<DiscrepancyDetailResponse[]>(`/analyses/${analysisId}/discrepancies`);
}
