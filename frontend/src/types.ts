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
