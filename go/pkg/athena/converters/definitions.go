package converters

type EmergencyContact struct {
	Name         *string `json:"contactname,omitempty"`
	Relationship *string `json:"contactrelationship,omitempty"`
	MobilePhone  *string `json:"contactmobilephone,omitempty"`
}

type Guarantor struct {
	Firstname             *string `json:"guarantorfirstname,omitempty"`
	Middlename            *string `json:"guarantormiddlename,omitempty"`
	Lastname              *string `json:"guarantorlastname,omitempty"`
	Suffix                *string `json:"guarantorsuffix,omitempty"`
	DOB                   *string `json:"guarantordob,omitempty"`
	Phone                 *string `json:"guarantorphone,omitempty"`
	Email                 *string `json:"guarantoremail,omitempty"`
	AddressLineOne        *string `json:"guarantoraddress1,omitempty"`
	AddressLineTwo        *string `json:"guarantoraddress2,omitempty"`
	City                  *string `json:"guarantorcity,omitempty"`
	State                 *string `json:"guarantorstate,omitempty"`
	ZipCode               *string `json:"guarantorzip,omitempty"`
	AddressSameAsPatient  *string `json:"guarantoraddresssameaspatient,omitempty"`
	RelationshipToPatient *string `json:"guarantorrelationshiptopatient,omitempty"`
}

type Name struct {
	Firstname     *string `json:"firstname,omitempty"`
	Lastname      *string `json:"lastname,omitempty"`
	Middlename    *string `json:"middlename,omitempty"`
	PreferredName *string `json:"preferredname,omitempty"`
	Suffix        *string `json:"suffix,omitempty"`
}

type ContactInfo struct {
	HomePhone   *string `json:"homephone,omitempty"`
	MobilePhone *string `json:"mobilephone,omitempty"`
	WorkPhone   *string `json:"workphone,omitempty"`
	Email       *string `json:"email,omitempty"`
}

type Address struct {
	AddressLineOne *string `json:"address1,omitempty"`
	AddressLineTwo *string `json:"address2,omitempty"`
	City           *string `json:"city,omitempty"`
	State          *string `json:"state,omitempty"`
	ZipCode        *string `json:"zip,omitempty"`
}

type Patient struct {
	PatientID *string `json:"patientid,omitempty"`
	DOB       *string `json:"dob,omitempty"`
	Sex       *string `json:"sex,omitempty"`
	*Name
	*ContactInfo
	*Address
	*EmergencyContact
	*Guarantor
	DepartmentID        *string `json:"departmentid,omitempty"`
	PrimaryProviderID   *string `json:"primaryproviderid,omitempty"`
	PortalAccessGiven   *string `json:"portalaccessgiven,omitempty"`
	GenderIdentity      *string `json:"genderidentity,omitempty"`
	GenderIdentityOther *string `json:"genderidentityother,omitempty"`
	BirthSex            *string `json:"assignedsexatbirth,omitempty"`
}

type CreateOrUpdatePatientResponse struct {
	PatientID string `json:"patientid"`
}

type CareTeam struct {
	Members []CareTeamMember `json:"members,omitempty"`
	Note    *string          `json:"note,omitempty"`
}

type CareTeamMember struct {
	MemberID           *string         `json:"memberid,omitempty"`
	ClinicalProviderID *string         `json:"clinicalproviderid,omitempty"`
	FacilityID         *string         `json:"facilityid,omitempty"`
	ProviderID         *string         `json:"providerid,omitempty"`
	AnsiSpecialtyName  *string         `json:"ansispecialtyname,omitempty"`
	Name               *string         `json:"name,omitempty"`
	FirstName          *string         `json:"firstname,omitempty"`
	LastName           *string         `json:"lastname,omitempty"`
	MiddleName         *string         `json:"middlename,omitempty"`
	PreferredName      *string         `json:"preferredname,omitempty"`
	Suffix             *string         `json:"suffix,omitempty"`
	Address1           *string         `json:"address1,omitempty"`
	Address2           *string         `json:"address2,omitempty"`
	City               *string         `json:"city,omitempty"`
	Country            *string         `json:"country,omitempty"`
	State              *string         `json:"state,omitempty"`
	Zip                *string         `json:"zip,omitempty"`
	Fax                *string         `json:"fax,omitempty"`
	NPI                *string         `json:"npi,omitempty"`
	PhoneNumber        *string         `json:"phonenumber,omitempty"`
	RecipientClass     *RecipientClass `json:"recipientclass,omitempty"`
}

type RecipientClass struct {
	Code        *string `json:"code,omitempty"`
	Description *string `json:"description,omitempty"`
}

type EnhancedBestMatchResult struct {
	*Patient
	Score any `json:"score,omitempty"`
}

type EnhancedBestMatchRequest struct {
	FirstName         string   `json:"firstname"`
	LastName          string   `json:"lastname"`
	DateOfBirth       string   `json:"dob"`
	Zip               string   `json:"zip"`
	HomePhone         *string  `json:"homephone,omitempty"`
	MobilePhone       *string  `json:"mobilephone,omitempty"`
	GuarantorPhone    *string  `json:"guarantorphone,omitempty"`
	Email             *string  `json:"email,omitempty"`
	GuarantorEmail    *string  `json:"guarantoremail,omitempty"`
	DepartmentID      *string  `json:"departmentid,omitempty"`
	MinimumScore      *float32 `json:"minscore,omitempty"`
	UseSoundexSearch  bool     `json:"usesoundexsearch"`
	ReturnBestMatches bool     `json:"returnbestmatches"`
}

type Pharmacy struct {
	PharmacyType         *string `json:"pharmacytype,omitempty"`
	DefaultPharmacy      *string `json:"defaultpharmacy,omitempty"`
	State                *string `json:"state,omitempty"`
	City                 *string `json:"city,omitempty"`
	ReceiverType         *string `json:"receivetype,omitempty"`
	AcceptFax            *string `json:"acceptfax,omitempty"`
	ClinicalProviderID   *string `json:"clinicalproviderid,omitempty"`
	Zip                  *string `json:"zip,omitempty"`
	PhoneNumber          *string `json:"phonenumber,omitempty"`
	ClinicalProviderName *string `json:"clinicalprovidername,omitempty"`
	Address1             *string `json:"address1,omitempty"`
	Address2             *string `json:"address2,omitempty"`
	FaxNumber            *string `json:"faxnumber,omitempty"`
}

type PreferredPharmacies struct {
	PreferredPharmacies []Pharmacy `json:"pharmacies,omitempty"`
}

type GetPatientInsuranceResponse struct {
	Insurances []PatientInsurance `json:"insurances,omitempty"`
}

type PatientInsurance struct {
	DepartmentID       *string `json:"departmentid,omitempty"`
	InsuranceID        *string `json:"insuranceidnumber,omitempty"`
	InsurancePackageID *string `json:"insurancepackageid,omitempty"`
	PolicyNumber       *string `json:"policynumber,omitempty"`
	UpdateAppointments *string `json:"updateappointments,omitempty"`
	AthenaInsuranceID  *string `json:"insuranceid,omitempty"`
	*InsuranceHolder
}

type InsuranceHolder struct {
	*InsuranceHolderName
	DOB                        *string `json:"insurancepolicyholderdob,omitempty"`
	Sex                        *string `json:"insurancepolicyholdersex,omitempty"`
	RelationshipToPolicyHolder *string `json:"relationshiptoinsuredid,omitempty"`
}

type InsuranceHolderName struct {
	FirstName  *string `json:"insurancepolicyholderfirstname,omitempty"`
	MiddleName *string `json:"insurancepolicyholdermiddlename,omitempty"`
	LastName   *string `json:"insurancepolicyholderlastname,omitempty"`
}

type ClinicalProviderSearchResult struct {
	ClinicalProviders []*ClinicalProvider `json:"clinicalproviders"`
}

type ClinicalProvider struct {
	ID           *string `json:"clinicalproviderid,omitempty"`
	Name         *string `json:"name,omitempty"`
	FirstName    *string `json:"firstname,omitempty"`
	LastName     *string `json:"lastname,omitempty"`
	City         *string `json:"city,omitempty"`
	State        *string `json:"state,omitempty"`
	Address      *string `json:"address,omitempty"`
	Zip          *string `json:"zip,omitempty"`
	PhoneNumber  *string `json:"phone,omitempty"`
	FaxNumber    *string `json:"fax,omitempty"`
	PharmacyType *string `json:"pharmacytype,omitempty"`
	NPI          *string `json:"clinicalprovidernpi,omitempty"`
	NCPDID       *string `json:"ncpdpid,omitempty"`
	Distance     *string `json:"distance,omitempty"`
	OrderType    *string `json:"ordertype,omitempty"`
}

type UpdatePatientDiscussionNotes struct {
	DiscussionNotes string `json:"discussionnotes,omitempty"`
}

type Analyte struct {
	ObservationIdentifier *string `json:"observationidentifier,omitempty"`
	ResultStatus          *string `json:"resultstatus,omitempty"`
	Name                  *string `json:"analytename,omitempty"`
	DateTime              *string `json:"analytedatetime,omitempty"`
	Date                  *string `json:"analytedate,omitempty"`
	Value                 *string `json:"value,omitempty"`
	Units                 *string `json:"units,omitempty"`
	Description           *string `json:"description,omitempty"`
	LoInc                 *string `json:"loinc,omitempty"`
	Note                  *string `json:"note,omitempty"`
	ID                    *string `json:"analyteid,omitempty"`
}

type LabResult struct {
	Priority              *string   `json:"priority,omitempty"`
	Date                  *string   `json:"labresultdate,omitempty"`
	ResultStatus          *string   `json:"resultstatus,omitempty"`
	IsReviewedByProvider  string    `json:"isreviewedbyprovider,omitempty"`
	PerformingLabAddress1 *string   `json:"performinglabaddress1,omitempty"`
	ID                    *string   `json:"labresultid,omitempty"`
	ProviderID            *string   `json:"providerid,omitempty"`
	PerformingLabName     *string   `json:"performinglabname,omitempty"`
	DateTime              *string   `json:"labresultdatetime,omitempty"`
	Analytes              []Analyte `json:"analytes,omitempty"`
	FacilityID            *string   `json:"facilityid,omitempty"`
	PerformingLabZIP      *string   `json:"performinglabzip,omitempty"`
	Description           *string   `json:"description,omitempty"`
	AttachmentExists      string    `json:"attachmentexists,omitempty"`
	PerformingLabCity     *string   `json:"performinglabcity,omitempty"`
	LoInc                 *string   `json:"labresultloinc,omitempty"`
	PerformingLabState    *string   `json:"performinglabstate,omitempty"`
}

type LabResults struct {
	LabResults []LabResult `json:"results,omitempty"`
}

type LabResultDocument struct {
	DepartmentID        *string   `json:"departmentid,omitempty"`
	DocumentRoute       *string   `json:"documentroute,omitempty"`
	DocumentSource      *string   `json:"documentsource,omitempty"`
	DocumentTypeID      *string   `json:"documenttypeid,omitempty"`
	EncounterDate       *string   `json:"encounterdate,omitempty"`
	EncounterID         *string   `json:"encounterid,omitempty"`
	FacilityID          *string   `json:"facilityid,omitempty"`
	IsConfidential      *string   `json:"isconfidental,omitempty"`
	ID                  *string   `json:"labresultid,omitempty"`
	Loinc               *string   `json:"labresultloinc,omitempty"`
	ObservationDateTime *string   `json:"observationdatetime,omitempty"`
	Observations        []Analyte `json:"observations,omitempty"`
	PerformingLabName   *string   `json:"performinglabname,omitempty"`
	ProviderID          *string   `json:"providerid,omitempty"`
	OrderID             *string   `json:"tietoorderid,omitempty"`
}

type GetRecipientClassesResponse struct {
	RecipientClasses []RecipientClass `json:"recipientclasses,omitempty"`
	// The URL path to the previous set of results
	Previous *string `json:"previous,omitempty"`
	// The URL path to the next set of results
	Next *string `json:"next,omitempty"`
}

type LabResultChangeEventsSubscription struct {
	Status *string `json:"status,omitempty"`
}

type ChangedLabResults struct {
	LabResults []ChangedLabResult `json:"labresults,omitempty"`
}

type ChangedLabResult struct {
	LabResultID  *string `json:"labresultid,omitempty"`
	DepartmentID *string `json:"departmentid,omitempty"`
	EncounterID  *string `json:"encounterid,omitempty"`
	PatientID    *string `json:"patientid,omitempty"`
}

type PatientChangeEventsSubscription struct {
	Status *string `json:"status,omitempty"`
}

type ChangedPatient struct {
	DepartmentID       *string  `json:"departmentid,omitempty"`
	PatientID          *string  `json:"patientid,omitempty"`
	PreviousPatientIDs []string `json:"previouspatientids,omitempty"`
}
type ChangedPatients struct {
	Patients []ChangedPatient `json:"labresults,omitempty"`
}

type PatientPaymentInformation struct {
	AccountNumber   *string `json:"accountnumber,omitempty"`
	BillingAddress  *string `json:"billingaddress,omitempty"`
	BillingZip      *string `json:"billingzip,omitempty"`
	CVV             *int64  `json:"cardsecuritycode,omitempty"`
	ExpirationMonth *int64  `json:"expirationmonthmm,omitempty"`
	ExpirationYear  *int64  `json:"expirationyearyyyy,omitempty"`
	NameOnCard      *string `json:"nameoncard,omitempty"`
	Amount          *string `json:"otheramount,omitempty"`
	DepartmentID    *int64  `json:"departmentid,omitempty"`
}

type PatientPaymentResponse struct {
	PaymentID *string `json:"epaymentid,omitempty"`
	ErrorText *string `json:"errortext,omitempty"`
	Success   *string `json:"success,omitempty"`
}

type AthenaCreditCardInformation struct {
	AccountNumber   *string `json:"accountnumber,omitempty"`
	BillingAddress  *string `json:"billingaddress,omitempty"`
	BillingZip      *string `json:"billingzip,omitempty"`
	CVV             *int64  `json:"cardsecuritycode,omitempty"`
	ExpirationMonth *int64  `json:"expirationmonthmm,omitempty"`
	ExpirationYear  *int64  `json:"expirationyearyyyy,omitempty"`
	NameOnCard      *string `json:"nameoncard,omitempty"`
	DepartmentID    *int64  `json:"departmentid,omitempty"`
}

type UploadPatientCreditCardResponse struct {
	PaymentID    *string `json:"epaymentid,omitempty"`
	ErrorText    *string `json:"errortext,omitempty"`
	Success      *string `json:"success,omitempty"`
	StoredCardID *string `json:"storedcardid,omitempty"`
}

type GetStoredCreditCardResponse struct {
	Status                   string `json:"status,omitempty"`
	CardType                 string `json:"cardtype,omitempty"`
	BillingZip               string `json:"billingzip,omitempty"`
	BillingCity              string `json:"billingcity,omitempty"`
	BillingState             string `json:"billingstate,omitempty"`
	StoredCardID             string `json:"storedcardid,omitempty"`
	PreferredCard            string `json:"preferredcard,omitempty"`
	BillingAddress           string `json:"billingaddress,omitempty"`
	CardExpirationMonthYear  string `json:"cardexpirationmmyyyy,omitempty"`
	CardNumberLastFourDigits string `json:"cardnumberlast4digits,omitempty"`
}

type DeleteStoredCardResponse struct {
	Success *string `json:"success,omitempty"`
}

type SearchPatientResponse struct {
	SearchPatientResults []SearchPatientResult `json:"patients,omitempty"`
}

type SearchPatientResult struct {
	FirstName           *string `json:"firstname,omitempty"`
	CurrentDepartmentID *string `json:"currentdepartmentid,omitempty"`
	MiddleInitial       *string `json:"middleinitial,omitempty"`
	LastName            *string `json:"lastname,omitempty"`
	State               *string `json:"state,omitempty"`
	City                *string `json:"city,omitempty"`
	CountryID           *string `json:"countryid,omitempty"`
	HomePhone           *string `json:"homephone,omitempty"`
	PatientID           *string `json:"patientid,omitempty"`
	Sex                 *string `json:"sex,omitempty"`
	DOB                 *string `json:"dob,omitempty"`
	Zip                 *string `json:"zip,omitempty"`
	CurrentDepartment   *string `json:"currentdepartment,omitempty"`
	Address1            *string `json:"address1,omitempty"`
	Address2            *string `json:"address2,omitempty"`
	NameSuffix          *string `json:"namesuffix,omitempty"`
}

type PatientInsuranceBenefitDetails struct {
	EligibilityData *string `json:"ansi271,omitempty"`
	DateOfService   *string `json:"dateofservice,omitempty"`
	LastCheckDate   *string `json:"lastcheckdate,omitempty"`
}

type PatientGoals struct {
	DiscussionNotes string `json:"discussionnotes,omitempty"`
}

type PatientOrder struct {
	OrderID     *string `json:"orderid,omitempty"`
	EncounterID *string `json:"encounterid,omitempty"`
}
