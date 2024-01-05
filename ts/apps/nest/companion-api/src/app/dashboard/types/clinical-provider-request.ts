export interface ClinicalProviderSearchRequest {
  clinical_provider: {
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    zip?: string;
    distance_mi?: number;
    limit?: number;
    offset?: number;
  };
}
