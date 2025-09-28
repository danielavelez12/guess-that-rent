export interface Listing {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

export interface ListingsResponse {
  success: boolean;
  count: number;
  listings: Listing[];
}

export interface ScoreItem {
  id: string;
  user_id: string;
  username: string;
  score_value: number;
  created_at: string | null;
}

export interface ScoreTodayResponse {
  success: boolean;
  count: number;
  scores: ScoreItem[];
}
