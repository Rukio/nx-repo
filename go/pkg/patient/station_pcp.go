package patient

type StationPCP struct {
	PatientHasPCP       *bool                    `json:"patient_has_pcp,omitempty"`
	PrimaryCareProvider *StationClinicalProvider `json:"primaryCareProvider,omitempty"`
}

type StationClinicalProvider struct {
	ClinicalProviderID *string `json:"clinicalProviderId,omitempty"`
}
