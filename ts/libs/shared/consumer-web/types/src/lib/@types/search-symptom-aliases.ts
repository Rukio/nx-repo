export interface SymptomAliasesSearchResult {
  id: string;
  symptomId: string;
  name: string;
  symptomName: string;
  legacyRiskProtocolName: string;
}

export interface Pagination {
  pageSize: number;
  totalResults: number;
  totalPages: number;
  currentPage: number;
}

export interface SearchSymptomAliasesResponse {
  symptoms: SymptomAliasesSearchResult[];
  pagination: Pagination;
}

export interface SearchSymptomAliasesParams {
  searchTerm: string;
  pageSize: number;
  page: number;
}

export interface RSSearchSymptomAliasesParams {
  search: string;
  'paginationQuery.page': number;
  'paginationQuery.pageSize': number;
}
