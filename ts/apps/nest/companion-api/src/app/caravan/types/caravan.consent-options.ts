export interface Option {
  id: number;
  order: number;
  name: string;
}

export interface RequirableOption extends Option {
  required: boolean;
}

export interface CaravanConsentOptions {
  signers: Option[];
  languages: Option[];
  frequencies: Option[];
  categories: RequirableOption[];
  capture_methods: Option[];
}
