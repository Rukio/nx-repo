package patient

type StationInsurance struct {
	ID                          *int64                         `json:"id,omitempty"`
	PatientID                   *int64                         `json:"patient_id,omitempty"`
	Priority                    *string                        `json:"priority,omitempty"`
	MemberID                    *string                        `json:"member_id,omitempty"`
	GroupNumber                 *string                        `json:"group_number,omitempty"`
	PrimaryInsuranceHolder      *StationPrimaryInsuranceHolder `json:"primary_insurance_holder_attributes,omitempty"`
	Eligible                    *string                        `json:"eligible,omitempty"`
	EligibilityMessage          *string                        `json:"eligibility_message,omitempty"`
	ImageRequiresVerification   *bool                          `json:"image_requires_verification,omitempty"`
	UpdatedAt                   *string                        `json:"updated_at,omitempty"`
	RemoveCardFront             *bool                          `json:"remove_card_front,omitempty"`
	RemoveCardBack              *bool                          `json:"remove_card_back,omitempty"`
	EHRID                       *string                        `json:"ehr_id,omitempty"`
	CompanyName                 *string                        `json:"company_name,omitempty"`
	PackageID                   *string                        `json:"package_id,omitempty"`
	InsurancePlanID             *int64                         `json:"insurance_plan_id,omitempty"`
	PatientRelationToSubscriber *string                        `json:"patient_relation_to_subscriber,omitempty"`
	InsuredSameAsPatient        bool                           `json:"insured_same_as_patient"`
}

type StationInsuranceWithRawImage struct {
	StationInsurance
	CardBack  *string `json:"card_back,omitempty"`
	CardFront *string `json:"card_front,omitempty"`
}

type StationInsuranceWithURL struct {
	StationInsurance
	CardBack  *Card `json:"card_back,omitempty"`
	CardFront *Card `json:"card_front,omitempty"`
}

type StationInsuranceImageRemoval struct {
	Insurance *StationInsurance `json:"insurance,omitempty"`
}

type StationPrimaryInsuranceHolderName struct {
	FirstName     *string `json:"first_name,omitempty"`
	LastName      *string `json:"last_name,omitempty"`
	MiddleInitial *string `json:"middle_initial,omitempty"`
}

type StationPrimaryInsuranceHolder struct {
	*StationPrimaryInsuranceHolderName
	Gender                       *string `json:"gender,omitempty"`
	PatientRelationshipToInsured *string `json:"patient_relationship_to_insured,omitempty"`
}

type Card struct {
	URL   *string `json:"url,omitempty"`
	Thumb URL     `json:"thumb,omitempty"`
	Small URL     `json:"small,omitempty"`
}

type URL struct {
	URL *string `json:"url,omitempty"`
}
