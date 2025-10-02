/**
 * ChatRequest DTO - Data Transfer Object for chat requests
 */

export interface ChatRequest {
  query: string;
  maxResults?: number;
  includeContext?: boolean;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  isTemporalQuery: boolean;
  documentsFound: number;
}
