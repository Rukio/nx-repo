export interface ServiceLine {
  id: number;
  name: string;
  default: boolean;
}

export interface Market {
  id: number;
  name: string;
  shortName: string;
  state: string;
}

export interface MarketsConfigurationState {
  selectedServiceLine?: ServiceLine;
  currentPage: number;
  rowsPerPage: number;
}
