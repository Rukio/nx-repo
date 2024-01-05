export interface DashboardPrimaryCareProvider {
  patient_has_pcp: boolean | null;
  primaryCareProvider: {
    clinicalProviderId?: string;
  };
}
