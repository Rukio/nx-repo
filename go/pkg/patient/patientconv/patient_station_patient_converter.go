package patientconv

import (
	"fmt"
	"strconv"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/pkg/errors"
	"google.golang.org/protobuf/proto"
)

func StationPatientProto(ehrID *string, patientProto *common.Patient) (*stationpatientspb.Patient, error) {
	var patientID int64
	var err error

	if patientProto.Id != nil {
		patientID, err = strconv.ParseInt(patientProto.GetId(), 10, 64)
		if err != nil {
			return nil, errors.Wrap(err, "failed to parse patient id")
		}
	}

	safetyFlag, err := StationPatientsSafetyFlagProto(&patientID, patientProto.PatientSafetyFlag)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse power of safety flag")
	}

	powerOfAttorney, err := StationPowerOfAttorneyProto(&patientID, patientProto)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse power of attorney")
	}

	billingCity, err := StationPatientBillingCityProto(patientProto.BillingCity)
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse billing city")
	}

	var mobileNumber *string

	if patientProto.ContactInfo != nil && patientProto.ContactInfo.MobileNumber != nil && patientProto.ContactInfo.MobileNumber.PhoneNumber != nil {
		mobileNumber = patientProto.ContactInfo.MobileNumber.PhoneNumber
	}

	return &stationpatientspb.Patient{
		Id:                patientID,
		ChannelItemId:     patientProto.ChannelItemId,
		SourceType:        patientProto.SourceType,
		PartnerId:         patientProto.PartnerId,
		PatientSafetyFlag: safetyFlag,
		VoicemailConsent:  patientProto.VoicemailConsent,
		BillingCity:       billingCity,
		PowerOfAttorney:   powerOfAttorney,
		EhrId:             ehrID,
		MobileNumber:      mobileNumber,
	}, nil
}

func StationPatientBillingCityProto(billingCity *common.BillingCity) (*stationpatientspb.BillingCity, error) {
	if billingCity == nil {
		return nil, nil
	}

	billingCityID, err := protoconv.ProtoStringToInt64(&billingCity.Id)
	if err != nil {
		return nil, err
	}

	return &stationpatientspb.BillingCity{
		Id: billingCityID,
	}, nil
}

func StationPatientsSafetyFlagProto(patientID *int64, safetyFlag *common.PatientSafetyFlag) (*stationpatientspb.PatientSafetyFlag, error) {
	if safetyFlag == nil {
		return nil, nil
	}

	flagType := proto.String(common.PatientSafetyFlag_FlagType_name[int32(safetyFlag.Type)])
	flaggerID, err := protoconv.ProtoStringToInt64(&safetyFlag.FlaggerUserId)
	if err != nil {
		return nil, err
	}

	return &stationpatientspb.PatientSafetyFlag{
		PatientId:  patientID,
		FlagType:   flagType,
		FlagReason: safetyFlag.Reason,
		FlaggerId:  flaggerID,
	}, nil
}

var patientRelationTypesStrings = map[common.RelationToPatient]string{
	common.RelationToPatient_RELATION_TO_PATIENT_SELF:             stringRelationToPatientSelf,
	common.RelationToPatient_RELATION_TO_PATIENT_FACILITY_STAFF:   stringRelationToPatientFacilityStaff,
	common.RelationToPatient_RELATION_TO_PATIENT_FAMILY:           stringRelationToPatientFamily,
	common.RelationToPatient_RELATION_TO_PATIENT_CLINICIAN:        stringRelationToPatientClinician,
	common.RelationToPatient_RELATION_TO_PATIENT_FRIEND:           stringRelationToPatientFriend,
	common.RelationToPatient_RELATION_TO_PATIENT_HOME_HEALTH_TEAM: stringRelationToPatientHomeHealthTeam,
	common.RelationToPatient_RELATION_TO_PATIENT_CASE_MANAGEMENT:  stringRelationToPatientCaseManagement,
	common.RelationToPatient_RELATION_TO_PATIENT_UNSPECIFIED:      stringRelationToPatientUnspecified,
	common.RelationToPatient_RELATION_TO_PATIENT_OTHER:            stringRelationToPatientOther,
}

func StationPowerOfAttorneyRelationProto(relationToPatient common.RelationToPatient) string {
	patientRelation, ok := patientRelationTypesStrings[relationToPatient]
	if !ok {
		return stringRelationToPatientUnspecified
	}
	return patientRelation
}

func StationPowerOfAttorneyProto(patientID *int64, patientProto *common.Patient) (*stationpatientspb.PowerOfAttorney, error) {
	poa := patientProto.MedicalPowerOfAttorney
	if poa == nil {
		return nil, nil
	}

	if poa.PatientRelation == nil {
		return nil, fmt.Errorf("invalid relation to patient")
	}

	relationship := StationPowerOfAttorneyRelationProto(poa.PatientRelation.Relation)

	name := poa.Name
	if name == nil || name.PreferredName == nil || *name.PreferredName == "" {
		return nil, fmt.Errorf("invalid patient name")
	}

	contactInfo := poa.ContactInfo
	if contactInfo == nil || contactInfo.MobileNumber == nil || contactInfo.MobileNumber.PhoneNumber == nil || *contactInfo.MobileNumber.PhoneNumber == "" {
		return nil, fmt.Errorf("invalid patient phone number")
	}

	return &stationpatientspb.PowerOfAttorney{
		Id:           poa.Id,
		PatientId:    patientID,
		Name:         name.PreferredName,
		Relationship: &relationship,
		Phone:        contactInfo.MobileNumber.PhoneNumber,
	}, nil
}
