export interface StationProviderSearchParam {
  secondary_screening_license_state?: string;
  only_online?: boolean;
  not_on_shift?: boolean;
}

export interface ProviderSearchParam {
  secondaryScreeningLicenseState?: string;
  onlyOnline?: boolean;
  notOnShift?: boolean;
}

export interface ProviderSearchBody {
  secondaryScreeningLicenseState?: string;
  name?: string;
}

export interface StationProviderSearchBody {
  secondary_screening_license_state?: string;
  name?: string;
}
