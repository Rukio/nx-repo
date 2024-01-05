package patient

type StationPhoneNumberType struct {
	IsMobile bool `json:"mobile"`
}

type StationPowerOfAttorney struct {
	Name            *string                 `json:"name,omitempty"`
	Relationship    *string                 `json:"relationship,omitempty"`
	Phone           *string                 `json:"phone,omitempty"`
	PhoneNumberType *StationPhoneNumberType `json:"phone_number,omitempty"`
}

type StationPatientSafetyFlag struct {
	FlaggerID  *int64  `json:"flagger_id,omitempty"`
	FlagType   *string `json:"flag_type,omitempty"`
	FlagReason *string `json:"flag_reason,omitempty"`
}

type StationName struct {
	FirstName  *string `json:"first_name,omitempty"`
	MiddleName *string `json:"middle_name,omitempty"`
	LastName   *string `json:"last_name,omitempty"`
	Suffix     *string `json:"suffix,omitempty"`
}

type StationPhone struct {
	MobileNumber    *string                 `json:"mobile_number,omitempty"`
	PhoneNumberType *StationPhoneNumberType `json:"phone_number,omitempty"`
}

type StationEHRIdentifier struct {
	EHRID   *string `json:"ehr_id,omitempty"`
	EHRName *string `json:"ehr_name,omitempty"`
}

type StationBillingAddress struct {
	BillingAddressStreetAddress1 *string `json:"billing_address_street_address_1,omitempty"`
	BillingAddressStreetAddress2 *string `json:"billing_address_street_address_2,omitempty"`
	BillingAddressCity           *string `json:"billing_address_city,omitempty"`
	BillingAddressState          *string `json:"billing_address_state,omitempty"`
	BillingAddressZipcode        *string `json:"billing_address_zipcode,omitempty"`
}

type StationGuarantor struct {
	RelationshipToPatient *string `json:"relationship_to_patient,omitempty"`
	*StationName
	DateOfBirth          *string `json:"dob,omitempty"`
	SocialSecurityNumber *string `json:"ssn,omitempty"`
	Phone                *string `json:"phone,omitempty"`
	Email                *string `json:"email,omitempty"`
	SameAsCareAddress    bool    `json:"same_as_care_address,omitempty"`
	*StationBillingAddress
}

type StationBillingCity struct {
	BillingCityID *string `json:"billing_city_id,omitempty"`
}

type StationPatient struct {
	ID *int64 `json:"id,omitempty"`
	*StationPhone
	*StationName
	PatientEmail         *string `json:"patient_email,omitempty"`
	DateOfBirth          *string `json:"dob,omitempty"`
	Gender               *string `json:"gender,omitempty"`
	SocialSecurityNumber *string `json:"ssn,omitempty"`
	*StationEHRIdentifier
	*StationBillingAddress
	PowerOfAttorney   *StationPowerOfAttorney   `json:"power_of_attorney,omitempty"`
	Guarantor         *StationGuarantor         `json:"guarantor,omitempty"`
	PatientSafetyFlag *StationPatientSafetyFlag `json:"patient_safety_flag,omitempty"`
	UpdatedAt         *string                   `json:"updated_at,omitempty"`
	VoicemailConsent  *bool                     `json:"voicemail_consent,omitempty"`
	*StationBillingCity
}
