package patient

type StationDefaultPharmacyParams struct {
	DefaultPharmacy *StationDefaultPharmacyParamsPayload `json:"default_pharmacy"`
}

type StationDefaultPharmacyParamsPayload struct {
	DefaultPharmacyID string `json:"default_pharmacy_id,omitempty"`
}

type StationDefaultPharmacy struct {
	DefaultPharmacy *StationPharmacy `json:"default_pharmacy"`
}

type StationPharmacy struct {
	ClinicalProviderID   *string `json:"clinicalproviderid,omitempty"`
	ClinicalProviderName *string `json:"clinicalprovidername,omitempty"`
	PharmacyType         *string `json:"pharmacytype,omitempty"`
	State                *string `json:"state,omitempty"`
	City                 *string `json:"city,omitempty"`
	ReceiverType         *string `json:"receivertype,omitempty"`
	AcceptFax            *string `json:"acceptfax,omitempty"`
	Zip                  *string `json:"zip,omitempty"`
	PhoneNumber          *string `json:"phonenumber,omitempty"`
	Address1             *string `json:"address1,omitempty"`
	FaxNumber            *string `json:"faxnumber,omitempty"`
}
