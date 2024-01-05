package patientconv

import (
	"strconv"

	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/pkg/errors"
)

var (
	errNoAthenaPatient = errors.New("athena patient cannot be nil")
)

func ToPatientProto(athenaPatient *athenapb.Patient, stationPatient *stationpatientspb.Patient) (*commonpb.Patient, error) {
	if athenaPatient == nil {
		return nil, errNoAthenaPatient
	}

	if stationPatient == nil {
		return nil, errNoStationPatient
	}

	stationPatientStrID := strconv.FormatInt(stationPatient.Id, 10)

	return &commonpb.Patient{
		Id:                     &stationPatientStrID,
		PrimaryIdentifier:      patientPrimaryIdentifierProto(athenaPatient.PatientId),
		Name:                   athenaPatient.Name,
		ContactInfo:            athenaContactInfoToProto(athenaPatient.ContactInfo),
		DateOfBirth:            athenaPatient.DateOfBirth,
		Sex:                    sexProto(athenaPatient.Sex),
		Guarantor:              athenaPatientGuarantorToProto(athenaPatient.Guarantor),
		PatientSafetyFlag:      stationPatientSafetyFlagProto(stationPatient.PatientSafetyFlag),
		ChannelItemId:          stationPatient.ChannelItemId,
		PartnerId:              stationPatient.PartnerId,
		SourceType:             stationPatient.SourceType,
		MedicalPowerOfAttorney: patientMedicalPowerOfAttorneyProto(stationPatient.PowerOfAttorney),
		VoicemailConsent:       stationPatient.VoicemailConsent,
		BillingCity:            patientBillingCityProto(stationPatient.BillingCity),
	}, nil
}

func ToPatientProtos(athenaPatients []*athenapb.Patient, stationPatients []*stationpatientspb.Patient) ([]*commonpb.Patient, error) {
	ehrIDToAthenaPatient := make(map[string]*athenapb.Patient)
	for _, p := range athenaPatients {
		ehrIDToAthenaPatient[p.GetPatientId()] = p
	}

	patients := make([]*commonpb.Patient, len(stationPatients))
	for i, sp := range stationPatients {
		ehrID := stationPatients[i].GetEhrId()
		p, err := ToPatientProto(ehrIDToAthenaPatient[ehrID], sp)
		if err != nil {
			return nil, err
		}
		patients[i] = p
	}
	return patients, nil
}

var stationPatientRelationTypes = map[string]commonpb.RelationToPatient{
	"self":             commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF,
	"patient":          commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF,
	"facility_staff":   commonpb.RelationToPatient_RELATION_TO_PATIENT_FACILITY_STAFF,
	"family":           commonpb.RelationToPatient_RELATION_TO_PATIENT_FAMILY,
	"clinician":        commonpb.RelationToPatient_RELATION_TO_PATIENT_CLINICIAN,
	"friend":           commonpb.RelationToPatient_RELATION_TO_PATIENT_FRIEND,
	"home_health_team": commonpb.RelationToPatient_RELATION_TO_PATIENT_HOME_HEALTH_TEAM,
	"case_management":  commonpb.RelationToPatient_RELATION_TO_PATIENT_CASE_MANAGEMENT,
	"":                 commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED,
}

var athenaRelationToPatientTypes = map[int64]commonpb.RelationToPatient{
	0: commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED,
	1: commonpb.RelationToPatient_RELATION_TO_PATIENT_SELF,
	4: commonpb.RelationToPatient_RELATION_TO_PATIENT_OTHER,
}

func parseRelationshipToPatient(rel *string) commonpb.RelationToPatient {
	if rel == nil {
		return commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED
	}

	relInt, err := strconv.ParseInt(*rel, 10, 64)
	if err != nil {
		return commonpb.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED
	}
	found, ok := athenaRelationToPatientTypes[relInt]
	if !ok {
		return commonpb.RelationToPatient_RELATION_TO_PATIENT_OTHER
	}
	return found
}

func athenaPatientGuarantorToProto(guarantor *athenapb.Guarantor) *commonpb.Guarantor {
	if guarantor == nil {
		return nil
	}

	relationToPatient := parseRelationshipToPatient(guarantor.RelationshipToPatient)

	return &commonpb.Guarantor{
		Name:        guarantor.Name,
		DateOfBirth: guarantor.DateOfBirth,
		ContactInfo: athenaContactInfoToProto(guarantor.ContactInfo),
		PatientRelation: &commonpb.PatientRelation{
			Relation: relationToPatient,
		},
	}
}

func stationPatientSafetyFlagProto(safetyFlag *stationpatientspb.PatientSafetyFlag) *commonpb.PatientSafetyFlag {
	if safetyFlag == nil {
		return nil
	}

	var flagType commonpb.PatientSafetyFlag_FlagType
	switch safetyFlag.GetFlagType() {
	case "temporary":
		flagType = commonpb.PatientSafetyFlag_FLAG_TYPE_TEMPORARY
	case "permanent":
		flagType = commonpb.PatientSafetyFlag_FLAG_TYPE_PERMANENT
	default:
		flagType = commonpb.PatientSafetyFlag_FLAG_TYPE_UNSPECIFIED
	}

	var flaggerUserID string
	if safetyFlag.FlaggerId != nil {
		flaggerUserID = strconv.FormatInt(*safetyFlag.FlaggerId, 10)
	}

	return &commonpb.PatientSafetyFlag{
		FlaggerUserId: flaggerUserID,
		Type:          flagType,
		Reason:        safetyFlag.FlagReason,
	}
}

func patientPrimaryIdentifierProto(athenaPatientID *string) *commonpb.PatientRecordIdentifier {
	return &commonpb.PatientRecordIdentifier{
		// hardcoded b/c we have single source for now
		Source:   commonpb.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA,
		RecordId: *athenaPatientID,
	}
}

func patientMedicalPowerOfAttorneyProto(stationMpoa *stationpatientspb.PowerOfAttorney) *commonpb.MedicalPowerOfAttorney {
	if stationMpoa == nil {
		return nil
	}
	// MPOA only has full name right now in Station, so we store it in PreferredName.
	// TODO(PT-431): In the future when we switch away from Station towards EHR Proxy, collect MPOA first/last name.
	mpoaNameProto := commonpb.Name{
		PreferredName: stationMpoa.Name,
	}
	// station only returns phone string attr
	var phoneNumber *commonpb.PhoneNumber
	phoneNumberProto, err := protoconv.PhoneNumberProto(stationMpoa.Phone, commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME)
	if err != nil {
		phoneNumber = nil
	} else {
		phoneNumber = phoneNumberProto
	}
	mpoaContactInfoProto := commonpb.ContactInfo{
		HomeNumber: phoneNumber,
	}

	relationProto := stationPatientRelationTypes[*stationMpoa.Relationship]
	patientRelationProto := commonpb.PatientRelation{
		Relation:          relationProto,
		OtherRelationText: stationMpoa.Relationship,
	}

	return &commonpb.MedicalPowerOfAttorney{
		Id:              stationMpoa.Id,
		Name:            &mpoaNameProto,
		ContactInfo:     &mpoaContactInfoProto,
		PatientRelation: &patientRelationProto,
	}
}

func patientBillingCityProto(billingCity *stationpatientspb.BillingCity) *commonpb.BillingCity {
	if billingCity == nil {
		return nil
	}

	return &commonpb.BillingCity{
		Id: strconv.FormatInt(*billingCity.Id, 10),
	}
}

func athenaContactInfoToProto(contact *athenapb.ContactInfo) *commonpb.ContactInfo {
	if contact == nil {
		return nil
	}

	return &commonpb.ContactInfo{
		HomeNumber:   contact.HomeNumber,
		MobileNumber: contact.MobileNumber,
		WorkNumber:   contact.WorkNumber,
		Email:        contact.Email,
		Address:      contact.Address,
	}
}

func EnhancedBestMatchResultPatientIDs(patients []*athenapb.EnhancedBestMatchResult) []string {
	ehrIDs := make([]string, len(patients))
	for i, p := range patients {
		ehrIDs[i] = p.GetPatient().GetPatientId()
	}
	return ehrIDs
}

func SearchPatientsResultPatientIDs(patients []*athenapb.SearchPatientsResult) []string {
	ehrIDs := make([]string, len(patients))
	for i, p := range patients {
		ehrIDs[i] = p.GetPatient().GetPatientId()
	}
	return ehrIDs
}

func AthenaPatientInsuranceBenefitDetailsToProto(details *athenapb.InsuranceBenefitDetails) *patientspb.InsuranceBenefitDetails {
	return &patientspb.InsuranceBenefitDetails{
		EligibilityData: details.EligibilityData,
		DateOfService:   details.DateOfService,
		LastCheckDate:   details.LastCheckDate,
	}
}
